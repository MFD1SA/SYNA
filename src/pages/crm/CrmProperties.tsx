import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTenant } from "@/hooks/useTenant";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";

const CrmProperties: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  usePageTitle(lang === "ar" ? "المشاريع" : "Properties");
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", city: "", district: "", street: "", property_type: "commercial" as string, status: "under_construction" as string });

  const fetchData = async () => {
    let q = supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (tenantId) q = q.eq("tenant_id", tenantId);
    else if (user) q = q.eq("user_id", user.id);
    const { data } = await q;
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user, tenantId]);

  const resetForm = () => {
    setForm({ name: "", city: "", district: "", street: "", property_type: "commercial", status: "under_construction" });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.city) return;
    const payload: any = { ...form, user_id: user!.id };
    if (tenantId) payload.tenant_id = tenantId;

    let error;
    if (editId) {
      ({ error } = await supabase.from("projects").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("projects").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: editId ? t.crm.actions.edit : t.crm.actions.add });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const handleEdit = (p: any) => {
    setForm({ name: p.name, city: p.city, district: p.district || "", street: p.street || "", property_type: p.property_type, status: p.status });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) fetchData();
  };

  const propertyTypes = [
    { value: "residential", label: t.crm.property.residential },
    { value: "commercial", label: t.crm.property.commercial },
    { value: "under_construction", label: t.crm.property.underConstruction },
  ];

  return (
    <CrmLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.properties}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {lang === "ar" ? "إدارة العقارات والمشاريع" : "Manage properties and projects"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{t.crm.property.addProperty}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? t.crm.property.editProperty : t.crm.property.addProperty}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t.crm.property.name}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.property.city}</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.property.district}</Label>
                  <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.crm.property.street}</Label>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.crm.property.type}</Label>
                <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                    ))}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className="doma-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{p.name}</h3>
                  <p className="text-sm font-light text-muted-foreground">{p.city}{p.district ? ` - ${p.district}` : ""}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                  {propertyTypes.find((pt) => pt.value === p.property_type)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="gap-1 text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />{t.crm.actions.edit}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="gap-1 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />{t.crm.actions.delete}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmProperties;
