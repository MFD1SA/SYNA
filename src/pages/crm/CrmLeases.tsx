import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTenant } from "@/hooks/useTenant";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Pencil, Trash2, Upload, Calendar } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-destructive/10 text-destructive",
  expiring_soon: "bg-accent/10 text-accent",
};

const CrmLeases: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [leases, setLeases] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    unit_id: "", start_date: "", end_date: "", monthly_rent: "",
    ejar_number: "", notes: "", responsible_employee: "", status: "active" as string,
  });

  const fetchData = async () => {
    let lq = supabase.from("leases").select("*, units(unit_number, unit_type, projects(name))").order("created_at", { ascending: false });
    let uq = supabase.from("units").select("id, unit_number, unit_type, project_id, projects(name)");
    if (tenantId) {
      lq = lq.eq("tenant_id", tenantId);
      uq = uq.eq("tenant_id", tenantId);
    } else if (user) {
      lq = lq.eq("user_id", user.id);
      uq = uq.eq("user_id", user.id);
    }
    const [leasesRes, unitsRes] = await Promise.all([lq, uq]);

    if (tenantId) {
      const { data: mems } = await supabase.from("tenant_members")
        .select("user_id, role, profiles(full_name)")
        .eq("tenant_id", tenantId);
      setMembers(mems || []);
    }

    setLeases(leasesRes.data || []);
    setUnits(unitsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user, tenantId]);

  const resetForm = () => {
    setForm({ unit_id: "", start_date: "", end_date: "", monthly_rent: "", ejar_number: "", notes: "", responsible_employee: "", status: "active" });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.unit_id || !form.start_date || !form.end_date) return;
    const payload: any = {
      ...form,
      monthly_rent: form.monthly_rent ? Number(form.monthly_rent) : null,
      responsible_employee: form.responsible_employee || null,
      user_id: user!.id,
    };
    if (tenantId) payload.tenant_id = tenantId;

    let error;
    if (editId) {
      ({ error } = await supabase.from("leases").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("leases").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setDialogOpen(false); resetForm(); fetchData();
    }
  };

  const handleEdit = (l: any) => {
    setForm({
      unit_id: l.unit_id, start_date: l.start_date, end_date: l.end_date,
      monthly_rent: l.monthly_rent?.toString() || "", ejar_number: l.ejar_number || "",
      notes: l.notes || "", responsible_employee: l.responsible_employee || "", status: l.status,
    });
    setEditId(l.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("leases").delete().eq("id", id);
    fetchData();
  };

  const handleFileUpload = async (leaseId: string, file: File) => {
    if (!tenantId) return;
    const path = `${tenantId}/${leaseId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
    if (uploadError) {
      toast({ variant: "destructive", title: "Error", description: uploadError.message });
      return;
    }
    const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
    await supabase.from("attachments").insert({
      tenant_id: tenantId, entity_type: "lease", entity_id: leaseId,
      file_name: file.name, file_url: urlData.publicUrl, file_size: file.size, uploaded_by: user!.id,
    });
    toast({ title: lang === "ar" ? "تم رفع الملف" : "File uploaded" });
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: t.crm.status.active, expired: t.crm.status.expired, expiring_soon: t.crm.status.expiringSoon,
    };
    return map[s] || s;
  };

  return (
    <CrmLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.leases}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {lang === "ar" ? "إدارة العقود وملفات التأجير" : "Manage leases and rental documents"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{t.crm.lease.addLease}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? t.crm.lease.editLease : t.crm.lease.addLease}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t.crm.lease.unit}</Label>
                <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {(u as any).projects?.name} — {u.unit_number || u.unit_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.lease.startDate}</Label>
                  <Input type="date" dir="ltr" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.lease.endDate}</Label>
                  <Input type="date" dir="ltr" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.lease.monthlyRent}</Label>
                  <Input type="number" dir="ltr" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.lease.ejarNumber}</Label>
                  <Input dir="ltr" value={form.ejar_number} onChange={(e) => setForm({ ...form, ejar_number: e.target.value })} />
                </div>
              </div>
              {members.length > 0 && (
                <div className="space-y-2">
                  <Label>{t.crm.lease.responsible}</Label>
                  <Select value={form.responsible_employee} onValueChange={(v) => setForm({ ...form, responsible_employee: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {(m as any).profiles?.full_name || m.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t.crm.lease.notes}</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : leases.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leases.map((l) => (
            <div key={l.id} className="doma-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {l.ejar_number || l.id.slice(0, 8)}
                    </p>
                    <p className="text-xs font-light text-muted-foreground">
                      {(l as any).units?.projects?.name} — {(l as any).units?.unit_number || (l as any).units?.unit_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end" dir="ltr">
                    <p className="text-xs font-light text-muted-foreground">
                      {new Date(l.start_date).toLocaleDateString("en-US")} → {new Date(l.end_date).toLocaleDateString("en-US")}
                    </p>
                    {l.monthly_rent && (
                      <p className="text-sm font-medium text-foreground">SAR {Number(l.monthly_rent).toLocaleString("en-US")}/mo</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${statusColors[l.status] || "bg-muted text-muted-foreground"}`}>
                    {getStatusLabel(l.status)}
                  </span>
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && handleFileUpload(l.id, e.target.files[0])} />
                    <Upload className="h-4 w-4 text-muted-foreground hover:text-primary" strokeWidth={1.5} />
                  </label>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(l)} className="h-8 w-8 text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmLeases;
