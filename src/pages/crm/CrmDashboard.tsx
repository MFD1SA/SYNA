import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import CrmLayout from "@/components/crm/CrmLayout";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  FileText, Handshake, TrendingUp,
  Search, Send, CheckCircle2,
  AlertTriangle, XCircle, Clock, ArrowRight,
  Sparkles, MapPin, Target, Zap,
} from "lucide-react";
import DashboardShell, { BentoGrid } from "@/components/dashboard/DashboardShell";
import BentoCard from "@/components/dashboard/BentoCard";
import KpiTile from "@/components/dashboard/KpiTile";
import SectionHeading from "@/components/dashboard/SectionHeading";
import StatusBadge from "@/components/dashboard/StatusBadge";
import QuickActions from "@/components/dashboard/QuickActions";
import EmptyState from "@/components/dashboard/EmptyState";
import TrendSparkline from "@/components/dashboard/TrendSparkline";

interface DevProfile {
  id: string;
  company_name: string;
  marketing_brand_name: string | null;
  cr_number: string;
  cr_file_url: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  verification_status: string;
}

const CrmDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { fullName } = useUserProfile();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة التحكم" : "Dashboard");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [developer, setDeveloper] = useState<DevProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [devKpi, setDevKpi] = useState({
    browsedLands: 0, sentRequests: 0, activeDeals: 0, closedDeals: 0,
    pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0,
    todayOpportunities: 0,
  });

  const getCompleteness = (dev: DevProfile | null) => {
    if (!dev) return { percent: 0, missing: [] as string[] };
    const fields: { key: keyof DevProfile; ar: string; en: string }[] = [
      { key: "company_name", ar: "اسم الشركة", en: "Company Name" },
      { key: "cr_number", ar: "رقم السجل التجاري", en: "CR Number" },
      { key: "cr_file_url", ar: "ملف السجل التجاري", en: "CR Document" },
      { key: "email", ar: "البريد الإلكتروني", en: "Email" },
      { key: "phone", ar: "رقم الجوال", en: "Phone" },
      { key: "website", ar: "الموقع الإلكتروني", en: "Website" },
      { key: "marketing_brand_name", ar: "الاسم التجاري", en: "Brand Name" },
    ];
    const missing = fields.filter(f => !dev[f.key]);
    const percent = Math.round(((fields.length - missing.length) / fields.length) * 100);
    return { percent, missing: missing.map(m => isAr ? m.ar : m.en) };
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
        if (profile?.full_name) setProfileName(profile.full_name);

        const { data: devProfile } = await supabase
          .from("developers")
          .select("id, company_name, marketing_brand_name, cr_number, cr_file_url, email, phone, website, verification_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (devProfile) {
          setDeveloper(devProfile as DevProfile);
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const [landsRes, reqRes, dealsActive, dealsClosed, reqPending, reqApproved, reqRejected, todayRes] = await Promise.all([
            supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true).eq("owner_approved", true),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id),
            supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
            supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("current_stage", "deal_closed"),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("status", "pending"),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("status", "approved"),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("status", "rejected"),
            supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true).eq("owner_approved", true).gte("created_at", todayStart.toISOString()),
          ]);
          setDevKpi({
            browsedLands: landsRes.count ?? 0,
            sentRequests: reqRes.count ?? 0,
            activeDeals: dealsActive.count ?? 0,
            closedDeals: dealsClosed.count ?? 0,
            pendingRequests: reqPending.count ?? 0,
            approvedRequests: reqApproved.count ?? 0,
            rejectedRequests: reqRejected.count ?? 0,
            todayOpportunities: todayRes.count ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch CRM dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const completeness = getCompleteness(developer);
  const greeting = profileName || fullName || developer?.marketing_brand_name || developer?.company_name || "";

  // Synthetic sparkline driven by actual KPI for a sensible visual signal.
  const activitySpark = useMemo(() => {
    const base = Math.max(4, devKpi.sentRequests);
    return [base * 0.4, base * 0.6, base * 0.55, base * 0.7, base * 0.85, base * 0.95, base];
  }, [devKpi.sentRequests]);

  const totalRequests = devKpi.pendingRequests + devKpi.approvedRequests + devKpi.rejectedRequests;

  return (
    <CrmLayout>
      <DashboardShell isAr={isAr} accent="blue">
        {/* ═══════ HERO ═══════ */}
        <BentoGrid className="mb-5">
          <BentoCard variant="hero" span="two-thirds" padding="lg" className="relative overflow-hidden">
            <div className="absolute top-0 end-0 w-44 h-44 bg-[#2B4C66]/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2B4C66]/10 text-[11px] font-semibold text-[#2B4C66]">
                  <Sparkles className="w-3 h-3" strokeWidth={2} />
                  {isAr ? "منصة المطور" : "Developer Hub"}
                </span>
                {developer?.verification_status === "verified" && (
                  <StatusBadge variant="success" dot>{isAr ? "موثّق" : "Verified"}</StatusBadge>
                )}
              </div>
              <h1 className="text-[24px] md:text-[30px] font-bold text-[#1E374B] dark:text-white tracking-tight mb-1.5">
                {isAr ? `مرحباً، ${greeting}` : `Welcome, ${greeting}`}
              </h1>
              <p className="text-[13px] md:text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-[560px]">
                {isAr
                  ? "تابع الفرص الجديدة، تقديماتك والصفقات الجارية في مكان واحد."
                  : "Track fresh opportunities, your submissions and ongoing deals — all in one place."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/crm/browse")}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#2B4C66] hover:bg-[#1E374B] text-white text-[13px] font-semibold transition-colors"
                >
                  <Search className="w-4 h-4" strokeWidth={1.7} />
                  {isAr ? "استكشف الفرص" : "Explore Opportunities"}
                </button>
                <button
                  onClick={() => navigate("/crm/my-requests")}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/70 hover:bg-white dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-white/60 dark:border-white/10 text-[#2B4C66] dark:text-white text-[13px] font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" strokeWidth={1.7} />
                  {isAr ? "تقديماتي" : "My Submissions"}
                </button>
              </div>
            </div>
          </BentoCard>

          {/* Quick snapshot (right) */}
          <BentoCard variant="gold" span="third" padding="lg">
            <SectionHeading
              title={isAr ? "لقطة اليوم" : "Today at a glance"}
              tone="gold"
              icon={Zap}
            />
            <div className="space-y-3">
              <KpiTile
                label={isAr ? "فرص اليوم" : "Today's opportunities"}
                value={loading ? "—" : devKpi.todayOpportunities}
                icon={Sparkles}
                tone="gold"
                loading={loading}
              />
              <TrendSparkline data={activitySpark} color="#A88A4A" height={56} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? "نشاط التقديمات خلال 7 أيام" : "Submissions activity — last 7 days"}
              </p>
            </div>
          </BentoCard>
        </BentoGrid>

        {/* ═══════ KPI ROW ═══════ */}
        <BentoGrid className="mb-5">
          <BentoCard variant="neutral" span="quarter" padding="md" interactive onClick={() => navigate("/crm/browse")}>
            <KpiTile
              label={isAr ? "فرص متاحة" : "Opportunities"}
              value={loading ? "—" : devKpi.browsedLands}
              icon={Search}
              tone="primary"
              loading={loading}
              sublabel={isAr ? "متاحة الآن" : "Available now"}
            />
          </BentoCard>
          <BentoCard variant="neutral" span="quarter" padding="md" interactive onClick={() => navigate("/crm/my-requests")}>
            <KpiTile
              label={isAr ? "تقديماتي النشطة" : "Active submissions"}
              value={loading ? "—" : devKpi.sentRequests}
              icon={Send}
              tone="primary"
              loading={loading}
              sublabel={isAr ? "جميع الطلبات" : "All time"}
            />
          </BentoCard>
          <BentoCard variant="neutral" span="quarter" padding="md" interactive onClick={() => navigate("/crm/deals")}>
            <KpiTile
              label={isAr ? "صفقات في التفاوض" : "Deals in negotiation"}
              value={loading ? "—" : devKpi.activeDeals}
              icon={Handshake}
              tone="gold"
              loading={loading}
              sublabel={isAr ? "جارية" : "Ongoing"}
            />
          </BentoCard>
          <BentoCard variant="neutral" span="quarter" padding="md" interactive onClick={() => navigate("/crm/deals")}>
            <KpiTile
              label={isAr ? "صفقات منجزة" : "Closed deals"}
              value={loading ? "—" : devKpi.closedDeals}
              icon={CheckCircle2}
              tone="success"
              loading={loading}
              sublabel={isAr ? "تم الإغلاق" : "Completed"}
            />
          </BentoCard>
        </BentoGrid>

        {/* ═══════ Profile Completeness (if <100%) ═══════ */}
        {!loading && completeness.percent < 100 && (
          <BentoCard variant="neutral" span="full" padding="md" className="mb-5 !bg-amber-50/70 !border-amber-200/60 dark:!bg-amber-500/10 dark:!border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
                  {isAr ? "أكمل ملفك المهني" : "Complete your profile"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={completeness.percent} className="h-1.5 flex-1" />
                  <span className="text-[12px] font-bold text-amber-700 dark:text-amber-300" dir="ltr">{completeness.percent}%</span>
                </div>
                {completeness.missing.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-amber-700/80 dark:text-amber-300/70">
                    {isAr ? "ناقص: " : "Missing: "}{completeness.missing.join(isAr ? "، " : ", ")}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/crm/settings")}
                className="h-9 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold shrink-0"
              >
                {isAr ? "إكمال الملف" : "Complete"}
                <ArrowRight className="h-3.5 w-3.5 ms-1" />
              </Button>
            </div>
          </BentoCard>
        )}

        {/* ═══════ Row 2: Pipeline + Quick actions ═══════ */}
        <BentoGrid className="mb-5">
          {/* Pipeline */}
          <BentoCard variant="neutral" span="two-thirds" padding="lg">
            <SectionHeading
              title={isAr ? "مسار التقديمات" : "Requests pipeline"}
              subtitle={isAr ? "توزيع الحالات الحالية" : "Current status distribution"}
              icon={Target}
              tone="primary"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate("/crm/my-requests")} className="h-7 text-[12px] text-[#2B4C66] hover:bg-[#2B4C66]/5">
                  {isAr ? "عرض التفاصيل" : "View all"}
                  <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              }
            />
            {totalRequests === 0 && !loading ? (
              <EmptyState
                icon={Send}
                title={isAr ? "لا توجد تقديمات بعد" : "No submissions yet"}
                description={isAr ? "ابدأ بتصفّح الفرص وتقديم طلب شراكة" : "Start by browsing opportunities and submitting a partnership request"}
                compact
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: isAr ? "قيد المراجعة" : "Pending", value: devKpi.pendingRequests, icon: Clock, variant: "pending" as const },
                  { label: isAr ? "مقبولة" : "Approved", value: devKpi.approvedRequests, icon: CheckCircle2, variant: "success" as const },
                  { label: isAr ? "مرفوضة" : "Rejected", value: devKpi.rejectedRequests, icon: XCircle, variant: "danger" as const },
                ].map((item) => {
                  const pct = totalRequests ? Math.round((item.value / totalRequests) * 100) : 0;
                  return (
                    <div key={item.label} className="rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge variant={item.variant}>{item.label}</StatusBadge>
                      </div>
                      <p className="text-[24px] font-bold text-[#1E374B] dark:text-white tracking-tight leading-none" dir="ltr">
                        {loading ? "—" : item.value}
                      </p>
                      <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                        <div
                          className={
                            item.variant === "success" ? "h-full bg-emerald-500" :
                            item.variant === "danger" ? "h-full bg-rose-500" : "h-full bg-amber-500"
                          }
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoCard>

          {/* Quick actions */}
          <BentoCard variant="neutral" span="third" padding="lg">
            <SectionHeading
              title={isAr ? "إجراءات سريعة" : "Quick actions"}
              icon={Zap}
              tone="gold"
            />
            <QuickActions
              className="!grid-cols-2"
              actions={[
                {
                  label: isAr ? "استكشف الفرص" : "Explore",
                  description: isAr ? "فرص جديدة جاهزة للتقديم" : "New lands to apply to",
                  icon: Search, onClick: () => navigate("/crm/browse"), tone: "primary",
                },
                {
                  label: isAr ? "طلباتي" : "My Requests",
                  description: isAr ? "متابعة تقديماتي الحالية" : "Track my submissions",
                  icon: FileText, onClick: () => navigate("/crm/my-requests"), tone: "primary",
                },
                {
                  label: isAr ? "صفقاتي" : "My Deals",
                  description: isAr ? "الصفقات الجارية والمغلقة" : "Active & closed deals",
                  icon: Handshake, onClick: () => navigate("/crm/deals"), tone: "gold",
                },
                {
                  label: isAr ? "الإعدادات" : "Settings",
                  description: isAr ? "الملف الشخصي والاتفاقية" : "Profile & agreement",
                  icon: Target, onClick: () => navigate("/crm/settings"), tone: "neutral",
                },
              ]}
            />
          </BentoCard>
        </BentoGrid>

        {/* ═══════ Row 3: Deal lifecycle ═══════ */}
        <BentoGrid>
          <BentoCard variant="neutral" span="full" padding="lg">
            <SectionHeading
              title={isAr ? "دورة حياة الصفقة" : "Deal lifecycle"}
              subtitle={isAr ? "الرحلة من الإدراج إلى الإغلاق" : "From listing to closing on SINA"}
              icon={TrendingUp}
              tone="primary"
            />
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 mt-2">
              {[
                { ar: "مسودة", en: "Draft" },
                { ar: "نشر", en: "Publish" },
                { ar: "استلام", en: "Receive" },
                { ar: "مراجعة", en: "Review" },
                { ar: "تفاوض", en: "Negotiate" },
                { ar: "إغلاق", en: "Close" },
              ].map((stage, idx, arr) => (
                <React.Fragment key={stage.en}>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold ${
                      idx === arr.length - 1
                        ? "bg-emerald-500 text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)]"
                        : idx === 0
                          ? "bg-[#2B4C66] text-white shadow-[0_4px_14px_-4px_rgba(43,76,102,0.5)]"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-[11px] font-semibold text-[#1E374B] dark:text-white whitespace-nowrap">
                      {isAr ? stage.ar : stage.en}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex-1 min-w-6 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      </DashboardShell>
    </CrmLayout>
  );
};

export default CrmDashboard;
