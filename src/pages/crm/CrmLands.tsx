import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Landmark, Pencil, Trash2, MapPin } from "lucide-react";

const usageTypes = [
  { value: "residential", ar: "سكني", en: "Residential" },
  { value: "commercial", ar: "تجاري", en: "Commercial" },
  { value: "residential_commercial", ar: "سكني تجاري", en: "Mixed Use" },
  { value: "high_density", ar: "كثافة عالية", en: "High Density" },
];

const partnershipGoals = [
  { value: "develop_sell", ar: "تطوير وبيع", en: "Develop & Sell" },
  { value: "develop_rent", ar: "تطوير وتأجير", en: "Develop & Rent" },
  { value: "develop_mixed", ar: "تطوير مختلط", en: "Mixed Development" },
  { value: "develop_complex", ar: "مجمع تطويري", en: "Complex Development" },
];

const CrmLands: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    city: "", district: "", land_area_sqm: "", width_m: "", length_m: "",
    street_width_m: "", usage_type: "residential", partnership_goal: "develop_sell",
    vision_summary: "", plot_number: "", plan_number: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("lands").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setLands(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const resetForm = () => {
    setForm({ city: "", district: "", land_area_sqm: "", width_m: "", length_m: "", street_width_m: "", usage_type: "residential", partnership_goal: "develop_sell", vision_summary: "", plot_number: "", plan_number: "" });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.city || !form.land_area_sqm) {
      toast({ variant: "destructive", title: isAr ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields" });
      return;
    }
    const payload: any = {
      owner_id: user!.id,
      city: form.city,
      district: form.district || null,
      land_area_sqm: parseFloat(form.land_area_sqm),
      width_m: form.width_m ? parseFloat(form.width_m) : null,
      length_m: form.length_m ? parseFloat(form.length_m) : null,
      street_width_m: form.street_width_m ? parseFloat(form.street_width_m) : null,
      usage_type: form.usage_type,
      partnership_goal: form.partnership_goal,
      vision_summary: form.vision_summary || null,
      plot_number: form.plot_number || null,
      plan_number: form.plan_number || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("lands").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("lands").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: editId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const handleEdit = (l: any) => {
    setForm({
      city: l.city, district: l.district || "", land_area_sqm: String(l.land_area_sqm),
      width_m: l.width_m ? String(l.width_m) : "", length_m: l.length_m ? String(l.length_m) : "",
      street_width_m: l.street_width_m ? String(l.street_width_m) : "",
      usage_type: l.usage_type, partnership_goal: l.partnership_goal,
      vision_summary: l.vision_summary || "", plot_number: l.plot_number || "", plan_number: l.plan_number || "",
    });
    setEditId(l.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("lands").delete().eq("id", id);
    fetchData();
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    await supabase.from("lands").update({ is_active: !currentState }).eq("id", id);
    fetchData();
  };

  return (
    <CrmLayout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "أراضيي" : "My Lands"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "إدارة الأراضي المدرجة واستقبال طلبات المطورين" : "Manage listed lands and receive developer requests"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{isAr ? "إضافة أرض" : "Add Land"}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? (isAr ? "تعديل أرض" : "Edit Land") : (isAr ? "إضافة أرض" : "Add Land")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "المدينة *" : "City *"}</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الحي" : "District"}</Label>
                  <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "المساحة (م²) *" : "Area (sqm) *"}</Label>
                  <Input type="number" value={form.land_area_sqm} onChange={(e) => setForm({ ...form, land_area_sqm: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "العرض (م)" : "Width (m)"}</Label>
                  <Input type="number" value={form.width_m} onChange={(e) => setForm({ ...form, width_m: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الطول (م)" : "Length (m)"}</Label>
                  <Input type="number" value={form.length_m} onChange={(e) => setForm({ ...form, length_m: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "عرض الشارع (م)" : "Street Width (m)"}</Label>
                  <Input type="number" value={form.street_width_m} onChange={(e) => setForm({ ...form, street_width_m: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "رقم القطعة" : "Plot #"}</Label>
                  <Input value={form.plot_number} onChange={(e) => setForm({ ...form, plot_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "رقم المخطط" : "Plan #"}</Label>
                  <Input value={form.plan_number} onChange={(e) => setForm({ ...form, plan_number: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "نوع الاستخدام" : "Usage Type"}</Label>
                  <Select value={form.usage_type} onValueChange={(v) => setForm({ ...form, usage_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {usageTypes.map((u) => <SelectItem key={u.value} value={u.value}>{isAr ? u.ar : u.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "هدف الشراكة" : "Partnership Goal"}</Label>
                  <Select value={form.partnership_goal} onValueChange={(v) => setForm({ ...form, partnership_goal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {partnershipGoals.map((g) => <SelectItem key={g.value} value={g.value}>{isAr ? g.ar : g.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "رؤية المشروع" : "Project Vision"}</Label>
                <Textarea value={form.vision_summary} onChange={(e) => setForm({ ...form, vision_summary: e.target.value })} rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleSave} className="doma-gradient">{isAr ? "حفظ" : "Save"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : lands.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Landmark className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد أراضٍ مدرجة بعد" : "No lands listed yet"}</p>
          <p className="mt-1 text-xs font-light text-muted-foreground">{isAr ? "أضف أرضك لبدء استقبال طلبات المطورين" : "Add your land to start receiving developer requests"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lands.map((l) => (
            <div key={l.id} className="doma-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <h3 className="font-medium text-foreground">{l.city}</h3>
                  </div>
                  {l.district && <p className="mt-0.5 ps-6 text-sm font-light text-muted-foreground">{l.district}</p>}
                </div>
                <button
                  onClick={() => handleToggleActive(l.id, l.is_active)}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${l.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}
                >
                  {l.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "متوقف" : "Inactive")}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-light text-muted-foreground">
                <span>{isAr ? "المساحة:" : "Area:"} {Number(l.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                <span>{isAr ? "الاستخدام:" : "Usage:"} {usageTypes.find((u) => u.value === l.usage_type)?.[isAr ? "ar" : "en"]}</span>
                <span>{isAr ? "الهدف:" : "Goal:"} {partnershipGoals.find((g) => g.value === l.partnership_goal)?.[isAr ? "ar" : "en"]}</span>
                {l.street_width_m && <span>{isAr ? "عرض الشارع:" : "Street:"} {l.street_width_m}{isAr ? "م" : "m"}</span>}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(l)} className="gap-1 text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />{isAr ? "تعديل" : "Edit"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)} className="gap-1 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />{isAr ? "حذف" : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmLands;
