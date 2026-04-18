import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Gift, Plus, Pencil, Trash2, Eye, EyeOff, MapPin, Ruler,
  ArrowUp, ArrowDown, Loader2, ExternalLink, Upload, Image as ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

interface Offer {
  id: string;
  slug: string;
  type: string;
  city_ar: string;
  city_en: string;
  district_ar: string;
  district_en: string;
  usage_type: string;
  area_sqm: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  detailed_description_ar: string;
  detailed_description_en: string;
  image_url: string;
  features_ar: string[];
  features_en: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const EMPTY_OFFER: Partial<Offer> = {
  slug: "", type: "partnership", city_ar: "", city_en: "", district_ar: "", district_en: "",
  usage_type: "residential", area_sqm: 0, title_ar: "", title_en: "",
  description_ar: "", description_en: "", detailed_description_ar: "", detailed_description_en: "",
  image_url: "", features_ar: [], features_en: [], is_active: true, sort_order: 0,
};

const usageOptions = [
  { value: "residential", ar: "سكني", en: "Residential" },
  { value: "commercial", ar: "تجاري", en: "Commercial" },
  { value: "mixed", ar: "سكني تجاري", en: "Mixed Use" },
  { value: "high_density", ar: "كثافة عالية", en: "High Density" },
];

const typeOptions = [
  { value: "partnership", ar: "شراكة تطوير", en: "Partnership" },
  { value: "contribution", ar: "مساهمة عقارية", en: "Contribution" },
];

const AdminOffers: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  usePageTitle(isAr ? "إدارة العروض" : "Manage Offers");

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; offer: Partial<Offer> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [featuresArText, setFeaturesArText] = useState("");
  const [featuresEnText, setFeaturesEnText] = useState("");
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchOffers = async () => {
    // Admin can see all offers via RLS policy
    const { data, error } = await supabase
      .from("platform_offers")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      // Try without is_active filter for admin
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
    setOffers((data as Offer[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const openCreate = () => {
    const maxSort = offers.length > 0 ? Math.max(...offers.map(o => o.sort_order)) + 1 : 1;
    setDialog({ mode: "create", offer: { ...EMPTY_OFFER, sort_order: maxSort } });
    setFeaturesArText("");
    setFeaturesEnText("");
  };

  const openEdit = (offer: Offer) => {
    setDialog({ mode: "edit", offer: { ...offer } });
    setFeaturesArText((offer.features_ar || []).join("\n"));
    setFeaturesEnText((offer.features_en || []).join("\n"));
  };

  const handleSave = async () => {
    if (!dialog) return;
    const o = dialog.offer;
    if (!o.slug || !o.title_ar || !o.title_en || !o.city_ar || !o.city_en) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields" });
      return;
    }

    setSaving(true);
    const payload = {
      slug: o.slug,
      type: o.type,
      city_ar: o.city_ar,
      city_en: o.city_en,
      district_ar: o.district_ar || "",
      district_en: o.district_en || "",
      usage_type: o.usage_type,
      area_sqm: o.area_sqm || 0,
      title_ar: o.title_ar,
      title_en: o.title_en,
      description_ar: o.description_ar || "",
      description_en: o.description_en || "",
      detailed_description_ar: o.detailed_description_ar || "",
      detailed_description_en: o.detailed_description_en || "",
      image_url: o.image_url || "",
      features_ar: featuresArText.split("\n").map(s => s.trim()).filter(Boolean),
      features_en: featuresEnText.split("\n").map(s => s.trim()).filter(Boolean),
      is_active: o.is_active ?? true,
      sort_order: o.sort_order ?? 0,
    };

    let error: any;
    if (dialog.mode === "create") {
      ({ error } = await supabase.from("platform_offers").insert(payload));
    } else {
      ({ error } = await supabase.from("platform_offers").update(payload).eq("id", o.id));
    }

    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: isAr ? "تم الحفظ" : "Saved" });
    setDialog(null);
    fetchOffers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) return;
    const { error } = await supabase.from("platform_offers").delete().eq("id", id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
    fetchOffers();
  };

  const toggleActive = async (offer: Offer) => {
    const { error } = await supabase.from("platform_offers").update({ is_active: !offer.is_active }).eq("id", offer.id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    fetchOffers();
  };

  const moveOrder = async (offer: Offer, direction: "up" | "down") => {
    const idx = offers.findIndex(o => o.id === offer.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= offers.length) return;
    const other = offers[swapIdx];
    await Promise.all([
      supabase.from("platform_offers").update({ sort_order: other.sort_order }).eq("id", offer.id),
      supabase.from("platform_offers").update({ sort_order: offer.sort_order }).eq("id", other.id),
    ]);
    fetchOffers();
  };

  const handleImageUpload = async (file: File) => {
    if (!file || file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "الحد الأقصى 5 ميغابايت" : "Max file size 5MB" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `offers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
    if (dialog) {
      setDialog({ ...dialog, offer: { ...dialog.offer, image_url: urlData.publicUrl } });
    }
    setUploading(false);
    toast({ title: isAr ? "تم رفع الصورة" : "Image uploaded" });
  };

  const usageLabel = (t: string) => usageOptions.find(o => o.value === t)?.[isAr ? "ar" : "en"] || t;
  const typeLabel = (t: string) => typeOptions.find(o => o.value === t)?.[isAr ? "ar" : "en"] || t;

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={Gift}
          titleAr="إدارة العروض"
          titleEn="Manage Offers"
          descAr="إضافة وتعديل العروض العقارية على الموقع"
          descEn="Add and manage real estate offers on the website"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/offers" target="_blank">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isAr ? "معاينة" : "Preview"}
                </Button>
              </Link>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" />
                {isAr ? "إضافة عرض" : "Add Offer"}
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}
          </div>
        ) : offers.length === 0 ? (
          <div className="py-20 text-center">
            <Gift className="mx-auto h-10 w-10 text-gray-300 mb-3" strokeWidth={1} />
            <p className="text-sm text-gray-400">{isAr ? "لا توجد عروض" : "No offers yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {offers.map((offer, idx) => (
              <div key={offer.id} className={`flex items-center gap-4 rounded-xl border bg-white px-5 py-4 transition-all hover:shadow-sm ${!offer.is_active ? "opacity-50" : "border-gray-200/60"}`}>
                {/* Thumbnail */}
                {offer.image_url && (
                  <img src={offer.image_url} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0 hidden sm:block" />
                )}
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-semibold text-gray-800 dark:text-white truncate">{isAr ? offer.title_ar : offer.title_en}</p>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${offer.type === "partnership" ? "border-[#2B4C66]/20 text-[#2B4C66] dark:text-[#9BBEDB]" : "border-emerald-200 text-emerald-600 dark:text-emerald-400"}`}>
                      {typeLabel(offer.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-300">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{isAr ? offer.city_ar : offer.city_en}</span>
                    <span>{usageLabel(offer.usage_type)}</span>
                    <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{Number(offer.area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveOrder(offer, "up")} disabled={idx === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveOrder(offer, "down")} disabled={idx === offers.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(offer)}>
                    {offer.is_active ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-gray-400" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(offer)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(offer.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        {dialog && (
          <Dialog open onOpenChange={() => setDialog(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {dialog.mode === "create" ? (isAr ? "إضافة عرض جديد" : "Add New Offer") : (isAr ? "تعديل العرض" : "Edit Offer")}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Row 1: Slug + Type + Usage */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px]">{isAr ? "المعرّف (slug)" : "Slug"} *</Label>
                    <Input value={dialog.offer.slug || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, slug: e.target.value } })} className="h-9 text-xs" dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "النوع" : "Type"}</Label>
                    <Select value={dialog.offer.type} onValueChange={v => setDialog({ ...dialog, offer: { ...dialog.offer, type: v } })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {typeOptions.map(o => <SelectItem key={o.value} value={o.value}>{isAr ? o.ar : o.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "الاستخدام" : "Usage"}</Label>
                    <Select value={dialog.offer.usage_type} onValueChange={v => setDialog({ ...dialog, offer: { ...dialog.offer, usage_type: v } })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {usageOptions.map(o => <SelectItem key={o.value} value={o.value}>{isAr ? o.ar : o.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Title */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">{isAr ? "العنوان (عربي)" : "Title (AR)"} *</Label>
                    <Input value={dialog.offer.title_ar || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, title_ar: e.target.value } })} className="h-9 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "العنوان (إنجليزي)" : "Title (EN)"} *</Label>
                    <Input value={dialog.offer.title_en || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, title_en: e.target.value } })} className="h-9 text-xs" dir="ltr" />
                  </div>
                </div>

                {/* City + District */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">{isAr ? "المدينة (ع)" : "City AR"} *</Label>
                      <Input value={dialog.offer.city_ar || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, city_ar: e.target.value } })} className="h-9 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px]">{isAr ? "المدينة (E)" : "City EN"} *</Label>
                      <Input value={dialog.offer.city_en || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, city_en: e.target.value } })} className="h-9 text-xs" dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">{isAr ? "الحي (ع)" : "District AR"}</Label>
                      <Input value={dialog.offer.district_ar || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, district_ar: e.target.value } })} className="h-9 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px]">{isAr ? "الحي (E)" : "District EN"}</Label>
                      <Input value={dialog.offer.district_en || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, district_en: e.target.value } })} className="h-9 text-xs" dir="ltr" />
                    </div>
                  </div>
                </div>

                {/* Area + Image */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">{isAr ? "المساحة (م²)" : "Area (sqm)"}</Label>
                    <Input type="number" value={dialog.offer.area_sqm || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, area_sqm: Number(e.target.value) } })} className="h-9 text-xs" dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "صورة العرض" : "Offer Image"}</Label>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                    {dialog.offer.image_url ? (
                      <div className="relative mt-1 rounded-lg overflow-hidden border border-gray-200 h-24">
                        <img src={dialog.offer.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => imageInputRef.current?.click()} className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white">
                            <Upload className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setDialog({ ...dialog, offer: { ...dialog.offer, image_url: "" } })} className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-white">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading} className="mt-1 w-full h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-[#2B4C66]/30 transition-colors flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#2B4C66]">
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                        <span className="text-[10px]">{uploading ? (isAr ? "جارٍ الرفع..." : "Uploading...") : (isAr ? "اضغط لرفع صورة" : "Click to upload image")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">{isAr ? "الوصف المختصر (ع)" : "Short Desc AR"}</Label>
                    <Textarea value={dialog.offer.description_ar || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, description_ar: e.target.value } })} className="text-xs min-h-[60px]" />
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "الوصف المختصر (E)" : "Short Desc EN"}</Label>
                    <Textarea value={dialog.offer.description_en || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, description_en: e.target.value } })} className="text-xs min-h-[60px]" dir="ltr" />
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">{isAr ? "الوصف التفصيلي (ع)" : "Detailed Desc AR"}</Label>
                    <Textarea value={dialog.offer.detailed_description_ar || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, detailed_description_ar: e.target.value } })} className="text-xs min-h-[80px]" />
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "الوصف التفصيلي (E)" : "Detailed Desc EN"}</Label>
                    <Textarea value={dialog.offer.detailed_description_en || ""} onChange={e => setDialog({ ...dialog, offer: { ...dialog.offer, detailed_description_en: e.target.value } })} className="text-xs min-h-[80px]" dir="ltr" />
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">{isAr ? "المميزات (ع) — سطر لكل ميزة" : "Features AR — one per line"}</Label>
                    <Textarea value={featuresArText} onChange={e => setFeaturesArText(e.target.value)} className="text-xs min-h-[70px]" />
                  </div>
                  <div>
                    <Label className="text-[11px]">{isAr ? "المميزات (E) — سطر لكل ميزة" : "Features EN — one per line"}</Label>
                    <Textarea value={featuresEnText} onChange={e => setFeaturesEnText(e.target.value)} className="text-xs min-h-[70px]" dir="ltr" />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <Switch checked={dialog.offer.is_active ?? true} onCheckedChange={v => setDialog({ ...dialog, offer: { ...dialog.offer, is_active: v } })} />
                  <Label className="text-xs">{isAr ? "نشط على الموقع" : "Active on website"}</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)} className="text-xs h-9">{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleSave} disabled={saving} className="text-xs h-9 gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isAr ? "حفظ" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;
