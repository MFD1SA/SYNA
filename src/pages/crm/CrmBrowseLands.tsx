import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import LocationMap from "@/components/crm/LocationMap";
import {
  Search, MapPin, Ruler, Send, CheckCircle2, Clock, Filter,
  Calendar, ArrowUpDown, Image as ImageIcon, Eye, ChevronLeft, ChevronRight,
  FileText, Building2, XCircle, Link2, Shield,
} from "lucide-react";
import DeveloperFeeAcknowledgment from "@/components/crm/DeveloperFeeAcknowledgment";
import LandAIInsights from "@/components/crm/LandAIInsights";
import NDAConsentModal from "@/components/agreements/NDAConsentModal";
import { logAudit } from "@/lib/auditLog";
import ImageGallery from "@/components/shared/ImageGallery";
import DashboardShell from "@/components/dashboard/DashboardShell";
import BentoCard from "@/components/dashboard/BentoCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getNDAConsentsForUser, submitNDADecision, type NDAConsent } from "@/services/nda.service";
import { phaseLabels, phaseColors, type DealPhase } from "@/services/dealPhase.service";

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed Use" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "تطوير مختلط", en: "Mixed" },
  develop_complex: { ar: "مجمع تطويري", en: "Complex" },
  sell_develop: { ar: "بيع وتطوير", en: "Sell & Develop" },
  partial_exit: { ar: "تخارج جزئي", en: "Partial Exit" },
  offplan_sell: { ar: "بيع على الخارطة", en: "Off-Plan Sell" },
  real_estate_contribution: { ar: "مساهمة عقارية", en: "Real Estate Contribution" },
};

const CrmBrowseLands: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "تصفح الفرص" : "Browse Opportunities");
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [requestDialog, setRequestDialog] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<any>(null);
  const [mapDialog, setMapDialog] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({ proposal_summary: "", proposed_project_type: "", google_drive_link: "", fee_acknowledged: false });
  const [submittedLands, setSubmittedLands] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [usageFilter, setUsageFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "largest" | "smallest">("newest");
  const [ndaMap, setNdaMap] = useState<Record<string, NDAConsent["status"]>>({});
  const [ndaDialog, setNdaDialog] = useState<{ landId: string; city: string; district?: string } | null>(null);
  const [ndaLoading, setNdaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Synchronous re-entry guard. Without this, a double-click on the Submit
   * button (before React commits the setSubmitting(true) state) would fire
   * two INSERTs into deal_requests and surface as duplicate rows. The boolean
   * state is still needed for the disabled UI; the ref is what actually
   * blocks the race. */
  const submittingRef = useRef(false);

  const areaRanges = [
    { value: "all", ar: "الكل", en: "All" },
    { value: "0-1000", ar: "أقل من 1,000 م²", en: "< 1,000 sqm", min: 0, max: 1000 },
    { value: "1000-5000", ar: "1,000 - 5,000 م²", en: "1,000 - 5,000 sqm", min: 1000, max: 5000 },
    { value: "5000-10000", ar: "5,000 - 10,000 م²", en: "5,000 - 10,000 sqm", min: 5000, max: 10000 },
    { value: "10000-50000", ar: "10,000 - 50,000 م²", en: "10,000 - 50,000 sqm", min: 10000, max: 50000 },
    { value: "50000+", ar: "50,000+ م²", en: "50,000+ sqm", min: 50000, max: Infinity },
  ];

  const fetchMyRequests = async (devId: string) => {
    // Soft-deleted requests must not block the developer from re-applying on
    // the same land. Mirrors the filter used by OwnerRequests and CrmDeals.
    const { data, error } = await supabase
      .from("deal_requests")
      .select("land_id, current_phase")
      .eq("developer_id", devId)
      .is("deleted_at", null);
    if (error) {
      console.error("Failed to load existing deal_requests:", error);
      return;
    }
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.land_id] = r.current_phase; });
      setSubmittedLands(map);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const { data: dev } = await supabase.from("developers").select("id, verification_status").eq("user_id", user.id).maybeSingle();
      if (dev) {
        setDeveloperId(dev.id);
        setIsVerified(dev.verification_status === "verified");
        await fetchMyRequests(dev.id);
        // Fetch NDA consents for all lands
        const ndaConsents = await getNDAConsentsForUser(user.id);
        const map: Record<string, NDAConsent["status"]> = {};
        ndaConsents.forEach(n => { map[n.land_id] = n.status; });
        setNdaMap(map);
      }
      // Browse via the column-safe view `lands_developer_browse` rather
      // than the base table — the view is the only path the database
      // allows for developers without a deal context. It excludes
      // owner_id, owner_name, deed/plot/plan numbers, exact GPS, and
      // money fields (P0 audit C-01/C-02 fix). Once a deal_request is
      // submitted the verified-developer policy on the base table opens
      // up for that specific land via `is_developer_in_land_context`.
      const { data } = await supabase
        .from("lands_developer_browse" as any)
        .select("id, city, district, land_area_sqm, usage_type, partnership_goal, street_width_m, created_at, brokerage_license_status, vision_summary, image_url, gallery_urls, is_active, owner_approved, partnership_model, project_type")
        .order("created_at", { ascending: false });
      setLands(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const handleSubmitRequest = async () => {
    if (!developerId || !requestDialog || !requestForm.proposal_summary || !requestForm.proposed_project_type || !requestForm.fee_acknowledged) {
      toast({ variant: "destructive", title: isAr ? "يرجى تعبئة جميع الحقول والموافقة على الرسوم" : "Please fill all fields and acknowledge fees" });
      return;
    }
    // Ref guard blocks the synchronous double-click race. The `setSubmitting`
    // below is still needed for the button's disabled state, but React batches
    // state so the guard must be an imperative ref check.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    // Snapshot the land id — requestDialog can be cleared by the success path
    // before the notification fan-out has finished reading it.
    const landId = requestDialog;
    const targetLand = lands.find(l => l.id === landId);

    try {
      const { data: insertedReq, error } = await supabase.from("deal_requests").insert({
        developer_id: developerId,
        land_id: landId,
        proposal_summary: requestForm.proposal_summary,
        proposed_project_type: requestForm.proposed_project_type,
        commission_accepted: true,
        // Total platform fee the developer has just acknowledged:
        // 2.50% brokerage + 1.50% platform services = 4.00% of land value.
        // Matches PLATFORM_TOTAL_RATE in LandFormConstants and the signed agreement v2.0.
        commission_rate: 4.00,
        proposal_link: requestForm.google_drive_link || null,
      } as any).select("id").single();

      if (error) {
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
        return;
      }

      toast({ title: isAr ? "تم إرسال الطلب بنجاح" : "Request submitted successfully" });

      // Audit trail: developer created an interest request on a land.
      if (insertedReq?.id && user) {
        try {
          await logAudit(
            user.id,
            user.email,
            "deal_request.create",
            "deal_request",
            insertedReq.id,
            { land_id: landId, proposed_project_type: requestForm.proposed_project_type },
          );
        } catch (e) { console.error("Audit log failed:", e); }
      }

      // Primary: unified owner-facing notification (Resend email + in-app row).
      // Fire-and-forget — a failing webhook must not block the dialog from closing.
      if (insertedReq?.id) {
        supabase.functions
          .invoke("notify-interest", { body: { deal_request_id: insertedReq.id } })
          .catch((e) => console.error("notify-interest failed", e));
      }

      // Legacy secondary notification path: previously fetched the
      // owner's profile client-side via the dev's session and forwarded
      // name/email to send-deal-notification. After the audit C-02 fix
      // owner_id is no longer exposed to developers (and `profiles` RLS
      // would have blocked the client-side read anyway, so this branch
      // was effectively dead — name/email always arrived empty).
      // notify-interest above is the canonical owner-notification
      // pathway: it runs server-side with service-role and resolves the
      // owner from lands.owner_id internally, so no information is lost
      // by removing the legacy fan-out.

      setRequestDialog(null);
      setRequestForm({ proposal_summary: "", proposed_project_type: "", google_drive_link: "", fee_acknowledged: false });
      fetchMyRequests(developerId);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleApplyClick = (land: any) => {
    const ndaStatus = ndaMap[land.id];
    if (ndaStatus === "rejected") {
      toast({
        variant: "destructive",
        title: isAr ? "تم رفض اتفاقية عدم الإفصاح" : "NDA Rejected",
        description: isAr ? "لقد رفضت اتفاقية عدم الإفصاح لهذه الفرصة — لا يمكن التقديم عليها." : "You rejected the NDA for this opportunity — you cannot apply.",
      });
      return;
    }
    if (ndaStatus === "accepted") {
      setRequestDialog(land.id);
      return;
    }
    // No NDA yet — show NDA modal
    setNdaDialog({ landId: land.id, city: land.city, district: land.district });
  };

  const handleNDAAccept = async () => {
    if (!ndaDialog) return;
    setNdaLoading(true);
    const result = await submitNDADecision(ndaDialog.landId, "accept");
    setNdaLoading(false);
    if (result.success) {
      setNdaMap(prev => ({ ...prev, [ndaDialog.landId]: "accepted" }));
      const landId = ndaDialog.landId;
      setNdaDialog(null);
      setRequestDialog(landId);
      toast({ title: isAr ? "تم قبول اتفاقية عدم الإفصاح" : "NDA Accepted" });
      // NDA decisions are part of the compliance trail — audit on every outcome.
      if (user) {
        try {
          await logAudit(user.id, user.email, "nda.accept", "land", landId, { role: "developer" });
        } catch (e) { console.error("Audit log failed:", e); }
      }
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleNDAReject = async () => {
    if (!ndaDialog) return;
    setNdaLoading(true);
    const landId = ndaDialog.landId;
    const result = await submitNDADecision(landId, "reject");
    setNdaLoading(false);
    if (result.success) {
      setNdaMap(prev => ({ ...prev, [landId]: "rejected" }));
      setNdaDialog(null);
      toast({
        variant: "destructive",
        title: isAr ? "تم رفض اتفاقية عدم الإفصاح" : "NDA Rejected",
        description: isAr ? "لن تتمكن من التقديم على هذه الفرصة." : "You will not be able to apply for this opportunity.",
      });
      if (user) {
        try {
          await logAudit(user.id, user.email, "nda.reject", "land", landId, { role: "developer" });
        } catch (e) { console.error("Audit log failed:", e); }
      }
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const getImageUrl = (land: any) => {
    if (!land.image_url) return null;
    if (land.image_url.startsWith("http")) return land.image_url;
    const { data } = supabase.storage.from("land-images").getPublicUrl(land.image_url);
    return data?.publicUrl;
  };

  // Filtering and sorting
  const filtered = lands.filter(l => {
    const q = searchQuery.toLowerCase();
    const textMatch = !q || l.city?.toLowerCase().includes(q) || l.district?.toLowerCase().includes(q) || l.vision_summary?.toLowerCase().includes(q);
    const usageMatch = usageFilter === "all" || l.usage_type === usageFilter;
    let areaMatch = true;
    if (areaFilter !== "all") {
      const range = areaRanges.find(r => r.value === areaFilter);
      if (range && "min" in range) {
        const area = Number(l.land_area_sqm);
        areaMatch = area >= range.min! && area < range.max!;
      }
    }
    return textMatch && usageMatch && areaMatch;
  }).sort((a, b) => {
    if (sortBy === "largest") return Number(b.land_area_sqm) - Number(a.land_area_sqm);
    if (sortBy === "smallest") return Number(a.land_area_sqm) - Number(b.land_area_sqm);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const renderStatusBadge = (landId: string) => {
    const phase = submittedLands[landId] as DealPhase | undefined;
    if (!phase) return null;
    const label = phaseLabels[phase] ? (isAr ? phaseLabels[phase].ar : phaseLabels[phase].en) : phase;
    const color = phaseColors[phase] || "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    const iconMap: Record<string, React.ElementType> = {
      nda_pending: Clock, nda_developer_accepted: Clock, nda_both_accepted: FileText,
      under_review: Eye, study_required: FileText, closed_lost: XCircle, cancelled: XCircle,
    };
    const Icon = iconMap[phase] || Clock;
    return (
      <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${color}`}>
        <Icon className="h-3 w-3" />{label}
      </div>
    );
  };

  return (
    <CrmLayout>
      <DashboardShell isAr={isAr} accent="blue">
        {/* ═══ HERO ═══ */}
        <BentoCard variant="hero" span="full" padding="lg" className="relative overflow-hidden mb-5">
          <div className="absolute top-0 end-0 w-60 h-60 bg-[#2B2B2B]/10 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2B2B2B]/25 dark:border-[#7BA3C5]/35 text-[11px] font-semibold text-[#2B2B2B] dark:text-[#9CC3DD]">
                  <Search className="w-3 h-3" strokeWidth={1.7} />
                  {isAr ? "استعراض الفرص" : "Browse"}
                </span>
                {isVerified && <StatusBadge variant="success" dot>{isAr ? "موثّق" : "Verified"}</StatusBadge>}
              </div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#020202] dark:text-white tracking-tight">
                {isAr ? "استعرض الفرص العقارية" : "Browse Opportunities"}
              </h1>
              <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                {isAr ? "استعرض الأراضي المتاحة وقدم طلب شراكة" : "Browse available lands and submit partnership requests"}
              </p>
            </div>
            {!loading && (
              <div className="px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{isAr ? "النتائج" : "Results"}</p>
                <p className="text-[22px] font-bold text-[#020202] dark:text-white tracking-tight leading-none mt-1" dir="ltr">
                  {filtered.length}
                </p>
              </div>
            )}
          </div>
        </BentoCard>

        {!isVerified && developerId && (
          <BentoCard variant="neutral" span="full" padding="md" className="mb-5 !bg-amber-50/70 !border-amber-200/60 dark:!bg-amber-500/10 dark:!border-amber-500/20">
            <p className="text-[13px] font-medium text-amber-800 dark:text-amber-200">
              {isAr ? "حسابك قيد التحقق — يمكنك الاستعراض لكن لا يمكنك تقديم طلبات حتى يتم التحقق من سجلك التجاري" : "Your account is pending verification — you can browse but cannot submit requests until verified"}
            </p>
          </BentoCard>
        )}

        {/* ═══ FILTER RAIL (chip-style) ═══ */}
        <BentoCard variant="neutral" span="full" padding="md" className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="ps-9 h-10 bg-white/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/10 rounded-xl"
                placeholder={isAr ? "بحث بالمدينة، الحي، أو الوصف..." : "Search city, district, or description..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={usageFilter} onValueChange={setUsageFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-white/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/10 rounded-xl">
                <Filter className="h-3.5 w-3.5 me-1.5 text-slate-400" />
                <SelectValue placeholder={isAr ? "نوع الاستخدام" : "Usage Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {Object.entries(usageLabels).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[180px] h-10 bg-white/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/10 rounded-xl">
                <Ruler className="h-3.5 w-3.5 me-1.5 text-slate-400" />
                <SelectValue placeholder={isAr ? "المساحة" : "Area"} />
              </SelectTrigger>
              <SelectContent>
                {areaRanges.map(r => (
                  <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[140px] h-10 bg-white/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/10 rounded-xl">
                <ArrowUpDown className="h-3.5 w-3.5 me-1.5 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                <SelectItem value="largest">{isAr ? "الأكبر" : "Largest"}</SelectItem>
                <SelectItem value="smallest">{isAr ? "الأصغر" : "Smallest"}</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || usageFilter !== "all" || areaFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[12px] text-slate-500 hover:text-[#2B2B2B] h-10"
                onClick={() => { setSearchQuery(""); setUsageFilter("all"); setAreaFilter("all"); }}
              >
                {isAr ? "إعادة ضبط" : "Reset"}
              </Button>
            )}
          </div>

          {/* Active filter chips — flat outlined style */}
          {(usageFilter !== "all" || areaFilter !== "all" || searchQuery) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#2B2B2B]/25 dark:border-[#7BA3C5]/35 text-[11px] font-semibold text-[#2B2B2B] dark:text-[#9CC3DD]">
                  <Search className="w-3 h-3" strokeWidth={1.7} />{searchQuery}
                  <button onClick={() => setSearchQuery("")} className="hover:text-[#020202] dark:hover:text-white"><XCircle className="w-3 h-3" strokeWidth={1.7} /></button>
                </span>
              )}
              {usageFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#C45A41]/35 dark:border-[#C45A41]/40 text-[11px] font-semibold text-[#A24832] dark:text-[#D4BC8A]">
                  {isAr ? usageLabels[usageFilter]?.ar : usageLabels[usageFilter]?.en}
                  <button onClick={() => setUsageFilter("all")} className="hover:text-[#866C3A] dark:hover:text-[#E5D4A6]"><XCircle className="w-3 h-3" strokeWidth={1.7} /></button>
                </span>
              )}
              {areaFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {isAr ? areaRanges.find(r => r.value === areaFilter)?.ar : areaRanges.find(r => r.value === areaFilter)?.en}
                  <button onClick={() => setAreaFilter("all")} className="hover:text-emerald-900 dark:hover:text-emerald-200"><XCircle className="w-3 h-3" strokeWidth={1.7} /></button>
                </span>
              )}
            </div>
          )}
        </BentoCard>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد فرص مطابقة" : "No matching opportunities"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(l => {
            const imgUrl = getImageUrl(l);
            return (
              <div key={l.id} className="syna-card overflow-hidden">
                {/* Image */}
                <div className="relative h-40 bg-muted">
                  {imgUrl ? (
                    <img src={imgUrl} alt={l.city} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status badge overlay */}
                  {submittedLands[l.id] && (
                    <div className="absolute top-2 end-2">{renderStatusBadge(l.id)}</div>
                  )}
                  {/* Usage badge */}
                  <div className="absolute bottom-2 start-2">
                    <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">
                      {usageLabels[l.usage_type]?.[isAr ? "ar" : "en"] || l.usage_type}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                    <h3 className="font-medium text-foreground truncate">{l.city}</h3>
                    {l.district && <span className="text-xs font-light text-muted-foreground truncate">- {l.district}</span>}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs font-light text-muted-foreground">
                    <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{Number(l.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{goalLabels[l.partnership_goal]?.[isAr ? "ar" : "en"] || l.partnership_goal}</span>
                    {l.street_width_m && <span>{isAr ? "شارع:" : "St:"} {l.street_width_m}{isAr ? "م" : "m"}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(l.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}</span>
                  </div>

                  {l.brokerage_license_number && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-600">
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">{isAr ? "رخصة وساطة:" : "Brokerage License:"}</span>
                      <span dir="ltr">{l.brokerage_license_number}</span>
                    </div>
                  )}

                  {l.vision_summary && (
                    <p className="mt-2 text-xs font-light text-muted-foreground line-clamp-2">{l.vision_summary}</p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => setDetailDialog(l)}>
                      <Eye className="h-3 w-3" />{isAr ? "التفاصيل" : "Details"}
                    </Button>
                    {!submittedLands[l.id] ? (
                      !isVerified ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* Wrapper span: disabled buttons don't fire pointer events so Radix can't detect hover */}
                            <span className="flex-1" tabIndex={0}>
                              <Button size="sm" variant="outline" className="w-full text-xs gap-1 border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10" disabled>
                                <Send className="h-3 w-3" strokeWidth={1.7} />{isAr ? "تقديم طلب" : "Apply"}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-center">
                            {isAr
                              ? "حسابك قيد التحقق. يرجى إكمال التوثيق أولاً لتتمكن من تقديم الطلبات."
                              : "Your account is pending verification. Complete verification first to submit applications."}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10" onClick={() => handleApplyClick(l)}>
                          <Send className="h-3 w-3" strokeWidth={1.7} />{isAr ? "تقديم طلب" : "Apply"}
                        </Button>
                      )
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1 border-emerald-300 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300" disabled>
                        <CheckCircle2 className="h-3 w-3" strokeWidth={1.7} />{isAr ? "تم التقديم" : "Applied"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </DashboardShell>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={o => { if (!o) setDetailDialog(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {detailDialog.city}{detailDialog.district ? ` - ${detailDialog.district}` : ""}
                </DialogTitle>
              </DialogHeader>

              {/* Image + Gallery */}
              {(() => {
                const cover = getImageUrl(detailDialog);
                const extras: string[] = Array.isArray(detailDialog.gallery_urls) ? detailDialog.gallery_urls.filter(Boolean) : [];
                const all = [cover, ...extras].filter(Boolean) as string[];
                if (!all.length) return null;
                return (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden h-48 bg-muted">
                      <img src={all[0]} alt="" className="h-full w-full object-cover" />
                    </div>
                    {all.length > 1 && <ImageGallery images={all.slice(1)} isAr={isAr} />}
                  </div>
                );
              })()}

              {/* Executive Summary */}
              {detailDialog.vision_summary && (
                <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
                  <h4 className="text-xs font-medium text-foreground mb-1">{isAr ? "ملخص تنفيذي" : "Executive Summary"}</h4>
                  <p className="text-sm font-light text-muted-foreground">{detailDialog.vision_summary}</p>
                </div>
              )}

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: isAr ? "المساحة" : "Area", value: `${Number(detailDialog.land_area_sqm).toLocaleString()} ${isAr ? "م²" : "sqm"}` },
                  { label: isAr ? "نوع الاستخدام" : "Usage", value: usageLabels[detailDialog.usage_type]?.[isAr ? "ar" : "en"] },
                  { label: isAr ? "هدف الشراكة" : "Partnership Goal", value: goalLabels[detailDialog.partnership_goal]?.[isAr ? "ar" : "en"] },
                  { label: isAr ? "عرض الشارع" : "Street Width", value: detailDialog.street_width_m ? `${detailDialog.street_width_m}${isAr ? " م" : "m"}` : "—" },
                  { label: isAr ? "الطول" : "Length", value: detailDialog.length_m ? `${detailDialog.length_m}${isAr ? " م" : "m"}` : "—" },
                  { label: isAr ? "العرض" : "Width", value: detailDialog.width_m ? `${detailDialog.width_m}${isAr ? " م" : "m"}` : "—" },
                  { label: isAr ? "نوع المشروع" : "Project Type", value: detailDialog.project_type || "—" },
                  { label: isAr ? "المدة المتوقعة" : "Expected Duration", value: detailDialog.expected_dev_duration_months ? `${detailDialog.expected_dev_duration_months} ${isAr ? "شهر" : "months"}` : "—" },
                  ...(detailDialog.brokerage_license_number ? [{ label: isAr ? "رخصة الوساطة" : "Brokerage License", value: detailDialog.brokerage_license_number }] : []),
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-border/40 p-3">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Map */}
              {detailDialog.exact_location_lat && detailDialog.exact_location_lng && (
                <div className="rounded-xl overflow-hidden border border-border/40">
                  <LocationMap lat={detailDialog.exact_location_lat} lng={detailDialog.exact_location_lng} onChange={() => {}} isAr={isAr} readOnly />
                </div>
              )}

              {/* AI Insights */}
              {detailDialog.id && (
                <LandAIInsights landId={detailDialog.id} />
              )}

              {/* Apply button — flat outline */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailDialog(null)}>{isAr ? "إغلاق" : "Close"}</Button>
                {!submittedLands[detailDialog.id] ? (
                  !isVerified ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>
                          <Button variant="outline" className="gap-1.5 border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10" disabled>
                            <Send className="h-4 w-4" strokeWidth={1.7} />{isAr ? "تقديم طلب شراكة" : "Submit Request"}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-center">
                        {isAr
                          ? "حسابك قيد التحقق. يرجى إكمال التوثيق أولاً لتتمكن من تقديم الطلبات."
                          : "Your account is pending verification. Complete verification first to submit applications."}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button variant="outline" className="gap-1.5 border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10" onClick={() => { setDetailDialog(null); handleApplyClick(detailDialog); }}>
                      <Send className="h-4 w-4" strokeWidth={1.7} />{isAr ? "تقديم طلب شراكة" : "Submit Request"}
                    </Button>
                  )
                ) : (
                  <Button variant="outline" disabled className="gap-1.5 border-emerald-300 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.7} />{isAr ? "تم التقديم" : "Already Applied"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={!!mapDialog} onOpenChange={o => { if (!o) setMapDialog(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {mapDialog?.city} {mapDialog?.district ? `- ${mapDialog.district}` : ""}
            </DialogTitle>
          </DialogHeader>
          {mapDialog && <LocationMap lat={mapDialog.exact_location_lat} lng={mapDialog.exact_location_lng} onChange={() => {}} isAr={isAr} readOnly />}
        </DialogContent>
      </Dialog>

      {/* Request Dialog */}
      <Dialog open={!!requestDialog} onOpenChange={o => { if (!o) { setRequestDialog(null); setRequestForm({ proposal_summary: "", proposed_project_type: "", google_drive_link: "", fee_acknowledged: false }); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? "تقديم طلب شراكة" : "Submit Partnership Request"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{isAr ? "نوع المشروع المقترح" : "Proposed Project Type"} <span className="text-destructive">*</span></Label>
              <Input value={requestForm.proposed_project_type} onChange={e => setRequestForm({ ...requestForm, proposed_project_type: e.target.value })} placeholder={isAr ? "مثال: مجمع تجاري" : "e.g., Commercial Complex"} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "ملخص المقترح" : "Proposal Summary"} <span className="text-destructive">*</span></Label>
              <Textarea value={requestForm.proposal_summary} onChange={e => setRequestForm({ ...requestForm, proposal_summary: e.target.value })} rows={4} placeholder={isAr ? "اكتب وصفاً واضحاً لمقترح التطوير..." : "Write a clear description..."} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                {isAr ? "رابط العرض التفصيلي (Google Drive)" : "Detailed Proposal Link (Google Drive)"}
              </Label>
              <Input
                dir="ltr"
                value={requestForm.google_drive_link}
                onChange={e => setRequestForm({ ...requestForm, google_drive_link: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "ارفع مقترحك بصيغة PDF على Google Drive والصق الرابط هنا" : "Upload your proposal as PDF to Google Drive and paste the link here"}
              </p>
            </div>

            {/* Fee Acknowledgment */}
            <DeveloperFeeAcknowledgment
              accepted={requestForm.fee_acknowledged}
              onAccept={(v) => setRequestForm({ ...requestForm, fee_acknowledged: v })}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestDialog(null)} disabled={submitting}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button
                variant="outline"
                onClick={handleSubmitRequest}
                disabled={!requestForm.fee_acknowledged || submitting}
                className="border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10"
              >
                {submitting ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit Request")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* NDA Consent Modal */}
      <NDAConsentModal
        isAr={isAr}
        open={!!ndaDialog}
        landCity={ndaDialog?.city || ""}
        landDistrict={ndaDialog?.district}
        loading={ndaLoading}
        onAccept={handleNDAAccept}
        onReject={handleNDAReject}
        onClose={() => setNdaDialog(null)}
      />
    </CrmLayout>
  );
};

export default CrmBrowseLands;
