import React, { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import LocationMap from "@/components/crm/LocationMap";
import {
  Search, MapPin, Ruler, Send, CheckCircle2, Clock, Filter,
  Calendar, ArrowUpDown, Image as ImageIcon, Eye, ChevronLeft, ChevronRight,
  FileText, Building2, XCircle, Link2,
} from "lucide-react";
import DeveloperFeeAcknowledgment from "@/components/crm/DeveloperFeeAcknowledgment";
import LandAIInsights from "@/components/crm/LandAIInsights";

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

  const areaRanges = [
    { value: "all", ar: "الكل", en: "All" },
    { value: "0-1000", ar: "أقل من 1,000 م²", en: "< 1,000 sqm", min: 0, max: 1000 },
    { value: "1000-5000", ar: "1,000 - 5,000 م²", en: "1,000 - 5,000 sqm", min: 1000, max: 5000 },
    { value: "5000-10000", ar: "5,000 - 10,000 م²", en: "5,000 - 10,000 sqm", min: 5000, max: 10000 },
    { value: "10000-50000", ar: "10,000 - 50,000 م²", en: "10,000 - 50,000 sqm", min: 10000, max: 50000 },
    { value: "50000+", ar: "50,000+ م²", en: "50,000+ sqm", min: 50000, max: Infinity },
  ];

  const fetchMyRequests = async (devId: string) => {
    const { data } = await supabase.from("deal_requests").select("land_id, status").eq("developer_id", devId);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.land_id] = r.status; });
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
      }
      const { data } = await supabase.from("lands").select("*").eq("is_active", true).order("created_at", { ascending: false });
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
    // Get the land info for notification
    const targetLand = lands.find(l => l.id === requestDialog);

    const { error } = await supabase.from("deal_requests").insert({
      developer_id: developerId,
      land_id: requestDialog,
      proposal_summary: requestForm.proposal_summary,
      proposed_project_type: requestForm.proposed_project_type,
      commission_accepted: true,
      commission_rate: 2.5,
      proposal_link: requestForm.google_drive_link || null,
    } as any);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم إرسال الطلب بنجاح" : "Request submitted successfully" });
      
      // Send email notification to land owner
      try {
        // Get developer info
        const { data: devInfo } = await supabase.from("developers").select("company_name, email").eq("id", developerId).maybeSingle();
        // Get owner email from profiles
        if (targetLand?.owner_id) {
          const { data: ownerProfile } = await supabase.from("profiles").select("email, full_name").eq("user_id", targetLand.owner_id).maybeSingle();
          await supabase.functions.invoke("send-deal-notification", {
            body: {
              type: "request_submitted",
              developer_name: devInfo?.company_name || "",
              developer_email: devInfo?.email || "",
              owner_name: ownerProfile?.full_name || targetLand.owner_name || "",
              owner_email: ownerProfile?.email || "",
              owner_user_id: targetLand.owner_id,
              land_city: targetLand.city,
              land_district: targetLand.district,
            },
          });
        }
      } catch (e) {
        console.error("Notification error:", e);
      }
      
      setRequestDialog(null);
      setRequestForm({ proposal_summary: "", proposed_project_type: "", google_drive_link: "", fee_acknowledged: false });
      if (developerId) fetchMyRequests(developerId);
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
    const status = submittedLands[landId];
    if (!status) return null;
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      pending: { label: isAr ? "بانتظار الرد" : "Awaiting Response", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
      approved: { label: isAr ? "تمت الموافقة" : "Approved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
      rejected: { label: isAr ? "تم الرفض" : "Rejected", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
      info_requested: { label: isAr ? "طلب معلومات" : "Info Requested", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: FileText },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${c.color}`}>
        <Icon className="h-3 w-3" />{c.label}
      </div>
    );
  };

  return (
    <CrmLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "استعراض الفرص" : "Browse Opportunities"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "استعرض الأراضي المتاحة وقدم طلب شراكة" : "Browse available lands and submit partnership requests"}
        </p>
      </div>

      {!isVerified && developerId && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm font-light text-yellow-700 dark:text-yellow-400">
          {isAr ? "حسابك قيد التحقق — يمكنك الاستعراض لكن لا يمكنك تقديم طلبات حتى يتم التحقق من سجلك التجاري" : "Your account is pending verification — you can browse but cannot submit requests until verified"}
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9 h-9" placeholder={isAr ? "بحث بالمدينة، الحي، أو الوصف..." : "Search city, district, or description..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={usageFilter} onValueChange={setUsageFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
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
          <SelectTrigger className="w-[180px] h-9">
            <Ruler className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={isAr ? "المساحة" : "Area"} />
          </SelectTrigger>
          <SelectContent>
            {areaRanges.map(r => (
              <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[140px] h-9">
            <ArrowUpDown className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
            <SelectItem value="largest">{isAr ? "الأكبر" : "Largest"}</SelectItem>
            <SelectItem value="smallest">{isAr ? "الأصغر" : "Smallest"}</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || usageFilter !== "all" || areaFilter !== "all") && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setSearchQuery(""); setUsageFilter("all"); setAreaFilter("all"); }}>
            {isAr ? "إعادة ضبط" : "Reset"}
          </Button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-3 text-xs font-light text-muted-foreground">
          {isAr ? `${filtered.length} فرصة` : `${filtered.length} opportunities`}
        </p>
      )}

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
              <div key={l.id} className="doma-card overflow-hidden">
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

                  {l.vision_summary && (
                    <p className="mt-2 text-xs font-light text-muted-foreground line-clamp-2">{l.vision_summary}</p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => setDetailDialog(l)}>
                      <Eye className="h-3 w-3" />{isAr ? "التفاصيل" : "Details"}
                    </Button>
                    {!submittedLands[l.id] ? (
                      <Button size="sm" className="flex-1 text-xs gap-1 doma-gradient" disabled={!isVerified} onClick={() => setRequestDialog(l.id)}>
                        <Send className="h-3 w-3" />{isAr ? "تقديم طلب" : "Apply"}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" disabled>
                        <CheckCircle2 className="h-3 w-3" />{isAr ? "تم التقديم" : "Applied"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

              {/* Image */}
              {getImageUrl(detailDialog) && (
                <div className="rounded-xl overflow-hidden h-48 bg-muted">
                  <img src={getImageUrl(detailDialog)!} alt="" className="h-full w-full object-cover" />
                </div>
              )}

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

              {/* Apply button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailDialog(null)}>{isAr ? "إغلاق" : "Close"}</Button>
                {!submittedLands[detailDialog.id] ? (
                  <Button className="doma-gradient gap-1.5" disabled={!isVerified} onClick={() => { setDetailDialog(null); setRequestDialog(detailDialog.id); }}>
                    <Send className="h-4 w-4" />{isAr ? "تقديم طلب شراكة" : "Submit Request"}
                  </Button>
                ) : (
                  <Button disabled className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />{isAr ? "تم التقديم" : "Already Applied"}
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
              <Button variant="outline" onClick={() => setRequestDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSubmitRequest} disabled={!requestForm.fee_acknowledged} className="syna-gradient">{isAr ? "إرسال الطلب" : "Submit Request"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CrmLayout>
  );
};

export default CrmBrowseLands;
