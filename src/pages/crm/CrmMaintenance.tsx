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
import { Plus, Wrench, Pencil } from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/10 text-accent",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-accent/10 text-accent",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

const CrmMaintenance: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as string, status: "open" as string, unit_id: "" });

  const fetchData = async () => {
    if (!tenantId) { setLoading(false); return; }
    const [tRes, uRes] = await Promise.all([
      supabase.from("maintenance_tickets").select("*, units(unit_number, unit_type, projects(name))").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("units").select("id, unit_number, unit_type, projects(name)").eq("tenant_id", tenantId),
    ]);
    setTickets(tRes.data || []);
    setUnits(uRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user, tenantId]);

  const resetForm = () => { setForm({ title: "", description: "", priority: "medium", status: "open", unit_id: "" }); setEditId(null); };

  const handleSave = async () => {
    if (!form.title || !form.unit_id || !tenantId) return;
    const payload: any = { ...form, tenant_id: tenantId, user_id: user!.id };
    let error;
    if (editId) ({ error } = await supabase.from("maintenance_tickets").update(payload).eq("id", editId));
    else ({ error } = await supabase.from("maintenance_tickets").insert(payload));
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { setDialogOpen(false); resetForm(); fetchData(); }
  };

  const handleEdit = (tk: any) => {
    setForm({ title: tk.title, description: tk.description || "", priority: tk.priority, status: tk.status, unit_id: tk.unit_id });
    setEditId(tk.id);
    setDialogOpen(true);
  };

  const priorities = [
    { value: "low", label: t.crm.ticket.low },
    { value: "medium", label: t.crm.ticket.medium },
    { value: "high", label: t.crm.ticket.high },
    { value: "urgent", label: t.crm.ticket.urgent },
  ];

  const statuses = [
    { value: "open", label: t.crm.status.open },
    { value: "in_progress", label: t.crm.status.inProgress },
    { value: "resolved", label: t.crm.status.resolved },
    { value: "closed", label: t.crm.status.closed },
  ];

  return (
    <CrmLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.maintenance}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {lang === "ar" ? "تذاكر الصيانة والطلبات" : "Maintenance tickets and requests"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{t.crm.ticket.addTicket}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? t.crm.actions.edit : t.crm.ticket.addTicket}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t.crm.ticket.title}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.crm.ticket.unit}</Label>
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
                  <Label>{t.crm.ticket.priority}</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {editId && (
                  <div className="space-y-2">
                    <Label>{t.crm.unit.status}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.crm.ticket.description}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
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
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Wrench className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((tk) => (
            <div key={tk.id} className="doma-card flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Wrench className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-foreground">{tk.title}</p>
                  <p className="text-xs font-light text-muted-foreground">
                    {(tk as any).units?.projects?.name} — {(tk as any).units?.unit_number || (tk as any).units?.unit_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${priorityColors[tk.priority]}`}>
                  {priorities.find((p) => p.value === tk.priority)?.label}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${statusColors[tk.status]}`}>
                  {statuses.find((s) => s.value === tk.status)?.label}
                </span>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(tk)} className="h-8 w-8 text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmMaintenance;
