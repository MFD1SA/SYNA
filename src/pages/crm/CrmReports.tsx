import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTenant } from "@/hooks/useTenant";
import CrmLayout from "@/components/crm/CrmLayout";
import { BarChart3, TrendingUp, AlertTriangle, Users } from "lucide-react";

const CrmReports: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId } = useTenant();
  const [data, setData] = useState({ totalUnits: 0, occupied: 0, activeLeases: 0, expiring30: 0, expiring60: 0, expiring90: 0, overdueCount: 0, overdueAmount: 0, employeeLeases: [] as { name: string; count: number }[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const now = new Date();
      const d30 = new Date(now); d30.setDate(d30.getDate() + 30);
      const d60 = new Date(now); d60.setDate(d60.getDate() + 60);
      const d90 = new Date(now); d90.setDate(d90.getDate() + 90);

      let uq = supabase.from("units").select("status");
      let lq = supabase.from("leases").select("status, end_date, responsible_employee");
      if (tenantId) { uq = uq.eq("tenant_id", tenantId); lq = lq.eq("tenant_id", tenantId); }
      else if (user) { uq = uq.eq("user_id", user.id); lq = lq.eq("user_id", user.id); }

      const [unitsRes, leasesRes] = await Promise.all([uq, lq]);
      const units = unitsRes.data || [];
      const leases = leasesRes.data || [];
      const activeLeases = leases.filter((l: any) => l.status === "active");
      const expiring = (days: Date) => activeLeases.filter((l: any) => new Date(l.end_date) <= days && new Date(l.end_date) >= now).length;

      // Employee performance
      const empMap = new Map<string, number>();
      leases.forEach((l: any) => {
        const emp = l.responsible_employee || "unassigned";
        empMap.set(emp, (empMap.get(emp) || 0) + 1);
      });

      let overdueCount = 0, overdueAmount = 0;
      if (tenantId) {
        const { data: recs } = await supabase.from("receivables").select("amount").eq("tenant_id", tenantId).eq("status", "overdue");
        overdueCount = recs?.length || 0;
        overdueAmount = recs?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
      }

      setData({
        totalUnits: units.length,
        occupied: units.filter((u: any) => u.status === "occupied").length,
        activeLeases: activeLeases.length,
        expiring30: expiring(d30), expiring60: expiring(d60), expiring90: expiring(d90),
        overdueCount, overdueAmount,
        employeeLeases: Array.from(empMap.entries()).map(([name, count]) => ({ name: name === "unassigned" ? (lang === "ar" ? "غير مسند" : "Unassigned") : name.slice(0, 8), count })).sort((a, b) => b.count - a.count),
      });
      setLoading(false);
    };
    fetch();
  }, [user, tenantId]);

  const occupancy = data.totalUnits > 0 ? Math.round((data.occupied / data.totalUnits) * 100) : 0;

  const reports = [
    {
      title: t.crm.report.occupancy,
      icon: BarChart3,
      items: [
        { label: t.crm.kpi.totalUnits, value: data.totalUnits.toLocaleString("en-US") },
        { label: t.crm.status.occupied, value: data.occupied.toLocaleString("en-US") },
        { label: t.crm.kpi.vacantUnits, value: (data.totalUnits - data.occupied).toLocaleString("en-US") },
        { label: t.crm.kpi.occupancyRate, value: `${occupancy}%` },
      ],
    },
    {
      title: t.crm.report.expiringReport,
      icon: AlertTriangle,
      items: [
        { label: "30 " + (lang === "ar" ? "يوم" : "days"), value: data.expiring30.toLocaleString("en-US") },
        { label: "60 " + (lang === "ar" ? "يوم" : "days"), value: data.expiring60.toLocaleString("en-US") },
        { label: "90 " + (lang === "ar" ? "يوم" : "days"), value: data.expiring90.toLocaleString("en-US") },
      ],
    },
    {
      title: t.crm.report.arrearsReport,
      icon: TrendingUp,
      items: [
        { label: lang === "ar" ? "عدد المتأخرات" : "Overdue Count", value: data.overdueCount.toLocaleString("en-US") },
        { label: lang === "ar" ? "إجمالي المتأخرات" : "Total Arrears", value: `SAR ${data.overdueAmount.toLocaleString("en-US")}` },
      ],
    },
    {
      title: t.crm.report.employeePerformance,
      icon: Users,
      items: data.employeeLeases.slice(0, 5).map((e) => ({
        label: e.name,
        value: `${e.count.toLocaleString("en-US")} ${lang === "ar" ? "عقد" : "leases"}`,
      })),
    },
  ];

  return (
    <CrmLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.reports}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {lang === "ar" ? "تقارير وتحليلات الأداء" : "Performance reports and analytics"}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {reports.map((report) => (
            <div key={report.title} className="doma-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                <report.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                {report.title}
              </h3>
              <div className="space-y-3">
                {report.items.length === 0 ? (
                  <p className="text-sm font-light text-muted-foreground">{t.crm.actions.noData}</p>
                ) : (
                  report.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                      <span className="text-sm font-light text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground" dir="ltr">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmReports;
