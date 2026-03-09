import {
  FileText, ClipboardList, Eye, CheckCircle2, Video, TrendingUp,
  Shield, Handshake, XCircle, Search, UserCheck, MessageSquare,
  Building2, Lock, Inbox, FileSearch, Award, Rocket, FolderCheck,
} from "lucide-react";

/**
 * Unified 13-stage deal lifecycle used across Owner, Developer, and Admin dashboards.
 * Maps to the `deal_stage` enum in the database (14 values incl. cancelled).
 *
 * DB enum values (14):
 *   listed, request_submitted, owner_review, accepting_proposals,
 *   owner_approved, meeting_scheduled, strategy_defined, under_review,
 *   documents_exchanged, agreements_prepared, agreed, active_project,
 *   deal_closed, deal_cancelled
 *
 * UI display labels (13 pipeline + cancelled):
 *   1.  مسودة            Draft
 *   2.  أرض معتمدة        Land Approved
 *   3.  فرصة منشورة       Published
 *   4.  استقبال عروض       Accepting Proposals
 *   5.  تم التقديم         Submitted
 *   6.  تم استلام العرض    Proposal Received
 *   7.  تمت المعاينة       Reviewed
 *   8.  قيد المراجعة       Under Review
 *   9.  مطور مختار         Developer Selected
 *   10. قيد التفاوض        Negotiating
 *   11. تم الاتفاق         Agreed
 *   12. مشروع نشط         Active Project
 *   13. مغلقة              Closed
 *   +   ملغاة              Cancelled
 */

export interface StageInfo {
  ar: string;
  en: string;
  color: string;
  icon: any; // LucideIcon
}

export const stageConfig: Record<string, StageInfo> = {
  listed:                { ar: "مسودة",            en: "Draft",                color: "text-muted-foreground", icon: FileText },
  request_submitted:     { ar: "أرض معتمدة",       en: "Land Approved",        color: "text-emerald-600",      icon: CheckCircle2 },
  owner_review:          { ar: "فرصة منشورة",      en: "Published",            color: "text-blue-600",         icon: Search },
  accepting_proposals:   { ar: "استقبال عروض",      en: "Accepting Proposals",  color: "text-sky-600",          icon: Inbox },
  owner_approved:        { ar: "تم التقديم",        en: "Submitted",            color: "text-indigo-600",       icon: ClipboardList },
  meeting_scheduled:     { ar: "تم استلام العرض",   en: "Proposal Received",    color: "text-violet-600",       icon: Eye },
  strategy_defined:      { ar: "تمت المعاينة",      en: "Reviewed",             color: "text-cyan-600",         icon: TrendingUp },
  under_review:          { ar: "قيد المراجعة",      en: "Under Review",         color: "text-purple-600",       icon: FileSearch },
  documents_exchanged:   { ar: "مطور مختار",        en: "Developer Selected",   color: "text-orange-600",       icon: UserCheck },
  agreements_prepared:   { ar: "قيد التفاوض",       en: "Negotiating",          color: "text-amber-600",        icon: MessageSquare },
  agreed:                { ar: "تم الاتفاق",        en: "Agreed",               color: "text-teal-600",         icon: FolderCheck },
  active_project:        { ar: "مشروع نشط",        en: "Active Project",       color: "text-green-600",        icon: Rocket },
  deal_closed:           { ar: "مغلقة",             en: "Closed",               color: "text-emerald-700",      icon: Handshake },
  deal_cancelled:        { ar: "ملغاة",             en: "Cancelled",            color: "text-destructive",      icon: XCircle },
};

/** Ordered pipeline stages (excluding cancelled) — 13 stages */
export const stageOrder = [
  "listed",
  "request_submitted",
  "owner_review",
  "accepting_proposals",
  "owner_approved",
  "meeting_scheduled",
  "strategy_defined",
  "under_review",
  "documents_exchanged",
  "agreements_prepared",
  "agreed",
  "active_project",
  "deal_closed",
];

export const healthLabels: Record<string, { ar: string; en: string; bg: string; text: string; dot: string }> = {
  green:  { ar: "سليمة",         en: "Healthy",         bg: "bg-emerald-500/10", text: "text-emerald-700", dot: "bg-emerald-500" },
  yellow: { ar: "تحتاج متابعة",  en: "Needs Attention", bg: "bg-amber-500/10",   text: "text-amber-700",   dot: "bg-amber-500" },
  red:    { ar: "متعثرة",        en: "At Risk",         bg: "bg-red-500/10",     text: "text-red-700",     dot: "bg-red-500" },
};

export const commissionStatusLabels: Record<string, { ar: string; en: string }> = {
  pending:  { ar: "قيد الانتظار",    en: "Pending" },
  paid:     { ar: "مدفوعة",          en: "Paid" },
  invoiced: { ar: "تم إصدار فاتورة", en: "Invoiced" },
  waived:   { ar: "معفاة",           en: "Waived" },
};

export const getStageProgress = (stage: string): number => {
  const idx = stageOrder.indexOf(stage);
  return idx >= 0 ? Math.round(((idx + 1) / stageOrder.length) * 100) : 0;
};
