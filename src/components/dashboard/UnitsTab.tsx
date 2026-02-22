import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Unit = Tables<"units">;
type ProjectBasic = { id: string; name: string };

const unitTypeLabels: Record<string, { ar: string; en: string }> = {
  showroom: { ar: "معرض", en: "Showroom" },
  shop: { ar: "محل", en: "Shop" },
  office: { ar: "مكتب", en: "Office" },
  apartment: { ar: "شقة", en: "Apartment" },
};

const emptyForm = {
  project_id: "", unit_type: "shop" as "showroom" | "shop" | "office" | "apartment",
  area_sqm: "", listing_price: "", listing_duration_months: "",
  commission_percentage: "", transfer_tax_percentage: "",
};

const UnitsTab: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<ProjectBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const isAr = lang === "ar";

  const fetchData = async () => {
    const [unitsRes, projRes] = await Promise.all([
      supabase.from("units").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name"),
    ]);
    setUnits(unitsRes.data ?? []);
    setProjects(projRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  const handleSave = async () => {
    if (!user || !form.project_id || !form.unit_type) {
      toast.error(isAr ? "المشروع ونوع الوحدة مطلوبان" : "Project and unit type are required");
      return;
    }
    const payload: TablesInsert<"units"> = {
      project_id: form.project_id, unit_type: form.unit_type,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      listing_price: form.listing_price ? parseFloat(form.listing_price) : null,
      listing_duration_months: form.listing_duration_months ? parseInt(form.listing_duration_months) : null,
      commission_percentage: form.commission_percentage ? parseFloat(form.commission_percentage) : null,
      transfer_tax_percentage: form.transfer_tax_percentage ? parseFloat(form.transfer_tax_percentage) : null,
      user_id: user.id,
    };
    if (editingId) {
      const { error } = await supabase.from("units").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(isAr ? "تم تحديث الوحدة" : "Unit updated");
    } else {
      const { error } = await supabase.from("units").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(isAr ? "تم إضافة الوحدة" : "Unit added");
    }
    setOpen(false); setEditingId(null); setForm(emptyForm); fetchData();
  };

  const handleEdit = (u: Unit) => {
    setEditingId(u.id);
    setForm({
      project_id: u.project_id, unit_type: u.unit_type,
      area_sqm: u.area_sqm?.toString() ?? "", listing_price: u.listing_price?.toString() ?? "",
      listing_duration_months: u.listing_duration_months?.toString() ?? "",
      commission_percentage: u.commission_percentage?.toString() ?? "",
      transfer_tax_percentage: u.transfer_tax_percentage?.toString() ?? "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(isAr ? "تم حذف الوحدة" : "Unit deleted");
    fetchData();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">{isAr ? "الوحدات" : "Units"}</h2>
        {canCreate && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{isAr ? "إضافة" : "Add"}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-medium">
                  {editingId ? (isAr ? "تعديل الوحدة" : "Edit Unit") : (isAr ? "وحدة جديدة" : "New Unit")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "المشروع" : "Project"} *</Label>
                  <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "نوع الوحدة" : "Unit Type"} *</Label>
                  <Select value={form.unit_type} onValueChange={(v) => setForm({ ...form, unit_type: v as typeof form.unit_type })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(unitTypeLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{isAr ? label.ar : label.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "المساحة (م²)" : "Area (sqm)"}</Label>
                    <Input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "السعر" : "Price"}</Label>
                    <Input type="number" value={form.listing_price} onChange={(e) => setForm({ ...form, listing_price: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "المدة (شهر)" : "Duration (mo)"}</Label>
                    <Input type="number" value={form.listing_duration_months} onChange={(e) => setForm({ ...form, listing_duration_months: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "العمولة %" : "Commission %"}</Label>
                    <Input type="number" step="0.01" value={form.commission_percentage} onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "الضريبة %" : "Tax %"}</Label>
                    <Input type="number" step="0.01" value={form.transfer_tax_percentage} onChange={(e) => setForm({ ...form, transfer_tax_percentage: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} className="mt-2">
                  {editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-sm font-light text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد وحدات بعد" : "No units yet"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-light">{isAr ? "المشروع" : "Project"}</TableHead>
                <TableHead className="font-light">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="font-light">{isAr ? "المساحة" : "Area"}</TableHead>
                <TableHead className="font-light">{isAr ? "السعر" : "Price"}</TableHead>
                {(canEdit || canDelete) && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-light">{projectName(u.project_id)}</TableCell>
                  <TableCell className="font-light">{isAr ? unitTypeLabels[u.unit_type]?.ar : unitTypeLabels[u.unit_type]?.en}</TableCell>
                  <TableCell className="font-light">{u.area_sqm ? `${u.area_sqm} م²` : "—"}</TableCell>
                  <TableCell className="font-light">{u.listing_price ? u.listing_price.toLocaleString() : "—"}</TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(u)}>
                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UnitsTab;
