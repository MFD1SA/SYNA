import {
  FileText, ClipboardList, Eye, CheckCircle2, Video, TrendingUp,
  Shield, Handshake, XCircle, Search, UserCheck, MessageSquare,
  Building2, Lock,
} from "lucide-react";

/**
 * Unified 13-stage deal lifecycle used across Owner, Developer, and Admin dashboards.
 * Maps to the `deal_stage` enum in the database.
 *
 * DB enum values (10):
 *   listed, request_submitted, owner_review, owner_approved,
 *   meeting_scheduled, strategy_defined, documents_exchanged,
 *   agreements_prepared, deal_closed, deal_cancelled
 *
 * UI display labels follow the 13-stage naming requested by the business:
 *   مسودة, أرض معتمدة, فرصة منشورة, استقبال عروض, تم التقديم,
 *   تم استلام العرض, تمت المعاينة, قيد المراجعة, مطور مختار,
 *   قيد التفاوض, تم الاتفاق, مشروع نشط, مغلقة
 *
 * We map the 10 DB stages to 13 display stages by splitting some stages
 * into sub-states displayed on the UI while keeping DB compatibility.
 */

export interface StageInfo {
  ar: string;
  en: string;
  color: string;
  icon: any; // LucideIcon
}

export const stageConfig: Record<string, StageInfo> = {
  listed:               { ar: "مسودة",           en: "Draft",              color: "text-muted-foreground", icon: FileText },
  request_submitted:    { ar: "أرض معتمدة",      en: "Land Approved",      color: "text-emerald-600",      icon: CheckCircle2 },
  owner_review:         { ar: "فرصة منشورة",     en: "Published",          color: "text-blue-600",         icon: Search },
  owner_approved:       { ar: "تم التقديم",       en: "Submitted",          color: "text-indigo-600",       icon: ClipboardList },
  meeting_scheduled:    { ar: "تم استلام العرض",   en: "Proposal Received",  color: "text-violet-600",       icon: Eye },
  strategy_defined:     { ar: "تمت المعاينة",     en: "Reviewed",           color: "text-cyan-600",         icon: TrendingUp },
  documents_exchanged:  { ar: "مطور مختار",       en: "Developer Selected", color: "text-orange-600",       icon: UserCheck },
  agreements_prepared:  { ar: "قيد التفاوض",      en: "Negotiating",        color: "text-amber-600",        icon: MessageSquare },
  deal_closed:          { ar: "مغلقة",            en: "Closed",             color: "text-emerald-700",      icon: Handshake },
  deal_cancelled:       { ar: "ملغاة",            en: "Cancelled",          color: "text-destructive",      icon: XCircle },
};

/** Ordered pipeline stages (excluding cancelled) */
export const stageOrder = [
  "listed",
  "request_submitted",
  "owner_review",
  "owner_approved",
  "meeting_scheduled",
  "strategy_defined",
  "documents_exchanged",
  "agreements_prepared",
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
