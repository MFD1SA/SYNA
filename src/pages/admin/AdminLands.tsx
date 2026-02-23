import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, StarOff, MapPin, Search } from "lucide-react";
import { saudiCities } from "@/data/saudiCities";

const AdminLands: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    city: "", district: "", land_area_sqm: "", usage_type: "residential" as any,
    partnership_goal: "develop_sell" as any, vision_summary: "", project_type: "",
    exact_location_lat: "", exact_location_lng: "", owner_name: "",
    plot_number: "", plan_number: "", deed_number: "",
  });

  const fetchLands = async () => {
    const { data } = await supabase.from("lands").select("*").order("created_at", { ascending: false });
    setLands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLands(); }, []);

  const handleAdd = async () => {
    if (!user || !form.city || !form.land_area_sqm) return;
    const { error } = await supabase.from("lands").insert({
      owner_id: user.id,
      city: form.city,
      district: form.district || null,
      land_area_sqm: parseFloat(form.land_area_sqm),
      usage_type: form.usage_type,
      partnership_goal: form.partnership_goal,
      vision_summary: form.vision_summary || null,
      project_type: form.project_type || null,
      exact_location_lat: form.exact_location_lat ? parseFloat(form.exact_location_lat) : null,
      exact_location_lng: form.exact_location_lng ? parseFloat(form.exact_location_lng) : null,
      owner_name: form.owner_name || null,
      plot_number: form.plot_number || null,
      plan_number: form.plan_number || null,
      deed_number: form.deed_number || null,
      is_featured: true,
    });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تمت الإضافة" : "Land Added" });
      setShowAdd(false);
      setForm({ city: "", district: "", land_area_sqm: "", usage_type: "residential", partnership_goal: "develop_sell", vision_summary: "", project_type: "", exact_location_lat: "", exact_location_lng: "", owner_name: "", plot_number: "", plan_number: "", deed_number: "" });
      fetchLands();
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("lands").update({ is_featured: !current }).eq("id", id);
    fetchLands();
  };

  const deleteLand = async (id: string) => {
    await supabase.from("lands").delete().eq("id", id);
    fetchLands();
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
  };

  const filtered = lands.filter(l =>
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.district?.toLowerCase().includes(search.toLowerCase()) ||
    l.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const usageLabels: Record<string, { ar: string; en: string }> = {
    residential: { ar: "سكني", en: "Residential" },
    commercial: { ar: "تجاري", en: "Commercial" },
    residential_commercial: { ar: "سكني تجاري", en: "Mixed" },
    high_density: { ar: "كثافة عالية", en: "High Density" },
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "إدارة الأراضي" : "Manage Lands"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">{isAr ? "إضافة وتعديل الأراضي المدرجة — الأراضي المميزة تظهر في الواجهة الرئيسية" : "Add and manage listed lands — featured lands appear on homepage"}</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{isAr ? "إضافة أرض" : "Add Land"}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isAr ? "إضافة أرض جديدة" : "Add New Land"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
                  <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {saudiCities.map(c => <SelectItem key={c.name.en} value={c.name.en}>{isAr ? c.name.ar : c.name.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "الحي" : "District"}</Label>
                  <Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "المساحة (م²)" : "Area (sqm)"}</Label>
                  <Input type="number" value={form.land_area_sqm} onChange={e => setForm(f => ({ ...f, land_area_sqm: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "نوع الاستخدام" : "Usage Type"}</Label>
                  <Select value={form.usage_type} onValueChange={v => setForm(f => ({ ...f, usage_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">{isAr ? "سكني" : "Residential"}</SelectItem>
                      <SelectItem value="commercial">{isAr ? "تجاري" : "Commercial"}</SelectItem>
                      <SelectItem value="residential_commercial">{isAr ? "سكني تجاري" : "Mixed"}</SelectItem>
                      <SelectItem value="high_density">{isAr ? "كثافة عالية" : "High Density"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "اسم المالك" : "Owner Name"}</Label>
                  <Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "نوع المشروع" : "Project Type"}</Label>
                  <Input value={form.project_type} onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))} />
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? "خط العرض" : "Latitude"}</Label>
                  <Input type="number" step="any" value={form.exact_location_lat} onChange={e => setForm(f => ({ ...f, exact_location_lat: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "خط الطول" : "Longitude"}</Label>
                  <Input type="number" step="any" value={form.exact_location_lng} onChange={e => setForm(f => ({ ...f, exact_location_lng: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">{isAr ? "ملخص الرؤية" : "Vision Summary"}</Label>
                <Input value={form.vision_summary} onChange={e => setForm(f => ({ ...f, vision_summary: e.target.value }))} />
              </div>
              <Button onClick={handleAdd} className="w-full doma-gradient">{isAr ? "إضافة" : "Add"}</Button>
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
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(land => (
            <div key={land.id} className="doma-card flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {land.city}{land.district ? ` — ${land.district}` : ""}
                  </p>
                  <p className="text-xs font-light text-muted-foreground">
                    {land.land_area_sqm?.toLocaleString()} م² • {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                    {land.owner_name ? ` • ${land.owner_name}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleFeatured(land.id, land.is_featured)} title={isAr ? "تمييز في الرئيسية" : "Toggle Featured"}>
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
