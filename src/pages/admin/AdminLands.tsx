import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, StarOff, MapPin, Search, Eye, EyeOff, Pencil, LocateFixed, ImagePlus } from "lucide-react";
import { saudiCities } from "@/data/saudiCities";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "مختلط", en: "Mixed" },
  develop_complex: { ar: "مجمع متكامل", en: "Integrated Complex" },
  sell_develop: { ar: "بيع وتطوير", en: "Sell & Develop" },
  partial_exit: { ar: "تخارج جزئي", en: "Partial Exit" },
  offplan_sell: { ar: "تطوير وبيع على الخارطة", en: "Off-Plan Sell" },
};

const defaultForm = {
  city: "", district: "", land_area_sqm: "", usage_type: "residential",
  partnership_goal: "develop_sell", vision_summary: "", project_type: "",
  exact_location_lat: "", exact_location_lng: "", owner_name: "",
  plot_number: "", plan_number: "", deed_number: "",
  length_m: "", width_m: "", street_width_m: "",
  image_url: "", owner_approved: false, partnership_model: "",
  selected_owner_id: "",
};

const AdminLands: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الأراضي" : "Manage Lands");
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ownerProfiles, setOwnerProfiles] = useState<any[]>([]);

  const fetchLands = async () => {
    const { data } = await supabase.from("lands").select("*").order("created_at", { ascending: false });
    setLands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLands(); }, []);

  useEffect(() => {
    const fetchOwnerProfiles = async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      setOwnerProfiles(data || []);
    };
    fetchOwnerProfiles();
  }, []);

  const selectedCity = saudiCities.find(c => c.name.en === form.city);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          exact_location_lat: pos.coords.latitude.toFixed(6),
          exact_location_lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "تعذر تحديد الموقع" : "Could not get location" });
        setLocating(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!user || !form.city || !form.land_area_sqm) return;
    const ownerId = form.selected_owner_id || user.id;
    const payload = {
      owner_id: ownerId,
      city: form.city,
      district: form.district || null,
      land_area_sqm: parseFloat(form.land_area_sqm),
      usage_type: form.usage_type as any,
      partnership_goal: form.partnership_goal as any,
      vision_summary: form.vision_summary || null,
      project_type: form.project_type || null,
      exact_location_lat: form.exact_location_lat ? parseFloat(form.exact_location_lat) : null,
      exact_location_lng: form.exact_location_lng ? parseFloat(form.exact_location_lng) : null,
      owner_name: form.owner_name || null,
      plot_number: form.plot_number || null,
      plan_number: form.plan_number || null,
      deed_number: form.deed_number || null,
      length_m: form.length_m ? parseFloat(form.length_m) : null,
      width_m: form.width_m ? parseFloat(form.width_m) : null,
      street_width_m: form.street_width_m ? parseFloat(form.street_width_m) : null,
      image_url: form.image_url || null,
      is_featured: true,
      is_active: true,
      owner_approved: form.owner_approved,
      partnership_model: form.partnership_model || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("lands").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("lands").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      if (user) await logAudit(user.id, user.email, editingId ? "update" : "create", "land", editingId || undefined, { city: payload.city });
      toast({ title: isAr ? (editingId ? "تم التحديث" : "تمت الإضافة") : (editingId ? "Updated" : "Land Added") });
      closeDialog();
      fetchLands();
    }
  };

  const closeDialog = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm({ ...defaultForm });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("land-images").upload(path, file);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      const { data: urlData } = supabase.storage.from("land-images").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const openEdit = (land: any) => {
    setEditingId(land.id);
    setForm({
      city: land.city || "",
      district: land.district || "",
      land_area_sqm: String(land.land_area_sqm || ""),
      usage_type: land.usage_type || "residential",
      partnership_goal: land.partnership_goal || "develop_sell",
      vision_summary: land.vision_summary || "",
      project_type: land.project_type || "",
      exact_location_lat: land.exact_location_lat ? String(land.exact_location_lat) : "",
      exact_location_lng: land.exact_location_lng ? String(land.exact_location_lng) : "",
      owner_name: land.owner_name || "",
      plot_number: land.plot_number || "",
      plan_number: land.plan_number || "",
      deed_number: land.deed_number || "",
      length_m: land.length_m ? String(land.length_m) : "",
      width_m: land.width_m ? String(land.width_m) : "",
      street_width_m: land.street_width_m ? String(land.street_width_m) : "",
      image_url: land.image_url || "",
      owner_approved: land.owner_approved || false,
      partnership_model: land.partnership_model || "",
      selected_owner_id: land.owner_id || "",
    });
    setShowAdd(true);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("lands").update({ is_featured: !current }).eq("id", id);
    if (user) await logAudit(user.id, user.email, "update", "land", id, { is_featured: !current });
    fetchLands();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("lands").update({ is_active: !current }).eq("id", id);
    if (user) await logAudit(user.id, user.email, "update", "land", id, { is_active: !current });
    fetchLands();
    toast({ title: isAr ? (!current ? "تم النشر" : "تم الإخفاء") : (!current ? "Published" : "Hidden") });
  };

  const deleteLand = async (id: string) => {
    await supabase.from("lands").delete().eq("id", id);
    if (user) await logAudit(user.id, user.email, "delete", "land", id);
    fetchLands();
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
  };

  const filtered = lands.filter(l =>
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.district?.toLowerCase().includes(search.toLowerCase()) ||
    l.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const mapPreviewUrl = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "إدارة الأراضي" : "Manage Lands"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "إضافة وتعديل الأراضي — تنعكس تلقائياً في الواجهة الرئيسية" : "Add and manage lands — reflected automatically on homepage"}
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={(v) => { if (!v) closeDialog(); else setShowAdd(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{isAr ? "إدراج أرض" : "Add Land"}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isAr ? (editingId ? "تعديل الأرض" : "إدراج أرض جديدة") : (editingId ? "Edit Land" : "Add New Land")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Location */}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-sm font-medium">{isAr ? "الموقع الجغرافي" : "Location"}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleLocate} disabled={locating} className="gap-1.5">
                    <LocateFixed className="h-3.5 w-3.5" />
                    {locating ? (isAr ? "جاري التحديد..." : "Locating...") : (isAr ? "موقعي الحالي" : "My Location")}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
                    <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v, district: "" }))}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر المدينة" : "Select city"} /></SelectTrigger>
                      <SelectContent>
                        {saudiCities.map(c => <SelectItem key={c.name.en} value={c.name.en}>{isAr ? c.name.ar : c.name.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الحي" : "District"}</Label>
                    <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))} disabled={!selectedCity}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر الحي" : "Select district"} /></SelectTrigger>
                      <SelectContent>
                        {selectedCity?.districts.map(d => (
                          <SelectItem key={d.en} value={d.en}>{isAr ? d.ar : d.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "خط العرض" : "Latitude"}</Label>
                    <Input type="number" step="any" value={form.exact_location_lat} onChange={e => setForm(f => ({ ...f, exact_location_lat: e.target.value }))} placeholder="24.7136" />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "خط الطول" : "Longitude"}</Label>
                    <Input type="number" step="any" value={form.exact_location_lng} onChange={e => setForm(f => ({ ...f, exact_location_lng: e.target.value }))} placeholder="46.6753" />
                  </div>
                </div>
                {form.exact_location_lat && form.exact_location_lng && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
                    <iframe
                      title="map"
                      src={mapPreviewUrl(parseFloat(form.exact_location_lat), parseFloat(form.exact_location_lng))}
                      className="h-48 w-full"
                      style={{ border: 0 }}
                    />
                  </div>
                )}
              </div>

              {/* Land details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "المساحة (م²)" : "Area (sqm)"}</Label>
                  <Input type="number" value={form.land_area_sqm} onChange={e => setForm(f => ({ ...f, land_area_sqm: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "الطول (م)" : "Length (m)"}</Label>
                  <Input type="number" value={form.length_m} onChange={e => setForm(f => ({ ...f, length_m: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "العرض (م)" : "Width (m)"}</Label>
                  <Input type="number" value={form.width_m} onChange={e => setForm(f => ({ ...f, width_m: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "عرض الشارع (م)" : "Street Width (m)"}</Label>
                  <Input type="number" value={form.street_width_m} onChange={e => setForm(f => ({ ...f, street_width_m: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "نوع الاستخدام" : "Usage Type"}</Label>
                  <Select value={form.usage_type} onValueChange={v => setForm(f => ({ ...f, usage_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(usageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "هدف الشراكة" : "Partnership Goal"}</Label>
                  <Select value={form.partnership_goal} onValueChange={v => setForm(f => ({ ...f, partnership_goal: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(goalLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "نوع المشروع" : "Project Type"}</Label>
                  <Input value={form.project_type} onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))} placeholder={isAr ? "فلل، أبراج..." : "Villas, Towers..."} />
                </div>
              </div>

              {/* Owner selection & deed info */}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <Label className="text-sm font-medium mb-3 block">{isAr ? "ربط المالك" : "Link Owner"}</Label>
                <Select value={form.selected_owner_id} onValueChange={v => {
                  const p = ownerProfiles.find(o => o.user_id === v);
                  setForm(f => ({ ...f, selected_owner_id: v, owner_name: p?.full_name || f.owner_name }));
                }}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر مالك الأرض" : "Select land owner"} /></SelectTrigger>
                  <SelectContent>
                    {ownerProfiles.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name || p.email} ({p.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {isAr ? "اختر المالك لربط الأرض بحسابه — أنشئ حسابه أولاً من صفحة إدارة الملاك" : "Select owner to link — create account first from Manage Owners"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "اسم المالك" : "Owner Name"}</Label>
                  <Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "رقم الصك" : "Deed Number"}</Label>
                  <Input value={form.deed_number} onChange={e => setForm(f => ({ ...f, deed_number: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "رقم القطعة" : "Plot Number"}</Label>
                  <Input value={form.plot_number} onChange={e => setForm(f => ({ ...f, plot_number: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "رقم المخطط" : "Plan Number"}</Label>
                  <Input value={form.plan_number} onChange={e => setForm(f => ({ ...f, plan_number: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">{isAr ? "ملخص الرؤية" : "Vision Summary"}</Label>
                <Textarea value={form.vision_summary} onChange={e => setForm(f => ({ ...f, vision_summary: e.target.value }))} rows={3} />
              </div>

              {/* Owner Approval */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <Label className="text-sm font-medium mb-3 block">{isAr ? "اعتماد المالك" : "Owner Approval"}</Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">{isAr ? "نموذج الشراكة" : "Partnership Model"}</Label>
                    <Select value={form.partnership_model} onValueChange={v => setForm(f => ({ ...f, partnership_model: v }))}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر النموذج" : "Select model"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equity_share">{isAr ? "شراكة تطوير مقابل نسبة" : "Equity Share Partnership"}</SelectItem>
                        <SelectItem value="income_years">{isAr ? "تطوير وتشغيل مقابل دخل لسنوات" : "Develop & Operate for Income"}</SelectItem>
                        <SelectItem value="full_sale">{isAr ? "بيع كامل" : "Full Sale"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="owner_approved" checked={form.owner_approved} onChange={e => setForm(f => ({ ...f, owner_approved: e.target.checked }))} className="rounded border-border" />
                    <label htmlFor="owner_approved" className="text-xs font-light text-foreground">
                      {isAr ? "✓ المالك موافق مبدئياً على استقبال عروض وفق النموذج المختار" : "✓ Owner approves receiving offers per selected model"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <Label className="text-sm font-medium mb-2 block">{isAr ? "صورة الأرض" : "Land Image"}</Label>
                {form.image_url && (
                  <div className="mb-3 overflow-hidden rounded-xl">
                    <img src={form.image_url} alt="Land" className="h-40 w-full object-cover rounded-xl" />
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اختر صورة" : "Choose Image")}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>

              <Button onClick={handleSubmit} className="w-full doma-gradient">
                {isAr ? (editingId ? "تحديث" : "إدراج الأرض") : (editingId ? "Update" : "Add Land")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="ps-9" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(land => (
            <div key={land.id} className="doma-card flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {land.city}{land.district ? ` — ${land.district}` : ""}
                    </p>
                    {!land.is_active && <Badge variant="secondary" className="text-[10px]">{isAr ? "مسودة" : "Draft"}</Badge>}
                    {land.owner_approved && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">{isAr ? "🟢 مالك موافق" : "🟢 Owner Approved"}</Badge>}
                  </div>
                  <p className="text-xs font-light text-muted-foreground">
                    {land.land_area_sqm?.toLocaleString()} م² • {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                    {land.owner_name ? ` • ${land.owner_name}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(land)} title={isAr ? "تعديل" : "Edit"}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(land.id, land.is_active)} title={isAr ? "إظهار/إخفاء" : "Show/Hide"}>
                  {land.is_active ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleFeatured(land.id, land.is_featured)} title={isAr ? "تمييز" : "Feature"}>
                  {land.is_featured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteLand(land.id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد أراضي" : "No lands found"}</p>}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLands;
