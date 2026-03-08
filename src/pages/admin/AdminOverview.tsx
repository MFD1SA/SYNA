import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Users, Landmark, Handshake, HardHat, TrendingUp, FileText, CheckCircle2, ArrowUpRight, Clock } from "lucide-react";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";
import { Link } from "react-router-dom";

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href?: string;
  change?: string;
}

const AdminOverview: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة الإدارة" : "Admin Panel");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalUsers: 0,
    totalDevelopers: 0,
    pendingVerification: 0,
    totalLands: 0,
    totalDeals: 0,
    activeDeals: 0,
    closedDeals: 0,
    pendingRequests: 0,
    recentUsers: [] as any[],
  });

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, profilesCount, devsRes, pendingDevsRes, landsRes, dealsRes, activeDealsRes, closedDealsRes, pendingReqRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, subscription_type, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("developers").select("id", { count: "exact", head: true }),
        supabase.from("developers").select("id", { count: "exact", head: true }).eq("verification_status", "pending_review"),
        supabase.from("lands").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("current_stage", "deal_closed"),
        supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setData({
        totalUsers: profilesCount.count ?? 0,
        totalDevelopers: devsRes.count ?? 0,
        pendingVerification: pendingDevsRes.count ?? 0,
        totalLands: landsRes.count ?? 0,
        totalDeals: dealsRes.count ?? 0,
        activeDeals: activeDealsRes.count ?? 0,
        closedDeals: closedDealsRes.count ?? 0,
        pendingRequests: pendingReqRes.count ?? 0,
        recentUsers: profilesRes.data || [],
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const kpiRow1: KPI[] = [
    {
      label: isAr ? "صفقات نشطة" : "Active Deals",
      value: data.activeDeals,
      icon: Handshake,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/admincp/deals",
    },
    {
      label: isAr ? "طلبات معلقة" : "Pending Requests",
      value: data.pendingRequests,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      href: "/admincp/deals",
    },
    {
      label: isAr ? "بانتظار التوثيق" : "Pending Verification",
      value: data.pendingVerification,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      href: "/admincp/developers",
    },
    {
      label: isAr ? "صفقات مُنجزة" : "Closed Deals",
      value: data.closedDeals,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const kpiRow2: KPI[] = [
    {
      label: isAr ? "المطورون" : "Developers",
      value: data.totalDevelopers,
      icon: HardHat,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      href: "/admincp/developers",
    },
    {
      label: isAr ? "الأراضي" : "Lands",
      value: data.totalLands,
      icon: Landmark,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      href: "/admincp/lands",
    },
    {
      label: isAr ? "المستخدمون" : "Users",
      value: data.totalUsers,
      icon: Users,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: isAr ? "إجمالي الصفقات" : "Total Deals",
      value: data.totalDeals,
      icon: TrendingUp,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  const KPICard = ({ kpi, large }: { kpi: KPI; large?: boolean }) => {
    const content = (
      <div className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm ${kpi.href ? "cursor-pointer" : ""}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {kpi.label}
            </p>
            <p className={`mt-1.5 ${large ? "text-3xl" : "text-2xl"} font-medium text-foreground`} dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
              {kpi.value.toLocaleString("en-US")}
            </p>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bgColor}`}>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={1.5} />
          </div>
        </div>
        {kpi.href && (
          <ArrowUpRight className="absolute end-2 bottom-2 h-3 w-3 text-muted-foreground/30 transition-colors group-hover:text-primary" />
        )}
      </div>
    );

    return kpi.href ? <Link to={kpi.href}>{content}</Link> : content;
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={TrendingUp}
        titleAr="نظرة عامة"
        titleEn="Overview"
        descAr="مراقبة سير العمل وقياس الأداء"
        descEn="Monitor workflow and measure performance"
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Priority KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpiRow1.map((kpi) => <KPICard key={kpi.label} kpi={kpi} large />)}
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpiRow2.map((kpi) => <KPICard key={kpi.label} kpi={kpi} />)}
          </div>

          {/* Charts + Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <h2 className="mb-4 text-sm font-medium text-foreground">
                  {isAr ? "تحليل الأداء الشهري" : "Monthly Performance"}
                </h2>
                <AdminAnalyticsCharts />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  {isAr ? "آخر المسجلين" : "Recent Registrations"}
                </h3>
                <span className="text-[10px] text-muted-foreground/60">{isAr ? "آخر 5" : "Last 5"}</span>
              </div>
              <div className="space-y-2">
                {data.recentUsers.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface/50 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-foreground">{p.full_name || p.email}</p>
                      <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{p.email}</p>
                    </div>
                    <span className="ms-2 shrink-0 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {p.subscription_type === "property_management" ? (isAr ? "مالك" : "Owner") : (isAr ? "مطور" : "Dev")}
                    </span>
                  </div>
                ))}
                {data.recentUsers.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
