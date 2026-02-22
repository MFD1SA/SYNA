import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTenant } from "@/hooks/useTenant";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, DoorOpen, Pencil, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  vacant: "bg-emerald-500/10 text-emerald-600",
  occupied: "bg-primary/10 text-primary",
  reserved: "bg-accent/10 text-accent",
  maintenance: "bg-destructive/10 text-destructive",
};

const CrmUnits: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ unit_number: "", unit_type: "apartment" as string, area_sqm: "", listing_price: "", status: "vacant" as string, project_id: "" });

  const fetchData = async () => {
    let uq = supabase.from("units").select("*, projects(name)").order("created_at", { ascending: false });
    let pq = supabase.from("projects").select("id, name");
    if (tenantId) { uq = uq.eq("tenant_id", tenantId); pq = pq.eq("tenant_id", tenantId); }
    else if (user) { uq = uq.eq("user_id", user.id); pq = pq.eq("user_id", user.id); }
    const [unitsRes, propsRes] = await Promise.all([uq, pq]);
    setUnits(unitsRes.data || []);
    setProperties(propsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user, tenantId]);

  const resetForm = () => {
    setForm({ unit_number: "", unit_type: "apartment", area_sqm: "", listing_price: "", status: "vacant", project_id: "" });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.project_id || !form.unit_type) return;
    const payload: any = {
      ...form,
      area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
      listing_price: form.listing_price ? Number(form.listing_price) : null,
      user_id: user!.id,
    };
    if (tenantId) payload.tenant_id = tenantId;

    let error;
    if (editId) {
      ({ error } = await supabase.from("units").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("units").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setDialogOpen(false); resetForm(); fetchData();
    }
  };

  const handleEdit = (u: any) => {
    setForm({
      unit_number: u.unit_number || "", unit_type: u.unit_type, area_sqm: u.area_sqm?.toString() || "",
      listing_price: u.listing_price?.toString() || "", status: u.status, project_id: u.project_id,
    });
    setEditId(u.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("units").delete().eq("id", id);
    fetchData();
  };

  const unitTypes = [
    { value: "showroom", label: t.crm.unit.showroom },
    { value: "shop", label: t.crm.unit.shop },
    { value: "office", label: t.crm.unit.office },
    { value: "apartment", label: t.crm.unit.apartment },
  ];

  const unitStatuses = [
    { value: "vacant", label: t.crm.status.vacant },
    { value: "occupied", label: t.crm.status.occupied },
    { value: "reserved", label: t.crm.status.reserved },
    { value: "maintenance", label: t.crm.status.underMaintenance },
  ];

  return (
    <CrmLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.units}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {lang === "ar" ? "إدارة الوحدات العقارية" : "Manage property units"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{t.crm.unit.addUnit}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? t.crm.unit.editUnit : t.crm.unit.addUnit}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t.crm.unit.property}</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.unit.number}</Label>
                  <Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.unit.type}</Label>
                  <Select value={form.unit_type} onValueChange={(v) => setForm({ ...form, unit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitTypes.map((ut) => <SelectItem key={ut.value} value={ut.value}>{ut.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.unit.area}</Label>
                  <Input type="number" dir="ltr" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.unit.price}</Label>
                  <Input type="number" dir="ltr" value={form.listing_price} onChange={(e) => setForm({ ...form, listing_price: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.crm.unit.status}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unitStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>{t.crm.actions.cancel}</Button>
                <Button onClick={handleSave} className="doma-gradient">{t.crm.actions.save}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : units.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <DoorOpen className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {units.map((u) => (
            <div key={u.id} className="doma-card flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <DoorOpen className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {u.unit_number || unitTypes.find((ut) => ut.value === u.unit_type)?.label}
                  </p>
                  <p className="text-xs font-light text-muted-foreground">
                    {(u as any).projects?.name} • {u.area_sqm ? `${Number(u.area_sqm).toLocaleString("en-US")} m²` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${statusColors[u.status] || "bg-muted text-muted-foreground"}`}>
                  {unitStatuses.find((s) => s.value === u.status)?.label}
                </span>
                {u.listing_price && (
                  <span className="text-sm font-light text-foreground" dir="ltr">
                    SAR {Number(u.listing_price).toLocaleString("en-US")}
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleEdit(u)} className="h-8 w-8 text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmUnits;
