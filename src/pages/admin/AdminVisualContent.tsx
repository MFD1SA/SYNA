import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { logAudit } from "@/lib/auditLog";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Image as ImageIcon, Upload, Trash2, Save, Loader2, Monitor, Smartphone,
  CheckCircle2, XCircle, Eye, Plus, RotateCcw
} from "lucide-react";
import {
  getAllHeroImages, updateHeroImageRecord, uploadHeroFile,
  removeHeroImageUrl, addHeroImagePage, HeroImageRecord,
} from "@/services/heroImages.service";

const AdminVisualContent: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "المحتوى البصري" : "Visual Content");

  const [records, setRecords] = useState<HeroImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewDialog, setPreviewDialog] = useState<HeroImageRecord | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ slug: "", labelAr: "", labelEn: "" });
  const [editAlt, setEditAlt] = useState<Record<string, { alt_ar: string; alt_en: string }>>({});

  const desktopRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mobileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchAll = async () => {
    try {
      const data = await getAllHeroImages();
      setRecords(data);
      const altMap: Record<string, { alt_ar: string; alt_en: string }> = {};
      data.forEach((r) => { altMap[r.id] = { alt_ar: r.alt_ar, alt_en: r.alt_en }; });
      setEditAlt(altMap);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const audit = async (action: string, entityId: string, details: any) => {
    if (user) await logAudit(user.id, user.email, action, "hero_images", entityId, details);
  };

  const handleUpload = async (record: HeroImageRecord, variant: "desktop" | "mobile", file: File) => {
    const uploadKey = `${record.id}-${variant}`;
    setUploading(uploadKey);
    try {
      const url = await uploadHeroFile(file, record.page_slug, variant);
      const field = variant === "desktop" ? "desktop_url" : "mobile_url";
      await updateHeroImageRecord(record.id, { [field]: url });
      await audit("upload_hero_image", record.id, { page_slug: record.page_slug, variant, url });
      toast({ title: isAr ? "تم رفع الصورة بنجاح" : "Image uploaded successfully" });
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الرفع" : "Upload Error", description: err.message });
    }
    setUploading(null);
  };

  const handleRemoveImage = async (record: HeroImageRecord, variant: "desktop" | "mobile") => {
    setSaving(record.id);
    try {
      await removeHeroImageUrl(record.id, variant);
      await audit("remove_hero_image", record.id, { page_slug: record.page_slug, variant });
      toast({ title: isAr ? "تم إزالة الصورة" : "Image removed" });
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setSaving(null);
  };

  const handleToggleActive = async (record: HeroImageRecord) => {
    setSaving(record.id);
    try {
      await updateHeroImageRecord(record.id, { is_active: !record.is_active });
      await audit("toggle_hero_active", record.id, { page_slug: record.page_slug, is_active: !record.is_active });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setSaving(null);
  };

  const handleSaveAlt = async (record: HeroImageRecord) => {
    const alt = editAlt[record.id];
    if (!alt) return;
    setSaving(record.id);
    try {
      await updateHeroImageRecord(record.id, { alt_ar: alt.alt_ar, alt_en: alt.alt_en });
      await audit("update_hero_alt", record.id, { page_slug: record.page_slug, ...alt });
      toast({ title: isAr ? "تم حفظ الوصف" : "Alt text saved" });
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setSaving(null);
  };

  const handleAddPage = async () => {
    if (!addForm.slug || !addForm.labelAr || !addForm.labelEn) return;
    setSaving("add");
    try {
      await addHeroImagePage(addForm.slug, addForm.labelAr, addForm.labelEn);
      await audit("add_hero_page", addForm.slug, addForm);
      toast({ title: isAr ? "تمت الإضافة" : "Page added" });
      setAddDialog(false);
      setAddForm({ slug: "", labelAr: "", labelEn: "" });
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setSaving(null);
  };

  // Separate home, default, and inner pages
  const homeRecord = records.find((r) => r.page_slug === "home");
  const defaultRecord = records.find((r) => r.page_slug === "default");
  const innerRecords = records.filter((r) => r.page_slug !== "home" && r.page_slug !== "default");

  const renderImageSlot = (record: HeroImageRecord, variant: "desktop" | "mobile", url: string | null) => {
    const uploadKey = `${record.id}-${variant}`;
    const isUploading = uploading === uploadKey;
    const Icon = variant === "desktop" ? Monitor : Smartphone;
    const refMap = variant === "desktop" ? desktopRefs : mobileRefs;

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-[11px] font-medium text-muted-foreground">
            {variant === "desktop" ? (isAr ? "سطح المكتب" : "Desktop") : (isAr ? "الجوال" : "Mobile")}
          </span>
        </div>

        {url ? (
          <div className="relative group rounded-lg overflow-hidden border border-border/40 bg-muted/30">
            <img src={url} alt="" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setPreviewDialog(record)}
                className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-gray-700" />
              </button>
              <button
                onClick={() => refMap.current[record.id]?.click()}
                className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-gray-700" />
              </button>
              <button
                onClick={() => handleRemoveImage(record, variant)}
                className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => refMap.current[record.id]?.click()}
            disabled={isUploading}
            className="w-full h-28 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-primary/[0.02] transition-all flex flex-col items-center justify-center gap-1.5"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-[10px] text-muted-foreground/60">{isAr ? "رفع صورة" : "Upload"}</span>
              </>
            )}
          </button>
        )}

        <input
          ref={(el) => { refMap.current[record.id] = el; }}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(record, variant, f);
            e.target.value = "";
          }}
        />
      </div>
    );
  };

  const renderCard = (record: HeroImageRecord, isSpecial?: boolean) => {
    const alt = editAlt[record.id] || { alt_ar: "", alt_en: "" };
    const hasImage = !!record.desktop_url || !!record.mobile_url;
    const isSaving = saving === record.id;

    return (
      <div
        key={record.id}
        className={`rounded-xl border bg-card transition-all ${
          isSpecial
            ? "border-primary/20 shadow-sm"
            : record.is_active && hasImage
            ? "border-emerald-200/60"
            : "border-border/60"
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
              isSpecial ? "bg-primary/10" : "bg-muted/60"
            }`}>
              <ImageIcon className={`h-4 w-4 ${isSpecial ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-semibold text-foreground truncate">
                {isAr ? record.page_label_ar : record.page_label_en}
              </h4>
              <code className="text-[10px] text-muted-foreground font-mono">/{record.page_slug === "home" ? "" : record.page_slug}</code>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            {hasImage ? (
              record.is_active ? (
                <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50/50 gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {isAr ? "مفعّل" : "Active"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 bg-amber-50/50 gap-1">
                  <XCircle className="h-2.5 w-2.5" />
                  {isAr ? "معطّل" : "Disabled"}
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                {isAr ? "بدون صورة" : "No Image"}
              </Badge>
            )}
            {/* Toggle */}
            <Switch
              checked={record.is_active}
              onCheckedChange={() => handleToggleActive(record)}
              disabled={isSaving}
              className="scale-75"
            />
          </div>
        </div>

        {/* Image Slots */}
        <div className="p-4">
          <div className="flex gap-3">
            {renderImageSlot(record, "desktop", record.desktop_url)}
            {renderImageSlot(record, "mobile", record.mobile_url)}
          </div>

          {/* Alt Text */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isAr ? "وصف (عربي)" : "Alt (AR)"}</Label>
              <Input
                value={alt.alt_ar}
                onChange={(e) => setEditAlt({ ...editAlt, [record.id]: { ...alt, alt_ar: e.target.value } })}
                dir="rtl"
                className="h-8 text-[11px]"
                placeholder={isAr ? "وصف الصورة" : "Image description"}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isAr ? "وصف (إنجليزي)" : "Alt (EN)"}</Label>
              <Input
                value={alt.alt_en}
                onChange={(e) => setEditAlt({ ...editAlt, [record.id]: { ...alt, alt_en: e.target.value } })}
                dir="ltr"
                className="h-8 text-[11px]"
                placeholder="Image description"
              />
            </div>
          </div>

          {/* Save alt text button */}
          {(alt.alt_ar !== record.alt_ar || alt.alt_en !== record.alt_en) && (
            <div className="mt-2 flex justify-end">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => handleSaveAlt(record)} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {isAr ? "حفظ الوصف" : "Save Alt"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={ImageIcon}
        titleAr="المحتوى البصري"
        titleEn="Visual Content"
        descAr="إدارة صور الهيدر والمحتوى البصري لجميع صفحات الموقع"
        descEn="Manage hero images and visual content for all website pages"
        actions={
          <Button
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90"
            onClick={() => setAddDialog(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "إضافة صفحة" : "Add Page"}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
          {/* Fallback Logic Explanation */}
          <div className="rounded-xl border border-blue-200/60 dark:border-blue-400/30 bg-blue-50/30 dark:bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/60 dark:bg-blue-400/20 shrink-0 mt-0.5">
                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-300" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {isAr ? "آلية عرض الصور" : "Image Display Logic"}
                </h4>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-200/90 leading-relaxed">
                  {isAr
                    ? "1) إذا كانت الصفحة لها صورة مخصصة مفعّلة → تُعرض تلقائياً. 2) إذا لم يكن لها صورة → تُستخدم الصورة الافتراضية. 3) إذا لم توجد أي صورة → يبقى التصميم الأصلي كما هو."
                    : "1) If a page has its own active image → it's displayed automatically. 2) If not → the default image is used. 3) If neither exists → the original design remains unchanged."}
                </p>
              </div>
            </div>
          </div>

          {/* Home Page Hero */}
          {homeRecord && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {isAr ? "الصفحة الرئيسية" : "Home Page"}
              </h3>
              {renderCard(homeRecord, true)}
            </div>
          )}

          {/* Default Inner Pages Image */}
          {defaultRecord && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2A86B]" />
                {isAr ? "الصورة الافتراضية للصفحات الداخلية" : "Default Inner Pages Image"}
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                {isAr
                  ? "تُستخدم هذه الصورة تلقائياً لأي صفحة داخلية ليس لها صورة هيدر مخصصة."
                  : "This image is automatically used for any inner page that doesn't have its own custom hero image."}
              </p>
              {renderCard(defaultRecord, true)}
            </div>
          )}

          {/* Inner Pages */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isAr ? "الصفحات الداخلية" : "Inner Pages"}
              <Badge variant="outline" className="text-[10px]">{innerRecords.length}</Badge>
            </h3>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {innerRecords.map((r) => renderCard(r))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDialog} onOpenChange={(o) => { if (!o) setPreviewDialog(null); }}>
        <DialogContent className="sm:max-w-2xl" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {isAr ? "معاينة" : "Preview"}: {previewDialog && (isAr ? previewDialog.page_label_ar : previewDialog.page_label_en)}
            </DialogTitle>
          </DialogHeader>
          {previewDialog && (
            <div className="space-y-4">
              {previewDialog.desktop_url && (
                <div>
                  <Label className="text-xs mb-1.5 block">{isAr ? "سطح المكتب" : "Desktop"}</Label>
                  <img src={previewDialog.desktop_url} alt="" className="w-full rounded-lg border border-border/40 object-cover max-h-64" />
                </div>
              )}
              {previewDialog.mobile_url && (
                <div>
                  <Label className="text-xs mb-1.5 block">{isAr ? "الجوال" : "Mobile"}</Label>
                  <div className="flex justify-center">
                    <img src={previewDialog.mobile_url} alt="" className="w-48 rounded-lg border border-border/40 object-cover max-h-64" />
                  </div>
                </div>
              )}
              {!previewDialog.desktop_url && !previewDialog.mobile_url && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isAr ? "لا توجد صور مرفوعة لهذه الصفحة" : "No images uploaded for this page"}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Page Dialog */}
      <Dialog open={addDialog} onOpenChange={(o) => { if (!o) setAddDialog(false); }}>
        <DialogContent className="sm:max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة صفحة جديدة" : "Add New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "معرّف الصفحة (slug)" : "Page Slug"}</Label>
              <Input
                value={addForm.slug}
                onChange={(e) => setAddForm({ ...addForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                dir="ltr"
                placeholder="my-new-page"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Label (Arabic)"}</Label>
                <Input value={addForm.labelAr} onChange={(e) => setAddForm({ ...addForm, labelAr: e.target.value })} dir="rtl" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Label (English)"}</Label>
                <Input value={addForm.labelEn} onChange={(e) => setAddForm({ ...addForm, labelEn: e.target.value })} dir="ltr" className="h-9 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button className="gap-1.5 bg-primary hover:bg-primary/90" onClick={handleAddPage} disabled={saving === "add" || !addForm.slug}>
              {saving === "add" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {isAr ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVisualContent;
