import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */

export type EmailStatus = "queued" | "sent" | "failed" | "bounced";

export interface EmailLogEntry {
  id: string;
  event_type: string;
  recipient_email: string;
  recipient_user_id: string | null;
  subject: string;
  body_preview: string | null;
  status: EmailStatus;
  attempts: number;
  max_attempts: number;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  error: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const emailStatusLabels: Record<EmailStatus, { ar: string; en: string }> = {
  queued: { ar: "في الانتظار", en: "Queued" },
  sent: { ar: "تم الإرسال", en: "Sent" },
  failed: { ar: "فشل", en: "Failed" },
  bounced: { ar: "مرتد", en: "Bounced" },
};

export const emailStatusColors: Record<EmailStatus, string> = {
  queued: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  sent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  bounced: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

/* ── All event types tracked in the system ── */
export const eventTypeLabels: Record<string, { ar: string; en: string }> = {
  developer_registered: { ar: "تسجيل مطور جديد", en: "New Developer Registered" },
  commission_accepted: { ar: "موافقة على العمولة", en: "Commission Accepted" },
  nda_developer_accepted: { ar: "NDA المطور", en: "Developer NDA Accepted" },
  nda_owner_accepted: { ar: "NDA المالك", en: "Owner NDA Accepted" },
  request_submitted: { ar: "تقديم طلب", en: "Request Submitted" },
  request_under_review: { ar: "انتقال للمراجعة", en: "Under Review" },
  study_required: { ar: "طلب دراسة", en: "Study Requested" },
  study_submitted: { ar: "رفع الدراسة", en: "Study Submitted" },
  study_approved: { ar: "قبول الدراسة", en: "Study Approved" },
  study_rejected: { ar: "رفض الدراسة", en: "Study Rejected" },
  study_changes_requested: { ar: "طلب تعديل الدراسة", en: "Study Changes Requested" },
  meeting_proposed: { ar: "اقتراح اجتماع", en: "Meeting Proposed" },
  meeting_confirmed: { ar: "تأكيد الاجتماع", en: "Meeting Confirmed" },
  meeting_rescheduled: { ar: "إعادة جدولة", en: "Meeting Rescheduled" },
  meeting_cancelled: { ar: "إلغاء الاجتماع", en: "Meeting Cancelled" },
  meeting_completed: { ar: "اكتمال الاجتماع", en: "Meeting Completed" },
  report_created: { ar: "إصدار تقرير الاجتماع", en: "Meeting Report Created" },
  report_approved: { ar: "اعتماد التقرير", en: "Report Approved" },
  report_rejected: { ar: "رفض التقرير", en: "Report Rejected" },
  report_changes_requested: { ar: "طلب تعديل التقرير", en: "Report Changes Requested" },
  report_deadline_reminder: { ar: "تذكير بانتهاء المهلة", en: "Deadline Reminder" },
  report_expired: { ar: "انتهاء مهلة التقرير", en: "Report Deadline Expired" },
  request_rejected: { ar: "رفض الطلب", en: "Request Rejected" },
  request_cancelled: { ar: "إلغاء الطلب", en: "Request Cancelled" },
};

/* ── API Functions ── */

/** Fetch email log entries for admin view */
export async function getEmailLogs(params?: {
  relatedEntityType?: string;
  relatedEntityId?: string;
  status?: EmailStatus;
  limit?: number;
}): Promise<EmailLogEntry[]> {
  let query = supabase
    .from("email_log" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(params?.limit || 50);

  if (params?.relatedEntityType) {
    query = query.eq("related_entity_type", params.relatedEntityType);
  }
  if (params?.relatedEntityId) {
    query = query.eq("related_entity_id", params.relatedEntityId);
  }
  if (params?.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as EmailLogEntry[];
}

/** Get email stats for admin dashboard */
export async function getEmailStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  queued: number;
}> {
  const { data, error } = await supabase
    .from("email_log" as any)
    .select("status");
  if (error) throw new Error(error.message);
  const entries = (data || []) as Array<{ status: string }>;
  return {
    total: entries.length,
    sent: entries.filter(e => e.status === "sent").length,
    failed: entries.filter(e => e.status === "failed").length,
    queued: entries.filter(e => e.status === "queued").length,
  };
}
