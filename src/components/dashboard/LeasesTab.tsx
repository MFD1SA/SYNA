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

type Lease = Tables<"leases">;
type Unit = Tables<"units"> & { projects?: { name: string } | null };

const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  active: { ar: "نشط", en: "Active", color: "bg-green-50 text-green-700" },
  expired: { ar: "منتهي", en: "Expired", color: "bg-red-50 text-red-700" },
  expiring_soon: { ar: "ينتهي قريباً", en: "Expiring Soon", color: "bg-amber-50 text-amber-700" },
};

const emptyForm = {
  unit_id: "", start_date: "", end_date: "",
  status: "active" as "active" | "expired" | "expiring_soon",
  ejar_number: "", duration_months: "",
};

const LeasesTab: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const isAr = lang === "ar";

  const fetchData = async () => {
    const [leasesRes, unitsRes] = await Promise.all([
      supabase.from("leases").select("*").order("created_at", { ascending: false }),
      supabase.from("units").select("id, unit_type, project_id, projects(name)"),
    ]);
    setLeases(leasesRes.data ?? []);
    setUnits((unitsRes.data as Unit[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const unitLabel = (id: string) => {
    const u = units.find((x) => x.id === id);
    if (!u) return "—";
    return `${u.projects?.name ?? ""} — ${u.unit_type}`;
  };

  const handleSave = async () => {
    if (!user || !form.unit_id || !form.start_date || !form.end_date) {
      toast.error(isAr ? "الوحدة وتواريخ العقد مطلوبة" : "Unit and dates are required");
      return;
    }
    const payload: TablesInsert<"leases"> = {
      unit_id: form.unit_id, start_date: form.start_date, end_date: form.end_date,
      status: form.status, ejar_number: form.ejar_number || null,
      duration_months: form.duration_months ? parseInt(form.duration_months) : null,
      user_id: user.id,
    };
    if (editingId) {
      const { error } = await supabase.from("leases").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(isAr ? "تم تحديث العقد" : "Lease updated");
    } else {
      const { error } = await supabase.from("leases").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(isAr ? "تم إضافة العقد" : "Lease added");
    }
    setOpen(false); setEditingId(null); setForm(emptyForm); fetchData();
  };

  const handleEdit = (l: Lease) => {
    setEditingId(l.id);
    setForm({
      unit_id: l.unit_id, start_date: l.start_date, end_date: l.end_date,
      status: l.status, ejar_number: l.ejar_number ?? "",
      duration_months: l.duration_months?.toString() ?? "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("leases").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(isAr ? "تم حذف العقد" : "Lease deleted");
    fetchData();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">{isAr ? "العقود" : "Leases"}</h2>
        {canCreate && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{isAr ? "إضافة" : "Add"}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-medium">
                  {editingId ? (isAr ? "تعديل العقد" : "Edit Lease") : (isAr ? "عقد جديد" : "New Lease")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "الوحدة" : "Unit"} *</Label>
                  <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? "اختر وحدة" : "Select unit"} /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.projects?.name ?? ""} — {u.unit_type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "تاريخ البداية" : "Start Date"} *</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "تاريخ النهاية" : "End Date"} *</Label>
                    <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "الحالة" : "Status"}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{isAr ? label.ar : label.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-light">{isAr ? "المدة (شهر)" : "Duration (mo)"}</Label>
                    <Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "رقم إيجار" : "Ejar Number"}</Label>
                  <Input value={form.ejar_number} onChange={(e) => setForm({ ...form, ejar_number: e.target.value })} />
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
      ) : leases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد عقود بعد" : "No leases yet"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-light">{isAr ? "الوحدة" : "Unit"}</TableHead>
                <TableHead className="font-light">{isAr ? "البداية" : "Start"}</TableHead>
                <TableHead className="font-light">{isAr ? "النهاية" : "End"}</TableHead>
                <TableHead className="font-light">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="font-light">{isAr ? "إيجار" : "Ejar"}</TableHead>
                {(canEdit || canDelete) && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((l) => {
                const sl = statusLabels[l.status];
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-light">{unitLabel(l.unit_id)}</TableCell>
                    <TableCell className="font-light">{l.start_date}</TableCell>
                    <TableCell className="font-light">{l.end_date}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-light ${sl?.color ?? ""}`}>
                        {isAr ? sl?.ar : sl?.en}
                      </span>
                    </TableCell>
                    <TableCell className="font-light text-muted-foreground">{l.ejar_number ?? "—"}</TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(l)}>
                              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(l.id)}>
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LeasesTab;
