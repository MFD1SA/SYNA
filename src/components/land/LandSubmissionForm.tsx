import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { saudiCities } from "@/data/saudiCities";
import { uploadPrivateFile, uploadPublicImage, openPrivateFileInTab } from "@/lib/storage";
import {
  MapPin, LocateFixed, Link2, ImagePlus, Upload, FileText,
  ChevronLeft, ChevronRight, Check,
} from "lucide-react";
import {
  LandFormData,
  defaultLandForm,
  usageLabels,
  goalLabels,
  projectModelLabels,
  developmentSubtypes,
  contributionModelLabels,
  exitPercentages,
} from "./LandFormConstants";
import LandReviewPage from "./LandReviewPage";

interface Props {
  initialData?: Partial<LandFormData>;
  ownerProfiles?: { user_id: string; full_name: string; email: string }[];
  isAdmin?: boolean;
  editingId?: string | null;
  onSubmit: (data: LandFormData) => Promise<void>;
  onCancel: () => void;
}

const STEPS = ["location", "details", "project", "pricing", "documents", "review"] as const;

const LandSubmissionForm: React.FC<Props> = ({ initialData, ownerProfiles, isAdmin, editingId, onSubmit, onCancel }) => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [form, setForm] = useState<LandFormData>({ ...defaultLandForm, ...initialData });
  const [step, setStep] = useState(0);
  const [mapsLink, setMapsLink] = useState("");
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentStep = STEPS[step];
  const selectedCity = saudiCities.find(c => c.name.en === form.city);
  const subtypeOptions = developmentSubtypes[form.usage_type]?.options || [];

  const stepLabels: Record<string, { ar: string; en: string }> = {
    location: { ar: "الموقع", en: "Location" },
    details: { ar: "تفاصيل الأرض", en: "Land Details" },
    project: { ar: "نموذج المشروع", en: "Project Model" },
    pricing: { ar: "التسعير", en: "Pricing" },
    documents: { ar: "المستندات", en: "Documents" },
    review: { ar: "المراجعة", en: "Review" },
  };

  const update = (key: keyof LandFormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  // Auto-calculate pricing
  const handlePriceChange = (field: "estimated_price_per_sqm" | "estimated_total_value", value: string) => {
    const area = parseFloat(form.land_area_sqm) || 0;
    if (field === "estimated_price_per_sqm" && area > 0) {
      const perSqm = parseFloat(value) || 0;
      setForm(f => ({ ...f, estimated_price_per_sqm: value, estimated_total_value: perSqm > 0 ? String(perSqm * area) : f.estimated_total_value }));
    } else if (field === "estimated_total_value" && area > 0) {
      const total = parseFloat(value) || 0;
      setForm(f => ({ ...f, estimated_total_value: value, estimated_price_per_sqm: total > 0 ? String(Math.round(total / area)) : f.estimated_price_per_sqm }));
    } else {
      update(field, value);
    }
  };

  const parseGoogleMapsLink = (link: string) => {
    if (!link.trim()) return;
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /place\/(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /(-?\d{1,3}\.\d{4,})[,\s]+(-?\d{1,3}\.\d{4,})/,
    ];
    for (const p of patterns) {
      const m = link.match(p);
      if (m) {
        setForm(f => ({ ...f, exact_location_lat: m[1], exact_location_lng: m[2] }));
        toast({ title: isAr ? "تم استخراج الإحداثيات ✓" : "Coordinates extracted ✓" });
        return;
      }
    }
    toast({ variant: "destructive", title: isAr ? "تعذر الاستخراج" : "Could not extract" });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, exact_location_lat: pos.coords.latitude.toFixed(6), exact_location_lng: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
        toast({ title: isAr ? "تم تحديد الموقع ✓" : "Location detected ✓" });
      },
      () => { setLocating(false); toast({ variant: "destructive", title: isAr ? "تعذر تحديد الموقع" : "Location failed" }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "deed_file_url" | "kroki_file_url" | "image_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      if (field === "image_url") {
        // Public bucket — store the public URL.
        const url = await uploadPublicImage(file, "land-images");
        update(field, url);
      } else {
        // Private bucket — store the PATH (a signed URL will be created on open).
        // Owner id: explicit selection (admin flow) or current authenticated user.
        let ownerId = form.selected_owner_id || "";
        if (!ownerId) {
          const { data } = await supabase.auth.getUser();
          ownerId = data.user?.id || "";
        }
        if (!ownerId) throw new Error("Missing owner id for private upload");
        const path = await uploadPrivateFile(file, "land-documents", ownerId);
        update(field, path);
      }
      toast({ title: isAr ? "تم الرفع ✓" : "Uploaded ✓" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الرفع" : "Upload error", description: err?.message });
    } finally {
      setUploading(null);
    }
  };

  const MAX_GALLERY = 10;

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = form.gallery_urls || [];
    const remaining = MAX_GALLERY - current.length;
    if (remaining <= 0) {
      toast({ variant: "destructive", title: isAr ? `الحد الأقصى ${MAX_GALLERY} صور` : `Max ${MAX_GALLERY} images` });
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading("gallery_urls");
    try {
      const urls: string[] = [];
      for (const f of toUpload) {
        const url = await uploadPublicImage(f, "land-images");
        urls.push(url);
      }
      update("gallery_urls", [...current, ...urls]);
      toast({ title: isAr ? `تم رفع ${urls.length} صورة ✓` : `Uploaded ${urls.length} image(s) ✓` });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الرفع" : "Upload error", description: err?.message });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleGalleryRemove = (idx: number) => {
    const next = [...(form.gallery_urls || [])];
    next.splice(idx, 1);
    update("gallery_urls", next);
  };

  const MAX_EXTRA_DOCS = 10;

  const handleExtraDocsAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = form.additional_docs_urls || [];
    const remaining = MAX_EXTRA_DOCS - current.length;
    if (remaining <= 0) {
      toast({ variant: "destructive", title: isAr ? `الحد الأقصى ${MAX_EXTRA_DOCS} ملفات` : `Max ${MAX_EXTRA_DOCS} files` });
      return;
    }
    let ownerId = form.selected_owner_id || "";
    if (!ownerId) {
      const { data } = await supabase.auth.getUser();
      ownerId = data.user?.id || "";
    }
    if (!ownerId) {
      toast({ variant: "destructive", title: isAr ? "تعذّر تحديد المالك" : "Missing owner id" });
      return;
    }
    setUploading("additional_docs_urls");
    try {
      const paths: string[] = [];
      for (const f of files.slice(0, remaining)) {
        const p = await uploadPrivateFile(f, "land-documents", ownerId);
        paths.push(p);
      }
      update("additional_docs_urls", [...current, ...paths]);
      toast({ title: isAr ? `تم رفع ${paths.length} ملف ✓` : `Uploaded ${paths.length} file(s) ✓` });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الرفع" : "Upload error", description: err?.message });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleExtraDocsRemove = (idx: number) => {
    const next = [...(form.additional_docs_urls || [])];
    next.splice(idx, 1);
    update("additional_docs_urls", next);
  };

  const handleOpenPrivateFile = async (pathOrUrl: string | null | undefined) => {
    if (!pathOrUrl) return;
    const ok = await openPrivateFileInTab(pathOrUrl, "land-documents");
    if (!ok) {
      toast({ variant: "destructive", title: isAr ? "تعذّر فتح الملف" : "Couldn't open file" });
    }
  };

  const canNext = () => {
    switch (currentStep) {
      case "location": return !!form.city;
      case "details": return !!form.land_area_sqm && !!form.brokerage_license_number;
      case "project": return !!form.project_model;
      case "pricing": return true;
      case "documents": return true;
      case "review": return form.legal_acknowledgment_accepted && form.platform_fee_acknowledged;
      default: return true;
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const mapPreviewUrl = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;

  const renderStep = () => {
    switch (currentStep) {
      case "location":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-sm font-medium">{isAr ? "الموقع الجغرافي" : "Location"}</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleLocate} disabled={locating} className="gap-1.5">
                <LocateFixed className="h-3.5 w-3.5" />
                {locating ? (isAr ? "جاري التحديد..." : "Locating...") : (isAr ? "موقعي الحالي" : "My Location")}
              </Button>
            </div>

            {/* Google Maps Link */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{isAr ? "أو الصق رابط Google Maps" : "Or paste Google Maps link"}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9 text-xs" dir="ltr" value={mapsLink} onChange={e => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => parseGoogleMapsLink(mapsLink)} className="shrink-0">
                  {isAr ? "استخراج" : "Extract"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "المدينة" : "City"} <span className="text-destructive">*</span></Label>
                <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v, district: "" }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر المدينة" : "Select city"} /></SelectTrigger>
                  <SelectContent>{saudiCities.map(c => <SelectItem key={c.name.en} value={c.name.en}>{isAr ? c.name.ar : c.name.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الحي" : "District"}</Label>
                <Select value={form.district} onValueChange={v => update("district", v)} disabled={!selectedCity}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر الحي" : "Select district"} /></SelectTrigger>
                  <SelectContent>{selectedCity?.districts.map(d => <SelectItem key={d.en} value={d.en}>{isAr ? d.ar : d.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "خط العرض" : "Latitude"}</Label>
                <Input type="number" step="any" value={form.exact_location_lat} onChange={e => update("exact_location_lat", e.target.value)} placeholder="24.7136" dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "خط الطول" : "Longitude"}</Label>
                <Input type="number" step="any" value={form.exact_location_lng} onChange={e => update("exact_location_lng", e.target.value)} placeholder="46.6753" dir="ltr" />
              </div>
            </div>

            {form.exact_location_lat && form.exact_location_lng && (
              <div className="overflow-hidden rounded-lg border border-border/60">
                <iframe title="map" src={mapPreviewUrl(parseFloat(form.exact_location_lat), parseFloat(form.exact_location_lng))} className="h-48 w-full" style={{ border: 0 }} />
              </div>
            )}

            {/* Owner selection (admin only) */}
            {isAdmin && ownerProfiles && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <Label className="text-sm font-medium mb-3 block">{isAr ? "ربط المالك" : "Link Owner"}</Label>
                <Select value={form.selected_owner_id} onValueChange={v => {
                  const p = ownerProfiles.find(o => o.user_id === v);
                  setForm(f => ({ ...f, selected_owner_id: v, owner_name: p?.full_name || f.owner_name }));
                }}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر مالك الأرض" : "Select land owner"} /></SelectTrigger>
                  <SelectContent>
                    {ownerProfiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email} ({p.email})</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="mt-3 flex items-center gap-2">
                  <input type="checkbox" id="owner_approved" checked={form.owner_approved} onChange={e => update("owner_approved", e.target.checked)} className="rounded border-border" />
                  <label htmlFor="owner_approved" className="text-xs font-light">{isAr ? "✓ المالك موافق مبدئياً" : "✓ Owner pre-approved"}</label>
                </div>
              </div>
            )}
          </div>
        );

      case "details":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "المساحة (م²)" : "Area (sqm)"} <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.land_area_sqm} onChange={e => update("land_area_sqm", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الطول (م)" : "Length (m)"}</Label>
                <Input type="number" value={form.length_m} onChange={e => update("length_m", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "العرض (م)" : "Width (m)"}</Label>
                <Input type="number" value={form.width_m} onChange={e => update("width_m", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "عرض الشارع (م)" : "Street Width (m)"}</Label>
                <Input type="number" value={form.street_width_m} onChange={e => update("street_width_m", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "نوع الاستخدام" : "Usage Type"}</Label>
                <Select value={form.usage_type} onValueChange={v => setForm(f => ({ ...f, usage_type: v, development_subtype: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(usageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "رقم المخطط" : "Plan Number"}</Label>
                <Input value={form.plan_number} onChange={e => update("plan_number", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "رقم القطعة" : "Plot Number"}</Label>
                <Input value={form.plot_number} onChange={e => update("plot_number", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "عدد القطع" : "Number of Parcels"}</Label>
                <Input type="number" value={form.parcel_count} onChange={e => update("parcel_count", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "رقم رخصة الوساطة العقارية" : "Brokerage License #"} <span className="text-destructive">*</span></Label>
                <Input value={form.brokerage_license_number} onChange={e => update("brokerage_license_number", e.target.value)} placeholder={isAr ? "رقم الترخيص" : "License number"} />
              </div>
            </div>

            <div>
              <Label className="text-xs">{isAr ? "حدود الأرض" : "Land Boundaries"}</Label>
              <Textarea value={form.land_boundaries} onChange={e => update("land_boundaries", e.target.value)} placeholder={isAr ? "شمال: ... جنوب: ... شرق: ... غرب: ..." : "North: ... South: ... East: ... West: ..."} rows={3} />
            </div>

            <div>
              <Label className="text-xs">{isAr ? "معلومات الشارع" : "Street Information"}</Label>
              <Textarea value={form.street_info} onChange={e => update("street_info", e.target.value)} placeholder={isAr ? "عدد الواجهات، أسماء الشوارع..." : "Number of frontages, street names..."} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "رقم الصك" : "Deed Number"}</Label>
                <Input value={form.deed_number} onChange={e => update("deed_number", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "تاريخ الصك" : "Deed Date"}</Label>
                <Input type="date" value={form.deed_date} onChange={e => update("deed_date", e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">{isAr ? "ملخص الرؤية" : "Vision Summary"}</Label>
              <Textarea value={form.vision_summary} onChange={e => update("vision_summary", e.target.value)} rows={3} />
            </div>
          </div>
        );

      case "project":
        return (
          <div className="space-y-4">
            {/* Project Model Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">{isAr ? "نموذج المشروع" : "Project Model"} <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(projectModelLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, project_model: key, contribution_model: "", exit_percentage: "", partnership_goal: key === "real_estate_contribution" ? "real_estate_contribution" : (f.partnership_goal === "real_estate_contribution" ? "develop_sell" : f.partnership_goal) }))}
                    className={`rounded-lg border-2 p-4 text-start transition-all ${form.project_model === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <span className="text-sm font-medium">{isAr ? label.ar : label.en}</span>
                    {form.project_model === key && <Check className="h-4 w-4 text-primary mt-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Partnership Goal */}
            {form.project_model !== "real_estate_contribution" && (
            <div>
              <Label className="text-xs">{isAr ? "هدف الشراكة" : "Partnership Goal"}</Label>
              <Select value={form.partnership_goal} onValueChange={v => update("partnership_goal", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(goalLabels)
                  .filter(([k]) => k !== "real_estate_contribution")
                  .map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            )}

            {/* Development Subtype */}
            {subtypeOptions.length > 0 && (
              <div>
                <Label className="text-xs">{isAr ? developmentSubtypes[form.usage_type]?.label.ar : developmentSubtypes[form.usage_type]?.label.en}</Label>
                <Select value={form.development_subtype} onValueChange={v => update("development_subtype", v)}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
                  <SelectContent>{subtypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{isAr ? o.ar : o.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            {/* Contribution Model (if real estate contribution) */}
            {form.project_model === "real_estate_contribution" && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-4">
                <Label className="text-sm font-medium">{isAr ? "نموذج المساهمة" : "Contribution Model"}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(contributionModelLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, contribution_model: key, exit_percentage: key === "full_inkind" ? "" : f.exit_percentage }))}
                      className={`rounded-lg border-2 p-3 text-start transition-all ${form.contribution_model === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    >
                      <span className="text-xs font-medium block">{isAr ? label.ar : label.en}</span>
                      <span className="text-[10px] text-muted-foreground mt-1 block">{isAr ? label.desc_ar : label.desc_en}</span>
                    </button>
                  ))}
                </div>

                {form.contribution_model === "partial_exit" && (
                  <div>
                    <Label className="text-xs">{isAr ? "نسبة التخارج" : "Exit Percentage"}</Label>
                    <Select value={form.exit_percentage} onValueChange={v => update("exit_percentage", v)}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر النسبة" : "Select %"} /></SelectTrigger>
                      <SelectContent>{exitPercentages.map(p => <SelectItem key={p} value={String(p)}>{p}%</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs">{isAr ? "نموذج الشراكة" : "Partnership Model"}</Label>
              <Textarea value={form.partnership_model} onChange={e => update("partnership_model", e.target.value)} rows={2} placeholder={isAr ? "وصف نموذج الشراكة المطلوب..." : "Describe partnership model..."} />
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium">{isAr ? "التقييم التقديري" : "Estimated Pricing"}</Label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "السعر التقديري للمتر (ر.س)" : "Est. Price/sqm (SAR)"}</Label>
                <Input type="number" value={form.estimated_price_per_sqm} onChange={e => handlePriceChange("estimated_price_per_sqm", e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "القيمة الإجمالية التقديرية (ر.س)" : "Est. Total Value (SAR)"}</Label>
                <Input type="number" value={form.estimated_total_value} onChange={e => handlePriceChange("estimated_total_value", e.target.value)} dir="ltr" />
              </div>
            </div>

            {/* Auto-calculation hint */}
            {parseFloat(form.land_area_sqm) > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {isAr ? "💡 أدخل أحد الحقلين وسيتم حساب الآخر تلقائياً" : "💡 Enter one field and the other will be calculated automatically"}
              </p>
            )}

            {/* Preview calculation */}
            {(parseFloat(form.estimated_total_value) > 0 || parseFloat(form.estimated_price_per_sqm) > 0) && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المساحة" : "Area"}</span><span>{parseFloat(form.land_area_sqm || "0").toLocaleString()} {isAr ? "م²" : "sqm"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "سعر المتر" : "Price/sqm"}</span><span>{parseFloat(form.estimated_price_per_sqm || "0").toLocaleString()} {isAr ? "ريال" : "SAR"}</span></div>
                <div className="flex justify-between font-medium"><span>{isAr ? "القيمة الإجمالية" : "Total"}</span><span>{parseFloat(form.estimated_total_value || "0").toLocaleString()} {isAr ? "ريال" : "SAR"}</span></div>
              </div>
            )}
          </div>
        );

      case "documents":
        return (
          <div className="space-y-4">
            {/* Deed Upload */}
            <div>
              <Label className="text-xs mb-2 block">{isAr ? "رفع الصك" : "Upload Deed"}</Label>
              {form.deed_file_url && (
                <button type="button" onClick={() => handleOpenPrivateFile(form.deed_file_url)} className="mb-2 inline-flex">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/5"><FileText className="h-3 w-3 me-1" />{isAr ? "تم الرفع — فتح" : "Uploaded — open"}</Badge>
                </button>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading === "deed_file_url" ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اختر ملف PDF" : "Choose PDF file")}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileUpload(e, "deed_file_url")} disabled={!!uploading} />
              </label>
            </div>

            {/* Kroki Upload */}
            <div>
              <Label className="text-xs mb-2 block">{isAr ? "رفع الكروكي (رسم الأرض)" : "Upload Land Sketch (Kroki)"}</Label>
              {form.kroki_file_url && (
                <button type="button" onClick={() => handleOpenPrivateFile(form.kroki_file_url)} className="mb-2 inline-flex">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/5"><FileText className="h-3 w-3 me-1" />{isAr ? "تم الرفع — فتح" : "Uploaded — open"}</Badge>
                </button>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading === "kroki_file_url" ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اختر ملف" : "Choose file")}</span>
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => handleFileUpload(e, "kroki_file_url")} disabled={!!uploading} />
              </label>
            </div>

            {/* Additional docs (private) */}
            <div>
              <Label className="text-xs mb-2 block">
                {isAr ? `مستندات إضافية (حتى ${MAX_EXTRA_DOCS})` : `Additional Documents (up to ${MAX_EXTRA_DOCS})`}
                {form.additional_docs_urls?.length ? <span className="ms-2 text-muted-foreground">· {form.additional_docs_urls.length}/{MAX_EXTRA_DOCS}</span> : null}
              </Label>
              {form.additional_docs_urls?.length > 0 && (
                <div className="mb-2 space-y-1.5">
                  {form.additional_docs_urls.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPrivateFile(p)}
                        className="flex items-center gap-2 text-[12px] text-[#1E374B] hover:text-primary truncate"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{isAr ? `مستند ${i + 1}` : `Document ${i + 1}`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtraDocsRemove(i)}
                        className="text-[11px] text-red-600 hover:underline shrink-0"
                      >{isAr ? "حذف" : "Remove"}</button>
                    </div>
                  ))}
                </div>
              )}
              {(form.additional_docs_urls?.length || 0) < MAX_EXTRA_DOCS && (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading === "additional_docs_urls" ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "أضف مستندات" : "Add documents")}</span>
                  <input type="file" accept=".pdf,.doc,.docx,.xlsx,image/*" multiple className="hidden" onChange={handleExtraDocsAdd} disabled={!!uploading} />
                </label>
              )}
            </div>

            {/* Land Image (cover) */}
            <div>
              <Label className="text-xs mb-2 block">{isAr ? "الصورة الرئيسية (الغلاف)" : "Cover Image"}</Label>
              {form.image_url && <div className="mb-2 overflow-hidden rounded-xl"><img src={form.image_url} alt="Land" className="h-32 w-full object-cover rounded-xl" /></div>}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading === "image_url" ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اختر صورة" : "Choose Image")}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, "image_url")} disabled={!!uploading} />
              </label>
            </div>

            {/* Gallery — up to MAX_GALLERY additional images */}
            <div>
              <Label className="text-xs mb-2 block">
                {isAr ? `معرض الصور (حتى ${MAX_GALLERY})` : `Gallery (up to ${MAX_GALLERY})`}
                {form.gallery_urls?.length ? <span className="ms-2 text-muted-foreground">· {form.gallery_urls.length}/{MAX_GALLERY}</span> : null}
              </Label>
              {form.gallery_urls?.length > 0 && (
                <div className="mb-2 grid grid-cols-3 gap-2">
                  {form.gallery_urls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border/60">
                      <img src={url} alt={`Gallery ${i + 1}`} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleGalleryRemove(i)}
                        className="absolute top-1 end-1 h-5 w-5 rounded-full bg-black/70 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={isAr ? "حذف" : "Remove"}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              {(form.gallery_urls?.length || 0) < MAX_GALLERY && (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading === "gallery_urls" ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "أضف صور إضافية" : "Add more images")}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} disabled={!!uploading} />
                </label>
              )}
            </div>
          </div>
        );

      case "review":
        return (
          <LandReviewPage
            form={form}
            onAcceptLegal={v => update("legal_acknowledgment_accepted", v)}
            onAcceptFees={v => update("platform_fee_acknowledged", v)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={`flex-1 text-center text-[10px] py-1.5 rounded-md transition-colors ${i === step ? "bg-primary text-primary-foreground font-medium" : i < step ? "bg-primary/10 text-primary cursor-pointer" : "bg-muted text-muted-foreground"}`}
          >
            {isAr ? stepLabels[s].ar : stepLabels[s].en}
          </button>
        ))}
      </div>

      {/* Step content */}
      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
        <Button type="button" variant="outline" size="sm" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} className="gap-1.5">
          {isAr ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          {step === 0 ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "السابق" : "Back")}
        </Button>

        {currentStep === "review" ? (
          <Button
            onClick={handleFinalSubmit}
            disabled={!canNext() || submitting}
            className="gap-1.5 syna-gradient"
          >
            <Check className="h-3.5 w-3.5" />
            {submitting ? (isAr ? "جاري التقديم..." : "Submitting...") : (isAr ? (editingId ? "تحديث" : "تقديم الطلب") : (editingId ? "Update" : "Submit"))}
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-1.5">
            {isAr ? "التالي" : "Next"}
            {isAr ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LandSubmissionForm;
