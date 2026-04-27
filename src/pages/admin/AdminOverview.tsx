import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useUserProfile } from "@/hooks/useUserProfile";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Users, Landmark, Handshake, HardHat, FileText, CheckCircle2, ArrowUpRight, Clock, Activity, BookOpen, ArrowRight, TrendingUp, LayoutDashboard } from "lucide-react";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";
import { Link } from "react-router-dom";

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  bg: string;
  href?: string;
  subtitle?: string;
}

const AdminOverview: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { fullName } = useUserProfile();
  usePageTitle(isAr ? "لوحة الإدارة" : "Admin Panel");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalUsers: 0,
    totalDevelopers: 0,
    verifiedDevelopers: 0,
    pendingVerification: 0,
    totalLands: 0,
    activeLands: 0,
    totalDeals: 0,
    activeDeals: 0,
    closedDeals: 0,
    pendingRequests: 0,
    recentUsers: [] as any[],
    recentDeals: [] as any[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          profilesRes, profilesCount, devsRes, verifiedDevsRes, pendingDevsRes,
          landsRes, activeLandsRes, dealsRes, activeDealsRes, closedDealsRes,
          pendingReqRes, recentDealsRes,
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, subscription_type, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("developers").select("id", { count: "exact", head: true }),
          supabase.from("developers").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
          supabase.from("developers").select("id", { count: "exact", head: true }).eq("verification_status", "pending_review"),
          supabase.from("lands").select("id", { count: "exact", head: true }),
          supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("deals").select("id", { count: "exact", head: true }),
          supabase.from("deals").select("id", { count: "exact", head: true }).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
          supabase.from("deals").select("id", { count: "exact", head: true }).eq("current_stage", "deal_closed"),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("deals").select("id, current_stage, health, created_at, developers(company_name, marketing_brand_name), lands(city, district)").order("created_at", { ascending: false }).limit(5),
        ]);

        setData({
          totalUsers: profilesCount.count ?? 0,
          totalDevelopers: devsRes.count ?? 0,
          verifiedDevelopers: verifiedDevsRes.count ?? 0,
          pendingVerification: pendingDevsRes.count ?? 0,
          totalLands: landsRes.count ?? 0,
          activeLands: activeLandsRes.count ?? 0,
          totalDeals: dealsRes.count ?? 0,
          activeDeals: activeDealsRes.count ?? 0,
          closedDeals: closedDealsRes.count ?? 0,
          pendingRequests: pendingReqRes.count ?? 0,
          recentUsers: profilesRes.data || [],
          recentDeals: recentDealsRes.data || [],
        });
      } catch (err) {
        console.error("AdminOverview fetchData error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const priorityKPIs: KPI[] = [
    {
      label: isAr ? "صفقات نشطة" : "Active Deals",
      value: data.activeDeals,
      icon: Handshake,
      accent: "text-[#2B2B2B]",
      bg: "bg-[#2B2B2B]/8",
      href: "/admincp/deals",
      subtitle: isAr ? "قيد التنفيذ" : "In Progress",
    },
    {
      label: isAr ? "طلبات معلقة" : "Pending Requests",
      value: data.pendingRequests,
      icon: FileText,
      accent: "text-amber-600",
      bg: "bg-amber-500/8",
      href: "/admincp/deals",
      subtitle: isAr ? "بانتظار المراجعة" : "Awaiting Review",
    },
    {
      label: isAr ? "بانتظار التوثيق" : "Pending Verification",
      value: data.pendingVerification,
      icon: Clock,
      accent: "text-orange-600",
      bg: "bg-orange-500/8",
      href: "/admincp/developers",
      subtitle: isAr ? "مطورون جدد" : "New Developers",
    },
    {
      label: isAr ? "صفقات منجزة" : "Closed Deals",
      value: data.closedDeals,
      icon: CheckCircle2,
      accent: "text-emerald-600",
      bg: "bg-emerald-500/8",
      subtitle: isAr ? "مكتملة" : "Completed",
    },
  ];

  const secondaryKPIs: KPI[] = [
    { label: isAr ? "المطورون" : "Developers", value: data.totalDevelopers, icon: HardHat, accent: "text-gray-600", bg: "", href: "/admincp/developers", subtitle: `${data.verifiedDevelopers} ${isAr ? "موثق" : "verified"}` },
    { label: isAr ? "الأراضي" : "Lands", value: data.totalLands, icon: Landmark, accent: "text-gray-600", bg: "", href: "/admincp/lands", subtitle: `${data.activeLands} ${isAr ? "نشطة" : "active"}` },
    { label: isAr ? "المستخدمون" : "Users", value: data.totalUsers, icon: Users, accent: "text-gray-600", bg: "" },
    { label: isAr ? "إجمالي الصفقات" : "Total Deals", value: data.totalDeals, icon: TrendingUp, accent: "text-gray-600", bg: "" },
  ];

  const healthDot = (h: string) => h === "green" ? "bg-emerald-500" : h === "yellow" ? "bg-amber-500" : "bg-red-500";

  const greeting = isAr
    ? `مرحباً${fullName ? `، ${fullName}` : ""}`
    : `Welcome${fullName ? `, ${fullName}` : ""}`;

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <PageHeader
          variant="admin"
          icon={LayoutDashboard}
          eyebrowAr="لوحة الإدارة · نظرة عامة"
          eyebrowEn="Admin · Overview"
          titleAr={greeting}
          titleEn={greeting}
          descAr="نظرة شاملة على أداء المنصة وحالة الفرص والصفقات في الوقت الفعلي."
          descEn="A real-time view of platform performance, opportunities and deal flow."
        />


        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[110px] animate-pulse rounded-2xl bg-gray-100/40" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Priority KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {priorityKPIs.map((kpi) => {
                const content = (
                  <div className="group relative bg-white rounded-2xl border border-gray-200/40 p-5 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(43,76,102,0.12)] hover:border-[#2B2B2B]/10">
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="text-[10.5px] font-semibold text-gray-400/90 uppercase tracking-[0.1em]">{kpi.label}</span>
                      <div className={`h-9 w-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`h-[18px] w-[18px] ${kpi.accent}`} strokeWidth={1.5} />
                      </div>
                    </div>
                    <p className="text-[30px] font-bold text-[#020202] leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {kpi.value.toLocaleString("en-US")}
                    </p>
                    {kpi.subtitle && (
                      <p className="mt-2.5 text-[11px] text-gray-400 font-medium">{kpi.subtitle}</p>
                    )}
                    {kpi.href && (
                      <ArrowUpRight className="absolute end-3.5 bottom-3.5 h-3.5 w-3.5 text-gray-200 transition-all duration-300 group-hover:text-[#C45A41]" strokeWidth={1.5} />
                    )}
                  </div>
                );
                return kpi.href ? <Link key={kpi.label} to={kpi.href}>{content}</Link> : <div key={kpi.label}>{content}</div>;
              })}
            </div>

            {/* Secondary KPIs - compact row */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {secondaryKPIs.map((kpi) => {
                const content = (
                  <div className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-200/40 px-5 py-4 transition-all duration-300 hover:shadow-[0_4px_16px_-6px_rgba(43,76,102,0.08)] hover:border-[#2B2B2B]/10">
                    <div>
                      <p className="text-[22px] font-bold text-[#020202] leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {kpi.value.toLocaleString("en-US")}
                      </p>
                      <p className="mt-1.5 text-[11px] text-gray-400 font-medium">{kpi.label}</p>
                    </div>
                    <div className="ms-auto text-end">
                      <kpi.icon className="h-4 w-4 text-gray-300/80 mb-1 ms-auto" strokeWidth={1.5} />
                      {kpi.subtitle && <p className="text-[10px] text-[#C45A41] font-medium">{kpi.subtitle}</p>}
                    </div>
                  </div>
                );
                return kpi.href ? <Link key={kpi.label} to={kpi.href}>{content}</Link> : <div key={kpi.label}>{content}</div>;
              })}
            </div>

            {/* Charts + Activity */}
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Charts — 2 cols */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200/40 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2.5 mb-1">
                    <Activity className="h-4 w-4 text-[#C45A41]" strokeWidth={1.5} />
                    <h2 className="text-[14px] font-semibold text-[#020202]">{isAr ? "تحليل الأداء" : "Performance Analytics"}</h2>
                  </div>
                  <AdminAnalyticsCharts />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Recent Users */}
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/10">
                    <h3 className="text-[13px] font-semibold text-[#020202] dark:text-white flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-[#2B2B2B] dark:text-[#9BBEDB]" strokeWidth={1.8} />
                      {isAr ? "آخر المسجلين" : "Recent Users"}
                    </h3>
                    <span className="text-[10px] text-[#A24832] dark:text-[#D7C084] font-semibold bg-[#C45A41]/[0.12] dark:bg-[#C45A41]/20 px-2.5 py-0.5 rounded-full">{isAr ? "آخر 5" : "Last 5"}</span>
                  </div>
                  <div className="p-2">
                    {data.recentUsers.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#2B2B2B]/[0.04] dark:hover:bg-white/5 transition-all duration-200">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#020202] dark:text-white">{p.full_name || p.email}</p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-300">{new Date(p.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                        <span className="ms-3 shrink-0 text-[10px] font-bold text-[#2B2B2B] dark:text-[#9BBEDB] bg-[#2B2B2B]/[0.1] dark:bg-[#2B2B2B]/30 px-2.5 py-0.5 rounded-full">
                          {p.subscription_type === "property_management" ? (isAr ? "مالك" : "Owner") : (isAr ? "مطور" : "Dev")}
                        </span>
                      </div>
                    ))}
                    {data.recentUsers.length === 0 && (
                      <p className="py-8 text-center text-[13px] text-slate-500 dark:text-slate-300">{isAr ? "لا توجد بيانات" : "No data"}</p>
                    )}
                  </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/10">
                    <h3 className="text-[13px] font-semibold text-[#020202] dark:text-white flex items-center gap-2.5">
                      <Handshake className="h-4 w-4 text-[#2B2B2B] dark:text-[#9BBEDB]" strokeWidth={1.8} />
                      {isAr ? "آخر الصفقات" : "Recent Deals"}
                    </h3>
                    <Link to="/admincp/deals" className="text-[11px] text-[#A24832] dark:text-[#D7C084] hover:text-[#2B2B2B] dark:hover:text-white font-semibold transition-colors">
                      {isAr ? "عرض الكل" : "View All"}
                    </Link>
                  </div>
                  <div className="p-2">
                    {data.recentDeals.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#2B2B2B]/[0.04] dark:hover:bg-white/5 transition-all duration-200">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#020202] dark:text-white">
                            {(d.developers as any)?.marketing_brand_name || (d.developers as any)?.company_name || "—"}
                          </p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-300">
                            {(d.lands as any)?.city}{(d.lands as any)?.district ? ` - ${(d.lands as any).district}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ms-3 shrink-0">
                          <div className={`h-1.5 w-1.5 rounded-full ${healthDot(d.health)}`} />
                          <span className="text-[10px] font-bold text-[#2B2B2B] dark:text-[#9BBEDB] bg-[#2B2B2B]/[0.1] dark:bg-[#2B2B2B]/30 px-2.5 py-0.5 rounded-full">
                            {d.current_stage?.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                    {data.recentDeals.length === 0 && (
                      <p className="py-8 text-center text-[13px] text-slate-500 dark:text-slate-300">{isAr ? "لا توجد صفقات" : "No deals"}</p>
                    )}
                  </div>
                </div>

                {/* Quick Navigation */}
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100/60 dark:border-white/10">
                    <BookOpen className="h-4 w-4 text-[#A24832] dark:text-[#D7C084]" strokeWidth={1.8} />
                    <h3 className="text-[13px] font-semibold text-[#020202] dark:text-white">{isAr ? "تنقل سريع" : "Quick Navigation"}</h3>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {[
                      { icon: HardHat, label: isAr ? "المطورون" : "Developers", desc: isAr ? "توثيق، تعديل بيانات" : "Verify, edit data", href: "/admincp/developers" },
                      { icon: Landmark, label: isAr ? "الملاك" : "Owners", desc: isAr ? "إنشاء حسابات، إدارة الأراضي" : "Create accounts, manage lands", href: "/admincp/owners" },
                      { icon: Handshake, label: isAr ? "الصفقات" : "Deals", desc: isAr ? "متابعة المراحل" : "Track stages", href: "/admincp/deals" },
                    ].map((item) => (
                      <Link key={item.href} to={item.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-[#2B2B2B]/[0.05] dark:hover:bg-white/5">
                        <div className="h-9 w-9 rounded-xl bg-[#2B2B2B]/[0.08] dark:bg-[#2B2B2B]/30 flex items-center justify-center group-hover:bg-[#2B2B2B]/[0.15] dark:group-hover:bg-[#2B2B2B]/50 transition-all duration-200">
                          <item.icon className="h-4 w-4 shrink-0 text-[#2B2B2B] dark:text-[#9BBEDB] group-hover:text-[#020202] dark:group-hover:text-white transition-colors duration-200" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#020202] dark:text-white">{item.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-300">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-500 group-hover:text-[#C45A41] dark:group-hover:text-[#D7C084] transition-colors duration-200" strokeWidth={1.8} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
