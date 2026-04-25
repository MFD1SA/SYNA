import { supabase } from "@/integrations/supabase/client";

export type DealPhase =
  | "nda_pending"
  | "nda_developer_accepted"
  | "nda_both_accepted"
  | "under_review"
  | "study_required"
  | "study_submitted"
  | "study_under_review"
  | "study_changes_requested"
  | "study_resubmitted"
  | "study_approved"
  | "study_rejected"
  | "meeting_proposed"
  | "meeting_confirmed"
  | "meeting_completed"
  | "report_pending_approval"
  | "report_approved"
  | "report_rejected"
  | "report_changes_requested"
  | "report_expired"
  | "negotiation_active"
  | "final_approval"
  | "closed_won"
  | "closed_lost"
  | "cancelled";

export const TERMINAL_PHASES: DealPhase[] = ["closed_won", "closed_lost", "cancelled"];

export const phaseLabels: Record<DealPhase, { ar: string; en: string }> = {
  nda_pending: { ar: "بانتظار NDA", en: "NDA Pending" },
  nda_developer_accepted: { ar: "بانتظار موافقة المالك", en: "Awaiting Owner NDA" },
  nda_both_accepted: { ar: "جاهز للمراجعة", en: "Ready for Review" },
  under_review: { ar: "قيد المراجعة", en: "Under Review" },
  study_required: { ar: "دراسة مطلوبة", en: "Study Required" },
  study_submitted: { ar: "الدراسة مرفوعة", en: "Study Submitted" },
  study_under_review: { ar: "مراجعة الدراسة", en: "Study Under Review" },
  study_changes_requested: { ar: "تعديلات مطلوبة", en: "Changes Requested" },
  study_resubmitted: { ar: "أعيد رفع الدراسة", en: "Study Resubmitted" },
  study_approved: { ar: "الدراسة مقبولة", en: "Study Approved" },
  study_rejected: { ar: "الدراسة مرفوضة", en: "Study Rejected" },
  meeting_proposed: { ar: "اجتماع مقترح", en: "Meeting Proposed" },
  meeting_confirmed: { ar: "اجتماع مؤكد", en: "Meeting Confirmed" },
  meeting_completed: { ar: "اجتماع مكتمل", en: "Meeting Completed" },
  report_pending_approval: { ar: "تقرير بانتظار الاعتماد", en: "Report Pending Approval" },
  report_approved: { ar: "تقرير معتمد", en: "Report Approved" },
  report_rejected: { ar: "تقرير مرفوض", en: "Report Rejected" },
  report_changes_requested: { ar: "تعديلات على التقرير", en: "Report Changes Requested" },
  report_expired: { ar: "انتهت مهلة التقرير", en: "Report Expired" },
  negotiation_active: { ar: "تفاوض جاري", en: "Negotiation Active" },
  final_approval: { ar: "اعتماد نهائي", en: "Final Approval" },
  closed_won: { ar: "صفقة ناجحة", en: "Deal Won" },
  closed_lost: { ar: "مغلق", en: "Closed" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

export const phaseColors: Record<DealPhase, string> = {
  nda_pending: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  nda_developer_accepted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  nda_both_accepted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  under_review: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  study_required: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  study_submitted: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  study_under_review: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  study_changes_requested: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  study_resubmitted: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  study_approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  study_rejected: "bg-destructive/10 text-destructive border-destructive/20",
  meeting_proposed: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  meeting_confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  meeting_completed: "bg-primary/10 text-primary border-primary/20",
  report_pending_approval: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  report_approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  report_rejected: "bg-destructive/10 text-destructive border-destructive/20",
  report_changes_requested: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  report_expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  negotiation_active: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  final_approval: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  closed_won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed_lost: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export const phaseIcons = {
  nda_pending: "Clock",
  nda_developer_accepted: "Clock",
  nda_both_accepted: "FileText",
  under_review: "Eye",
  study_required: "AlertCircle",
  study_submitted: "FileUp",
  study_under_review: "Eye",
  study_changes_requested: "AlertCircle",
  study_resubmitted: "FileUp",
  study_approved: "CheckCircle2",
  study_rejected: "XCircle",
  meeting_proposed: "Calendar",
  meeting_confirmed: "CalendarCheck",
  meeting_completed: "CheckCircle2",
  report_pending_approval: "Clock",
  report_approved: "CheckCircle2",
  report_rejected: "XCircle",
  report_changes_requested: "AlertCircle",
  report_expired: "Clock",
  negotiation_active: "MessageSquare",
  final_approval: "ShieldCheck",
  closed_won: "Trophy",
  closed_lost: "XCircle",
  cancelled: "XCircle",
} as const;

/**
 * Returns true if the phase is a terminal state (no further transitions
 * allowed). Mirrors TERMINAL_PHASES but gives a readable call site.
 */
export function isTerminalPhase(phase: DealPhase | string | null | undefined): boolean {
  return !!phase && TERMINAL_PHASES.includes(phase as DealPhase);
}

/**
 * P1.5 — pre-flight prerequisite check. The edge function is the source
 * of truth for the full transition graph (supabase/functions/transition-
 * deal-phase/index.ts), but we do *cheap* client-side checks first to:
 *   1) avoid a useless edge-function round-trip when the deal is closed
 *   2) give a friendlier error message than the generic server rejection
 *   3) let callers disable buttons up-front
 *
 * Any check that would have to duplicate the server-side graph is left
 * to the server so we don't drift. This function ONLY checks:
 *   - request exists
 *   - current phase is not terminal
 *   - if `targetPhase` is terminal, require a reason (matches server behavior)
 */
export async function checkTransitionPrerequisites(
  requestId: string,
  targetPhase: DealPhase,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!requestId) return { ok: false, error: "Request ID is required" };

  const { data, error } = await supabase
    .from("deal_requests")
    .select("current_phase, closed_at")
    .eq("id", requestId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Deal request not found" };

  const current = data.current_phase as DealPhase | null;

  // Already terminal → nothing can change.
  if (isTerminalPhase(current)) {
    return {
      ok: false,
      error: `Cannot transition a closed deal (current phase: ${current}).`,
    };
  }

  // Redundant transition (same → same) is a no-op. Block to avoid
  // accidental audit-log noise and double-counted timestamps.
  if (current === targetPhase) {
    return {
      ok: false,
      error: `Deal is already in phase "${targetPhase}".`,
    };
  }

  // Terminal transitions should carry a reason for the audit trail.
  // The server enforces this too, but catching it early avoids the round trip.
  if ((targetPhase === "closed_lost" || targetPhase === "cancelled") && !reason?.trim()) {
    return {
      ok: false,
      error: "A reason is required when closing or cancelling a deal.",
    };
  }

  return { ok: true };
}

export async function transitionDealPhase(
  requestId: string,
  targetPhase: DealPhase,
  reason?: string,
): Promise<{
  success: boolean;
  error?: string;
  from_phase?: string;
  to_phase?: string;
  actor_role?: string;
}> {
  // P1.5 — pre-flight guard.
  const pre = await checkTransitionPrerequisites(requestId, targetPhase, reason);
  if (!pre.ok) return { success: false, error: pre.error };

  const { data, error } = await supabase.functions.invoke("transition-deal-phase", {
    body: { request_id: requestId, target_phase: targetPhase, reason: reason || null },
  });

  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return {
    success: true,
    from_phase: data.from_phase,
    to_phase: data.to_phase,
    actor_role: data.actor_role,
  };
}
