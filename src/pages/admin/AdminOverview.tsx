import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useUserProfile } from "@/hooks/useUserProfile";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Users, Landmark, Handshake, HardHat, FileText, CheckCircle2, ArrowUpRight,
  Clock, Activity, BookOpen, ArrowRight, TrendingUp, LayoutDashboard,
  AlertTriangle, UserCheck, Sparkles, Percent, Building2, AlertCircle,
} from "lucide-react";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";
import { Link } from "react-router-dom";
import { log } from "@/lib/logger";

interface KPI {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  href?: string;
  subtitle?: string;
}

interface OverviewData {
  totalUsers: number;
  totalOwners: number;
  totalDevelopers: number;
  verifiedDevelopers: number;
  pendingVerification: number;
  totalLands: number;
  activeLands: number;
  totalDeals: number;
  activeDeals: number;
  closedDeals: number;
  pendingRequests: number;
  totalRequests: number;
  newUsersThisMonth: number;
  newLandsThisMonth: number;
  newDealsThisMonth: number;
  stuckDeals: number;
  conversionPct: number;
  recentUsers: any[];
  recentDeals: any[];
}

const INITIAL: OverviewData = {
  totalUsers: 0,
  totalOwners: 0,
  totalDevelopers: 0,
  verifiedDevelopers: 0,
  pendingVerification: 0,
  totalLands: 0,
  activeLands: 0,
  totalDeals: 0,
  activeDeals: 0,
  closedDeals: 0,
  pendingRequests: 0,
  totalRequests: 0,
  newUsersThisMonth: 0,
  newLandsThisMonth: 0,
  newDealsThisMonth: 0,
  stuckDeals: 0,
  conversionPct: 0,
  recentUsers: [],
  recentDeals: [],
};

const AdminOverview: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { fullName } = useUserProfile();
  usePageTitle(isAr ? "لوحة الإدارة" : "Admin Panel");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OverviewData>(INITIAL);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        // First-of-current-month boundary for "new this month" deltas.
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthStartIso = monthStart.toISOString();

        // 7-day-ago boundary for "stuck deals" alert (deals in active stages
        // that haven't moved in a week — see AdminMonitoring).
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoIso = weekAgo.toISOString();

        const [
          profilesRes, profilesCount, ownersRolesCount, devsRes,
          verifiedDevsRes, pendingDevsRes,
          landsRes, activeLandsRes, dealsRes, activeDealsRes, closedDealsRes,
          pendingReqRes, totalReqRes, approvedReqRes,
          newUsersRes, newLandsRes, newDealsRes,
          stuckDealsRes, recentDealsRes,
        ] = await Promise.all([
          // Recent 5 users for activity feed
          supabase.from("profiles").select("id, full_name, email, subscription_type, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          // Owners count via authoritative role (not subscription_type, since
          // some owners may not have a subscription record yet).
          supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "owner"),
          supabase.from("developers").select("id", { count: "exact", head: true }),
          supabase.from("developers").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
          supabase.from("developers").select("id", { count: "exact", head: true }).eq("verification_status", "pending_review"),
          supabase.from("lands").select("id", { count: "exact", head: true }),
          supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("deals").select("id", { count: "exact", head: true }),
          supabase.from("deals").select("id", { count: "exact", head: true }).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
          supabase.from("deals").select("id", { count: "exact", head: true }).eq("current_stage", "deal_closed"),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
          // "New this month" deltas — uses profiles.created_at / lands.created_at / deals.created_at.
          supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthStartIso),
          supabase.from("lands").select("id", { count: "exact", head: true }).gte("created_at", monthStartIso),
          supabase.from("deals").select("id", { count: "exact", head: true }).gte("created_at", monthStartIso),
          // Stuck deals: in active stages, last updated >7 days ago. Surfaced
          // here as a single alert count; full breakdown lives in /admincp/monitoring.
          supabase.from("deals").select("id", { count: "exact", head: true })
            .neq("current_stage", "deal_closed")
            .neq("current_stage", "deal_cancelled")
            .lt("updated_at", weekAgoIso),
          supabase.from("deals").select("id, current_stage, health, created_at, developers(company_name, marketing_brand_name), lands(city, district)").order("created_at", { ascending: false }).limit(5),
        ]);

        const totalReq = totalReqRes.count ?? 0;
        const approvedReq = approvedReqRes.count ?? 0;
        const conversionPct = totalReq > 0 ? Math.round((approvedReq / totalReq) * 100) : 0;

        setData({
          totalUsers: profilesCount.count ?? 0,
          totalOwners: ownersRolesCount.count ?? 0,
          totalDevelopers: devsRes.count ?? 0,
          verifiedDevelopers: verifiedDevsRes.count ?? 0,
          pendingVerification: pendingDevsRes.count ?? 0,
          totalLands: landsRes.count ?? 0,
          activeLands: activeLandsRes.count ?? 0,
          totalDeals: dealsRes.count ?? 0,
          activeDeals: activeDealsRes.count ?? 0,
          closedDeals: closedDealsRes.count ?? 0,
          pendingRequests: pendingReqRes.count ?? 0,
          totalRequests: totalReq,
          newUsersThisMonth: newUsersRes.count ?? 0,
          newLandsThisMonth: newLandsRes.count ?? 0,
          newDealsThisMonth: newDealsRes.count ?? 0,
          stuckDeals: stuckDealsRes.count ?? 0,
          conversionPct,
          recentUsers: profilesRes.data || [],
          recentDeals: recentDealsRes.data || [],
        });
      } catch (err) {
        log.error("AdminOverview fetchData error:", err);
        setError(isAr ? "تعذر تحميل بعض البيانات. حاول التحديث." : "Some data couldn't be loaded. Try refreshing.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAr]);

  // Hero KPIs — the four numbers an admin needs to see first thing in the morning.
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

  // Growth this month — month-to-date acquisition / activity.
  const growthKPIs: KPI[] = [
    {
      label: isAr ? "مستخدمون جدد" : "New Users",
      value: data.newUsersThisMonth,
      icon: Sparkles,
      accent: "text-[#6899B4]",
      bg: "bg-[#6899B4]/10",
      subtitle: isAr ? "هذا الشهر" : "This month",
    },
    {
      label: isAr ? "أراضٍ جديدة" : "New Lands",
      value: data.newLandsThisMonth,
      icon: Landmark,
      accent: "text-emerald-600",
      bg: "bg-emerald-500/8",
      subtitle: isAr ? "هذا الشهر" : "This month",
      href: "/admincp/lands",
    },
    {
      label: isAr ? "صفقات جديدة" : "New Deals",
      value: data.newDealsThisMonth,
      icon: Handshake,
      accent: "text-[#C45A41]",
      bg: "bg-[#C45A41]/10",
      subtitle: isAr ? "هذا الشهر" : "This month",
      href: "/admincp/deals",
    },
    {
      label: isAr ? "معدل التحويل" : "Conversion",
      value: `${data.conversionPct}%`,
      icon: Percent,
      accent: "text-violet-600",
      bg: "bg-violet-500/8",
      subtitle: isAr ? "طلبات → موافقة" : "Requests → Approved",
    },
  ];

  // Inventory strip — the "what we have" snapshot.
  const inventoryKPIs: KPI[] = [
    { label: isAr ? "المستخدمون" : "Users", value: data.totalUsers, icon: Users, accent: "text-gray-600", bg: "" },
    { label: isAr ? "الملاك" : "Owners", value: data.totalOwners, icon: Building2, accent: "text-gray-600", bg: "", href: "/admincp/owners", subtitle: `${data.activeLands} ${isAr ? "أرض نشطة" : "active lands"}` },
    { label: isAr ? "المطورون" : "Developers", value: data.totalDevelopers, icon: HardHat, accent: "text-gray-600", bg: "", href: "/admincp/developers", subtitle: `${data.verifiedDevelopers} ${isAr ? "موثق" : "verified"}` },
    { label: isAr ? "الأراضي" : "Lands", value: data.totalLands, icon: Landmark, accent: "text-gray-600", bg: "", href: "/admincp/lands", subtitle: `${data.activeLands} ${isAr ? "نشطة" : "active"}` },
    { label: isAr ? "إجمالي الصفقات" : "Total Deals", value: data.totalDeals, icon: TrendingUp, accent: "text-gray-600", bg: "" },
  ];

  const healthDot = (h: string) => h === "green" ? "bg-emerald-500" : h === "yellow" ? "bg-amber-500" : "bg-red-500";

  // Admin alerts — surfaces the single most actionable issues. Only renders
  // when at least one count is non-zero, so a healthy system stays clean.
  const alerts: { label: string; count: number; icon: React.ElementType; href: string; tone: "warn" | "danger" | "info" }[] = [
    ...(data.stuckDeals > 0
      ? [{
          label: isAr ? "صفقات متوقفة (>7 أيام)" : "Stuck deals (>7 days)",
          count: data.stuckDeals,
          icon: AlertTriangle,
          href: "/admincp/monitoring",
          tone: "danger" as const,
        }]
      : []),
    ...(data.pendingVerification > 0
      ? [{
          label: isAr ? "مطورون بانتظار التوثيق" : "Developers awaiting verification",
          count: data.pendingVerification,
          icon: UserCheck,
          href: "/admincp/developers",
          tone: "warn" as const,
        }]
      : []),
    ...(data.pendingRequests > 0
      ? [{
          label: isAr ? "طلبات شراكة بانتظار المراجعة" : "Partnership requests pending review",
          count: data.pendingRequests,
          icon: FileText,
          href: "/admincp/deals",
          tone: "info" as const,
        }]
      : []),
  ];

  const greeting = isAr
    ? `مرحباً${fullName ? `، ${fullName}` : ""}`
    : `Welcome${fullName ? `, ${fullName}` : ""}`;

  // Mid-fidelity skeleton that mirrors the actual layout. Reduces layout
  // shift when data lands and feels less jarring than the prior 8 rectangles.
  const Skeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[122px] animate-pulse rounded-2xl bg-white border border-gray-200/40" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[100px] animate-pulse rounded-2xl bg-white border border-gray-200/40" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[78px] animate-pulse rounded-2xl bg-white border border-gray-200/40" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[420px] animate-pulse rounded-2xl bg-white border border-gray-200/40" />
        <div className="space-y-5">
          <div className="h-[200px] animate-pulse rounded-2xl bg-white border border-gray-200/40" />
          <div className="h-[200px] animate-pulse rounded-2xl bg-white border border-gray-200/40" />
        </div>
      </div>
    </div>
  );

  // Reusable hero/growth card. Pulled out so the two strips stay visually
  // identical and any future tweak only happens in one place.
  const renderCard = (kpi: KPI, key: string) => {
    const content = (
      <div className="group relative bg-white rounded-2xl border border-gray-200/40 p-5 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(43,76,102,0.12)] hover:border-[#2B2B2B]/10 h-full">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10.5px] font-semibold text-gray-400/90 uppercase tracking-[0.1em]">{kpi.label}</span>
          <div className={`h-9 w-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
            <kpi.icon className={`h-[18px] w-[18px] ${kpi.accent}`} strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-[30px] font-bold text-[#020202] leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
          {typeof kpi.value === "number" ? kpi.value.toLocaleString("en-US") : kpi.value}
        </p>
        {kpi.subtitle && (
          <p className="mt-2.5 text-[11px] text-gray-400 font-medium">{kpi.subtitle}</p>
        )}
        {kpi.href && (
          <ArrowUpRight className="absolute end-3.5 bottom-3.5 h-3.5 w-3.5 text-gray-200 transition-all duration-300 group-hover:text-[#C45A41]" strokeWidth={1.5} />
        )}
      </div>
    );
    return kpi.href ? <Link key={key} to={kpi.href} className="block">{content}</Link> : <div key={key}>{content}</div>;
  };

  const alertTone = (tone: "warn" | "danger" | "info") => {
    if (tone === "danger") return "border-red-200/70 bg-red-50/60 text-red-700 hover:bg-red-50";
    if (tone === "warn") return "border-amber-200/70 bg-amber-50/60 text-amber-700 hover:bg-amber-50";
    return "border-[#6899B4]/30 bg-[#6899B4]/[0.06] text-[#2B2B2B] hover:bg-[#6899B4]/[0.1]";
  };

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

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/60 px-5 py-4 text-[13px] text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.8} />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <Skeleton />
        ) : (
          <div className="space-y-6">
            {/* Admin alerts — only renders when something needs attention. */}
            {alerts.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {alerts.map((a) => (
                  <Link
                    key={a.label}
                    to={a.href}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${alertTone(a.tone)}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <a.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span className="text-[12.5px] font-medium truncate">{a.label}</span>
                    </div>
                    <span className="text-[14px] font-bold shrink-0" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {a.count.toLocaleString("en-US")}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Priority KPIs — the four metrics an admin should glance at first. */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {priorityKPIs.map((kpi) => renderCard(kpi, `p-${kpi.label}`))}
            </div>

            {/* Growth strip — month-to-date acquisition + conversion. */}
            <div>
              <div className="flex items-center gap-2 mb-3 ps-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#C45A41]" strokeWidth={1.8} />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.1em]">
                  {isAr ? "نمو ونشاط الشهر" : "Growth this month"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {growthKPIs.map((kpi) => renderCard(kpi, `g-${kpi.label}`))}
              </div>
            </div>

            {/* Inventory strip — compact "what we have". */}
            <div>
              <div className="flex items-center gap-2 mb-3 ps-0.5">
                <BookOpen className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.8} />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.1em]">
                  {isAr ? "نظرة على المخزون" : "Inventory snapshot"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {inventoryKPIs.map((kpi) => {
                  const content = (
                    <div className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-200/40 px-5 py-4 transition-all duration-300 hover:shadow-[0_4px_16px_-6px_rgba(43,76,102,0.08)] hover:border-[#2B2B2B]/10 h-full">
                      <div className="min-w-0">
                        <p className="text-[22px] font-bold text-[#020202] leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {typeof kpi.value === "number" ? kpi.value.toLocaleString("en-US") : kpi.value}
                        </p>
                        <p className="mt-1.5 text-[11px] text-gray-400 font-medium truncate">{kpi.label}</p>
                      </div>
                      <div className="ms-auto text-end shrink-0">
                        <kpi.icon className="h-4 w-4 text-gray-300/80 mb-1 ms-auto" strokeWidth={1.5} />
                        {kpi.subtitle && <p className="text-[10px] text-[#C45A41] font-medium">{kpi.subtitle}</p>}
                      </div>
                    </div>
                  );
                  return kpi.href ? (
                    <Link key={`i-${kpi.label}`} to={kpi.href} className="block">{content}</Link>
                  ) : (
                    <div key={`i-${kpi.label}`}>{content}</div>
                  );
                })}
              </div>
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
                      <div className="py-10 px-4 text-center">
                        <Users className="h-6 w-6 text-gray-300 mx-auto mb-2" strokeWidth={1.4} />
                        <p className="text-[12.5px] text-slate-400">{isAr ? "لا يوجد مسجلون بعد" : "No users yet"}</p>
                      </div>
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
                      <div className="py-10 px-4 text-center">
                        <Handshake className="h-6 w-6 text-gray-300 mx-auto mb-2" strokeWidth={1.4} />
                        <p className="text-[12.5px] text-slate-400">{isAr ? "لا توجد صفقات بعد" : "No deals yet"}</p>
                      </div>
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
                      { icon: Building2, label: isAr ? "الملاك" : "Owners", desc: isAr ? "إنشاء حسابات، إدارة الأراضي" : "Create accounts, manage lands", href: "/admincp/owners" },
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
