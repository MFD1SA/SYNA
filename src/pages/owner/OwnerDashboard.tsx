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
import {
  Landmark, MapPin, Globe, CheckCircle2,
  Radar, Brain, TrendingUp, Shield, FileText,
  ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, ChevronUp,
  Loader2, BarChart3, Users, GitCompareArrows, ExternalLink,
  Info, XCircle, CalendarClock, Clock,
} from "lucide-react";

const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  active_approved: { ar: "نشطة - مالك موافق", en: "Active - Owner Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  active: { ar: "نشطة", en: "Active", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  pending: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  draft: { ar: "مسودة", en: "Draft", color: "bg-muted text-muted-foreground border-border" },
};

const recLabels: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  accept: { ar: "يُوصى بالقبول", en: "Recommended", color: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20", icon: ThumbsUp },
  cautious: { ar: "يُنصح بالتريث", en: "Proceed with Caution", color: "text-amber-700 bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
  reject: { ar: "يُوصى بالرفض", en: "Not Recommended", color: "text-red-700 bg-red-500/10 border-red-500/20", icon: ThumbsDown },
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
  stats: {
    total_requests: number;
    approved_requests: number;
    rejected_requests: number;
    active_deals: number;
    closed_deals: number;
    cancelled_deals: number;
    health_ratio: number;
  };
  ai_analysis: {
    overall_score: number;
    profile_score: number;
    track_record_score: number;
    proposal_score: number;
    reliability_score: number;
    recommendation: string;
    recommendation_reason_ar: string;
    strengths_ar: string[];
    weaknesses_ar: string[];
    negotiation_tips_ar?: string[];
    summary_ar: string;
  };
  error?: boolean;
}

const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="font-light text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{score}/{max}</span>
    </div>
    <div className="h-2 w-full rounded-full bg-muted">
      <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${(score / max) * 100}%` }} />
    </div>
  </div>
);

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "صفحة مالك الأرض" : "Landowner Dashboard");

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
        const [reqRes, pulseRes, approvedRes] = await Promise.all([
          supabase.from("deal_requests").select("land_id").in("land_id", landIds),
          supabase.from("land_pulse_snapshots").select("*").in("land_id", landIds).order("created_at", { ascending: false }),
          supabase.from("deal_requests").select("*, lands(city, district), developers(company_name, marketing_brand_name, email)").in("land_id", landIds).eq("status", "approved").order("updated_at", { ascending: false }),
        ]);

        const counts: Record<string, number> = {};
        reqRes.data?.forEach(r => { counts[r.land_id] = (counts[r.land_id] || 0) + 1; });
        setRequests(counts);

        const snapMap: Record<string, any> = {};
        pulseRes.data?.forEach(s => { if (!snapMap[s.land_id]) snapMap[s.land_id] = s; });
        setPulseSnapshots(snapMap);
        setApprovedRequests(approvedRes.data || []);
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
      const { data, error } = await supabase.functions.invoke("analyze-developer", { body: { land_id: landId } });
      if (error) throw error;
      setAnalyses(prev => ({ ...prev, [landId]: data.analyses || [] }));
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: isAr ? "خطأ في التحليل" : "Analysis Error", description: e.message });
    } finally {
      setAnalyzingLand(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const totalRequests = Object.values(requests).reduce((a, b) => a + b, 0);

  const handleApproveRequest = async (a: DeveloperAnalysis, landCity: string, landDistrict?: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from("deal_requests").update({ status: "approved" }).eq("id", a.request_id);
      if (error) throw error;
      // Audit log for owner approval
      try {
        await logAudit(user?.id || "", user?.email, "owner_approve_request", "deal_request", a.request_id, {
          developer_name: a.developer_name,
          developer_id: a.developer_id,
          land_city: landCity,
          land_district: landDistrict,
          approved_by: "owner",
        });
      } catch {}
      toast({ title: isAr ? "تمت الموافقة على الطلب" : "Request approved" });

      // Send single notification (fix: was sending twice)
      try {
        const { data: devInfo } = await supabase.from("developers").select("email").eq("id", a.developer_id).maybeSingle();
        if (devInfo?.email) {
          await supabase.functions.invoke("send-deal-notification", {
            body: {
              type: "request_approved",
              developer_name: a.developer_name,
              developer_email: devInfo.email,
              owner_name: ownerName,
              land_city: landCity,
              land_district: landDistrict,
            },
          });
        }
        // Show meeting dialog
        setMeetingDialog({
          requestId: a.request_id,
          devName: a.developer_name,
          devEmail: devInfo?.email || "",
          landCity,
          landDistrict,
          approvedAt: new Date().toISOString(),
        });
      } catch (e) { console.error("Notification error:", e); }

      setAnalyses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(item =>
            item.request_id === a.request_id ? { ...item, status: "approved" } : item
          );
        });
        return updated;
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectDialog) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("deal_requests").update({
        status: "rejected",
        owner_response_notes: rejectNotes || null,
      }).eq("id", rejectDialog.requestId);
      if (error) throw error;
      toast({ title: isAr ? "تم رفض الطلب" : "Request rejected" });
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: {
            type: "request_rejected",
            developer_name: rejectDialog.devName,
            developer_email: rejectDialog.devEmail,
            owner_name: ownerName,
            land_city: rejectDialog.landCity,
            land_district: rejectDialog.landDistrict,
            reject_reason: rejectNotes,
          },
        });
      } catch (e) { console.error("Notification error:", e); }
      setAnalyses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(item =>
            item.request_id === rejectDialog.requestId ? { ...item, status: "rejected" } : item
          );
        });
        return updated;
      });
      setRejectDialog(null);
      setRejectNotes("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getMinMeetingDate = (approvedAt: string) => {
    const d = new Date(approvedAt);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const handleScheduleMeeting = async () => {
    if (!meetingDialog || !meetingDate || !meetingTime) {
      toast({ variant: "destructive", title: isAr ? "يرجى تحديد التاريخ والوقت" : "Please select date and time" });
      return;
    }
    setActionLoading(true);
    try {
      await supabase.functions.invoke("send-deal-notification", {
        body: {
          type: "meeting_scheduled",
          developer_name: meetingDialog.devName,
          developer_email: meetingDialog.devEmail,
          owner_name: ownerName,
          owner_email: user?.email,
          land_city: meetingDialog.landCity,
          land_district: meetingDialog.landDistrict,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
        },
      });
      toast({ title: isAr ? "تم إرسال طلب الاجتماع للمدير" : "Meeting request sent to admin" });
      setMeetingDialog(null);
      setMeetingDate("");
      setMeetingTime("13:00");
      setMeetingNotes("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <OwnerLayout>
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">
          {isAr ? `مرحباً، ${ownerName || "مالك الأرض"}` : `Welcome, ${ownerName || "Landowner"}`}
        </h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "تابع حالة أراضيك واستعرض تحليلات المطورين المهتمين" : "Track your lands and review developer analyses"}
        </p>
      </div>

      {/* Summary Stats */}
      {!loading && lands.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="syna-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-light text-muted-foreground">{isAr ? "أراضيي" : "My Lands"}</span>
              <Landmark className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-medium text-foreground">{lands.length}</p>
          </div>
          <div className="syna-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-light text-muted-foreground">{isAr ? "مطورون مهتمون" : "Interested Devs"}</span>
              <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-medium text-foreground">{totalRequests}</p>
          </div>
          <div className="syna-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-light text-muted-foreground">{isAr ? "أراضي موافق عليها" : "Approved Lands"}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-medium text-foreground">{lands.filter(l => l.owner_approved).length}</p>
          </div>
        </div>
      )}

      {/* Approved Requests - Meeting Scheduling Section */}
      {!loading && approvedRequests.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-medium text-foreground">
              {isAr ? `طلبات مقبولة تحتاج جدولة اجتماع (${approvedRequests.length})` : `Approved Requests - Schedule Meeting (${approvedRequests.length})`}
            </h2>
          </div>
          <div className="space-y-2">
            {approvedRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {req.developers?.marketing_brand_name || req.developers?.company_name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {req.lands?.city}{req.lands?.district ? ` - ${req.lands.district}` : ""} • {req.proposed_project_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                    <CheckCircle2 className="h-2.5 w-2.5 me-1" />{isAr ? "مقبول" : "Approved"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={actionLoading}
                    onClick={() => {
                      setMeetingDialog({
                        requestId: req.id,
                        devName: req.developers?.marketing_brand_name || req.developers?.company_name || "",
                        devEmail: req.developers?.email || "",
                        landCity: req.lands?.city || "",
                        landDistrict: req.lands?.district,
                        approvedAt: req.updated_at,
                      });
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "جدولة اجتماع" : "Schedule Meeting"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && lands.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-light text-amber-800">
            {isAr
              ? "تحليلات الذكاء الاصطناعي استرشادية وتعتمد على البيانات المسجلة في النظام. ننصح بالتحقق المستقل قبل اتخاذ أي قرار."
              : "AI analyses are advisory and based on system-registered data. Independent verification is recommended before any decision."}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : lands.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Landmark className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">
            {isAr ? "لا توجد أراضي مسجلة حالياً — تواصل مع مدير النظام لربط أراضيك" : "No lands registered — contact admin to link your lands"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lands.map(land => {
            const status = getLandStatus(land);
            const statusInfo = statusLabels[status] || statusLabels.draft;
            const reqCount = requests[land.id] || 0;
            const pulse = pulseSnapshots[land.id];
            const isExpanded = expandedLand === land.id;
            const landAnalyses = analyses[land.id] || [];
            const isAnalyzing = analyzingLand === land.id;

            return (
              <div key={land.id} className="syna-card overflow-hidden">
                {/* Land header */}
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      <h3 className="font-medium text-foreground">{land.city}</h3>
                      {land.district && <span className="text-sm font-light text-muted-foreground">— {land.district}</span>}
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                      {isAr ? statusInfo.ar : statusInfo.en}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-light text-muted-foreground mb-4">
                    <span>{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                    {land.street_width_m && <span>{isAr ? "شارع:" : "Street:"} {land.street_width_m}{isAr ? "م" : "m"}</span>}
                    {land.partnership_model && <span>{isAr ? "نموذج:" : "Model:"} {land.partnership_model}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {land.owner_approved && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-light text-emerald-700">{isAr ? "مالك موافق" : "Owner Approved"}</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => analyzeDevs(land.id)}
                      disabled={isAnalyzing || reqCount === 0}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Brain className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="text-xs">
                        {reqCount > 0
                          ? (isAr ? `تحليل ${reqCount} مطور مهتم` : `Analyze ${reqCount} interested developers`)
                          : (isAr ? "لا يوجد مطورون مهتمون" : "No interested developers")
                        }
                      </span>
                      {reqCount > 0 && !isAnalyzing && (
                        isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Pulse summary */}
                  {pulse && (
                    <div className="mt-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Radar className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground">{isAr ? "نبض الموقع 900م" : "Location Pulse 900m"}</span>
                      </div>
                      <p className="text-xs font-light text-muted-foreground line-clamp-2">
                        {isAr ? pulse.ai_report_ar : pulse.ai_report_en || pulse.ai_report_ar}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expanded: Developer analyses */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/10 p-5">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-light text-muted-foreground">
                          {isAr ? "جاري تحليل المطورين بالذكاء الاصطناعي..." : "AI analyzing developers..."}
                        </p>
                      </div>
                    ) : landAnalyses.length === 0 ? (
                      <p className="text-center text-sm font-light text-muted-foreground py-4">
                        {isAr ? "لا توجد طلبات شراكة على هذه الأرض" : "No partnership requests for this land"}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            {isAr ? `${landAnalyses.length} مطور مهتم` : `${landAnalyses.length} interested developers`}
                          </h4>
                          {landAnalyses.length > 1 && (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCompare(showCompare === land.id ? null : land.id)}>
                              <GitCompareArrows className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs">{isAr ? "مقارنة الجميع" : "Compare All"}</span>
                            </Button>
                          )}
                        </div>

                        {/* Compare All Table */}
                        {showCompare === land.id && landAnalyses.length > 1 && (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                            <h5 className="text-sm font-medium text-primary flex items-center gap-2">
                              <GitCompareArrows className="h-4 w-4" />
                              {isAr ? "مقارنة المطورين المهتمين" : "Developers Comparison"}
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border/40">
                                    <th className="py-2 pe-3 text-start font-medium text-muted-foreground">{isAr ? "المطور" : "Developer"}</th>
                                    <th className="py-2 px-2 text-center font-medium text-muted-foreground">{isAr ? "التقييم" : "Score"}</th>
                                    <th className="py-2 px-2 text-center font-medium text-muted-foreground">{isAr ? "البروفايل" : "Profile"}</th>
                                    <th className="py-2 px-2 text-center font-medium text-muted-foreground">{isAr ? "الإنجازات" : "Track"}</th>
                                    <th className="py-2 px-2 text-center font-medium text-muted-foreground">{isAr ? "المقترح" : "Proposal"}</th>
                                    <th className="py-2 px-2 text-center font-medium text-muted-foreground">{isAr ? "الموثوقية" : "Reliab."}</th>
                                    <th className="py-2 px-2 text-center font-medium text-muted-foreground">{isAr ? "التوصية" : "Rec."}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...landAnalyses].filter(a => !a.error).sort((a, b) => b.ai_analysis.overall_score - a.ai_analysis.overall_score).map((a, idx) => {
                                    const rec = recLabels[a.ai_analysis.recommendation] || recLabels.cautious;
                                    const isBest = idx === 0;
                                    return (
                                      <tr key={a.request_id} className={`border-b border-border/20 ${isBest ? "bg-emerald-500/5" : ""}`}>
                                        <td className="py-2 pe-3 font-medium text-foreground">
                                          <div className="flex items-center gap-1.5">
                                            {isBest && <span className="text-[10px] text-emerald-600">★</span>}
                                            {a.developer_brand || a.developer_name}
                                          </div>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${getScoreColor(a.ai_analysis.overall_score)}`}>
                                            {a.ai_analysis.overall_score}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-center text-foreground">{a.ai_analysis.profile_score}/20</td>
                                        <td className="py-2 px-2 text-center text-foreground">{a.ai_analysis.track_record_score}/30</td>
                                        <td className="py-2 px-2 text-center text-foreground">{a.ai_analysis.proposal_score}/25</td>
                                        <td className="py-2 px-2 text-center text-foreground">{a.ai_analysis.reliability_score}/25</td>
                                        <td className="py-2 px-2 text-center">
                                          <Badge variant="outline" className={`text-[10px] ${rec.color}`}>{isAr ? rec.ar : rec.en}</Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Individual Developer Cards */}
                        {landAnalyses.map((a) => {
                          if (a.error) return null;
                          const ai = a.ai_analysis;
                          const rec = recLabels[ai.recommendation] || recLabels.cautious;
                          const RecIcon = rec.icon;
                          const isDevExpanded = expandedDev === a.request_id;

                          return (
                            <div key={a.request_id} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                              <button
                                className="flex w-full items-center gap-3 p-4 text-start hover:bg-muted/20 transition-colors"
                                onClick={() => setExpandedDev(isDevExpanded ? null : a.request_id)}
                              >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getScoreColor(ai.overall_score)} text-white font-bold text-sm`}>
                                  {ai.overall_score}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h5 className="font-medium text-foreground truncate">{a.developer_brand || a.developer_name}</h5>
                                    {a.verification_status === "verified" && (
                                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shrink-0">
                                        <Shield className="h-2.5 w-2.5 me-1" />{isAr ? "موثق" : "Verified"}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs font-light text-muted-foreground truncate">{a.proposed_project_type} • {a.stats.closed_deals} {isAr ? "صفقات" : "deals"}</p>
                                  <p className="text-xs font-light text-muted-foreground mt-0.5 line-clamp-1">{ai.summary_ar}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="outline" className={`text-[10px] ${rec.color}`}>
                                    <RecIcon className="h-2.5 w-2.5 me-1" />
                                    {isAr ? rec.ar : rec.en}
                                  </Badge>
                                  {isDevExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </button>

                              {isDevExpanded && (
                                <div className="border-t border-border/40 p-5 space-y-4">
                                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${rec.color}`}>
                                    <RecIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{isAr ? rec.ar : rec.en}</span>
                                    <span className="text-xs font-light">— {ai.recommendation_reason_ar}</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <ScoreBar label={isAr ? "قوة البروفايل" : "Profile Strength"} score={ai.profile_score} max={20} color={getScoreColor(ai.profile_score * 5)} />
                                    <ScoreBar label={isAr ? "سجل الإنجازات" : "Track Record"} score={ai.track_record_score} max={30} color={getScoreColor(ai.track_record_score * 3.33)} />
                                    <ScoreBar label={isAr ? "جودة المقترح" : "Proposal Quality"} score={ai.proposal_score} max={25} color={getScoreColor(ai.proposal_score * 4)} />
                                    <ScoreBar label={isAr ? "الموثوقية" : "Reliability"} score={ai.reliability_score} max={25} color={getScoreColor(ai.reliability_score * 4)} />
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { label: isAr ? "صفقات ناجحة" : "Closed Deals", value: a.stats.closed_deals, icon: TrendingUp },
                                      { label: isAr ? "صفقات نشطة" : "Active Deals", value: a.stats.active_deals, icon: BarChart3 },
                                      { label: isAr ? "نسبة الصحة" : "Health Ratio", value: `${a.stats.health_ratio}%`, icon: Shield },
                                    ].map((kpi, i) => (
                                      <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-2.5 text-center">
                                        <kpi.icon className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-lg font-medium text-foreground">{kpi.value}</p>
                                        <p className="text-[10px] font-light text-muted-foreground">{kpi.label}</p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-xs font-medium text-foreground">{isAr ? "تفاصيل المقترح" : "Proposal Details"}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-light text-muted-foreground">
                                      <span>{isAr ? "نوع المشروع:" : "Type:"} {a.proposed_project_type}</span>
                                      {a.estimated_duration_months && (
                                        <span>{isAr ? "المدة:" : "Duration:"} {a.estimated_duration_months} {isAr ? "شهر" : "months"}</span>
                                      )}
                                    </div>
                                    <p className="text-xs font-light text-muted-foreground">{a.proposal_summary}</p>
                                  </div>

                                  <p className="text-sm font-light text-foreground leading-relaxed">{ai.summary_ar}</p>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <span className="text-xs font-medium text-emerald-700">{isAr ? "نقاط القوة" : "Strengths"}</span>
                                      {ai.strengths_ar?.map((s, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-xs font-light text-muted-foreground">
                                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                                          <span>{s}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-xs font-medium text-red-700">{isAr ? "نقاط الضعف" : "Weaknesses"}</span>
                                      {ai.weaknesses_ar?.map((w, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-xs font-light text-muted-foreground">
                                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                                          <span>{w}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {ai.negotiation_tips_ar && ai.negotiation_tips_ar.length > 0 && (
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                                      <span className="text-xs font-medium text-primary">{isAr ? "نصائح للتفاوض" : "Negotiation Tips"}</span>
                                      {ai.negotiation_tips_ar.map((t, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-xs font-light text-foreground">
                                          <span className="shrink-0 text-primary">{i + 1}.</span>
                                          <span>{t}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Website Analysis */}
                                  <div className="border-t border-border/40 pt-4">
                                    <h6 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                                      <Globe className="h-3.5 w-3.5 text-primary" />
                                      {isAr ? "تحليل الموقع والسوشيال ميديا والأخبار" : "Website, Social Media & News Analysis"}
                                    </h6>
                                    {a.developer_website ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <ExternalLink className="h-3 w-3 text-primary" />
                                          <a href={a.developer_website.startsWith("http") ? a.developer_website : `https://${a.developer_website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {a.developer_website}
                                          </a>
                                        </div>
                                        <DevWebsiteAnalysis developerName={a.developer_name} developerId={a.developer_id} isAr={isAr} autoUrl={a.developer_website} />
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-light">
                                          {isAr ? "لم يُسجل المطور موقعاً إلكترونياً. يمكنك إدخال رابط يدوياً:" : "Developer didn't register a website. You can enter one manually:"}
                                        </p>
                                        <DevWebsiteAnalysis developerName={a.developer_name} developerId={a.developer_id} isAr={isAr} />
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  {a.status === "pending" && (
                                    <div className="border-t border-border/40 pt-4 flex items-center gap-2">
                                      <Button size="sm" className="flex-1 gap-1.5 syna-gradient" disabled={actionLoading} onClick={() => handleApproveRequest(a, land.city, land.district)}>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {isAr ? "قبول الطلب" : "Approve"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1 gap-1.5"
                                        disabled={actionLoading}
                                        onClick={async () => {
                                          const { data: devInfo } = await supabase.from("developers").select("email").eq("id", a.developer_id).maybeSingle();
                                          setRejectDialog({
                                            requestId: a.request_id,
                                            devName: a.developer_name,
                                            devEmail: devInfo?.email || "",
                                            landCity: land.city,
                                            landDistrict: land.district,
                                          });
                                        }}
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        {isAr ? "رفض الطلب" : "Reject"}
                                      </Button>
                                    </div>
                                  )}
                                  {a.status === "approved" && (
                                    <div className="border-t border-border/40 pt-4">
                                      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 mb-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-medium text-emerald-700">{isAr ? "تمت الموافقة" : "Approved"}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full gap-1.5"
                                        disabled={actionLoading}
                                        onClick={async () => {
                                          const { data: devInfo } = await supabase.from("developers").select("email").eq("id", a.developer_id).maybeSingle();
                                          setMeetingDialog({
                                            requestId: a.request_id,
                                            devName: a.developer_name,
                                            devEmail: devInfo?.email || "",
                                            landCity: land.city,
                                            landDistrict: land.district,
                                            approvedAt: new Date().toISOString(),
                                          });
                                        }}
                                      >
                                        <CalendarClock className="h-3.5 w-3.5 text-primary" />
                                        {isAr ? "جدولة اجتماع" : "Schedule Meeting"}
                                      </Button>
                                    </div>
                                  )}
                                  {a.status === "rejected" && (
                                    <div className="border-t border-border/40 pt-4">
                                      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        <span className="text-xs font-medium text-destructive">{isAr ? "تم رفض الطلب" : "Request Rejected"}</span>
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={o => { if (!o) { setRejectDialog(null); setRejectNotes(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {isAr ? "رفض الطلب" : "Reject Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isAr ? `هل تريد رفض طلب ${rejectDialog?.devName}؟` : `Reject ${rejectDialog?.devName}'s request?`}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "سبب الرفض (اختياري)" : "Rejection Reason (optional)"}</Label>
              <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3} placeholder={isAr ? "أدخل سبب الرفض..." : "Enter rejection reason..."} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectNotes(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleRejectRequest} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1" /> : <XCircle className="h-3.5 w-3.5 me-1" />}
              {isAr ? "تأكيد الرفض" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Scheduling Dialog */}
      <Dialog open={!!meetingDialog} onOpenChange={o => { if (!o) { setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              {isAr ? "جدولة اجتماع" : "Schedule Meeting"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-primary font-medium mb-1">{isAr ? "تنبيه" : "Note"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "سيتم إرسال تفاصيل الاجتماع إلى مدير النظام للتنسيق مع المطور. الأوقات المتاحة من 1 ظهراً إلى 5 عصراً."
                  : "Meeting details will be sent to the admin to coordinate with the developer. Available times: 1 PM - 5 PM."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "المطور" : "Developer"}</Label>
              <p className="text-sm text-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40">{meetingDialog?.devName}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "تاريخ الاجتماع" : "Meeting Date"}</Label>
              <Input type="date" dir="ltr" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} min={meetingDialog ? getMinMeetingDate(meetingDialog.approvedAt) : ""} />
              <p className="text-[10px] text-muted-foreground">{isAr ? "يجب أن يكون بعد القبول بيوم على الأقل" : "Must be at least 1 day after approval"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "وقت الاجتماع" : "Meeting Time"}</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <select className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}>
                  <option value="13:00">{isAr ? "1:00 ظهراً" : "1:00 PM"}</option>
                  <option value="13:30">{isAr ? "1:30 ظهراً" : "1:30 PM"}</option>
                  <option value="14:00">{isAr ? "2:00 ظهراً" : "2:00 PM"}</option>
                  <option value="14:30">{isAr ? "2:30 ظهراً" : "2:30 PM"}</option>
                  <option value="15:00">{isAr ? "3:00 عصراً" : "3:00 PM"}</option>
                  <option value="15:30">{isAr ? "3:30 عصراً" : "3:30 PM"}</option>
                  <option value="16:00">{isAr ? "4:00 عصراً" : "4:00 PM"}</option>
                  <option value="16:30">{isAr ? "4:30 عصراً" : "4:30 PM"}</option>
                  <option value="17:00">{isAr ? "5:00 عصراً" : "5:00 PM"}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={2} placeholder={isAr ? "ملاحظات إضافية..." : "Additional notes..."} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleScheduleMeeting} disabled={actionLoading || !meetingDate} className="syna-gradient gap-1.5">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
              {isAr ? "إرسال طلب الاجتماع" : "Send Meeting Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
};

export default OwnerDashboard;
