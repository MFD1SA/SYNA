import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Users, Landmark, Handshake, HardHat, TrendingUp, FileText, CheckCircle2, ArrowUpRight, Clock, Activity, BarChart3, BookOpen, ExternalLink } from "lucide-react";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href?: string;
  subtitle?: string;
}

const AdminOverview: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
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
      subtitle: isAr ? "قيد التنفيذ" : "In Progress",
    },
    {
      label: isAr ? "طلبات معلقة" : "Pending Requests",
      value: data.pendingRequests,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      href: "/admincp/deals",
      subtitle: isAr ? "بانتظار المراجعة" : "Awaiting Review",
    },
    {
      label: isAr ? "بانتظار التوثيق" : "Pending Verification",
      value: data.pendingVerification,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      href: "/admincp/developers",
      subtitle: isAr ? "مطورون جدد" : "New Developers",
    },
    {
      label: isAr ? "صفقات مُنجزة" : "Closed Deals",
      value: data.closedDeals,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      subtitle: isAr ? "مكتملة" : "Completed",
    },
  ];

  const kpiRow2: KPI[] = [
    { label: isAr ? "المطورون" : "Developers", value: data.totalDevelopers, icon: HardHat, color: "text-muted-foreground", bgColor: "bg-muted", href: "/admincp/developers", subtitle: `${data.verifiedDevelopers} ${isAr ? "موثق" : "verified"}` },
    { label: isAr ? "الأراضي" : "Lands", value: data.totalLands, icon: Landmark, color: "text-muted-foreground", bgColor: "bg-muted", href: "/admincp/lands", subtitle: `${data.activeLands} ${isAr ? "نشطة" : "active"}` },
    { label: isAr ? "المستخدمون" : "Users", value: data.totalUsers, icon: Users, color: "text-muted-foreground", bgColor: "bg-muted" },
    { label: isAr ? "إجمالي الصفقات" : "Total Deals", value: data.totalDeals, icon: TrendingUp, color: "text-muted-foreground", bgColor: "bg-muted" },
  ];

  const KPICard = ({ kpi, large }: { kpi: KPI; large?: boolean }) => {
    const content = (
      <div className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm ${kpi.href ? "cursor-pointer" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {kpi.label}
            </p>
            <p className={`mt-1.5 ${large ? "text-3xl" : "text-2xl"} font-semibold text-foreground`} dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
              {kpi.value.toLocaleString("en-US")}
            </p>
            {kpi.subtitle && (
              <p className="mt-1 text-[10px] text-muted-foreground">{kpi.subtitle}</p>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bgColor}`}>
            <kpi.icon className={`h-5 w-5 ${kpi.color}`} strokeWidth={1.5} />
          </div>
        </div>
        {kpi.href && (
          <ArrowUpRight className="absolute end-2 bottom-2 h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-primary" />
        )}
      </div>
    );
    return kpi.href ? <Link to={kpi.href}>{content}</Link> : content;
  };

  const healthDot = (h: string) => h === "green" ? "bg-emerald-500" : h === "yellow" ? "bg-amber-500" : "bg-red-500";

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={BarChart3}
          titleAr="نظرة عامة"
          titleEn="Overview"
          descAr="مراقبة سير العمل وقياس الأداء"
          descEn="Monitor workflow and measure performance"
        />

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
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

            {/* Charts + Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-medium text-foreground">
                      {isAr ? "تحليل الأداء الشهري" : "Monthly Performance"}
                    </h2>
                  </div>
                  <AdminAnalyticsCharts />
                </div>
              </div>

              <div className="space-y-4">
                {/* Recent Users */}
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "آخر المسجلين" : "Recent Users"}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">{isAr ? "آخر 5" : "Last 5"}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {data.recentUsers.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-foreground">{p.full_name || p.email}</p>
                          <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{p.email}</p>
                        </div>
                        <Badge variant="outline" className="ms-2 shrink-0 text-[10px]">
                          {p.subscription_type === "property_management" ? (isAr ? "مالك" : "Owner") : (isAr ? "مطور" : "Dev")}
                        </Badge>
                      </div>
                    ))}
                    {data.recentUsers.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
                    )}
                  </div>
                </div>

                {/* Recent Deals */}
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Handshake className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "آخر الصفقات" : "Recent Deals"}
                    </h3>
                    <Link to="/admincp/deals">
                      <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/5">{isAr ? "عرض الكل" : "View All"}</Badge>
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    {data.recentDeals.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-foreground">
                            {(d.developers as any)?.marketing_brand_name || (d.developers as any)?.company_name || "—"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {(d.lands as any)?.city}{(d.lands as any)?.district ? ` - ${(d.lands as any).district}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ms-2 shrink-0">
                          <div className={`h-2 w-2 rounded-full ${healthDot(d.health)}`} />
                          <Badge variant="outline" className="text-[10px]">{d.current_stage?.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    ))}
                    {data.recentDeals.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">{isAr ? "لا توجد صفقات" : "No deals"}</p>
                    )}
                  </div>
                </div>

                {/* Staff Guide */}
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">
                      {isAr ? "دليل الاستخدام" : "Staff Guide"}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: HardHat, label: isAr ? "المطورون" : "Developers", desc: isAr ? "توثيق الحسابات، تعديل البيانات، تغيير كلمات المرور" : "Verify accounts, edit data, change passwords", href: "/admincp/developers" },
                      { icon: Landmark, label: isAr ? "الملاك" : "Owners", desc: isAr ? "إنشاء حسابات الملاك وإدارة أراضيهم" : "Create owner accounts, manage their lands", href: "/admincp/owners" },
                      { icon: Handshake, label: isAr ? "الصفقات" : "Deals", desc: isAr ? "متابعة مراحل الصفقات وتحديث حالتها" : "Track deal stages and update status", href: "/admincp/deals" },
                      { icon: FileText, label: isAr ? "المحتوى" : "Content", desc: isAr ? "تعديل نصوص الموقع والسياسات" : "Edit website content and policies", href: "/admincp/content" },
                    ].map((item) => (
                      <Link key={item.href} to={item.href} className="flex items-start gap-3 rounded-lg border border-border/40 p-2.5 transition-all hover:border-primary/20 hover:bg-primary/5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <item.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Quick Portal Access */}
                  <div className="mt-3 border-t border-border/40 pt-3">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                      {isAr ? "الوصول السريع للبوابات" : "Quick Portal Access"}
                    </p>
                    <div className="flex gap-2">
                      <a href="/crm" target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/40 px-3 py-2 text-[11px] text-muted-foreground transition-all hover:border-primary/20 hover:text-primary">
                        <HardHat className="h-3 w-3" />
                        {isAr ? "لوحة المطور" : "Developer Panel"}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <a href="/owner" target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/40 px-3 py-2 text-[11px] text-muted-foreground transition-all hover:border-primary/20 hover:text-primary">
                        <Landmark className="h-3 w-3" />
                        {isAr ? "لوحة المالك" : "Owner Panel"}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
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
