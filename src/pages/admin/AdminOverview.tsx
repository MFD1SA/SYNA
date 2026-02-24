import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, Landmark, Handshake, HardHat, ShieldCheck, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";

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
      const [profilesRes, devsRes, pendingDevsRes, landsRes, dealsRes, activeDealsRes, closedDealsRes, pendingReqRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, subscription_type, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("developers").select("id", { count: "exact", head: true }),
        supabase.from("developers").select("id", { count: "exact", head: true }).eq("verification_status", "pending_review"),
        supabase.from("lands").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("current_stage", "deal_closed"),
        supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setData({
        totalUsers: profilesRes.data?.length ?? 0,
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

  const kpis = [
    { label: isAr ? "إجمالي المستخدمين" : "Total Users", value: data.totalUsers, icon: Users, color: "text-blue-500" },
    { label: isAr ? "المطورون المسجلون" : "Registered Developers", value: data.totalDevelopers, icon: HardHat, color: "text-amber-500" },
    { label: isAr ? "بانتظار التوثيق" : "Pending Verification", value: data.pendingVerification, icon: ShieldCheck, color: "text-orange-500" },
    { label: isAr ? "الأراضي المدرجة" : "Listed Lands", value: data.totalLands, icon: Landmark, color: "text-emerald-500" },
    { label: isAr ? "طلبات معلقة" : "Pending Requests", value: data.pendingRequests, icon: FileText, color: "text-purple-500" },
    { label: isAr ? "صفقات نشطة" : "Active Deals", value: data.activeDeals, icon: Handshake, color: "text-primary" },
    { label: isAr ? "صفقات مُنجزة" : "Closed Deals", value: data.closedDeals, icon: CheckCircle2, color: "text-green-500" },
    { label: isAr ? "إجمالي الصفقات" : "Total Deals", value: data.totalDeals, icon: TrendingUp, color: "text-indigo-500" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">
          {isAr ? "لوحة تحكم المدير" : "Admin Dashboard"}
        </h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "مراقبة سير العمل وقياس الأداء" : "Monitor workflow and measure performance"}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="doma-card group p-4 transition-all hover:doma-shadow">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-light text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={1.5} />
                </div>
                <p className="text-3xl font-medium text-foreground" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {kpi.value.toLocaleString("en-US")}
                </p>
              </div>
            ))}
          </div>

          {/* Analytics Charts */}
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              {isAr ? "تحليل الأداء الشهري" : "Monthly Performance"}
            </h2>
            <AdminAnalyticsCharts />
          </div>

          {/* Recent Users */}
          <div className="mt-6 doma-card p-5">
            <h3 className="mb-3 text-sm font-medium text-foreground">
              {isAr ? "آخر المسجلين" : "Recent Registrations"}
            </h3>
            <div className="space-y-2">
              {data.recentUsers.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div>
                    <p className="text-sm font-light text-foreground">{p.full_name || p.email}</p>
                    <p className="text-xs font-light text-muted-foreground">{p.email}</p>
                  </div>
                  <span className="rounded-full border border-primary/20 px-2 py-0.5 text-xs text-primary">
                    {p.subscription_type === "property_management" ? (isAr ? "مالك أرض" : "Landowner") : (isAr ? "مطور" : "Developer")}
                  </span>
                </div>
              ))}
              {data.recentUsers.length === 0 && (
                <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
