import React, { useEffect, useRef, useState } from "react";
import { logAudit } from "@/lib/auditLog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import OwnerLayout from "@/components/owner/OwnerLayout";
import DashboardShell from "@/components/dashboard/DashboardShell";
import BentoCard from "@/components/dashboard/BentoCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Building2,
  MapPin, Shield, Lock, Loader2, ShieldCheck, BookOpen, Ban, Calendar, ChevronDown, ChevronUp,
  MessageSquare, Trophy,
} from "lucide-react";
import StudyPanel from "@/components/study/StudyPanel";
import MeetingPanel from "@/components/meeting/MeetingPanel";
import MeetingReportPanel from "@/components/meeting/MeetingReportPanel";
import NegotiationPanel from "@/components/negotiation/NegotiationPanel";
import DealClosingPanel from "@/components/negotiation/DealClosingPanel";
import { getNDAConsentsForUser, submitNDADecision, type NDAConsent } from "@/services/nda.service";
import {
  transitionDealPhase,
  phaseLabels,
  phaseColors,
  TERMINAL_PHASES,
  type DealPhase,
} from "@/services/dealPhase.service";
import {
  resolvePartyIdentities,
  getDeveloperDisplayName,
  getRevealBadge,
  getRevealLevel,
  type PartyIdentity,
  type RevealLevel,
} from "@/services/identityReveal.service";

/* ── Phase → Icon map ── */
const phaseIconMap: Record<string, React.ElementType> = {
  nda_pending: Clock,
  nda_developer_accepted: Clock,
  nda_both_accepted: FileText,
  under_review: Eye,
  study_required: AlertCircle,
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

/* ── Phase → guidance message for owner ── */
const ownerGuidance: Record<DealPhase, { ar: string; en: string }> = {
  nda_pending: { ar: "بانتظار موافقة المطور على اتفاقية عدم الإفصاح", en: "Waiting for the developer to accept the NDA" },
  nda_developer_accepted: { ar: "المطور وافق على NDA — بانتظار موافقتك على اتفاقية عدم الإفصاح من لوحة التحكم", en: "Developer accepted NDA — awaiting your NDA approval from the dashboard" },
  nda_both_accepted: { ar: "اتفاقية عدم الإفصاح مكتملة — يمكنك مراجعة الطلب واتخاذ إجراء", en: "NDA complete — you can review this request and take action" },
  under_review: { ar: "الطلب تحت مراجعتك — يمكنك طلب دراسة جدوى أو اقتراح اجتماع أو رفض الطلب", en: "Under your review — request a study, propose a meeting, or reject" },
  study_required: { ar: "تم طلب دراسة الجدوى — بانتظار المطور لتقديم الدراسة", en: "Feasibility study requested — waiting for the developer to submit" },
  study_submitted: { ar: "المطور رفع الدراسة — يمكنك بدء المراجعة", en: "Developer submitted the study — you can start reviewing" },
  study_under_review: { ar: "أنت تراجع الدراسة — قبول / طلب تعديل / رفض", en: "You are reviewing the study — approve, request changes, or reject" },
  study_changes_requested: { ar: "طلبت تعديلات — بانتظار المطور لإعادة الرفع", en: "Changes requested — waiting for developer to resubmit" },
  study_resubmitted: { ar: "المطور أعاد رفع الدراسة — يمكنك بدء المراجعة", en: "Developer resubmitted — you can start reviewing" },
  study_approved: { ar: "الدراسة مقبولة — يمكنك اقتراح اجتماع", en: "Study approved — you can propose a meeting" },
  study_rejected: { ar: "تم رفض الدراسة", en: "Study has been rejected" },
  meeting_proposed: { ar: "تم اقتراح اجتماع — بانتظار رد المطور", en: "Meeting proposed — awaiting developer response" },
  meeting_confirmed: { ar: "الاجتماع مؤكد — يمكنك تسجيل انعقاده بعد عقده", en: "Meeting confirmed — mark as completed after it's held" },
  meeting_completed: { ar: "تم عقد الاجتماع — يمكنك إعداد تقرير الاجتماع", en: "Meeting completed — you can create the meeting report" },
  report_pending_approval: { ar: "التقرير بانتظار اعتماد الطرفين خلال 24 ساعة", en: "Report awaiting approval from both parties within 24 hours" },
  report_approved: { ar: "تم اعتماد التقرير من الطرفين", en: "Report approved by both parties" },
  report_rejected: { ar: "تم رفض التقرير — يمكنك إعادة إصداره", en: "Report rejected — you can reissue it" },
  report_changes_requested: { ar: "تم طلب تعديلات على التقرير — يمكنك إعادة إصداره", en: "Report changes requested — you can reissue it" },
  report_expired: { ar: "انتهت مهلة اعتماد التقرير — يمكنك إعادة إصداره", en: "Report approval deadline expired — you can reissue it" },
  negotiation_active: { ar: "التفاوض جاري — قدّم عرضك أو رد على عرض المطور", en: "Negotiation active — submit your offer or respond to the developer's offer" },
  final_approval: { ar: "تم قبول العرض — يمكنك إغلاق الصفقة بنجاح أو إعادة التفاوض", en: "Offer accepted — you can close the deal or reopen negotiation" },
  closed_won: { ar: "تم إغلاق الصفقة بنجاح", en: "Deal closed successfully" },
  closed_lost: { ar: "تم رفض هذا الطلب نهائيًا", en: "This request has been permanently rejected" },
  cancelled: { ar: "تم إلغاء هذا الطلب", en: "This request has been cancelled" },
};

/* ── Allowed owner actions per phase ── */
function getOwnerActions(phase: DealPhase): Array<"accept_nda" | "approve" | "study" | "reject"> {
  switch (phase) {
    case "nda_developer_accepted":
      // Developer accepted NDA, now owner must accept too + can reject outright
      return ["accept_nda", "reject"];
    case "nda_both_accepted":
      return ["approve", "study", "reject"];
    case "under_review":
      return ["study", "reject"];
    default:
      return [];
  }
}

/* ── Phases that show expandable study/meeting panels ── */
const EXPANDABLE_PHASES: DealPhase[] = [
  "study_required", "study_submitted", "study_under_review", "study_changes_requested",
  "study_resubmitted", "study_approved", "study_rejected",
  "meeting_proposed", "meeting_confirmed", "meeting_completed",
  "report_pending_approval", "report_approved", "report_rejected",
  "report_changes_requested", "report_expired",
  "negotiation_active", "final_approval", "closed_won",
];

const OwnerRequests: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "طلبات الشراكة" : "Partnership Requests");

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerNdaMap, setOwnerNdaMap] = useState<Record<string, NDAConsent["status"]>>({});
  const [identities, setIdentities] = useState<Record<string, PartyIdentity>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ requestId: string; devLabel: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [expandedReq, setExpandedReq] = useState<string | null>(null);

  /* ── Re-entry guard keyed by requestId. Buttons on every card can
   * double-fire if the user double-clicks before the RPC round-trip
   * finishes. `actionLoading` is a single string, so two different
   * cards can still overlap; this ref blocks per-request. */
  const submittingRef = useRef<Record<string, boolean>>({});

  /* ── Fetch data ──
   * Exposed as a `refreshAll` callback so child phase panels can
   * trigger a re-fetch after they transition a deal, instead of
   * forcing a full page reload (which drops dialog state, scroll
   * position, and re-initialises the Supabase client). */
  const refreshAll = React.useCallback(async () => {
    if (!user) return;
    const { data: lands } = await supabase.from("lands").select("id").eq("owner_id", user.id).is("deleted_at", null);
    if (!lands || lands.length === 0) { setLoading(false); return; }
    const landIds = lands.map(l => l.id);
    const [reqRes, ndaRes] = await Promise.all([
      supabase
        .from("deal_requests")
        .select("*, lands(city, district, land_area_sqm)")
        .in("land_id", landIds)
        .order("created_at", { ascending: false }),
      getNDAConsentsForUser(user.id, "owner"),
    ]);
    const reqs = reqRes.data || [];
    setRequests(reqs);
    const map: Record<string, NDAConsent["status"]> = {};
    ndaRes.forEach(n => { map[n.land_id] = n.status; });
    setOwnerNdaMap(map);

    // Resolve identities via centralized Edge Function (no direct developer JOINs)
    if (reqs.length > 0) {
      try {
        const result = await resolvePartyIdentities(reqs.map(r => r.id));
        setIdentities(result.identities);
      } catch (e) { console.error("Identity resolve error:", e); }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  /* ── Action handlers (all go through transitionDealPhase) ──
   *
   * Returns a boolean so callers (e.g. confirmReject) can distinguish
   * success from failure — important because we previously dismissed
   * the reject dialog unconditionally, which silently swallowed errors
   * and left the request in its previous phase while pretending it had
   * been rejected.
   *
   * The submittingRef gate is stronger than `actionLoading` because
   * `actionLoading` is reset in `finally` — a double-click that fires
   * before React commits the state change would still slip through.
   * The ref is synchronous. */
  const handleTransition = async (
    requestId: string,
    target: DealPhase,
    reason?: string,
  ): Promise<boolean> => {
    if (submittingRef.current[requestId]) return false;
    submittingRef.current[requestId] = true;
    setActionLoading(requestId);
    try {
      const result = await transitionDealPhase(requestId, target, reason);
      if (!result.success) throw new Error(result.error || "Transition failed");

      // Update local state
      setRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, current_phase: target, ...(target === "closed_lost" ? { closed_at: new Date().toISOString(), rejection_reason: reason || null } : {}) } : r)
      );

      // Audit — transitions driven from the owner panel are high-signal
      // (especially closed_lost); log once, after success, per P1-6.
      try {
        await logAudit(
          user?.id || "",
          user?.email,
          target === "closed_lost" ? "reject_request" : "transition_phase",
          "deal_request",
          requestId,
          { to_phase: target, reason: reason || null },
        );
      } catch (e) {
        // Audit failures must not flip the operation back to "failed"
        // in the UI — the real work already committed server-side.
        console.error("Audit log failed:", e);
      }

      const labels: Record<string, { ar: string; en: string }> = {
        under_review: { ar: "تمت الموافقة المبدئية", en: "Preliminary approval granted" },
        study_required: { ar: "تم طلب الدراسة", en: "Study requested" },
        closed_lost: { ar: "تم استبعاد الطلب", en: "Request excluded" },
      };
      const lbl = labels[target] || { ar: "تم التحديث", en: "Updated" };
      toast({ title: isAr ? lbl.ar : lbl.en });
      return true;
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
      return false;
    } finally {
      setActionLoading(null);
      delete submittingRef.current[requestId];
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog) return;
    const ok = await handleTransition(rejectDialog.requestId, "closed_lost", rejectNotes || undefined);
    // Only dismiss the dialog on success — if the RPC failed the toast
    // surfaces the error and the user keeps their typed reason so they
    // can retry without re-typing.
    if (ok) {
      setRejectDialog(null);
      setRejectNotes("");
    }
  };

  /* ── Owner accepts the NDA for a specific request ── */
  const handleAcceptNDA = async (req: { id: string; land_id: string }): Promise<boolean> => {
    if (submittingRef.current[req.id]) return false;
    submittingRef.current[req.id] = true;
    setActionLoading(req.id);
    try {
      const result = await submitNDADecision(req.land_id, "accept", "owner");
      if (!result.success) throw new Error(result.error || "NDA submit failed");
      // Flip state optimistically — the land now has an accepted owner NDA
      setOwnerNdaMap(prev => ({ ...prev, [req.land_id]: "accepted" }));
      // Transition the request phase to nda_both_accepted (both parties are in)
      const transition = await transitionDealPhase(req.id, "nda_both_accepted");
      if (!transition.success) throw new Error(transition.error || "Phase transition failed");
      setRequests(prev => prev.map(r => r.id === req.id
        ? { ...r, current_phase: "nda_both_accepted", owner_nda_status: "accepted" }
        : r));

      try {
        await logAudit(
          user?.id || "",
          user?.email,
          "accept_nda",
          "deal_request",
          req.id,
          { land_id: req.land_id, to_phase: "nda_both_accepted" },
        );
      } catch (e) {
        console.error("Audit log failed:", e);
      }

      toast({ title: isAr ? "تم قبول اتفاقية عدم الإفصاح" : "NDA accepted" });
      return true;
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
      return false;
    } finally {
      setActionLoading(null);
      delete submittingRef.current[req.id];
    }
  };

  /* ── Render ── */
  return (
    <OwnerLayout>
      <DashboardShell isAr={isAr} accent="gold">
        <BentoCard variant="hero" span="full" padding="lg" className="relative overflow-hidden mb-5">
          <div className="absolute top-0 end-0 w-60 h-60 bg-[#C2A86B]/15 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C2A86B]/15 text-[11px] font-semibold text-[#A88A4A] mb-2">
                <FileText className="w-3 h-3" strokeWidth={2} />
                {isAr ? "الطلبات" : "Requests"}
              </span>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#1E374B] dark:text-white tracking-tight">
                {isAr ? "طلبات الشراكة الواردة" : "Incoming Partnership Requests"}
              </h1>
              <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                {isAr ? "متابعة طلبات المطورين على أراضيك واتخاذ الإجراءات المناسبة" : "Track developer requests on your lands and take appropriate actions"}
              </p>
            </div>
            {!loading && requests.length > 0 && (
              <div className="px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{isAr ? "الطلبات" : "Requests"}</p>
                <p className="text-[22px] font-bold text-[#1E374B] dark:text-white tracking-tight leading-none mt-1" dir="ltr">{requests.length}</p>
              </div>
            )}
          </div>
        </BentoCard>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50 border border-border/40" />)}
        </div>
      ) : requests.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/40 rounded-2xl bg-card">
          <FileText className="h-12 w-12 text-muted-foreground/25 mb-4" strokeWidth={1} />
          <h3 className="text-base font-medium text-foreground mb-1">{isAr ? "لا توجد طلبات شراكة" : "No Partnership Requests"}</h3>
          <p className="text-sm font-light text-muted-foreground max-w-sm">
            {isAr ? "لم يتقدم أي مطور بطلب شراكة على أراضيك حتى الآن" : "No developer has submitted a partnership request on your lands yet"}
          </p>
        </div>
      ) : (
        /* Request cards */
        <div className="space-y-4">
          {requests.map((req, idx) => {
            const phase = (req.current_phase || "nda_developer_accepted") as DealPhase;
            const pl = phaseLabels[phase] || phaseLabels.nda_developer_accepted;
            const pc = phaseColors[phase] || phaseColors.nda_developer_accepted;
            const StatusIcon = phaseIconMap[phase] || Clock;
            const isTerminal = TERMINAL_PHASES.includes(phase);
            const actions = getOwnerActions(phase);
            const isLoading = actionLoading === req.id;

            // Identity from centralized service — no local developer data
            const identity = identities[req.id];
            const devRevealLevel = identity?.reveal_level_for_developer || getRevealLevel(phase, "owner", "developer");
            const devLabel = getDeveloperDisplayName(identity, idx + 1, isAr);
            const isRevealed = devRevealLevel !== "anonymous";
            const revealBadge = getRevealBadge(devRevealLevel);

            const guidance = ownerGuidance[phase];

            return (
              <div
                key={req.id}
                className={`rounded-xl border bg-card transition-all shadow-sm hover:shadow-md ${
                  isTerminal
                    ? "border-border/40 opacity-70"
                    : actions.length > 0
                      ? "border-primary/20 hover:border-primary/40"
                      : "border-border/60 hover:border-border"
                }`}
              >
                {/* Card top section */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Developer + Land info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Developer name */}
                      <div className="flex items-center gap-2">
                        {isRevealed ? (
                          <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                        )}
                        <span className={`text-sm font-medium truncate ${isRevealed ? "text-foreground" : "text-muted-foreground italic"}`}>
                          {devLabel}
                        </span>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${revealBadge.color}`}>
                          {isAr ? revealBadge.labelAr : revealBadge.labelEn}
                        </Badge>
                      </div>
                      {/* Developer website — only if revealed */}
                      {isRevealed && identity?.developer?.website && (
                        <p className="text-[11px] text-muted-foreground truncate">{identity.developer.website as string}</p>
                      )}

                      {/* Location + Area */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {req.lands?.city}{req.lands?.district ? ` - ${req.lands.district}` : ""}
                        </span>
                        {req.lands?.land_area_sqm && (
                          <>
                            <span className="h-3 w-px bg-border" />
                            <span><span dir="ltr" className="tabular-nums">{Number(req.lands.land_area_sqm).toLocaleString()}</span> {isAr ? "م²" : "sqm"}</span>
                          </>
                        )}
                      </div>

                      {/* Proposal type + summary */}
                      {req.proposed_project_type && (
                        <p className="text-xs font-medium text-foreground/80">{req.proposed_project_type}</p>
                      )}
                      {req.proposal_summary && (
                        <p className="text-xs font-light text-muted-foreground line-clamp-2 leading-relaxed">{req.proposal_summary}</p>
                      )}

                      {/* Rejection reason if closed */}
                      {phase === "closed_lost" && req.rejection_reason && (
                        <div className="mt-1 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          <span className="font-medium">{isAr ? "سبب الرفض:" : "Rejection reason:"}</span> {req.rejection_reason}
                        </div>
                      )}

                      {/* Admin notes if present */}
                      {req.owner_response_notes && (
                        <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
                          <span className="font-medium">{isAr ? "ملاحظات:" : "Notes:"}</span> {req.owner_response_notes}
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-[10px] text-muted-foreground/60" dir="ltr">
                        {new Date(req.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>

                    {/* Phase badge + NDA */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-[11px] font-medium shadow-sm ${pc}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {isAr ? pl.ar : pl.en}
                      </Badge>
                      {/* NDA status indicators */}
                      <div className="flex flex-col items-end gap-1 rounded-lg border border-border/30 bg-muted/20 px-2.5 py-1.5">
                        <span className={`text-[10px] flex items-center gap-1 ${req.developer_nda_status === "accepted" ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                          {req.developer_nda_status === "accepted" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          <span dir="ltr">NDA</span> {isAr ? "المطور" : "Dev"}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${req.owner_nda_status === "accepted" ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                          {req.owner_nda_status === "accepted" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          <span dir="ltr">NDA</span> {isAr ? "المالك" : "Owner"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guidance + Actions footer */}
                <div className={`border-t px-5 py-3 ${isTerminal ? "border-border/30 bg-muted/20" : "border-border/40 bg-muted/5"}`}>
                  {/* Guidance text */}
                  <p className={`text-xs font-light leading-relaxed mb-2 ${isTerminal ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                    {isAr ? guidance.ar : guidance.en}
                  </p>

                  {/* Action buttons (only if actions exist and not terminal) */}
                  {actions.length > 0 && !isTerminal && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {actions.includes("accept_nda") && (
                        <Button
                          size="sm"
                          className="h-9 gap-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isLoading}
                          onClick={() => handleAcceptNDA({ id: req.id, land_id: req.land_id })}
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {isAr ? "قبول اتفاقية عدم الإفصاح" : "Accept NDA"}
                        </Button>
                      )}
                      {actions.includes("approve") && (
                        <Button
                          size="sm"
                          className="h-9 gap-2 text-xs font-medium shadow-sm bg-[#2B4C66] hover:bg-[#2B4C66]/90"
                          disabled={isLoading}
                          onClick={() => handleTransition(req.id, "under_review")}
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {isAr ? "موافقة مبدئية" : "Preliminary Approval"}
                        </Button>
                      )}
                      {actions.includes("study") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 gap-2 text-xs font-medium border-orange-500/30 text-orange-600 hover:bg-orange-500/5"
                          disabled={isLoading}
                          onClick={() => handleTransition(req.id, "study_required")}
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
                          {isAr ? "طلب دراسة جدوى" : "Request Study"}
                        </Button>
                      )}
                      {actions.includes("reject") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 gap-2 text-xs font-medium border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                          disabled={isLoading}
                          onClick={() => setRejectDialog({ requestId: req.id, devLabel })}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {isAr ? "رفض" : "Reject"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Expand toggle for study/meeting phases */}
                  {EXPANDABLE_PHASES.includes(phase) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground mt-2 w-full justify-center hover:text-foreground"
                      onClick={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                    >
                      {expandedReq === req.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {expandedReq === req.id
                        ? (isAr ? "إخفاء التفاصيل" : "Hide Details")
                        : (isAr ? "عرض التفاصيل" : "View Details")}
                    </Button>
                  )}
                </div>

                {/* Expandable Study + Meeting Panels */}
                {expandedReq === req.id && EXPANDABLE_PHASES.includes(phase) && (
                  <div className="border-t border-border/40 p-5 space-y-4 bg-muted/5">
                    <StudyPanel
                      requestId={req.id}
                      currentPhase={phase}
                      viewerRole="owner"
                      isAr={isAr}
                      onPhaseChange={() => { refreshAll(); }}
                    />
                    <MeetingPanel
                      requestId={req.id}
                      currentPhase={phase}
                      viewerRole="owner"
                      isAr={isAr}
                      onPhaseChange={() => { refreshAll(); }}
                    />
                    <MeetingReportPanel
                      requestId={req.id}
                      meetingId=""
                      currentPhase={phase}
                      viewerRole="owner"
                      isAr={isAr}
                      onPhaseChange={() => { refreshAll(); }}
                    />
                    <NegotiationPanel
                      requestId={req.id}
                      currentPhase={phase}
                      viewerRole="owner"
                      isAr={isAr}
                      onPhaseChange={() => { refreshAll(); }}
                    />
                    <DealClosingPanel
                      requestId={req.id}
                      currentPhase={phase}
                      viewerRole="owner"
                      isAr={isAr}
                      onPhaseChange={() => { refreshAll(); }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </DashboardShell>

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={o => { if (!o) { setRejectDialog(null); setRejectNotes(""); } }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <XCircle className="h-5 w-5 text-destructive" />
              {isAr ? "تأكيد رفض الطلب" : "Confirm Request Rejection"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              {isAr ? "سيتم رفض طلب الشراكة من:" : "You are about to reject the partnership request from:"}{" "}
              <strong className="text-foreground">{rejectDialog?.devLabel}</strong>
            </p>
            <p className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {isAr ? "هذا الإجراء نهائي ولا يمكن التراجع عنه." : "This action is permanent and cannot be undone."}
            </p>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {isAr ? "سبب الرفض (اختياري)" : "Rejection reason (optional)"}
              </Label>
              <Textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                rows={3}
                placeholder={isAr ? "اكتب السبب..." : "Describe the reason..."}
                className="resize-none bg-muted/50 border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => { setRejectDialog(null); setRejectNotes(""); }}>
              {isAr ? "تراجع" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!!actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {isAr ? "تأكيد الرفض" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
};

export default OwnerRequests;
