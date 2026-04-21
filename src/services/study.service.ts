import { supabase } from "@/integrations/supabase/client";
import { transitionDealPhase } from "./dealPhase.service";

export interface DealStudy {
  id: string;
  deal_request_id: string;
  version: number;
  uploaded_by: string;
  title: string;
  summary: string | null;
  file_url: string;          // storage path (NOT a public URL) — caller must request a signed URL
  notes: string | null;
  status: StudyStatus;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudyStatus = "submitted" | "under_review" | "changes_requested" | "approved" | "rejected";

/** Hard limits enforced before upload */
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const ALLOWED_MIME_PREFIXES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
];

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE_MB}MB — File too large, max ${MAX_FILE_SIZE_MB}MB`);
  }
  if (file.size === 0) {
    throw new Error("الملف فارغ — Empty file");
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`نوع الملف غير مسموح. المسموح: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }
  // Soft MIME check — some browsers lie about type, so we don't hard-fail but
  // log for future server-side tightening.
  const mime = file.type || "";
  if (mime && !ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
    console.warn(`[study.service] Suspicious MIME for ${file.name}: ${mime}`);
  }
}

/** Fetch all study versions for a deal request */
export async function getStudies(requestId: string): Promise<DealStudy[]> {
  const { data, error } = await supabase
    .from("deal_studies" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as DealStudy[];
}

/**
 * Get a short-lived signed URL for a study file. The bucket is private
 * and `file_url` is stored as a storage path, so the UI must always call
 * this before letting the user download/view the file.
 */
export async function getStudySignedUrl(
  filePathOrUrl: string,
  expiresInSeconds = 300,
): Promise<string> {
  // Back-compat: if a legacy record stored a full public URL, extract the path
  let path = filePathOrUrl;
  const m = filePathOrUrl.match(/\/object\/(?:public\/)?deal-studies\/(.+)$/);
  if (m) path = m[1];

  const { data, error } = await supabase.storage
    .from("deal-studies")
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Upload a new study version */
export async function uploadStudy(params: {
  requestId: string;
  title: string;
  summary?: string;
  file: File;
  notes?: string;
}): Promise<{ success: boolean; error?: string; study?: DealStudy }> {
  try {
    validateFile(params.file);

    // Get current version count (optimistic — see note in comment)
    const { count } = await supabase
      .from("deal_studies" as any)
      .select("id", { count: "exact", head: true })
      .eq("deal_request_id", params.requestId);

    const version = (count || 0) + 1;
    const ext = (params.file.name.split(".").pop() || "pdf").toLowerCase();
    const path = `${params.requestId}/v${version}_${Date.now()}.${ext}`;

    // Upload file
    const { error: uploadErr } = await supabase.storage
      .from("deal-studies")
      .upload(path, params.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: params.file.type || `application/${ext}`,
      });
    if (uploadErr) throw new Error(uploadErr.message);

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Insert study record — store the storage path, NOT a public URL.
    // This ensures access is always mediated by createSignedUrl().
    const { data: study, error: insertErr } = await supabase
      .from("deal_studies" as any)
      .insert({
        deal_request_id: params.requestId,
        version,
        uploaded_by: user.id,
        title: params.title,
        summary: params.summary || null,
        file_url: path,
        notes: params.notes || null,
        status: "submitted",
      })
      .select()
      .single();
    if (insertErr) {
      // Roll back the uploaded object so we don't leak orphan files
      await supabase.storage.from("deal-studies").remove([path]).catch(() => {});
      throw new Error(insertErr.message);
    }

    // Transition phase: study_required → study_submitted OR study_changes_requested → study_resubmitted
    const { data: req } = await supabase
      .from("deal_requests")
      .select("current_phase")
      .eq("id", params.requestId)
      .single();

    const phase = req?.current_phase;
    if (phase === "study_required") {
      await transitionDealPhase(params.requestId, "study_submitted");
    } else if (phase === "study_changes_requested") {
      await transitionDealPhase(params.requestId, "study_resubmitted");
    }

    return { success: true, study: study as unknown as DealStudy };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Owner reviews a study: approve / reject / request changes */
export async function reviewStudy(params: {
  studyId: string;
  requestId: string;
  action: "approve" | "reject" | "changes_requested";
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const statusMap: Record<string, StudyStatus> = {
      approve: "approved",
      reject: "rejected",
      changes_requested: "changes_requested",
    };

    // Update study record
    const { error: updateErr } = await supabase
      .from("deal_studies" as any)
      .update({
        status: statusMap[params.action],
        reviewer_id: user.id,
        review_notes: params.notes || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.studyId);
    if (updateErr) throw new Error(updateErr.message);

    // Transition deal phase
    const phaseMap: Record<string, string> = {
      approve: "study_approved",
      reject: "study_rejected",
      changes_requested: "study_changes_requested",
    };
    const result = await transitionDealPhase(params.requestId, phaseMap[params.action] as any, params.notes);
    if (!result.success) throw new Error(result.error || "Transition failed");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Owner starts review (transitions to study_under_review) */
export async function startStudyReview(requestId: string): Promise<{ success: boolean; error?: string }> {
  const result = await transitionDealPhase(requestId, "study_under_review");
  return result.success ? { success: true } : { success: false, error: result.error };
}
