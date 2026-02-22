import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

const emptyForm = {
  name: "",
  city: "",
  district: "",
  street: "",
  status: "under_construction" as "under_construction" | "ready",
  latitude: "",
  longitude: "",
  showroom_count: "",
  shop_count: "",
  office_count: "",
  apartment_count: "",
};

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isAr = lang === "ar";

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name || !form.city) {
      toast.error(isAr ? "الاسم والمدينة مطلوبان" : "Name and city are required");
      return;
    }

    const payload: TablesInsert<"projects"> = {
      name: form.name,
      city: form.city,
      district: form.district || null,
      street: form.street || null,
      status: form.status,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      showroom_count: form.showroom_count ? parseInt(form.showroom_count) : 0,
      shop_count: form.shop_count ? parseInt(form.shop_count) : 0,
      office_count: form.office_count ? parseInt(form.office_count) : 0,
      apartment_count: form.apartment_count ? parseInt(form.apartment_count) : 0,
      user_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(isAr ? "تم تحديث المشروع" : "Project updated");
    } else {
      const { error } = await supabase.from("projects").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(isAr ? "تم إضافة المشروع" : "Project added");
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchProjects();
  };

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      city: p.city,
      district: p.district ?? "",
      street: p.street ?? "",
      status: p.status,
      latitude: p.latitude?.toString() ?? "",
      longitude: p.longitude?.toString() ?? "",
      showroom_count: p.showroom_count?.toString() ?? "0",
      shop_count: p.shop_count?.toString() ?? "0",
      office_count: p.office_count?.toString() ?? "0",
      apartment_count: p.apartment_count?.toString() ?? "0",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(isAr ? "تم حذف المشروع" : "Project deleted");
    fetchProjects();
  };

  const statusLabel = (s: string) =>
    s === "ready" ? (isAr ? "جاهز" : "Ready") : (isAr ? "تحت الإنشاء" : "Under Construction");

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "المشاريع" : "Projects"}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? "إضافة مشروع" : "Add Project"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-medium">
                {editingId ? (isAr ? "تعديل المشروع" : "Edit Project") : (isAr ? "مشروع جديد" : "New Project")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="font-light">{isAr ? "اسم المشروع" : "Project Name"} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "المدينة" : "City"} *</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "الحي" : "District"}</Label>
                  <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="font-light">{isAr ? "الشارع" : "Street"}</Label>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="font-light">{isAr ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_construction">{isAr ? "تحت الإنشاء" : "Under Construction"}</SelectItem>
                    <SelectItem value="ready">{isAr ? "جاهز" : "Ready"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "خط العرض" : "Latitude"}</Label>
                  <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "خط الطول" : "Longitude"}</Label>
                  <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "معارض" : "Showrooms"}</Label>
                  <Input type="number" value={form.showroom_count} onChange={(e) => setForm({ ...form, showroom_count: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "محلات" : "Shops"}</Label>
                  <Input type="number" value={form.shop_count} onChange={(e) => setForm({ ...form, shop_count: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "مكاتب" : "Offices"}</Label>
                  <Input type="number" value={form.office_count} onChange={(e) => setForm({ ...form, office_count: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="font-light">{isAr ? "شقق" : "Apartments"}</Label>
                  <Input type="number" value={form.apartment_count} onChange={(e) => setForm({ ...form, apartment_count: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSave} className="mt-2">
                {editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm font-light text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-light text-muted-foreground">
            {isAr ? "لا توجد مشاريع بعد" : "No projects yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-light">{isAr ? "الاسم" : "Name"}</TableHead>
                <TableHead className="font-light">{isAr ? "المدينة" : "City"}</TableHead>
                <TableHead className="font-light">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="font-light">{isAr ? "الوحدات" : "Units"}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-light">{p.name}</TableCell>
                  <TableCell className="font-light">{p.city}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-light ${
                      p.status === "ready"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {statusLabel(p.status)}
                    </span>
                  </TableCell>
                  <TableCell className="font-light text-muted-foreground">
                    {(p.showroom_count ?? 0) + (p.shop_count ?? 0) + (p.office_count ?? 0) + (p.apartment_count ?? 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectsPage;
