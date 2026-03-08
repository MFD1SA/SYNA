import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Search, FileText, Handshake, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Ruler, MapPin, Globe,
  TrendingUp, Video, CalendarClock, Loader2, ArrowRight, Shield, MessageSquare, Link2, ClipboardList,
  ChevronDown, ChevronUp, BarChart3, Building2,
} from "lucide-react";

const stageOrder = ["listed", "request_submitted", "owner_review", "owner_approved", "meeting_scheduled", "strategy_defined", "documents_exchanged", "agreements_prepared", "deal_closed"];

const stageConfig: Record<string, { ar: string; en: string; icon: React.ElementType; color: string }> = {
  listed: { ar: "مُدرجة", en: "Listed", icon: FileText, color: "text-muted-foreground" },
  request_submitted: { ar: "طلب مقدم", en: "Submitted", icon: ClipboardList, color: "text-blue-600" },
  owner_review: { ar: "مراجعة الإدارة", en: "Admin Review", icon: Eye, color: "text-amber-600" },
  owner_approved: { ar: "موافقة مبدئية", en: "Approved", icon: CheckCircle2, color: "text-emerald-600" },
  meeting_scheduled: { ar: "اجتماع مجدول", en: "Meeting Set", icon: Video, color: "text-violet-600" },
  strategy_defined: { ar: "استراتيجية", en: "Strategy", icon: TrendingUp, color: "text-cyan-600" },
  documents_exchanged: { ar: "مستندات", en: "Documents", icon: FileText, color: "text-orange-600" },
  agreements_prepared: { ar: "اتفاقيات", en: "Agreements", icon: Shield, color: "text-indigo-600" },
  deal_closed: { ar: "مُغلقة", en: "Closed", icon: Handshake, color: "text-emerald-700" },
  deal_cancelled: { ar: "ملغاة", en: "Cancelled", icon: XCircle, color: "text-destructive" },
};

const healthColors: Record<string, { bg: string; text: string; ar: string; en: string }> = {
  green: { bg: "bg-emerald-500/10", text: "text-emerald-700", ar: "سليمة", en: "Healthy" },
  yellow: { bg: "bg-amber-500/10", text: "text-amber-700", ar: "تحتاج متابعة", en: "Needs Attention" },
  red: { bg: "bg-red-500/10", text: "text-red-700", ar: "متعثرة", en: "At Risk" },
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: "معلق", en: "Pending" },
  approved: { ar: "مقبول", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  info_requested: { ar: "معلومات مطلوبة", en: "Info Requested" },
};

const commissionStatusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  paid: { ar: "مدفوعة", en: "Paid" },
  invoiced: { ar: "تم إصدار فاتورة", en: "Invoiced" },
  waived: { ar: "معفاة", en: "Waived" },
};

const AdminDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الصفقات" : "Manage Deals");
  const [requests, setRequests] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
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

  const fetchAll = async () => {
    try {
      const [reqRes, dealRes] = await Promise.all([
        supabase.from("deal_requests").select("*, lands(city, district, land_area_sqm, usage_type, partnership_goal, owner_name, owner_id), developers(company_name, marketing_brand_name, cr_number, email, phone, website)").order("created_at", { ascending: false }),
        supabase.from("deals").select("*, lands(city, district, land_area_sqm), developers(company_name, marketing_brand_name, email, phone, website)").order("created_at", { ascending: false }),
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
      const { error: updateErr } = await supabase.from("deal_requests").update({ status: "approved" }).eq("id", req.id);
      if (updateErr) throw updateErr;
      let ownerId = req.lands?.owner_id;
      if (!ownerId) {
        const { data: landData } = await supabase.from("lands").select("owner_id").eq("id", req.land_id).single();
        ownerId = landData?.owner_id;
      }
      if (!ownerId) throw new Error(isAr ? "لم يتم العثور على مالك الأرض" : "Land owner not found");
      const { error: dealErr } = await supabase.from("deals").insert({
        request_id: req.id, land_id: req.land_id, developer_id: req.developer_id,
        owner_id: ownerId, commission_rate: 2.5,
      });
      if (dealErr) throw dealErr;
      // Notify developer
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: {
            type: "request_approved", developer_name: req.developers?.company_name,
            developer_email: req.developers?.email, land_city: req.lands?.city, land_district: req.lands?.district,
          },
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
      const { error } = await supabase.from("deal_requests").update({ status: "rejected", owner_response_notes: rejectNotes || null }).eq("id", req.id);
      if (error) throw error;
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
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: isAr ? "طلبات معلقة" : "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: isAr ? "صفقات نشطة" : "Active Deals", value: activeDealsCount, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: isAr ? "مُنجزة" : "Closed", value: deals.filter(d => d.current_stage === "deal_closed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: isAr ? "ملغاة" : "Cancelled", value: deals.filter(d => d.current_stage === "deal_cancelled").length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{kpi.label}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xl font-medium text-foreground" dir="ltr">{kpi.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="requests">
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
            <div className="space-y-2">
              {filteredRequests.map(req => (
                <div key={req.id} className="rounded-xl border border-border/60 bg-card flex items-center justify-between p-4 transition-all hover:border-primary/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-foreground">
                        {req.developers?.marketing_brand_name || req.developers?.company_name || "—"}
                      </p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {req.lands?.city}{req.lands?.district ? ` / ${req.lands.district}` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ps-5">
                      {req.proposed_project_type} • {Number(req.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"} • {new Date(req.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "outline"} className="text-[10px]">
                      {req.status === "pending" && <Clock className="h-3 w-3 me-1" />}
                      {req.status === "approved" && <CheckCircle2 className="h-3 w-3 me-1" />}
                      {req.status === "rejected" && <XCircle className="h-3 w-3 me-1" />}
                      {isAr ? statusLabels[req.status]?.ar : statusLabels[req.status]?.en}
                    </Badge>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setViewReq(req); setRejectNotes(""); setDevWebsite(req.developers?.website || ""); }}>
                      <Eye className="h-3.5 w-3.5" />{isAr ? "عرض" : "View"}
                    </Button>
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests"}</p>}
            </div>
          )}
        </TabsContent>

        {/* DEALS TAB */}
        <TabsContent value="deals">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : (
            <div className="space-y-3">
              {filteredDeals.map(deal => {
                const sc = stageConfig[deal.current_stage] || stageConfig.listed;
                const StageIcon = sc.icon;
                const hc = healthColors[deal.health] || healthColors.green;
                const isClosed = deal.current_stage === "deal_closed";
                const isCancelled = deal.current_stage === "deal_cancelled";
                const progress = getStageProgress(deal.current_stage);
                const meetings = dealMeetings[deal.id] || [];

                return (
                  <div key={deal.id} className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/20">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <span className="text-sm font-medium text-foreground truncate">
                              {deal.developers?.marketing_brand_name || deal.developers?.company_name || "—"}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {deal.lands?.city}{deal.lands?.district ? ` - ${deal.lands.district}` : ""}
                            </span>
                          </div>

                          {/* Progress bar */}
                          {!isCancelled && (
                            <div className="flex items-center gap-1 mt-2">
                              {stageOrder.map((s, idx) => {
                                const stageIdx = stageOrder.indexOf(deal.current_stage);
                                return (
                                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
                                    idx <= stageIdx ? "bg-primary" : "bg-border"
                                  }`} title={stageConfig[s]?.[isAr ? "ar" : "en"]} />
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] gap-1 ${hc.bg} ${hc.text} border-transparent`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${deal.health === "green" ? "bg-emerald-500" : deal.health === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                            {isAr ? hc.ar : hc.en}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${sc.color}`}>
                            <StageIcon className="h-3 w-3" />
                            {isAr ? sc.ar : sc.en}
                          </Badge>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setViewDeal(deal)}>
                            <Eye className="h-3.5 w-3.5" />{isAr ? "تفاصيل" : "Details"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredDeals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد صفقات" : "No deals"}</p>}
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
                  {isAr ? "سجل:" : "CR:"} {viewReq.developers?.cr_number} • {viewReq.developers?.email || "—"} • {viewReq.developers?.phone || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">{isAr ? "الأرض" : "Land"}</p>
                </div>
                <p className="text-sm font-medium text-foreground">{viewReq.lands?.city}{viewReq.lands?.district ? ` - ${viewReq.lands.district}` : ""}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> {Number(viewReq.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
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
                  <p className="text-[10px] text-emerald-600">{isAr ? "عمولة المنصة 2.5% مُطبقة تلقائياً وموافق عليها من المطور" : "Platform commission 2.5% auto-applied & accepted by developer"}</p>
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

              {viewReq.status === "pending" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "ملاحظات (في حال الرفض)" : "Notes (if rejecting)"}</Label>
                  <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={2} placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."} />
                </div>
              )}
              {viewReq.owner_response_notes && viewReq.status !== "pending" && (
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <Label className="text-xs font-medium">{isAr ? "ملاحظات الإدارة" : "Admin Notes"}</Label>
                  <p className="text-sm text-foreground mt-1">{viewReq.owner_response_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewReq(null)}>{isAr ? "إغلاق" : "Close"}</Button>
            {viewReq?.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => handleReject(viewReq)} disabled={actionLoading} className="gap-1">
                  <XCircle className="h-3.5 w-3.5" />{isAr ? "رفض" : "Reject"}
                </Button>
                <Button onClick={() => handleApprove(viewReq)} disabled={actionLoading} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />{isAr ? "قبول وإنشاء صفقة" : "Approve & Create Deal"}
                </Button>
              </>
            )}
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
                      {viewDeal.lands?.city}{viewDeal.lands?.district ? ` - ${viewDeal.lands.district}` : ""} • {Number(viewDeal.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
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
                <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                  <h6 className="text-xs font-medium text-foreground mb-3">{isAr ? "مراحل الصفقة" : "Deal Pipeline"}</h6>
                  <div className="flex items-center gap-1">
                    {stageOrder.map((s, idx) => {
                      const sConf = stageConfig[s];
                      const SIcon = sConf?.icon || FileText;
                      const isActive = s === viewDeal.current_stage;
                      const isPast = idx < currentIdx;
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                            isActive ? "border-primary bg-primary/10" : isPast ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-muted/30"
                          }`}>
                            {isPast ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <SIcon className={`h-3.5 w-3.5 ${isActive ? sConf?.color : "text-muted-foreground/40"}`} />
                            )}
                          </div>
                          <span className={`text-[9px] text-center leading-tight ${isActive ? "font-medium text-primary" : isPast ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                            {isAr ? sConf?.ar : sConf?.en}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                      {isAr ? "الاجتماعات" : "Meetings"} ({meetings.length})
                    </h6>
                    {canAdvance && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs"
                        onClick={() => {
                          const ownerEmail = ""; // Will be fetched
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
                  {meetings.length > 0 ? meetings.map((m: any) => (
                    <div key={m.id} className="rounded-lg border border-border/30 bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-violet-600" />
                          <span className="text-xs font-medium text-foreground">
                            {new Date(m.scheduled_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(m.scheduled_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {m.meeting_type === "google_meet" ? "Google Meet" : (isAr ? "حضوري" : "In Person")}
                        </Badge>
                      </div>
                      {m.meet_link && (
                        <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Link2 className="h-3 w-3" />{isAr ? "رابط الاجتماع" : "Meeting Link"}
                        </a>
                      )}
                      {m.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</p>}
                      <div className="rounded-md bg-muted/30 border border-border/20 p-2 space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">{isAr ? "المدة:" : "Duration:"} {m.duration_minutes} {isAr ? "دقيقة" : "min"}</p>
                        {m.notes && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{isAr ? "إفادة المشرف:" : "Supervisor Notes:"}</p>
                            <p className="text-xs text-foreground">{m.notes}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/70">{isAr ? "أُنشئ بواسطة المشرف بتاريخ:" : "Created by supervisor on:"} {new Date(m.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد اجتماعات" : "No meetings yet"}</p>
                  )}
                </div>

                {/* Commission */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700">{isAr ? "عمولة المنصة: 2.5%" : "Platform Commission: 2.5%"}</p>
                    <p className="text-[10px] text-emerald-600">
                      {isAr ? "حالة العمولة:" : "Commission Status:"}{" "}
                      {isAr
                        ? (commissionStatusLabels[viewDeal.commission_status]?.ar || viewDeal.commission_status)
                        : (commissionStatusLabels[viewDeal.commission_status]?.en || viewDeal.commission_status)}
                    </p>
                  </div>
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
                    <Button className="flex-1 gap-1.5 bg-primary hover:bg-primary/90" onClick={() => setStageDialog({ dealId: viewDeal.id, currentStage: viewDeal.current_stage, nextStage })}>
                      <ArrowRight className="h-3.5 w-3.5" />
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
              <ArrowRight className="h-5 w-5 text-primary" />
              {isAr ? "تقديم مرحلة الصفقة" : "Advance Deal Stage"}
            </DialogTitle>
          </DialogHeader>
          {stageDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                <Badge variant="outline" className="text-xs">{isAr ? stageConfig[stageDialog.currentStage]?.ar : stageConfig[stageDialog.currentStage]?.en}</Badge>
                <ArrowRight className="h-4 w-4 text-primary" />
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
    </div>
    </AdminLayout>
  );
};

export default AdminDeals;
