import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Send, Clock, CheckCircle2, XCircle, AlertCircle, Eye, FileText, MapPin, Building2,
  ChevronDown, ChevronUp, FileUp, Calendar, CalendarCheck, Ban, MessageSquare, ShieldCheck, Trophy,
} from "lucide-react";
import { phaseLabels, phaseColors, TERMINAL_PHASES, type DealPhase } from "@/services/dealPhase.service";
import StudyPanel from "@/components/study/StudyPanel";
import MeetingPanel from "@/components/meeting/MeetingPanel";
import MeetingReportPanel from "@/components/meeting/MeetingReportPanel";
import NegotiationPanel from "@/components/negotiation/NegotiationPanel";
import DealClosingPanel from "@/components/negotiation/DealClosingPanel";

const phaseIconMap: Record<string, React.ElementType> = {
  nda_pending: Clock,
  nda_developer_accepted: Clock,
  nda_both_accepted: FileText,
  under_review: Eye,
  study_required: AlertCircle,
  study_submitted: FileUp,
  study_under_review: Eye,
  study_changes_requested: AlertCircle,
  study_resubmitted: FileUp,
  study_approved: CheckCircle2,
  study_rejected: XCircle,
  meeting_proposed: Calendar,
  meeting_confirmed: CalendarCheck,
  meeting_completed: CheckCircle2,
  report_pending_approval: Clock,
  report_approved: CheckCircle2,
  report_rejected: XCircle,
  report_changes_requested: AlertCircle,
  report_expired: Clock,
  negotiation_active: MessageSquare,
  final_approval: ShieldCheck,
  closed_won: CheckCircle2,
  closed_lost: XCircle,
  cancelled: Ban,
};

/* ── Developer guidance per phase ── */
const devGuidance: Record<DealPhase, { ar: string; en: string }> = {
  nda_pending: { ar: "بانتظار موافقتك على اتفاقية عدم الإفصاح", en: "Awaiting your NDA acceptance" },
  nda_developer_accepted: { ar: "وافقت على NDA — بانتظار موافقة المالك", en: "You accepted the NDA — awaiting owner approval" },
  nda_both_accepted: { ar: "اتفاقية عدم الإفصاح مكتملة — بانتظار مراجعة المالك", en: "NDA complete — awaiting owner review" },
  under_review: { ar: "طلبك قيد المراجعة من المالك", en: "Your request is under owner review" },
  study_required: { ar: "المالك يطلب دراسة جدوى — يرجى رفعها", en: "Owner requests a feasibility study — please upload it" },
  study_submitted: { ar: "تم رفع الدراسة — بانتظار بدء المراجعة", en: "Study uploaded — awaiting review start" },
  study_under_review: { ar: "الدراسة قيد المراجعة", en: "Study is under review" },
  study_changes_requested: { ar: "المالك يطلب تعديلات — يرجى إعادة رفع الدراسة", en: "Owner requests changes — please resubmit" },
  study_resubmitted: { ar: "أعيد رفع الدراسة — بانتظار المراجعة", en: "Study resubmitted — awaiting review" },
  study_approved: { ar: "الدراسة مقبولة — بانتظار اقتراح اجتماع من المالك", en: "Study approved — awaiting meeting proposal from owner" },
  study_rejected: { ar: "تم رفض الدراسة", en: "Study has been rejected" },
  meeting_proposed: { ar: "تم اقتراح اجتماع — يمكنك التأكيد أو طلب إعادة الجدولة", en: "Meeting proposed — you can confirm or request reschedule" },
  meeting_confirmed: { ar: "الاجتماع مؤكد — بانتظار انعقاده", en: "Meeting confirmed — awaiting completion" },
  meeting_completed: { ar: "تم عقد الاجتماع — بانتظار تقرير من المالك", en: "Meeting completed — awaiting report from owner" },
  report_pending_approval: { ar: "التقرير بانتظار اعتمادك خلال 24 ساعة", en: "Report awaiting your approval within 24 hours" },
  report_approved: { ar: "تم اعتماد التقرير من الطرفين", en: "Report approved by both parties" },
  report_rejected: { ar: "تم رفض التقرير", en: "Report has been rejected" },
  report_changes_requested: { ar: "تم طلب تعديلات على التقرير", en: "Report changes have been requested" },
  report_expired: { ar: "انتهت مهلة اعتماد التقرير", en: "Report approval deadline has expired" },
  negotiation_active: { ar: "التفاوض جاري — يمكنك تقديم عرض أو الرد على عرض المالك", en: "Negotiation active — submit an offer or respond to the owner's offer" },
  final_approval: { ar: "تم قبول العرض — بانتظار إغلاق الصفقة", en: "Offer accepted — awaiting deal closing" },
  closed_won: { ar: "تم إغلاق الصفقة بنجاح", en: "Deal closed successfully" },
  closed_lost: { ar: "تم رفض هذا الطلب نهائيًا", en: "This request has been permanently rejected" },
  cancelled: { ar: "تم إلغاء هذا الطلب", en: "This request has been cancelled" },
};

const EXPANDABLE_PHASES: DealPhase[] = [
  "study_required", "study_submitted", "study_under_review", "study_changes_requested",
  "study_resubmitted", "study_approved", "study_rejected",
  "meeting_proposed", "meeting_confirmed", "meeting_completed",
  "report_pending_approval", "report_approved", "report_rejected",
  "report_changes_requested", "report_expired",
  "negotiation_active", "final_approval", "closed_won",
];

const CrmMyRequests: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "طلباتي" : "My Requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReq, setExpandedReq] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: dev } = await supabase.from("developers").select("id").eq("user_id", user.id).maybeSingle();
      if (!dev) { setLoading(false); return; }
      const { data } = await supabase
        .from("deal_requests")
        .select("*, lands(city, district, land_area_sqm)")
        .eq("developer_id", dev.id)
        .order("created_at", { ascending: false }) as any;
      setRequests(data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <CrmLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B4C66]/10">
            <Send className="h-5 w-5 text-[#2B4C66]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{isAr ? "طلباتي" : "My Requests"}</h1>
        </div>
        <p className="ps-12 text-sm font-light text-muted-foreground">
          {isAr ? "متابعة حالة طلبات الشراكة المقدمة" : "Track the status of your submitted partnership requests"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Send className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لم تقدم أي طلبات شراكة بعد" : "You haven't submitted any requests yet"}</p>
          <p className="mt-1 text-xs font-light text-muted-foreground">{isAr ? "استعرض الأراضي المتاحة لتقديم طلبك الأول" : "Browse available lands to submit your first request"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const phase = (r.current_phase || "nda_developer_accepted") as DealPhase;
            const pl = phaseLabels[phase] || phaseLabels.nda_developer_accepted;
            const pc = phaseColors[phase] || phaseColors.nda_developer_accepted;
            const StatusIcon = phaseIconMap[phase] || Clock;
            const isTerminal = TERMINAL_PHASES.includes(phase);
            const guidance = devGuidance[phase];
            const isExpanded = expandedReq === r.id;

            return (
              <div
                key={r.id}
                className={`rounded-xl border bg-card transition-all shadow-sm hover:shadow-md ${
                  isTerminal ? "border-border/40 opacity-70" : "border-border/60 hover:border-border"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-foreground">
                          {r.lands?.city}{r.lands?.district ? ` - ${r.lands.district}` : ""}
                        </span>
                        {r.lands?.land_area_sqm && (
                          <span className="text-xs text-muted-foreground">
                            <span dir="ltr" className="tabular-nums">{Number(r.lands.land_area_sqm).toLocaleString()}</span> {isAr ? "م²" : "sqm"}
                          </span>
                        )}
                      </div>
                      {/* Proposal */}
                      {r.proposed_project_type && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium text-foreground">{r.proposed_project_type}</span>
                        </div>
                      )}
                      {r.proposal_summary && (
                        <p className="text-xs font-light text-muted-foreground line-clamp-2 leading-relaxed">{r.proposal_summary}</p>
                      )}
                      {r.owner_response_notes && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
                          <span className="font-medium">{isAr ? "ملاحظات:" : "Notes:"}</span> {r.owner_response_notes}
                        </div>
                      )}
                      {/* Rejection reason */}
                      {phase === "closed_lost" && r.rejection_reason && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          <span className="font-medium">{isAr ? "سبب الرفض:" : "Rejection reason:"}</span> {r.rejection_reason}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground/60" dir="ltr">
                        {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    {/* Phase badge */}
                    <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-[11px] font-medium shrink-0 shadow-sm ${pc}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {isAr ? pl.ar : pl.en}
                    </Badge>
                  </div>
                </div>

                {/* Guidance + expand toggle */}
                <div className={`border-t px-5 py-3 ${isTerminal ? "border-border/30 bg-muted/20" : "border-border/40 bg-muted/5"}`}>
                  <p className={`text-xs font-light leading-relaxed ${isTerminal ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                    {isAr ? guidance.ar : guidance.en}
                  </p>
                  {EXPANDABLE_PHASES.includes(phase) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground mt-2 w-full justify-center hover:text-foreground"
                      onClick={() => setExpandedReq(isExpanded ? null : r.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isExpanded
                        ? (isAr ? "إخفاء التفاصيل" : "Hide Details")
                        : (isAr ? "عرض التفاصيل" : "View Details")}
                    </Button>
                  )}
                </div>

                {/* Expandable Study + Meeting Panels */}
                {isExpanded && EXPANDABLE_PHASES.includes(phase) && (
                  <div className="border-t border-border/40 p-5 space-y-4 bg-muted/5">
                    <StudyPanel
                      requestId={r.id}
                      currentPhase={phase}
                      viewerRole="developer"
                      isAr={isAr}
                      onPhaseChange={() => window.location.reload()}
                    />
                    <MeetingPanel
                      requestId={r.id}
                      currentPhase={phase}
                      viewerRole="developer"
                      isAr={isAr}
                      onPhaseChange={() => window.location.reload()}
                    />
                    <MeetingReportPanel
                      requestId={r.id}
                      meetingId=""
                      currentPhase={phase}
                      viewerRole="developer"
                      isAr={isAr}
                      onPhaseChange={() => window.location.reload()}
                    />
                    <NegotiationPanel
                      requestId={r.id}
                      currentPhase={phase}
                      viewerRole="developer"
                      isAr={isAr}
                      onPhaseChange={() => window.location.reload()}
                    />
                    <DealClosingPanel
                      requestId={r.id}
                      currentPhase={phase}
                      viewerRole="developer"
                      isAr={isAr}
                      onPhaseChange={() => window.location.reload()}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmMyRequests;
