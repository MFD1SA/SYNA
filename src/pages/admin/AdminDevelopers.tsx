import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle2, XCircle, Clock, Trash2, HardHat } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Developer = Database["public"]["Tables"]["developers"]["Row"];

const AdminDevelopers: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  const [devs, setDevs] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDevs = async () => {
    const { data } = await supabase.from("developers").select("*").order("created_at", { ascending: false });
    setDevs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDevs(); }, []);

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("developers").update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: isAr ? (status === "verified" ? "تم التوثيق" : "تم الرفض") : (status === "verified" ? "Verified" : "Rejected") });
      fetchDevs();
    }
  };

  const deleteDev = async (id: string) => {
    await supabase.from("developers").delete().eq("id", id);
    fetchDevs();
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
  };

  const filtered = devs.filter(d =>
    d.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.cr_number?.includes(search) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = {
    pending_review: { label: isAr ? "قيد المراجعة" : "Pending", icon: Clock, variant: "outline" as const, color: "text-amber-600" },
    verified: { label: isAr ? "موثق" : "Verified", icon: CheckCircle2, variant: "default" as const, color: "text-green-600" },
    rejected: { label: isAr ? "مرفوض" : "Rejected", icon: XCircle, variant: "destructive" as const, color: "text-red-600" },
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "إدارة المطورين" : "Manage Developers"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">{isAr ? "تفعيل وإدارة حسابات المطورين" : "Activate and manage developer accounts"}</p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="ps-9" placeholder={isAr ? "بحث بالاسم أو السجل..." : "Search by name or CR..."} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: isAr ? "إجمالي" : "Total", value: devs.length },
          { label: isAr ? "موثق" : "Verified", value: devs.filter(d => d.verification_status === "verified").length },
          { label: isAr ? "قيد المراجعة" : "Pending", value: devs.filter(d => d.verification_status === "pending_review").length },
        ].map(s => (
          <div key={s.label} className="doma-card p-3 text-center">
            <p className="text-2xl font-medium text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(dev => {
            const sc = statusConfig[dev.verification_status];
            return (
              <div key={dev.id} className="doma-card flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <HardHat className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{dev.company_name}</p>
                      {dev.marketing_brand_name && <span className="text-xs text-muted-foreground">({dev.marketing_brand_name})</span>}
                    </div>
                    <p className="text-xs font-light text-muted-foreground">
                      {isAr ? "سجل تجاري:" : "CR:"} {dev.cr_number} • {dev.email || "—"} • {dev.phone || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sc.variant} className="gap-1">
                    <sc.icon className="h-3 w-3" />
                    {sc.label}
                  </Badge>
                  {dev.verification_status === "pending_review" && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus(dev.id, "verified")}>
                        <CheckCircle2 className="h-3.5 w-3.5 me-1" />{isAr ? "توثيق" : "Verify"}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(dev.id, "rejected")}>
                        <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? "رفض" : "Reject"}
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteDev(dev.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا يوجد مطورون" : "No developers found"}</p>}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDevelopers;
