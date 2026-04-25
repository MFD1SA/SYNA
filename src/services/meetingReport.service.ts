import { supabase } from "@/integrations/supabase/client";
import { transitionDealPhase } from "./dealPhase.service";

/* ── Types ── */

export type ReportOutcome =
  | "positive"
  | "negative"
  | "needs_followup"
  | "needs_further_study"
  | "needs_modification";

export type ReportStatus =
  | "pending_approval"
  | "partially_approved"
  | "fully_approved"
  | "rejected"
  | "changes_requested"
  | "expired";

export type ApprovalDecision = "approved" | "rejected" | "changes_requested";

export interface MeetingReport {
  id: string;
  deal_request_id: string;
  meeting_id: string;
  created_by: string;
  version: number;
  summary: string;
  outcome: ReportOutcome;
  action_items: Array<{ item: string; assignee?: string }>;
  responsibilities: Array<{ party: string; task: string }>;
  deadlines: Array<{ item: string; due_date: string }>;
  additional_requests: string | null;
  next_steps: string | null;
  status: ReportStatus;
  expires_at: string;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  expired_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportApproval {
  id: string;
  report_id: string;
  user_id: string;
  role: "owner" | "developer" | "admin";
  decision: ApprovalDecision;
  notes: string | null;
  decided_at: string;
}

/* ── Report outcome labels ── */
export const outcomeLabels: Record<ReportOutcome, { ar: string; en: string }> = {
  positive: { ar: "إيجابية", en: "Positive" },
  negative: { ar: "سلبية", en: "Negative" },
  needs_followup: { ar: "تحتاج متابعة", en: "Needs Follow-up" },
  needs_further_study: { ar: "تحتاج دراسة إضافية", en: "Needs Further Study" },
  needs_modification: { ar: "تحتاج تعديل", en: "Needs Modification" },
};

export const outcomeColors: Record<ReportOutcome, string> = {
  positive: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  negative: "bg-destructive/10 text-destructive border-destructive/20",
  needs_followup: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  needs_further_study: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  needs_modification: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export const reportStatusLabels: Record<ReportStatus, { ar: string; en: string }> = {
  pending_approval: { ar: "بانتظار الاعتماد", en: "Pending Approval" },
  partially_approved: { ar: "معتمد جزئيًا", en: "Partially Approved" },
  fully_approved: { ar: "معتمد بالكامل", en: "Fully Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  changes_requested: { ar: "تعديلات مطلوبة", en: "Changes Requested" },
  expired: { ar: "منتهي المهلة", en: "Expired" },
};

export const reportStatusColors: Record<ReportStatus, string> = {
  pending_approval: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  partially_approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  fully_approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

/* ── API Functions ── */

/** Fetch the report for a deal request */
export async function getReport(requestId: string): Promise<MeetingReport | null> {
  const { data, error } = await supabase
    .from("meeting_reports" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as MeetingReport | null;
}

/** Fetch approvals for a report */
export async function getApprovals(reportId: string): Promise<ReportApproval[]> {
  const { data, error } = await supabase
    .from("report_approvals" as any)
    .select("*")
    .eq("report_id", reportId)
    .order("decided_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as ReportApproval[];
}

/** Create a meeting report (owner/admin) */
export async function createReport(params: {
  requestId: string;
  meetingId: string;
  summary: string;
  outcome: ReportOutcome;
  actionItems: Array<{ item: string; assignee?: string }>;
  responsibilities: Array<{ party: string; task: string }>;
  deadlines: Array<{ item: string; due_date: string }>;
  additionalRequests?: string;
  nextSteps?: string;
}): Promise<{ success: boolean; error?: string; report?: MeetingReport }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get current version count
    const { count } = await supabase
      .from("meeting_reports" as any)
      .select("id", { count: "exact", head: true })
      .eq("deal_request_id", params.requestId);

    const version = (count || 0) + 1;

    const { data: report, error: insertErr } = await supabase
      .from("meeting_reports" as any)
      .insert({
        deal_request_id: params.requestId,
        meeting_id: params.meetingId,
        created_by: user.id,
        version,
        summary: params.summary,
        outcome: params.outcome,
        action_items: params.actionItems,
        responsibilities: params.responsibilities,
        deadlines: params.deadlines,
        additional_requests: params.additionalRequests || null,
        next_steps: params.nextSteps || null,
        status: "pending_approval",
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);

    // Transition deal phase to report_pending_approval
    const result = await transitionDealPhase(params.requestId, "report_pending_approval" as any);
    if (!result.success) {
      console.warn("Phase transition note:", result.error);
    }

    // Trigger email notification
    try {
      await supabase.functions.invoke("send-platform-email", {
        body: {
          event_type: "report_created",
          deal_request_id: params.requestId,
          report_id: (report as any).id,
        },
      });
    } catch (e) { console.warn("Email notification failed:", e); }

    return { success: true, report: report as unknown as MeetingReport };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Submit an approval decision (owner/developer/admin).
 *
 * All consensus logic (role resolution, upsert, status recompute)
 * runs server-side inside the `submit_report_approval` RPC, which
 * takes a row lock on the report so concurrent approvals from
 * owner + developer can't race. The client is only responsible
 * for calling `transition-deal-phase` afterwards using the phase
 * the RPC recommends. */
export async function submitApproval(params: {
  reportId: string;
  requestId: string;
  decision: ApprovalDecision;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error: rpcErr } = await supabase.rpc(
      "submit_report_approval" as any,
      {
        _report_id: params.reportId,
        _decision: params.decision,
        _notes: params.notes || "",
      },
    );
    if (rpcErr) throw new Error(rpcErr.message);

    // RPC returns TABLE(...); supabase-js gives us an array
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Failed to record approval");

    const actorRole = row.actor_role as "owner" | "developer" | "admin";
    const nextPhase = row.next_phase as string | null;

    // Transition deal phase if the RPC recommended one
    if (nextPhase) {
      const result = await transitionDealPhase(
        params.requestId,
        nextPhase as any,
        params.notes,
      );
      if (!result.success) console.warn("Phase transition note:", result.error);
    }

    // Trigger email notification
    try {
      await supabase.functions.invoke("send-platform-email", {
        body: {
          event_type: `report_${params.decision}`,
          deal_request_id: params.requestId,
          report_id: params.reportId,
          actor_role: actorRole,
        },
      });
    } catch (e) { console.warn("Email notification failed:", e); }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Compute remaining time until deadline */
export function getDeadlineInfo(expiresAt: string): {
  isExpired: boolean;
  remainingMs: number;
  remainingLabel: { ar: string; en: string };
} {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const remainingMs = exp - now;
  const isExpired = remainingMs <= 0;

  if (isExpired) {
    return { isExpired: true, remainingMs: 0, remainingLabel: { ar: "انتهت المهلة", en: "Deadline expired" } };
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return {
      isExpired: false,
      remainingMs,
      remainingLabel: {
        ar: `${hours} ساعة و ${minutes} دقيقة متبقية`,
        en: `${hours}h ${minutes}m remaining`,
      },
    };
  }

  return {
    isExpired: false,
    remainingMs,
    remainingLabel: {
      ar: `${minutes} دقيقة متبقية`,
      en: `${minutes}m remaining`,
    },
  };
}
