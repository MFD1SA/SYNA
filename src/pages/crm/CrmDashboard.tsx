import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTenant } from "@/hooks/useTenant";
import CrmLayout from "@/components/crm/CrmLayout";
import {
  Building2, DoorOpen, FileText, TrendingUp, AlertTriangle,
  Wrench, Receipt, BarChart3,
} from "lucide-react";

interface KPI {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  activeLeases: number;
  expiringLeases: number;
  openTickets: number;
  arrears: number;
}

const CrmDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId } = useTenant();
  const [kpi, setKpi] = useState<KPI>({
    totalProperties: 0, totalUnits: 0, occupiedUnits: 0, vacantUnits: 0,
    activeLeases: 0, expiringLeases: 0, openTickets: 0, arrears: 0,
  });
  const [expiringList, setExpiringList] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      let pq = supabase.from("projects").select("id", { count: "exact", head: true });
      let uq = supabase.from("units").select("id, status");
      let lq = supabase.from("leases").select("id, status, end_date, unit_id");
      if (tenantId) {
        pq = pq.eq("tenant_id", tenantId);
        uq = uq.eq("tenant_id", tenantId);
        lq = lq.eq("tenant_id", tenantId);
      } else if (user) {
        pq = pq.eq("user_id", user.id);
        uq = uq.eq("user_id", user.id);
        lq = lq.eq("user_id", user.id);
      }

      const [props, units, leases, tickets, receivables] = await Promise.all([
        pq,
        uq,
        lq,
        tenantId
          ? supabase.from("maintenance_tickets").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "open")
          : Promise.resolve({ count: 0 } as any),
        tenantId
          ? supabase.from("receivables").select("*").eq("tenant_id", tenantId).eq("status", "overdue")
          : Promise.resolve({ data: [] } as any),
      ]);

      const unitsData = units.data || [];
      const leasesData = leases.data || [];
      const occupied = unitsData.filter((u: any) => u.status === "occupied").length;
      const active = leasesData.filter((l: any) => l.status === "active").length;
      const expiring = leasesData.filter((l: any) => {
        const end = new Date(l.end_date);
        return l.status === "active" && end <= thirtyDays && end >= new Date();
      });

      setKpi({
        totalProperties: props.count ?? 0,
        totalUnits: unitsData.length,
        occupiedUnits: occupied,
        vacantUnits: unitsData.filter((u: any) => u.status === "vacant").length,
        activeLeases: active,
        expiringLeases: expiring.length,
        openTickets: (tickets as any).count ?? 0,
        arrears: ((receivables as any).data || []).length,
      });

      setExpiringList(expiring.slice(0, 10));
      setOverdueList(((receivables as any).data || []).slice(0, 10));
      setLoading(false);
    };
    fetch();
  }, [user, tenantId]);

  const occupancyRate = kpi.totalUnits > 0
    ? Math.round((kpi.occupiedUnits / kpi.totalUnits) * 100)
    : 0;

  const cards = [
    { label: t.crm.kpi.totalProperties, value: kpi.totalProperties, icon: Building2 },
    { label: t.crm.kpi.totalUnits, value: kpi.totalUnits, icon: DoorOpen },
    { label: t.crm.kpi.occupancyRate, value: `${occupancyRate}%`, icon: BarChart3 },
    { label: t.crm.kpi.vacantUnits, value: kpi.vacantUnits, icon: DoorOpen },
    { label: t.crm.kpi.activeLeases, value: kpi.activeLeases, icon: FileText },
    { label: t.crm.kpi.expiringLeases, value: kpi.expiringLeases, icon: AlertTriangle },
    { label: t.crm.kpi.openTickets, value: kpi.openTickets, icon: Wrench },
    { label: t.crm.kpi.arrears, value: kpi.arrears, icon: Receipt },
  ];

  return (
    <CrmLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.dashboard}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {lang === "ar" ? "ملخص شامل لأداء العقارات والعقود" : "Comprehensive overview of property and lease performance"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="doma-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">{card.label}</span>
              <card.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-medium text-foreground" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? <span className="inline-block h-7 w-14 animate-pulse rounded-lg bg-muted" /> : card.value.toLocaleString("en-US")}
            </p>
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Expiring Leases */}
        <div className="doma-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 text-accent" strokeWidth={1.5} />
            {lang === "ar" ? "أقرب العقود للانتهاء" : "Leases Expiring Soon"}
          </h3>
          {expiringList.length === 0 ? (
            <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
          ) : (
            <div className="space-y-2">
              {expiringList.map((lease: any) => (
                <div key={lease.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <span className="text-sm font-light text-foreground" dir="ltr">
                    {lease.ejar_number || lease.id.slice(0, 8)}
                  </span>
                  <span className="text-xs font-light text-accent" dir="ltr">
                    {new Date(lease.end_date).toLocaleDateString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Payments */}
        <div className="doma-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Receipt className="h-4 w-4 text-destructive" strokeWidth={1.5} />
            {lang === "ar" ? "مستحقات متأخرة" : "Overdue Payments"}
          </h3>
          {overdueList.length === 0 ? (
            <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
          ) : (
            <div className="space-y-2">
              {overdueList.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <span className="text-sm font-light text-foreground" dir="ltr">
                    SAR {Number(r.amount).toLocaleString("en-US")}
                  </span>
                  <span className="text-xs font-light text-destructive" dir="ltr">
                    {new Date(r.due_date).toLocaleDateString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CrmLayout>
  );
};

export default CrmDashboard;
