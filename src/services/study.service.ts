import { supabase } from "@/integrations/supabase/client";
import { transitionDealPhase } from "./dealPhase.service";

export interface DealStudy {
  id: string;
  deal_request_id: string;
  version: number;
  uploaded_by: string;
  title: string;
  summary: string | null;
  file_url: string;
  notes: string | null;
  status: StudyStatus;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudyStatus = "submitted" | "under_review" | "changes_requested" | "approved" | "rejected";

/** Fetch all study versions for a deal request */
export async function getStudies(requestId: string): Promise<DealStudy[]> {
  const { data, error } = await supabase
    .from("deal_studies" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as DealStudy[];
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
    // Get current version count
    const { count } = await supabase
      .from("deal_studies" as any)
      .select("id", { count: "exact", head: true })
      .eq("deal_request_id", params.requestId);

    const version = (count || 0) + 1;
    const ext = params.file.name.split(".").pop() || "pdf";
    const path = `${params.requestId}/v${version}_${Date.now()}.${ext}`;

    // Upload file
    const { error: uploadErr } = await supabase.storage
      .from("deal-studies")
      .upload(path, params.file);
    if (uploadErr) throw new Error(uploadErr.message);

    const { data: urlData } = supabase.storage.from("deal-studies").getPublicUrl(path);
    const fileUrl = urlData.publicUrl;

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Insert study record
    const { data: study, error: insertErr } = await supabase
      .from("deal_studies" as any)
      .insert({
        deal_request_id: params.requestId,
        version,
        uploaded_by: user.id,
        title: params.title,
        summary: params.summary || null,
        file_url: fileUrl,
        notes: params.notes || null,
        status: "submitted",
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);

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

    return { success: true, study: study as DealStudy };
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
