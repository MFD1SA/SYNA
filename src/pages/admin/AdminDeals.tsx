import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DevWebsiteAnalysis from "@/components/owner/DevWebsiteAnalysis";
import LegalDocPrintView from "@/components/land/LegalDocPrintView";
import { defaultLandForm, LandFormData } from "@/components/land/LandFormConstants";
import {
  Search, FileText, Handshake, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Ruler, MapPin, Globe,
  TrendingUp, Video, CalendarClock, Loader2, MoveRight, Shield, MessageSquare, Link2, ClipboardList,
  ChevronDown, ChevronUp, BarChart3, Building2, ChevronLeft, ChevronRight,
} from "lucide-react";
import DealStagePipeline from "@/components/deal/DealStagePipeline";
import MeetingsList from "@/components/deal/MeetingsList";
import CommissionBreakdown from "@/components/deal/CommissionBreakdown";
import { stageConfig, stageOrder, healthLabels as healthColors, commissionStatusLabels, getStageProgress } from "@/components/deal/dealStageConfig";
import { transitionDealPhase, phaseLabels, phaseColors, TERMINAL_PHASES, type DealPhase } from "@/services/dealPhase.service";
import StudyPanel from "@/components/study/StudyPanel";
import MeetingPanel from "@/components/meeting/MeetingPanel";
import MeetingReportPanel from "@/components/meeting/MeetingReportPanel";
import DeveloperReportPanel from "@/components/developer-report/DeveloperReportPanel";
import NegotiationPanel from "@/components/negotiation/NegotiationPanel";
import DealClosingPanel from "@/components/negotiation/DealClosingPanel";

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: "معلق", en: "Pending" },
  approved: { ar: "مقبول", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  info_requested: { ar: "معلومات مطلوبة", en: "Info Requested" },
};

export interface DealRequestData {
  id: string;
  developer_id: string;
  land_id: string;
  status: string;
  proposed_project_type: string;
  created_at: string;
  commission_rate?: number;
  proposal_summary?: string;
  proposal_link?: string;
  owner_response_notes?: string;
  developers?: { company_name: string; marketing_brand_name?: string; website?: string };
  lands?: { city: string; district: string; land_area_sqm: number | string; estimated_total_value?: number | string };
}

export interface DealData {
  id: string;
  current_stage: string;
  health: "green" | "yellow" | "red";
  commission_status: string;
  created_at: string;
  closed_at?: string;
  developer_id: string;
  developers?: { company_name: string; marketing_brand_name?: string };
  lands?: {
    city: string; district: string; land_area_sqm: number | string;
    estimated_price_per_sqm: number | string; estimated_total_value: number | string;
    owner_name: string; partnership_goal?: string; project_model?: string;
    deed_number?: string; plan_number?: string;
  };
}

const AdminDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الصفقات" : "Manage Deals");
  const [requests, setRequests] = useState<DealRequestData[]>([]);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewReq, setViewReq] = useState<any>(null);
  const [viewDeal, setViewDeal] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [devWebsite, setDevWebsite] = useState("");
  // Meeting scheduling
  const [meetingDialog, setMeetingDialog] = useState<any>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("13:00");
  const [meetingType, setMeetingType] = useState<"google_meet" | "in_person">("google_meet");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  // Stage advancement
  const [stageDialog, setStageDialog] = useState<any>(null);
  const [stageNotes, setStageNotes] = useState("");
  // Deal meetings data
  const [dealMeetings, setDealMeetings] = useState<Record<string, any[]>>({});
  const [showLegalDoc, setShowLegalDoc] = useState(false);

  const buildLandForm = (land: any): LandFormData => ({
    ...defaultLandForm,
    city: land?.city || "", district: land?.district || "",
    land_area_sqm: String(land?.land_area_sqm || ""),
    estimated_price_per_sqm: String(land?.estimated_price_per_sqm || ""),
    estimated_total_value: String(land?.estimated_total_value || ""),
    usage_type: land?.usage_type || "residential",
    partnership_goal: land?.partnership_goal || "develop_sell",
    project_model: land?.project_model || "development_partnership",
    deed_number: land?.deed_number || "", plan_number: land?.plan_number || "",
    owner_name: land?.owner_name || "",
  });

  const fetchAll = async () => {
    try {
      const [reqRes, dealRes] = await Promise.all([
        supabase.from("deal_requests").select("*, lands(city, district, land_area_sqm, usage_type, partnership_goal, owner_name, owner_id, estimated_price_per_sqm, estimated_total_value, project_model, deed_number, plan_number), developers(company_name, marketing_brand_name, cr_number, email, phone, website)").order("created_at", { ascending: false }),
        supabase.from("deals").select("*, lands(city, district, land_area_sqm, estimated_price_per_sqm, estimated_total_value, owner_name, usage_type, partnership_goal, project_model, deed_number, plan_number), developers(company_name, marketing_brand_name, email, phone, website)").order("created_at", { ascending: false }),
      ]);
      setRequests(reqRes.data || []);
      const dealsData = dealRes.data || [];
      setDeals(dealsData);

      // Fetch meetings for all deals
      if (dealsData.length > 0) {
        const dealIds = dealsData.map((d: any) => d.id);
        const { data: meetingsData } = await supabase.from("deal_meetings").select("*").in("deal_id", dealIds).order("scheduled_at", { ascending: false });
        const meetingsMap: Record<string, any[]> = {};
        meetingsData?.forEach((m: any) => {
          if (!meetingsMap[m.deal_id]) meetingsMap[m.deal_id] = [];
          meetingsMap[m.deal_id].push(m);
        });
        setDealMeetings(meetingsMap);
      }
    } catch (err) {
      console.error("fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (req: any) => {
    setActionLoading(true);
    try {
      // Transition to under_review via Edge Function if not already there
      const phase = req.current_phase as DealPhase | undefined;
      if (phase && phase !== "under_review" && !TERMINAL_PHASES.includes(phase)) {
        const transResult = await transitionDealPhase(req.id, "under_review");
        if (!transResult.success) throw new Error(transResult.error || "Phase transition failed");
      }
      // Set legacy status to approved + create deal
      const { error: updateErr } = await supabase.from("deal_requests").update({ status: "approved" as any }).eq("id", req.id);
      if (updateErr) throw updateErr;
      let ownerId = req.lands?.owner_id;
      if (!ownerId) {
        const { data: landData } = await supabase.from("lands").select("owner_id").eq("id", req.land_id).single();
        ownerId = landData?.owner_id;
      }
      if (!ownerId) throw new Error(isAr ? "لم يتم العثور على مالك الأرض" : "Land owner not found");
      const { error: dealErr } = await supabase.from("deals").insert({
        request_id: req.id, land_id: req.land_id, developer_id: req.developer_id,
        owner_id: ownerId,
        // Total platform fee: 2.50% brokerage + 1.50% platform = 4.00% of land value.
        // Matches commission agreement v2.0 + PLATFORM_TOTAL_RATE constant.
        commission_rate: 4.00,
      });
      if (dealErr) throw dealErr;
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: {
            type: "request_approved", developer_name: req.developers?.company_name,
            developer_email: req.developers?.email, land_city: req.lands?.city, land_district: req.lands?.district,
          },
        });
      } catch {}
      try {
        await logAudit(user?.id || "", user?.email, "approve_request", "deal_request", req.id, {
          developer_name: req.developers?.company_name || "",
          developer_id: req.developer_id,
          land_city: req.lands?.city,
          land_district: req.lands?.district,
        });
      } catch {}
      toast({ title: isAr ? "تمت الموافقة وإنشاء الصفقة" : "Approved and deal created" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setViewReq(null);
      setActionLoading(false);
      fetchAll();
    }
  };

  const handleReject = async (req: any) => {
    setActionLoading(true);
    try {
      const result = await transitionDealPhase(req.id, "closed_lost", rejectNotes || undefined);
      if (!result.success) throw new Error(result.error || "Transition failed");
      // Also set legacy notes
      await supabase.from("deal_requests").update({ owner_response_notes: rejectNotes || null } as any).eq("id", req.id);
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: {
            type: "request_rejected", developer_name: req.developers?.company_name,
            developer_email: req.developers?.email, land_city: req.lands?.city,
            land_district: req.lands?.district, reject_reason: rejectNotes,
          },
        });
      } catch {}
      toast({ title: isAr ? "تم رفض الطلب" : "Request rejected" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setViewReq(null); setRejectNotes(""); setActionLoading(false); fetchAll();
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingDialog || !meetingDate || !meetingTime) {
      toast({ variant: "destructive", title: isAr ? "يرجى تحديد التاريخ والوقت" : "Please select date and time" });
      return;
    }
    setActionLoading(true);
    try {
      const scheduledAt = `${meetingDate}T${meetingTime}:00`;
      const { error } = await supabase.from("deal_meetings").insert({
        deal_id: meetingDialog.dealId,
        scheduled_at: scheduledAt,
        meeting_type: meetingType,
        notes: meetingNotes || null,
        location: meetingLocation || null,
        created_by: user!.id,
        duration_minutes: 30,
      });
      if (error) throw error;
      // Advance deal stage
      await supabase.from("deals").update({ current_stage: "meeting_scheduled" }).eq("id", meetingDialog.dealId);
      // Log stage change
      await supabase.from("deal_stages_log").insert({
        deal_id: meetingDialog.dealId, from_stage: "owner_approved", to_stage: "meeting_scheduled",
        changed_by: user!.id, notes: `اجتماع مجدول: ${meetingDate} ${meetingTime}`,
      });
      // Notify owner with meeting link
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: {
            type: "meeting_scheduled",
            developer_name: meetingDialog.devName, developer_email: meetingDialog.devEmail,
            owner_name: meetingDialog.ownerName, owner_email: meetingDialog.ownerEmail,
            land_city: meetingDialog.landCity, land_district: meetingDialog.landDistrict,
            meeting_date: meetingDate, meeting_time: meetingTime,
          },
        });
      } catch {}
      toast({ title: isAr ? "تم جدولة الاجتماع بنجاح" : "Meeting scheduled successfully" });
      setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes(""); setMeetingLocation("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setActionLoading(false); fetchAll();
    }
  };

  const handleAdvanceStage = async () => {
    if (!stageDialog) return;
    setActionLoading(true);
    try {
      const currentIdx = stageOrder.indexOf(stageDialog.currentStage);
      const nextStage = stageOrder[currentIdx + 1];
      if (!nextStage) throw new Error("Already at final stage");
      const updates: any = { current_stage: nextStage };
      if (nextStage === "deal_closed") updates.closed_at = new Date().toISOString();
      await supabase.from("deals").update(updates).eq("id", stageDialog.dealId);
      await supabase.from("deal_stages_log").insert({
        deal_id: stageDialog.dealId, from_stage: stageDialog.currentStage as any, to_stage: nextStage as any,
        changed_by: user!.id, notes: stageNotes || null,
      });
      // Send stage change notification
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: {
            type: "deal_stage_changed",
            deal_id: stageDialog.dealId,
            developer_name: stageDialog.devName,
            land_city: stageDialog.landCity,
            land_district: stageDialog.landDistrict,
            from_stage: stageDialog.currentStage,
            to_stage: nextStage,
            stage_notes: stageNotes || null,
          },
        });
      } catch {}
      toast({ title: isAr ? `تم الانتقال إلى: ${stageConfig[nextStage]?.ar}` : `Advanced to: ${stageConfig[nextStage]?.en}` });
      setStageDialog(null); setStageNotes("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setActionLoading(false); fetchAll();
    }
  };

  const handleCancelDeal = async (dealId: string, currentStage: string) => {
    setActionLoading(true);
    try {
      await supabase.from("deals").update({ current_stage: "deal_cancelled" }).eq("id", dealId);
      await supabase.from("deal_stages_log").insert({
        deal_id: dealId, from_stage: currentStage as any, to_stage: "deal_cancelled" as any,
        changed_by: user!.id, notes: "تم إلغاء الصفقة من قبل الإدارة",
      });
      toast({ title: isAr ? "تم إلغاء الصفقة" : "Deal cancelled" });
      setViewDeal(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setActionLoading(false); fetchAll();
    }
  };

  const handleUpdateHealth = async (dealId: string, health: "green" | "yellow" | "red") => {
    await supabase.from("deals").update({ health }).eq("id", dealId);
    toast({ title: isAr ? "تم تحديث حالة الصفقة" : "Deal health updated" });
    fetchAll();
  };

  const filteredRequests = requests.filter(r =>
    r.developers?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.lands?.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.proposed_project_type?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDeals = deals.filter(d =>
    d.developers?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.lands?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const activeDealsCount = deals.filter(d => !["deal_closed", "deal_cancelled"].includes(d.current_stage)).length;

  const getStageProgress = (stage: string) => {
    const idx = stageOrder.indexOf(stage);
    return idx >= 0 ? Math.round(((idx + 1) / stageOrder.length) * 100) : 0;
  };

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
      <AdminPageHeader
        icon={Handshake}
        titleAr="الطلبات والصفقات"
        titleEn="Requests & Deals"
        descAr="متابعة سير الطلبات والصفقات مع الحوكمة الكاملة"
        descEn="Track requests and deals with full governance"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: isAr ? "طلبات معلقة" : "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: isAr ? "صفقات نشطة" : "Active Deals", value: activeDealsCount, icon: TrendingUp, color: "text-[#2B4C66]", bg: "bg-[#2B4C66]/10", border: "border-[#2B4C66]/20" },
          { label: isAr ? "مُنجزة" : "Closed", value: deals.filter(d => d.current_stage === "deal_closed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: isAr ? "ملغاة" : "Cancelled", value: deals.filter(d => d.current_stage === "deal_cancelled").length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-xl border bg-card p-4 ${kpi.border} transition-shadow hover:shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{kpi.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground tabular-nums" dir="ltr">{kpi.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="requests" dir={isAr ? "rtl" : "ltr"}>
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="requests" className="gap-2 flex-1 sm:flex-initial"><FileText className="h-3.5 w-3.5" />{isAr ? "الطلبات" : "Requests"} ({requests.length})</TabsTrigger>
          <TabsTrigger value="deals" className="gap-2 flex-1 sm:flex-initial"><Handshake className="h-3.5 w-3.5" />{isAr ? "الصفقات" : "Deals"} ({deals.length})</TabsTrigger>
        </TabsList>

        <div className="mb-4 relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* REQUESTS TAB */}
        <TabsContent value="requests">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-[#2B4C66]/[0.04] text-muted-foreground border-b border-[#2B4C66]/10">
                    <tr>
                      <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "المطور والموقع" : "Developer & Location"}</th>
                      <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "المقترح المساحة" : "Proposal & Area"}</th>
                      <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "الحالة" : "Status"}</th>
                      <th className="px-5 py-3.5 font-medium text-end text-xs tracking-wide">{isAr ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-4 min-w-[220px]">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <p className="text-sm font-medium text-foreground">
                              {req.developers?.marketing_brand_name || req.developers?.company_name || "—"}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground ms-6">
                            {req.lands?.city}{req.lands?.district ? ` - ${req.lands.district}` : ""}
                          </span>
                        </td>
                        <td className="px-5 py-4 min-w-[200px]">
                          <p className="text-sm text-foreground font-medium">{req.proposed_project_type}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span dir="ltr" className="tabular-nums">{Number(req.lands?.land_area_sqm).toLocaleString()}</span> {isAr ? "م²" : "sqm"} • {new Date(req.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {(() => {
                            const phase = (req as any).current_phase as DealPhase | undefined;
                            if (phase && phaseLabels[phase]) {
                              return (
                                <Badge variant="outline" className={`text-[10px] gap-1 ${phaseColors[phase]}`}>
                                  {isAr ? phaseLabels[phase].ar : phaseLabels[phase].en}
                                </Badge>
                              );
                            }
                            return (
                              <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "outline"} className="text-[10px]">
                                {isAr ? statusLabels[req.status]?.ar : statusLabels[req.status]?.en}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-4 text-end">
                          <Button size="sm" variant="outline" className="h-8 opacity-70 group-hover:opacity-100 transition-opacity gap-1" onClick={() => { setViewReq(req); setRejectNotes(""); setDevWebsite(req.developers?.website || ""); }}>
                            <Eye className="h-3.5 w-3.5" />{isAr ? "عرض" : "View"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRequests.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests"}</p>}
              </div>
            </div>
          )}
        </TabsContent>

        {/* DEALS TAB */}
        <TabsContent value="deals">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-[#2B4C66]/[0.04] text-muted-foreground border-b border-[#2B4C66]/10">
                    <tr>
                      <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "معلومات الصفقة" : "Deal Info"}</th>
                      <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide min-w-[300px]">{isAr ? "مسار الصفقة (Pipeline)" : "Pipeline Progress"}</th>
                      <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "الحالة والمؤشر" : "Health & Status"}</th>
                      <th className="px-5 py-3.5 font-medium text-end text-xs tracking-wide">{isAr ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredDeals.map(deal => {
                      const sc = stageConfig[deal.current_stage] || stageConfig.listed;
                      const StageIcon = sc.icon;
                      const hc = healthColors[deal.health] || healthColors.green;
                      const isClosed = deal.current_stage === "deal_closed";
                      const isCancelled = deal.current_stage === "deal_cancelled";
                      
                      return (
                        <tr key={deal.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-5 py-4 min-w-[200px] align-top">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                              <span className="text-sm font-medium text-foreground">
                                {deal.developers?.marketing_brand_name || deal.developers?.company_name || "—"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground ms-6">
                              {deal.lands?.city}{deal.lands?.district ? ` - ${deal.lands.district}` : ""}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-top pt-5">
                            {!isCancelled ? (
                              <DealStagePipeline currentStage={deal.current_stage} isAr={isAr} compact />
                            ) : (
                              <span className="text-xs text-muted-foreground italic px-2">{isAr ? "الصفقة ملغاة" : "Deal cancelled"}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-col gap-1.5 items-start">
                              <Badge variant="outline" className={`text-[10px] gap-1 ${hc.bg} ${hc.text} border-transparent`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${deal.health === "green" ? "bg-emerald-500" : deal.health === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                                {isAr ? hc.ar : hc.en}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] gap-1 ${sc.color}`}>
                                <StageIcon className="h-3 w-3" />
                                {isAr ? sc.ar : sc.en}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-end align-top">
                            <Button size="sm" variant="outline" className="h-8 opacity-70 group-hover:opacity-100 transition-opacity gap-1" onClick={() => setViewDeal(deal)}>
                              <Eye className="h-3.5 w-3.5" />{isAr ? "تفاصيل" : "Details"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredDeals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد صفقات" : "No deals"}</p>}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* VIEW REQUEST DIALOG */}
      <Dialog open={!!viewReq} onOpenChange={o => { if (!o) setViewReq(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isAr ? "تفاصيل الطلب" : "Request Details"}
            </DialogTitle>
          </DialogHeader>
          {viewReq && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">{isAr ? "المطور" : "Developer"}</p>
                </div>
                <p className="text-sm font-medium text-foreground">{viewReq.developers?.company_name}</p>
                {viewReq.developers?.marketing_brand_name && <p className="text-xs text-muted-foreground">{viewReq.developers.marketing_brand_name}</p>}
                <p className="text-xs text-muted-foreground">
                  {isAr ? "سجل:" : "CR:"} <span dir="ltr">{viewReq.developers?.cr_number}</span> • {viewReq.developers?.email || "—"} • <span dir="ltr">{viewReq.developers?.phone || "—"}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">{isAr ? "الأرض" : "Land"}</p>
                </div>
                <p className="text-sm font-medium text-foreground">{viewReq.lands?.city}{viewReq.lands?.district ? ` - ${viewReq.lands.district}` : ""}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> <span dir="ltr" className="tabular-nums">{Number(viewReq.lands?.land_area_sqm).toLocaleString()}</span> {isAr ? "م²" : "sqm"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "نوع المشروع" : "Project Type"}</Label>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border/40">{viewReq.proposed_project_type}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "ملخص المقترح" : "Proposal"}</Label>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border/40 whitespace-pre-wrap">{viewReq.proposal_summary}</p>
              </div>

              {/* Commission Notice */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-700">{isAr ? "حقوق المنصة محفوظة" : "Platform Rights Protected"}</p>
                  <p className="text-[10px] text-emerald-600">{isAr ? "إجمالي الأتعاب المهنية 4.00% (سعي 2.50% + منصة 1.50%) مُطبقة تلقائياً وموافق عليها من المطور" : "Total professional fees 4.00% (brokerage 2.50% + platform 1.50%) auto-applied & accepted by developer"}</p>
                </div>
              </div>

              {/* Developer Website Analysis */}
              <div className="border-t border-border/40 pt-3">
                <h6 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "تحليل الموقع الإلكتروني للمطور" : "Developer Website Analysis"}
                </h6>
                <DevWebsiteAnalysis developerName={viewReq.developers?.company_name || ""} developerId={viewReq.developer_id} isAr={isAr} autoUrl={devWebsite || undefined} />
              </div>

              {/* Study & Meeting & Report Panels (admin oversight) */}
              {(() => {
                const phase = (viewReq as any).current_phase as DealPhase | undefined;
                if (!phase) return null;
                const showStudy = phase.startsWith("study_") || ["meeting_proposed", "meeting_confirmed", "meeting_completed", "study_approved"].includes(phase) || phase.startsWith("report_");
                const showMeeting = ["study_approved", "meeting_proposed", "meeting_confirmed", "meeting_completed", "under_review"].includes(phase) || phase.startsWith("report_");
                const showReport = ["meeting_completed", "report_pending_approval", "report_approved", "report_rejected", "report_changes_requested", "report_expired"].includes(phase);
                if (!showStudy && !showMeeting && !showReport) return null;
                return (
                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "الدراسة والاجتماع والتقرير" : "Study, Meeting & Report"}
                    </h6>
                    {showStudy && (
                      <StudyPanel
                        requestId={viewReq.id}
                        currentPhase={phase}
                        viewerRole="admin"
                        isAr={isAr}
                        onPhaseChange={() => { setViewReq(null); fetchAll(); }}
                      />
                    )}
                    {showMeeting && (
                      <MeetingPanel
                        requestId={viewReq.id}
                        currentPhase={phase}
                        viewerRole="admin"
                        isAr={isAr}
                        onPhaseChange={() => { setViewReq(null); fetchAll(); }}
                      />
                    )}
                    {showReport && (
                      <MeetingReportPanel
                        requestId={viewReq.id}
                        meetingId=""
                        currentPhase={phase}
                        viewerRole="admin"
                        isAr={isAr}
                        onPhaseChange={() => { setViewReq(null); fetchAll(); }}
                      />
                    )}
                    <DeveloperReportPanel
                      requestId={viewReq.id}
                      developerId={viewReq.developer_id}
                      currentPhase={phase}
                      viewerRole="admin"
                      isAr={isAr}
                    />
                    <NegotiationPanel
                      requestId={viewReq.id}
                      currentPhase={phase}
                      viewerRole="admin"
                      isAr={isAr}
                      onPhaseChange={() => { setViewReq(null); fetchAll(); }}
                    />
                    <DealClosingPanel
                      requestId={viewReq.id}
                      currentPhase={phase}
                      viewerRole="admin"
                      isAr={isAr}
                      onPhaseChange={() => { setViewReq(null); fetchAll(); }}
                    />
                  </div>
                );
              })()}

              {(() => {
                const phase = (viewReq as any).current_phase as DealPhase | undefined;
                const isTerminal = phase && TERMINAL_PHASES.includes(phase);
                const canAct = !isTerminal && viewReq.status !== "approved";
                return canAct ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "ملاحظات (في حال الرفض)" : "Notes (if rejecting)"}</Label>
                    <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={2} placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."} />
                  </div>
                ) : null;
              })()}
              {viewReq.owner_response_notes && (
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <Label className="text-xs font-medium">{isAr ? "ملاحظات الإدارة" : "Admin Notes"}</Label>
                  <p className="text-sm text-foreground mt-1">{viewReq.owner_response_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewReq(null)}>{isAr ? "إغلاق" : "Close"}</Button>
            {(() => {
              const phase = (viewReq as any)?.current_phase as DealPhase | undefined;
              const isTerminal = phase && TERMINAL_PHASES.includes(phase);
              const canAct = viewReq && !isTerminal && viewReq.status !== "approved";
              if (!canAct) return null;
              return (
                <>
                  <Button variant="destructive" onClick={() => handleReject(viewReq)} disabled={actionLoading} className="gap-1">
                    <XCircle className="h-3.5 w-3.5" />{isAr ? "رفض" : "Reject"}
                  </Button>
                  <Button onClick={() => handleApprove(viewReq)} disabled={actionLoading} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />{isAr ? "قبول وإنشاء صفقة" : "Approve & Create Deal"}
                  </Button>
                </>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW DEAL DIALOG */}
      <Dialog open={!!viewDeal} onOpenChange={o => { if (!o) setViewDeal(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              {isAr ? "تفاصيل الصفقة" : "Deal Details"}
            </DialogTitle>
          </DialogHeader>
          {viewDeal && (() => {
            const sc = stageConfig[viewDeal.current_stage] || stageConfig.listed;
            const StageIcon = sc.icon;
            const hc = healthColors[viewDeal.health] || healthColors.green;
            const isClosed = viewDeal.current_stage === "deal_closed";
            const isCancelled = viewDeal.current_stage === "deal_cancelled";
            const meetings = dealMeetings[viewDeal.id] || [];
            const canAdvance = !isClosed && !isCancelled;
            const currentIdx = stageOrder.indexOf(viewDeal.current_stage);
            const nextStage = canAdvance && currentIdx < stageOrder.length - 1 ? stageOrder[currentIdx + 1] : null;

            return (
              <div className="space-y-5">
                {/* Deal Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {viewDeal.developers?.marketing_brand_name || viewDeal.developers?.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {viewDeal.lands?.city}{viewDeal.lands?.district ? ` - ${viewDeal.lands.district}` : ""} • <span dir="ltr" className="tabular-nums">{Number(viewDeal.lands?.land_area_sqm).toLocaleString()}</span> {isAr ? "م²" : "sqm"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`gap-1 ${hc.bg} ${hc.text} border-transparent`}>
                      <div className={`h-2 w-2 rounded-full ${viewDeal.health === "green" ? "bg-emerald-500" : viewDeal.health === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                      {isAr ? hc.ar : hc.en}
                    </Badge>
                  </div>
                </div>

                {/* Stage Pipeline */}
                {!isCancelled && <DealStagePipeline currentStage={viewDeal.current_stage} isAr={isAr} />}

                {/* Health Control */}
                <div className="rounded-xl border border-border/40 p-3">
                  <h6 className="text-xs font-medium text-foreground mb-2">{isAr ? "حالة الصفقة" : "Deal Health"}</h6>
                  <div className="flex gap-2">
                    {(["green", "yellow", "red"] as const).map(h => (
                      <Button key={h} size="sm" variant={viewDeal.health === h ? "default" : "outline"}
                        className={`flex-1 gap-1.5 text-xs ${viewDeal.health === h ? (h === "green" ? "bg-emerald-600 hover:bg-emerald-700" : h === "yellow" ? "bg-amber-500 hover:bg-amber-600" : "bg-red-600 hover:bg-red-700") : ""}`}
                        onClick={() => handleUpdateHealth(viewDeal.id, h)}
                      >
                        <div className={`h-2 w-2 rounded-full ${h === "green" ? "bg-emerald-400" : h === "yellow" ? "bg-amber-400" : "bg-red-400"}`} />
                        {isAr ? healthColors[h].ar : healthColors[h].en}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Meetings Section */}
                <div className="rounded-xl border border-border/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-violet-600" />
                      {isAr ? "الاجتماعات" : "Meetings"}
                    </h6>
                    {canAdvance && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs"
                        onClick={() => {
                          setMeetingDialog({
                            dealId: viewDeal.id,
                            devName: viewDeal.developers?.marketing_brand_name || viewDeal.developers?.company_name,
                            devEmail: viewDeal.developers?.email || "",
                            ownerName: "", ownerEmail: "",
                            landCity: viewDeal.lands?.city, landDistrict: viewDeal.lands?.district,
                          });
                        }}>
                        <CalendarClock className="h-3 w-3" />{isAr ? "جدولة اجتماع" : "Schedule Meeting"}
                      </Button>
                    )}
                  </div>
                  <MeetingsList meetings={meetings} isAr={isAr} showSupervisorInfo />
                </div>

                {/* Commission Breakdown */}
                <CommissionBreakdown
                  isAr={isAr}
                  estimatedPricePerSqm={viewDeal.lands?.estimated_price_per_sqm || 0}
                  estimatedTotalValue={viewDeal.lands?.estimated_total_value || 0}
                  landAreaSqm={viewDeal.lands?.land_area_sqm || 0}
                />

                {/* Legal Acknowledgment */}
                <div className="rounded-xl border border-border/40 p-4 space-y-2">
                  <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "الإقرار القانوني" : "Legal Acknowledgment"}
                  </h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${viewDeal.owner_acknowledgment_accepted ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {isAr ? "إقرار المالك:" : "Owner:"} {viewDeal.owner_acknowledgment_accepted ? (isAr ? "تم" : "Accepted") : (isAr ? "لم يتم" : "Pending")}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${viewDeal.developer_acknowledgment_accepted ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {isAr ? "إقرار المطور:" : "Developer:"} {viewDeal.developer_acknowledgment_accepted ? (isAr ? "تم" : "Accepted") : (isAr ? "لم يتم" : "Pending")}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => setShowLegalDoc(true)}>
                    <FileText className="h-3.5 w-3.5" />
                    {isAr ? "عرض وثيقة الإقرار" : "View Acknowledgment Document"}
                  </Button>
                </div>

                {/* Governance Info */}
                <div className="rounded-xl border border-border/40 p-4 space-y-2">
                  <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "حوكمة الصفقة" : "Deal Governance"}
                  </h6>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{isAr ? "المشرف المسؤول" : "Assigned Supervisor"}</p>
                      <p className="text-xs font-medium text-foreground">{viewDeal.support_assignee ? (user?.email || "—") : (isAr ? "غير محدد" : "Unassigned")}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{isAr ? "تاريخ الإنشاء" : "Created"}</p>
                      <p className="text-xs font-medium text-foreground">{new Date(viewDeal.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                    </div>
                    {viewDeal.closed_at && (
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{isAr ? "تاريخ الإغلاق" : "Closed At"}</p>
                        <p className="text-xs font-medium text-foreground">{new Date(viewDeal.closed_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Developer Website */}
                {viewDeal.developers?.website && (
                  <div className="border-t border-border/40 pt-3">
                    <h6 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "تحليل المطور" : "Developer Analysis"}
                    </h6>
                    <DevWebsiteAnalysis developerName={viewDeal.developers?.company_name || ""} developerId={viewDeal.developer_id} isAr={isAr} autoUrl={viewDeal.developers.website} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-border/40 pt-4">
                  {nextStage && (
                    <Button className="flex-1 gap-1.5 bg-[#2B4C66] hover:bg-[#2B4C66]/90" onClick={() => setStageDialog({ dealId: viewDeal.id, currentStage: viewDeal.current_stage, nextStage, devName: viewDeal.developers?.company_name, landCity: viewDeal.lands?.city, landDistrict: viewDeal.lands?.district })}>
                      {isAr ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {isAr ? `الانتقال إلى: ${stageConfig[nextStage]?.ar}` : `Advance to: ${stageConfig[nextStage]?.en}`}
                    </Button>
                  )}
                  {canAdvance && (
                    <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleCancelDeal(viewDeal.id, viewDeal.current_stage)} disabled={actionLoading}>
                      <XCircle className="h-3.5 w-3.5" />{isAr ? "إلغاء" : "Cancel"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* SCHEDULE MEETING DIALOG */}
      <Dialog open={!!meetingDialog} onOpenChange={o => { if (!o) { setMeetingDialog(null); setMeetingDate(""); setMeetingTime("13:00"); setMeetingNotes(""); setMeetingLocation(""); } }}>
        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-violet-600" />
              {isAr ? "جدولة اجتماع" : "Schedule Meeting"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-primary font-medium">{isAr ? "سيتم إرسال تفاصيل الاجتماع لجميع الأطراف" : "Meeting details will be sent to all parties"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "نوع الاجتماع" : "Meeting Type"}</Label>
              <Select value={meetingType} onValueChange={v => setMeetingType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_meet"><div className="flex items-center gap-2"><Video className="h-3.5 w-3.5" />Google Meet</div></SelectItem>
                  <SelectItem value="in_person"><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{isAr ? "حضوري" : "In Person"}</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "تاريخ الاجتماع" : "Meeting Date"}</Label>
              <Input type="date" dir="ltr" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "الوقت" : "Time"}</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <select className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}>
                  {["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"].map(t => (
                    <option key={t} value={t}>{t} {parseInt(t) < 12 ? (isAr ? "ص" : "AM") : (isAr ? "م" : "PM")}</option>
                  ))}
                </select>
              </div>
            </div>
            {meetingType === "in_person" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "الموقع" : "Location"}</Label>
                <Input value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} placeholder={isAr ? "عنوان المكان..." : "Meeting location..."} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "ملاحظات المشرف (تظهر لجميع الأطراف)" : "Supervisor Notes (visible to all)"}</Label>
              <Textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={3} placeholder={isAr ? "جدول أعمال الاجتماع، نقاط النقاش..." : "Meeting agenda, discussion points..."} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMeetingDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleScheduleMeeting} disabled={actionLoading || !meetingDate} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
              {isAr ? "تأكيد الاجتماع" : "Confirm Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STAGE ADVANCE DIALOG */}
      <Dialog open={!!stageDialog} onOpenChange={o => { if (!o) { setStageDialog(null); setStageNotes(""); } }}>
        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isAr ? <ChevronLeft className="h-5 w-5 text-[#2B4C66]" /> : <ChevronRight className="h-5 w-5 text-[#2B4C66]" />}
              {isAr ? "تقديم مرحلة الصفقة" : "Advance Deal Stage"}
            </DialogTitle>
          </DialogHeader>
          {stageDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                <Badge variant="outline" className="text-xs">{isAr ? stageConfig[stageDialog.currentStage]?.ar : stageConfig[stageDialog.currentStage]?.en}</Badge>
                <MoveRight className="h-4 w-4 text-[#2B4C66]" />
                <Badge className="text-xs bg-primary">{isAr ? stageConfig[stageDialog.nextStage]?.ar : stageConfig[stageDialog.nextStage]?.en}</Badge>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea value={stageNotes} onChange={e => setStageNotes(e.target.value)} rows={3} placeholder={isAr ? "تفاصيل الانتقال..." : "Transition details..."} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStageDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAdvanceStage} disabled={actionLoading} className="gap-1.5">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {isAr ? "تأكيد الانتقال" : "Confirm Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legal Doc Print View */}
      {viewDeal && (
        <LegalDocPrintView
          open={showLegalDoc}
          onClose={() => setShowLegalDoc(false)}
          form={buildLandForm(viewDeal.lands)}
          referenceNumber={viewDeal.id?.substring(0, 8).toUpperCase()}
          ownerName={viewDeal.lands?.owner_name}
          companyName={viewDeal.developers?.company_name}
          dealId={viewDeal.id}
          viewerRole="admin"
          ownerAcknowledged={viewDeal.owner_acknowledgment_accepted}
          ownerAcknowledgedDate={viewDeal.owner_acknowledgment_date}
          developerAcknowledged={viewDeal.developer_acknowledgment_accepted}
          developerAcknowledgedDate={viewDeal.developer_acknowledgment_date}
        />
      )}
    </div>
    </AdminLayout>
  );
};

export default AdminDeals;
