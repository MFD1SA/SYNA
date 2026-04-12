import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import OwnerLayout from "@/components/owner/OwnerLayout";
import DevWebsiteAnalysis from "@/components/owner/DevWebsiteAnalysis";
import OwnerNDAConsentModal from "@/components/agreements/OwnerNDAConsentModal";
import { getNDAConsentsForUser, submitNDADecision, type NDAConsent } from "@/services/nda.service";
import { transitionDealPhase, phaseLabels, phaseColors, TERMINAL_PHASES, type DealPhase } from "@/services/dealPhase.service";
import { resolvePartyIdentities, getDeveloperDisplayName, getRevealBadge, getRevealLevel, type PartyIdentity } from "@/services/identityReveal.service";
import {
  Landmark, MapPin, Globe, CheckCircle2,
  Radar, Brain, TrendingUp, Shield, FileText,
  ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, ChevronUp,
  Loader2, BarChart3, Users, GitCompareArrows, ExternalLink,
  Info, XCircle, CalendarClock, Clock, Activity, LineChart, ShieldCheck, Lock
} from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  active_approved: { ar: "نشطة - تم الاعتماد", en: "Active - Approved", color: "bg-primary/5 text-primary border-primary/20" },
  active: { ar: "نشطة", en: "Active", color: "bg-muted text-foreground border-border/50" },
  pending: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  draft: { ar: "مسودة", en: "Draft", color: "bg-muted/50 text-muted-foreground border-border/30" },
};

const recLabels: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  accept: { ar: "استثمار موصى به", en: "Recommended", color: "text-primary bg-primary/5 border-primary/20", icon: ShieldCheck },
  cautious: { ar: "يُنصح بالمراقبة", en: "Proceed with Caution", color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: Activity },
  reject: { ar: "عالي المخاطر", en: "High Risk", color: "text-destructive bg-destructive/5 border-destructive/20", icon: AlertTriangle },
};

interface DeveloperAnalysis {
  request_id: string;
  developer_id: string;
  developer_name: string;
  developer_brand?: string;
  developer_website?: string;
  verification_status: string;
  proposed_project_type: string;
  proposal_summary: string;
  commission_rate: number;
  estimated_duration_months?: number;
  needs_financing: boolean;
  status: string;
  created_at: string;
  stats: { total_requests: number; approved_requests: number; rejected_requests: number; active_deals: number; closed_deals: number; cancelled_deals: number; health_ratio: number; };
  ai_analysis: { overall_score: number; profile_score: number; track_record_score: number; proposal_score: number; reliability_score: number; recommendation: string; recommendation_reason_ar: string; strengths_ar: string[]; weaknesses_ar: string[]; negotiation_tips_ar?: string[]; summary_ar: string; };
  error?: boolean;
}

const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{score}/{max}</span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${(score / max) * 100}%` }} />
    </div>
  </div>
);

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة المالك" : "Owner Dashboard");

  const [ownerName, setOwnerName] = useState("");
  const [lands, setLands] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pulseSnapshots, setPulseSnapshots] = useState<Record<string, any>>({});
  const [expandedLand, setExpandedLand] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, DeveloperAnalysis[]>>({});
  const [analyzingLand, setAnalyzingLand] = useState<string | null>(null);
  const [expandedDev, setExpandedDev] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ requestId: string; devName: string; devEmail: string; landCity: string; landDistrict?: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [meetingDialog, setMeetingDialog] = useState<{ requestId: string; devName: string; devEmail: string; landCity: string; landDistrict?: string; approvedAt: string } | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("13:00");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [ownerNdaMap, setOwnerNdaMap] = useState<Record<string, NDAConsent["status"]>>({});
  const [ndaDialog, setNdaDialog] = useState<{ landId: string; city: string; district?: string } | null>(null);
  const [ndaLoading, setNdaLoading] = useState(false);
  const [requestPhases, setRequestPhases] = useState<Record<string, DealPhase>>({});
  const [partyIdentities, setPartyIdentities] = useState<Record<string, PartyIdentity>>({});

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      const { data: landsData } = await supabase.from("lands").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });

      const profileName = profile?.full_name;
      const landOwnerName = landsData?.[0]?.owner_name;
      setOwnerName(profileName || landOwnerName || user.email?.split("@")[0] || "");
      setLands(landsData || []);

      if (landsData && landsData.length > 0) {
        const landIds = landsData.map(l => l.id);
        const [reqRes, pulseRes, approvedRes, ndaRes] = await Promise.all([
          supabase.from("deal_requests").select("land_id").in("land_id", landIds),
          supabase.from("land_pulse_snapshots").select("*").in("land_id", landIds).order("created_at", { ascending: false }),
          supabase.from("deal_requests").select("*, lands(city, district)").in("land_id", landIds).eq("current_phase", "under_review").order("updated_at", { ascending: false }),
          getNDAConsentsForUser(user.id, "owner"),
        ]);

        const counts: Record<string, number> = {};
        reqRes.data?.forEach(r => { counts[r.land_id] = (counts[r.land_id] || 0) + 1; });
        setRequests(counts);

        const snapMap: Record<string, any> = {};
        pulseRes.data?.forEach(s => { if (!snapMap[s.land_id]) snapMap[s.land_id] = s; });
        setPulseSnapshots(snapMap);
        const approved = approvedRes.data || [];
        setApprovedRequests(approved);
        const ndaMap: Record<string, NDAConsent["status"]> = {};
        ndaRes.forEach(n => { ndaMap[n.land_id] = n.status; });
        setOwnerNdaMap(ndaMap);

        // Resolve identities for approved requests via central service
        if (approved.length > 0) {
          try {
            const idResult = await resolvePartyIdentities(approved.map(r => r.id));
            setPartyIdentities(prev => ({ ...prev, ...idResult.identities }));
          } catch (e) { console.error("Identity resolve error:", e); }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getLandStatus = (land: any) => {
    if (land.is_active && land.owner_approved) return "active_approved";
    if (land.is_active) return "active";
    return "draft";
  };

  const analyzeDevs = async (landId: string) => {
    if (analyses[landId]) {
      setExpandedLand(expandedLand === landId ? null : landId);
      return;
    }
    setAnalyzingLand(landId);
    setExpandedLand(landId);
    try {
      const [analysisRes, phasesRes] = await Promise.all([
        supabase.functions.invoke("analyze-developer", { body: { land_id: landId } }),
        supabase.from("deal_requests").select("id, current_phase").eq("land_id", landId),
      ]);
      if (analysisRes.error) throw analysisRes.error;
      setAnalyses(prev => ({ ...prev, [landId]: analysisRes.data.analyses || [] }));
      // Merge phases
      const phaseMap: Record<string, DealPhase> = {};
      const reqIds: string[] = [];
      phasesRes.data?.forEach((r: any) => { phaseMap[r.id] = r.current_phase as DealPhase; reqIds.push(r.id); });
      setRequestPhases(prev => ({ ...prev, ...phaseMap }));
      // Resolve identities for this land's requests
      if (reqIds.length > 0) {
        try {
          const idResult = await resolvePartyIdentities(reqIds);
          setPartyIdentities(prev => ({ ...prev, ...idResult.identities }));
        } catch (e) { console.error("Identity resolve error:", e); }
      }
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: isAr ? "خطأ في التحليل" : "Analysis Error", description: e.message });
    } finally {
      setAnalyzingLand(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-primary font-medium text-primary-foreground";
    if (score >= 60) return "bg-muted-foreground text-white font-medium";
    return "bg-destructive text-destructive-foreground font-medium";
  };
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-primary";
    if (score >= 60) return "bg-muted-foreground";
    return "bg-destructive";
  };

  const totalRequests = Object.values(requests).reduce((a, b) => a + b, 0);

  const handleApproveRequest = async (a: DeveloperAnalysis, landCity: string, landDistrict?: string) => {
    setActionLoading(true);
    try {
      const result = await transitionDealPhase(a.request_id, "under_review");
      if (!result.success) throw new Error(result.error || "Transition failed");

      try {
        await logAudit(user?.id || "", user?.email, "owner_approve_request", "deal_request", a.request_id, {
          developer_name: a.developer_name, developer_id: a.developer_id, land_city: landCity, land_district: landDistrict, approved_by: "owner",
        });
      } catch {}
      toast({ title: isAr ? "تمت الموافقة المبدئية" : "Preliminary approval granted" });

      try {
        const { data: devInfo } = await supabase.from("developers").select("email").eq("id", a.developer_id).maybeSingle();
        if (devInfo?.email) {
          await supabase.functions.invoke("send-deal-notification", {
            body: { type: "request_approved", developer_name: a.developer_name, developer_email: devInfo.email, owner_name: ownerName, land_city: landCity, land_district: landDistrict },
          });
        }
      } catch (e) { console.error("Notification error:", e); }

      setRequestPhases(prev => ({ ...prev, [a.request_id]: "under_review" }));
      setAnalyses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => { updated[key] = updated[key].map(item => item.request_id === a.request_id ? { ...item, status: "approved" } : item); });
        return updated;
      });
    } catch (err: any) { toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message }); } finally { setActionLoading(false); }
  };

  const handleStudyRequired = async (a: DeveloperAnalysis, landCity: string, landDistrict?: string) => {
    setActionLoading(true);
    try {
      const result = await transitionDealPhase(a.request_id, "study_required");
      if (!result.success) throw new Error(result.error || "Transition failed");
      toast({ title: isAr ? "تم طلب الدراسة" : "Study requested" });
      setRequestPhases(prev => ({ ...prev, [a.request_id]: "study_required" }));
    } catch (err: any) { toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message }); } finally { setActionLoading(false); }
  };

  const handleRejectRequest = async () => {
    if (!rejectDialog) return;
    setActionLoading(true);
    try {
      const result = await transitionDealPhase(rejectDialog.requestId, "closed_lost", rejectNotes || undefined);
      if (!result.success) throw new Error(result.error || "Transition failed");
      toast({ title: isAr ? "تم استبعاد المطور" : "Developer excluded" });
      try {
        await supabase.functions.invoke("send-deal-notification", { body: { type: "request_rejected", developer_name: rejectDialog.devName, developer_email: rejectDialog.devEmail, owner_name: ownerName, land_city: rejectDialog.landCity, land_district: rejectDialog.landDistrict, reject_reason: rejectNotes } });
      } catch (e) { console.error("Notification error:", e); }
      setRequestPhases(prev => ({ ...prev, [rejectDialog.requestId]: "closed_lost" }));
      setAnalyses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => { updated[key] = updated[key].map(item => item.request_id === rejectDialog.requestId ? { ...item, status: "rejected" } : item); });
        return updated;
      });
      setRejectDialog(null); setRejectNotes("");
    } catch (err: any) { toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message }); } finally { setActionLoading(false); }
  };

  const getMinMeetingDate = (approvedAt: string) => { const d = new Date(approvedAt); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; };

  const handleScheduleMeeting = async () => {
    if (!meetingDialog || !meetingDate || !meetingTime) { toast({ variant: "destructive", title: isAr ? "يرجى تحديد التاريخ والوقت" : "Please select date and time" }); return; }
    setActionLoading(true);
    try {
      await supabase.functions.invoke("send-deal-notification", { body: { type: "meeting_scheduled", developer_name: meetingDialog.devName, developer_email: meetingDialog.devEmail, owner_name: ownerName, owner_email: user?.email, land_city: meetingDialog.landCity, land_district: meetingDialog.landDistrict, meeting_date: meetingDate, meeting_time: meetingTime } });
      toast({ title: isAr ? "تم إرسال طلب التنسيق للمدير" : "Coordination request sent to admin" });
      setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes("");
    } catch (err: any) { toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message }); } finally { setActionLoading(false); }
  };

  const handleOwnerNDAAccept = async () => {
    if (!ndaDialog) return;
    setNdaLoading(true);
    const result = await submitNDADecision(ndaDialog.landId, "accept", "owner");
    setNdaLoading(false);
    if (result.success) {
      setOwnerNdaMap(prev => ({ ...prev, [ndaDialog.landId]: "accepted" }));
      setNdaDialog(null);
      toast({ title: isAr ? "تم قبول اتفاقية عدم الإفصاح" : "NDA Accepted" });
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleOwnerNDAReject = async () => {
    if (!ndaDialog) return;
    setNdaLoading(true);
    const result = await submitNDADecision(ndaDialog.landId, "reject", "owner");
    setNdaLoading(false);
    if (result.success) {
      setOwnerNdaMap(prev => ({ ...prev, [ndaDialog.landId]: "rejected" }));
      setNdaDialog(null);
      toast({
        variant: "destructive",
        title: isAr ? "تم رفض اتفاقية عدم الإفصاح" : "NDA Rejected",
        description: isAr ? "لن تتمكن من مراجعة بيانات المطورين لهذه الأرض." : "You will not be able to review developer details for this land.",
      });
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleIntelligenceClick = (land: any) => {
    const ndaStatus = ownerNdaMap[land.id];
    if (ndaStatus === "rejected") {
      toast({
        variant: "destructive",
        title: isAr ? "تم رفض اتفاقية عدم الإفصاح" : "NDA Rejected",
        description: isAr ? "لقد رفضت اتفاقية عدم الإفصاح لهذه الأرض — لا يمكن مراجعة بيانات المطورين." : "You rejected the NDA for this land — you cannot review developer details.",
      });
      return;
    }
    if (ndaStatus === "accepted") {
      analyzeDevs(land.id);
      return;
    }
    // No NDA yet — show modal
    setNdaDialog({ landId: land.id, city: land.city, district: land.district });
  };

  return (
    <OwnerLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {isAr ? `مرحبا، ${ownerName || ""}` : `Welcome, ${ownerName || ""}`}
        </h1>
        <p className="mt-1.5 text-sm font-light text-muted-foreground">
          {isAr ? "تقييم العروض ومتابعة المؤشرات الاستخبارية للمطورين" : "Evaluate proposals and review intelligence metrics for developers"}
        </p>
      </div>

      {/* Summary KPI Cards */}
      {!loading && lands.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(43,76,102,0.06)] hover:border-[#2B4C66]/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{isAr ? "الأصول المدرجة" : "Listed Assets"}</span>
              <div className="h-8 w-8 rounded-lg bg-[#2B4C66]/[0.06] flex items-center justify-center">
                <Landmark className="h-4 w-4 text-[#2B4C66]/60" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[32px] font-bold text-foreground leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{lands.length}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(43,76,102,0.06)] hover:border-[#2B4C66]/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{isAr ? "الكيانات المهتمة" : "Interested Entities"}</span>
              <div className="h-8 w-8 rounded-lg bg-[#C2A86B]/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-[#C2A86B]" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[32px] font-bold text-foreground leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{totalRequests}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(43,76,102,0.06)] hover:border-[#2B4C66]/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{isAr ? "صفقات معتمدة" : "Approved Deals"}</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[32px] font-bold text-foreground leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{lands.filter(l => l.owner_approved).length}</p>
          </div>
        </div>
      )}

      {/* Meeting Needed Module */}
      {!loading && approvedRequests.length > 0 && (
        <div className="mb-8 rounded-xl border border-primary/20 bg-background overflow-hidden relative shadow-sm">
          <div className="absolute top-0 start-0 w-1 h-full bg-primary" />
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h2 className="text-base font-medium text-foreground tracking-tight">
                  {isAr ? `تنسيق اجتماعات لصفقات مقبولة (${approvedRequests.length})` : `Schedule Meetings for Approved Deals (${approvedRequests.length})`}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground font-light">{isAr ? "يرجى استكمال جدول التنسيق مع المطورين لبدء التنفيذ" : "Please finalize meeting schedules with developers to proceed."}</p>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {approvedRequests.map((req, idx) => {
                const identity = partyIdentities[req.id];
                const devDisplayName = getDeveloperDisplayName(identity, idx + 1, isAr);
                const isRevealed = identity?.reveal_level_for_developer !== "anonymous";
                return (
                  <div key={req.id} className="flex items-center justify-between bg-muted/20 border border-border/50 rounded-lg p-3 w-full sm:min-w-[300px]">
                    <div>
                      <p className={`text-sm font-medium ${isRevealed ? "text-foreground" : "text-muted-foreground italic"}`}>{devDisplayName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{req.lands?.city} • {req.proposed_project_type}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs font-medium" onClick={() => setMeetingDialog({ requestId: req.id, devName: devDisplayName, devEmail: "", landCity: req.lands?.city || "", landDistrict: req.lands?.district, approvedAt: req.updated_at })}>
                      {isAr ? "تنسيق موعد" : "Coordinate"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Asset View */}
      {loading ? (
        <div className="grid gap-6">
          {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/50 border border-border/50" />)}
        </div>
      ) : lands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-2xl bg-card">
          <Landmark className="mb-5 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <h3 className="text-lg font-medium text-foreground mb-2">{isAr ? "محفظة الأصول فارغة" : "Asset Portfolio Empty"}</h3>
          <p className="text-sm font-light text-muted-foreground max-w-sm">
            {isAr ? "لم يتم تبويب أي أصول عقارية تحت إدارتكم. يرجى التواصل مع فريق سينا للإدراج." : "No real estate assets registered under your administration. Contact SINA for listing."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {lands.map(land => {
            const statusInfo = statusLabels[getLandStatus(land)] || statusLabels.draft;
            const reqCount = requests[land.id] || 0;
            const pulse = pulseSnapshots[land.id];
            const isExpanded = expandedLand === land.id;
            const landAnalyses = analyses[land.id] || [];
            const isAnalyzing = analyzingLand === land.id;

            return (
              <div key={land.id} className="rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
                
                {/* Land Top Section */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <h3 className="text-xl font-medium text-foreground tracking-tight">{land.city}</h3>
                        {land.district && <span className="text-sm text-muted-foreground">| {land.district}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-wider mt-2">
                        <span>{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                        <span className="h-3 w-px bg-border"></span>
                        {land.street_width_m && <span>{isAr ? "شارع" : "St"}: {land.street_width_m}{isAr ? "م" : "m"}</span>}
                        {land.partnership_model && <>
                          <span className="h-3 w-px bg-border"></span>
                          <span>{land.partnership_model}</span>
                        </>}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs px-2.5 py-1 ${statusInfo.color}`}>{isAr ? statusInfo.ar : statusInfo.en}</Badge>
                  </div>

                  {land.owner_approved && (
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">{isAr ? "صفقة معتمدة للتنفيذ" : "Approved for Execution"}</span>
                    </div>
                  )}

                  {pulse && (
                    <div className="mb-5 rounded-xl border border-border/40 bg-muted/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Radar className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-foreground">{isAr ? "المرصد الإقليمي" : "Regional Observatory"} (900m)</span>
                      </div>
                      <p className="text-sm font-light text-muted-foreground leading-relaxed line-clamp-2">
                        {isAr ? pulse.ai_report_ar : pulse.ai_report_en || pulse.ai_report_ar}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-start gap-3">
                    {ownerNdaMap[land.id] === "rejected" ? (
                      <div className="h-11 px-6 gap-2 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center text-sm text-destructive">
                        <Lock className="h-4 w-4" />
                        <span className="font-medium">{isAr ? "تم رفض اتفاقية عدم الإفصاح — المسار مغلق" : "NDA Rejected — Access Closed"}</span>
                      </div>
                    ) : (
                      <Button
                        variant={isExpanded ? "secondary" : "default"}
                        className={`h-11 px-6 gap-2 rounded-xl transition-all shadow-sm ${!isExpanded ? "syna-gradient" : ""}`}
                        onClick={() => handleIntelligenceClick(land)}
                        disabled={isAnalyzing || reqCount === 0}
                      >
                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : ownerNdaMap[land.id] === "accepted" ? <Brain className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        <span className="font-medium">
                          {reqCount > 0
                            ? ownerNdaMap[land.id] === "accepted"
                              ? (isAr ? `تقرير استخباري لـ ${reqCount} مطور` : `Intelligence Report for ${reqCount} Developers`)
                              : (isAr ? `اتفاقية عدم الإفصاح مطلوبة — ${reqCount} مطور مهتم` : `NDA Required — ${reqCount} Interested Developers`)
                            : (isAr ? "لا صفقات معلقة" : "No pending proposals")}
                        </span>
                        {reqCount > 0 && !isAnalyzing && ownerNdaMap[land.id] === "accepted" && (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Developer Analyses Dropdown */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/5">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-foreground">{isAr ? "استخلاص المؤشرات وتحليل المطورين..." : "Extracting metrics & analyzing developers..."}</p>
                      </div>
                    ) : landAnalyses.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground"><p className="text-sm font-light">{isAr ? "لا توجد ترشيحات حالية" : "No current prospects"}</p></div>
                    ) : (
                      <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                          <h4 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-primary" />
                            {isAr ? "مؤشرات المطورين" : "Developer Metrics Analytics"}
                          </h4>
                          {landAnalyses.length > 1 && (
                            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-xs font-medium bg-background" onClick={() => setShowCompare(showCompare === land.id ? null : land.id)}>
                              <GitCompareArrows className="h-4 w-4" /> {isAr ? "المصفوفة المقارنة" : "Comparative Matrix"}
                            </Button>
                          )}
                        </div>

                        {/* Comparison Table */}
                        {showCompare === land.id && landAnalyses.length > 1 && (
                          <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-start">
                                <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
                                  <tr>
                                    <th className="px-4 py-3 font-medium">{isAr ? "الكيان التطويري" : "Entity"}</th>
                                    <th className="px-4 py-3 font-medium text-center">{isAr ? "المؤشر العام" : "Composite"}</th>
                                    <th className="px-4 py-3 font-medium text-center">{isAr ? "الملف التعريفي" : "Profile"}</th>
                                    <th className="px-4 py-3 font-medium text-center">{isAr ? "سجل التشغيل" : "Track Record"}</th>
                                    <th className="px-4 py-3 font-medium text-center">{isAr ? "العرض الفني" : "Proposal"}</th>
                                    <th className="px-4 py-3 font-medium text-center">{isAr ? "مؤشر الثقة" : "Trust"}</th>
                                    <th className="px-4 py-3 font-medium text-center">{isAr ? "القرار" : "Verdict"}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                  {[...landAnalyses].filter(a => !a.error).sort((a, b) => b.ai_analysis.overall_score - a.ai_analysis.overall_score).map((a, idx) => {
                                    const rec = recLabels[a.ai_analysis.recommendation] || recLabels.cautious;
                                    const isBest = idx === 0;
                                    return (
                                      <tr key={a.request_id} className={`hover:bg-muted/20 transition-colors ${isBest ? "bg-primary/5" : ""}`}>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                          <div className="flex items-center gap-2">
                                            {isBest && <ShieldCheck className="h-4 w-4 text-primary" />}
                                            {a.developer_brand || a.developer_name}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs ${getScoreColor(a.ai_analysis.overall_score)}`}>{a.ai_analysis.overall_score}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{a.ai_analysis.profile_score}/20</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{a.ai_analysis.track_record_score}/30</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{a.ai_analysis.proposal_score}/25</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{a.ai_analysis.reliability_score}/25</td>
                                        <td className="px-4 py-3 text-center">
                                          <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${rec.color}`}>{isAr ? rec.ar : rec.en}</Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Detail Cards */}
                        <div className="grid gap-4">
                          {landAnalyses.map((a) => {
                            if (a.error) return null;
                            const ai = a.ai_analysis;
                            const rec = recLabels[ai.recommendation] || recLabels.cautious;
                            const RecIcon = rec.icon;
                            const isDevExpanded = expandedDev === a.request_id;

                            return (
                              <div key={a.request_id} className="rounded-xl border border-border bg-background overflow-hidden hover:border-primary/30 transition-colors shadow-sm">
                                {/* Card Header Toggle */}
                                <button className="w-full flex items-center justify-between p-5 focus:outline-none" onClick={() => setExpandedDev(isDevExpanded ? null : a.request_id)}>
                                  <div className="flex items-center gap-4">
                                    <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl ${getScoreColor(ai.overall_score)} shadow-inner-sm`}>
                                      <span className="text-xl font-bold leading-none">{ai.overall_score}</span>
                                    </div>
                                    <div className="text-start">
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-lg font-semibold text-foreground tracking-tight">{a.developer_brand || a.developer_name}</h5>
                                        {a.verification_status === "verified" && (
                                          <ShieldCheck className="h-4 w-4 text-primary" />
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground font-light uppercase tracking-wider mt-1">{a.proposed_project_type} • {a.stats.closed_deals} {isAr ? "صفقة منجزة" : "Deals Closed"}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={`hidden md:flex items-center gap-1.5 px-3 py-1 ${rec.color}`}>
                                      <RecIcon className="h-3.5 w-3.5" />
                                      <span className="text-[11px] uppercase tracking-wider font-bold">{isAr ? rec.ar : rec.en}</span>
                                    </Badge>
                                    <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground">
                                      {isDevExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded Analysis Content */}
                                {isDevExpanded && (
                                  <div className="border-t border-border p-6 bg-muted/5 space-y-8 animate-in slide-in-from-top-2 duration-300">
                                    
                                    {/* Exec Summary & Verdict */}
                                    <div className="grid md:grid-cols-3 gap-6">
                                      <div className="md:col-span-2 space-y-3">
                                        <h6 className="text-sm font-medium text-foreground flex items-center gap-2">
                                          <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {isAr ? "ملخص التحليل الاقتصادي" : "Economic Analysis Summary"}
                                        </h6>
                                        <p className="text-sm font-light text-muted-foreground leading-relaxed">{ai.summary_ar}</p>
                                      </div>
                                      <div className={`rounded-xl border p-4 flex flex-col justify-center ${rec.color}`}>
                                        <span className="text-[10px] uppercase tracking-widest font-bold mb-2 block">{isAr ? "التوصية الاستراتيجية" : "Strategic Action"}</span>
                                        <div className="flex items-start gap-2">
                                          <RecIcon className="h-5 w-5 shrink-0 mt-0.5" />
                                          <span className="text-sm font-medium leading-tight">{ai.recommendation_reason_ar}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                      <ScoreBar label={isAr ? "قوة الكيان" : "Entity Strength"} score={ai.profile_score} max={20} color={getProgressColor(ai.profile_score * 5)} />
                                      <ScoreBar label={isAr ? "سجل التنفيذ" : "Execution Record"} score={ai.track_record_score} max={30} color={getProgressColor(ai.track_record_score * 3.33)} />
                                      <ScoreBar label={isAr ? "جدوى المقترح" : "Proposal Viability"} score={ai.proposal_score} max={25} color={getProgressColor(ai.proposal_score * 4)} />
                                      <ScoreBar label={isAr ? "مؤشر الثقة" : "Trust Index"} score={ai.reliability_score} max={25} color={getProgressColor(ai.reliability_score * 4)} />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {[
                                        { label: isAr ? "تاريخ الإنجاز" : "History", val: a.stats.closed_deals, suffix: isAr ? "مشروع" : "Proj" },
                                        { label: isAr ? "مشاريع جارية" : "In Progress", val: a.stats.active_deals, suffix: "" },
                                        { label: isAr ? "صحة العمليات" : "Ops Health", val: `${a.stats.health_ratio}`, suffix: "%" },
                                        { label: isAr ? "مدة التنفيذ" : "Timeframe", val: a.estimated_duration_months || "—", suffix: isAr ? "شهر" : "mo" }
                                      ].map((k, i) => (
                                        <div key={i} className="rounded-xl border border-border/50 bg-background p-4 flex flex-col px-5">
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1">{k.label}</span>
                                          <div className="flex items-baseline gap-1 mt-auto">
                                            <span className="text-2xl font-semibold text-foreground">{k.val}</span>
                                            <span className="text-xs text-muted-foreground">{k.suffix}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Strengths & Weaknesses */}
                                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                                      <div className="space-y-3">
                                        <span className="text-xs font-semibold text-foreground uppercase tracking-widest flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-primary" /> {isAr ? "عوامل القوة التنافسية" : "Competitive Strengths"}
                                        </span>
                                        <ul className="space-y-2.5">
                                          {ai.strengths_ar?.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-light leading-relaxed">
                                              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" /> <span>{s}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="space-y-3">
                                        <span className="text-xs font-semibold text-foreground uppercase tracking-widest flex items-center gap-2">
                                          <AlertTriangle className="h-4 w-4 text-muted-foreground" /> {isAr ? "تحذيرات اقتصادية" : "Economic Caveats"}
                                        </span>
                                        <ul className="space-y-2.5">
                                          {ai.weaknesses_ar?.map((w, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-light leading-relaxed">
                                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" /> <span>{w}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    {/* Negotiation Tips */}
                                    {ai.negotiation_tips_ar && ai.negotiation_tips_ar.length > 0 && (
                                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                          <FileText className="h-4 w-4 text-primary" />
                                          <span className="text-sm font-medium text-primary">{isAr ? "استراتيجية التفاوض المقترحة" : "Suggested Negotiation Strategy"}</span>
                                        </div>
                                        <div className="grid gap-2">
                                          {ai.negotiation_tips_ar.map((t, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-foreground font-light bg-background/50 p-2.5 rounded-lg border border-primary/10">
                                              <span className="text-primary font-medium shrink-0">{i + 1}.</span> <span>{t}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Web Analysis Sub-Module Component */}
                                    <div className="pt-2">
                                      <DevWebsiteAnalysis developerName={a.developer_name} developerId={a.developer_id} isAr={isAr} autoUrl={a.developer_website} />
                                    </div>

                                    {/* Actions — phase-aware */}
                                    {(() => {
                                      const phase = requestPhases[a.request_id] as DealPhase | undefined;
                                      const isTerminal = phase && TERMINAL_PHASES.includes(phase);
                                      const canApprove = phase === "nda_both_accepted";
                                      const canStudy = phase === "nda_both_accepted" || phase === "under_review";
                                      const canReject = !isTerminal && phase && phase !== "nda_pending" && phase !== "nda_developer_accepted";
                                      if (isTerminal || a.status === "approved" || a.status === "rejected") return null;
                                      if (!canApprove && !canStudy && !canReject) return null;
                                      return (
                                        <div className="pt-6 border-t border-border space-y-3">
                                          {phase && (
                                            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${phaseColors[phase] || ""}`}>
                                              {isAr ? phaseLabels[phase]?.ar : phaseLabels[phase]?.en}
                                            </div>
                                          )}
                                          <div className="flex flex-col sm:flex-row gap-3">
                                            {canApprove && (
                                              <Button className="h-12 w-full sm:flex-1 gap-2 font-medium" disabled={actionLoading} onClick={() => handleApproveRequest(a, land.city, land.district)}>
                                                <ShieldCheck className="h-4 w-4" /> {isAr ? "الموافقة المبدئية للشراكة" : "Grant Preliminary Approval"}
                                              </Button>
                                            )}
                                            {canStudy && (
                                              <Button variant="outline" className="h-12 w-full sm:flex-1 gap-2 font-medium border-orange-500/30 text-orange-600 hover:bg-orange-500/5" disabled={actionLoading} onClick={() => handleStudyRequired(a, land.city, land.district)}>
                                                <FileText className="h-4 w-4" /> {isAr ? "طلب دراسة جدوى" : "Request Feasibility Study"}
                                              </Button>
                                            )}
                                            {canReject && (
                                              <Button variant="outline" className="h-12 w-full sm:flex-1 gap-2 font-medium border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30" disabled={actionLoading} onClick={async () => {
                                                const { data: devInfo } = await supabase.from("developers").select("email").eq("id", a.developer_id).maybeSingle();
                                                setRejectDialog({ requestId: a.request_id, devName: a.developer_name, devEmail: devInfo?.email || "", landCity: land.city, landDistrict: land.district });
                                              }}>
                                                <XCircle className="h-4 w-4" /> {isAr ? "استبعاد الكيان" : "Exclude Entity"}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={o => { if (!o) { setRejectDialog(null); setRejectNotes(""); } }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? "استبعاد الكيان التطويري" : "Exclude Development Entity"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              {isAr ? `تأكيد استبعاد طلب الاستثمار المقدم من:` : `Confirm exclusion of investment request from:`} <strong className="text-foreground">{rejectDialog?.devName}</strong>
            </p>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "مذكرة الرفض (اختياري، تظهر للمطور)" : "Rejection Memo (optional)"}</Label>
              <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3} placeholder={isAr ? "اكتب أسباب فنية أو مالية..." : "Note technical or financial reasons..."} className="resize-none bg-muted/50 border-border" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => { setRejectDialog(null); setRejectNotes(""); }}>{isAr ? "تراجع" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleRejectRequest} disabled={actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {isAr ? "تأكيد واستبعاد" : "Confirm Exclusion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Dialig */}
      <Dialog open={!!meetingDialog} onOpenChange={o => { if (!o) { setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes(""); } }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CalendarClock className="h-5 w-5 text-primary" />
              {isAr ? "جدولة الاجتماع المبدئي" : "Schedule Preliminary Meeting"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{meetingDialog?.devName}</span><br/>
              {meetingDialog?.landCity} {meetingDialog?.landDistrict ? ` - ${meetingDialog.landDistrict}` : ""}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "التاريخ" : "Date"}</Label>
                <Input type="date" dir="ltr" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} min={meetingDialog ? getMinMeetingDate(meetingDialog.approvedAt) : ""} className="h-11 bg-muted/50 border-border text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "الوقت (1م - 5م)" : "Time (1PM-5PM)"}</Label>
                <div className="relative">
                  <Clock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select className="w-full h-11 ps-9 pe-3 rounded-md border border-border bg-muted/50 text-sm focus-visible:ring-1 focus-visible:ring-primary appearance-none" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}>
                    <option value="13:00">1:00 PM</option><option value="13:30">1:30 PM</option>
                    <option value="14:00">2:00 PM</option><option value="14:30">2:30 PM</option>
                    <option value="15:00">3:00 PM</option><option value="15:30">3:30 PM</option>
                    <option value="16:00">4:00 PM</option><option value="16:30">4:30 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "أجندة مقترحة (للإدارة)" : "Proposed Agenda (for Admin)"}</Label>
              <Textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={2} placeholder={isAr ? "حدد المحاور..." : "Key points to discuss..."} className="bg-muted/50 border-border resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => { setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleScheduleMeeting} disabled={actionLoading || !meetingDate} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isAr ? "اعتماد وإرسال للإدارة" : "Approve & Send to Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Owner NDA Consent Modal */}
      <OwnerNDAConsentModal
        isAr={isAr}
        open={!!ndaDialog}
        landCity={ndaDialog?.city || ""}
        landDistrict={ndaDialog?.district}
        loading={ndaLoading}
        onAccept={handleOwnerNDAAccept}
        onReject={handleOwnerNDAReject}
        onClose={() => setNdaDialog(null)}
      />
    </OwnerLayout>
  );
};

export default OwnerDashboard;
