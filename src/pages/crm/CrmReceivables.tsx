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
import { Plus, Receipt, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-accent/10 text-accent",
  paid: "bg-emerald-500/10 text-emerald-600",
  overdue: "bg-destructive/10 text-destructive",
  partial: "bg-primary/10 text-primary",
};

const CrmReceivables: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [form, setForm] = useState({ lease_id: "", amount: "", due_date: "" });

  const fetchData = async () => {
    if (!tenantId) { setLoading(false); return; }
    const [rRes, lRes] = await Promise.all([
      supabase.from("receivables").select("*, leases(ejar_number, units(unit_number, projects(name)))").eq("tenant_id", tenantId).order("due_date", { ascending: true }),
      supabase.from("leases").select("id, ejar_number, units(unit_number, projects(name))").eq("tenant_id", tenantId),
    ]);
    setReceivables(rRes.data || []);
    setLeases(lRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user, tenantId]);

  const handleAdd = async () => {
    if (!form.lease_id || !form.amount || !form.due_date || !tenantId) return;
    const { error } = await supabase.from("receivables").insert({
      tenant_id: tenantId, lease_id: form.lease_id, amount: Number(form.amount),
      due_date: form.due_date, user_id: user!.id,
    });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { setDialogOpen(false); setForm({ lease_id: "", amount: "", due_date: "" }); fetchData(); }
  };

  const handlePay = async (id: string) => {
    if (!payAmount) return;
    const rec = receivables.find((r) => r.id === id);
    if (!rec) return;
    const newPaid = Number(rec.paid_amount || 0) + Number(payAmount);
    const newStatus = newPaid >= Number(rec.amount) ? "paid" : "partial";
    await supabase.from("receivables").update({
      paid_amount: newPaid, paid_date: new Date().toISOString().split("T")[0], status: newStatus,
    }).eq("id", id);
    setPayDialog(null); setPayAmount(""); fetchData();
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t.crm.status.pending, paid: t.crm.status.paid, overdue: t.crm.status.overdue, partial: t.crm.status.partial,
    };
    return map[s] || s;
  };

  return (
    <CrmLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.receivables}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {lang === "ar" ? "جدول المستحقات والتحصيل" : "Payment schedule and collection"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{t.crm.receivable.addPayment}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.crm.receivable.addPayment}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t.crm.receivable.lease}</Label>
                <Select value={form.lease_id} onValueChange={(v) => setForm({ ...form, lease_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {leases.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.ejar_number || l.id.slice(0, 8)} — {(l as any).units?.projects?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.receivable.amount}</Label>
                  <Input type="number" dir="ltr" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.receivable.dueDate}</Label>
                  <Input type="date" dir="ltr" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.crm.actions.cancel}</Button>
                <Button onClick={handleAdd} className="doma-gradient">{t.crm.actions.save}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => { setPayDialog(null); setPayAmount(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.crm.receivable.recordPayment}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t.crm.receivable.paidAmount}</Label>
              <Input type="number" dir="ltr" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayDialog(null)}>{t.crm.actions.cancel}</Button>
              <Button onClick={() => payDialog && handlePay(payDialog)} className="doma-gradient">{t.crm.actions.confirm}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : receivables.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Receipt className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receivables.map((r) => (
            <div key={r.id} className="doma-card flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Receipt className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-foreground" dir="ltr">
                    SAR {Number(r.amount).toLocaleString("en-US")}
                  </p>
                  <p className="text-xs font-light text-muted-foreground" dir="ltr">
                    {lang === "ar" ? "الاستحقاق:" : "Due:"} {new Date(r.due_date).toLocaleDateString("en-US")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {Number(r.paid_amount) > 0 && (
                  <span className="text-xs font-light text-muted-foreground" dir="ltr">
                    {t.crm.kpi.collected}: SAR {Number(r.paid_amount).toLocaleString("en-US")}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${statusColors[r.status]}`}>
                  {getStatusLabel(r.status)}
                </span>
                {r.status !== "paid" && (
                  <Button variant="ghost" size="sm" onClick={() => setPayDialog(r.id)} className="gap-1 text-primary">
                    <CheckCircle className="h-3.5 w-3.5" />{t.crm.receivable.recordPayment}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmReceivables;
