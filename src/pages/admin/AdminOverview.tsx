import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import CrmLayout from "@/components/crm/CrmLayout";
import { Users, Building2, FileText, AlertTriangle, ShieldCheck } from "lucide-react";

const AdminOverview: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [data, setData] = useState({
    totalProfiles: 0,
    byType: {} as Record<string, number>,
    totalTenants: 0,
    totalLeases: 0,
    leasesNoAttachment: 0,
    unitsNoLease: 0,
    profiles: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, tenantsRes, leasesRes, unitsRes, attachmentsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.from("leases").select("id"),
        supabase.from("units").select("id"),
        supabase.from("attachments").select("entity_id").eq("entity_type", "lease"),
      ]);

      const profiles = profilesRes.data || [];
      const byType: Record<string, number> = {};
      profiles.forEach((p: any) => {
        byType[p.subscription_type] = (byType[p.subscription_type] || 0) + 1;
      });

      const leaseIds = (leasesRes.data || []).map((l: any) => l.id);
      const attachedLeaseIds = new Set((attachmentsRes.data || []).map((a: any) => a.entity_id));
      const leasesNoAttachment = leaseIds.filter((id: string) => !attachedLeaseIds.has(id)).length;

      setData({
        totalProfiles: profiles.length,
        byType,
        totalTenants: tenantsRes.count ?? 0,
        totalLeases: leaseIds.length,
        leasesNoAttachment,
        unitsNoLease: 0,
        profiles: profiles.slice(0, 20),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const subTypeLabels: Record<string, { ar: string; en: string }> = {
    individual: { ar: "أفراد", en: "Individual" },
    brokerage: { ar: "وساطة", en: "Brokerage" },
    brand: { ar: "براند", en: "Brand" },
    property_management: { ar: "إدارة أملاك", en: "Property Mgmt" },
    bank: { ar: "بنوك", en: "Banks" },
  };

  const kpis = [
    { label: t.admin.totalSubscribers, value: data.totalProfiles, icon: Users },
    { label: lang === "ar" ? "المنشآت" : "Organizations", value: data.totalTenants, icon: Building2 },
    { label: lang === "ar" ? "إجمالي العقود" : "Total Leases", value: data.totalLeases, icon: FileText },
    { label: t.admin.leasesWithoutAttachments, value: data.leasesNoAttachment, icon: AlertTriangle },
  ];

  return (
    <CrmLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            {lang === "ar" ? "لوحة تحكم الأدمن" : "Admin Dashboard"}
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {lang === "ar" ? "مراقبة المشتركين وجودة البيانات" : "Monitor subscribers and data quality"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-light text-muted-foreground">Admin</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="doma-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-light text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-medium text-foreground" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {kpi.value.toLocaleString("en-US")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Subscription Breakdown */}
            <div className="doma-card p-6">
              <h3 className="mb-4 text-sm font-medium text-foreground">
                {lang === "ar" ? "توزيع المشتركين" : "Subscriber Breakdown"}
              </h3>
              <div className="space-y-3">
                {Object.entries(data.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                    <span className="text-sm font-light text-muted-foreground">
                      {lang === "ar" ? subTypeLabels[type]?.ar : subTypeLabels[type]?.en}
                    </span>
                    <span className="text-sm font-medium text-foreground" dir="ltr">{count.toLocaleString("en-US")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Subscribers */}
            <div className="doma-card p-6">
              <h3 className="mb-4 text-sm font-medium text-foreground">
                {lang === "ar" ? "آخر المشتركين" : "Recent Subscribers"}
              </h3>
              <div className="space-y-2">
                {data.profiles.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div>
                      <p className="text-sm font-light text-foreground">{p.full_name || p.email}</p>
                      <p className="text-xs font-light text-muted-foreground">{p.email}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {lang === "ar" ? subTypeLabels[p.subscription_type]?.ar : subTypeLabels[p.subscription_type]?.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </CrmLayout>
  );
};

export default AdminOverview;
