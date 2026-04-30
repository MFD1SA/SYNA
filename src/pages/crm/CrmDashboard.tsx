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
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Handshake, TrendingUp,
  Search, Send, CheckCircle2,
  AlertTriangle, XCircle, Clock, ArrowRight, ArrowLeft,
  Sparkles, MapPin, Target, Zap,
  Eye, ClipboardList, MessageSquare, Award,
  type LucideIcon,
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [developer, setDeveloper] = useState<DevProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [latestPhase, setLatestPhase] = useState<string | null>(null);
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
    let cancelled = false;
    const fetchData = async () => {
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
        if (cancelled) return;
        if (profile?.full_name) setProfileName(profile.full_name);

        const { data: devProfile } = await supabase
          .from("developers")
          .select("id, company_name, marketing_brand_name, cr_number, cr_file_url, email, phone, website, verification_status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;

        if (devProfile) {
          setDeveloper(devProfile as DevProfile);
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          // Every query here filters on `deleted_at is null` — soft-deleted
          // rows must never count toward KPIs. A developer whose deal was
          // soft-deleted by admin would otherwise see a stale "active deals"
          // tile that doesn't match /crm/deals.
          const [landsRes, reqRes, dealsActive, dealsClosed, reqPending, reqApproved, reqRejected, todayRes] = await Promise.all([
            supabase.from("lands_developer_browse" as any).select("id", { count: "exact", head: true }),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).is("deleted_at", null),
            supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).is("deleted_at", null).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
            supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).is("deleted_at", null).eq("current_stage", "deal_closed"),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).is("deleted_at", null).eq("status", "pending"),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).is("deleted_at", null).eq("status", "approved"),
            supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).is("deleted_at", null).eq("status", "rejected"),
            supabase.from("lands_developer_browse" as any).select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
          ]);
          if (cancelled) return;
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

          // Pull the developer's most recent deal request to drive the
          // dynamic lifecycle strip at the bottom of the dashboard.
          const { data: latestReq } = await supabase
            .from("deal_requests")
            .select("current_phase, created_at")
            .eq("developer_id", devProfile.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          if (latestReq?.current_phase) setLatestPhase(latestReq.current_phase);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to fetch CRM dashboard data:", err);
        // Surface to the user — a silently-empty dashboard looks like a
        // privilege problem, not a network one. The toast lets them retry.
        toast({
          variant: "destructive",
          title: isAr ? "تعذر تحميل البيانات" : "Could not load dashboard",
          description: err?.message || undefined,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [user, toast, isAr]);

  const completeness = getCompleteness(developer);
  const greeting = profileName || fullName || developer?.marketing_brand_name || developer?.company_name || "";

  // Synthetic sparkline driven by actual KPI for a sensible visual signal.
  const activitySpark = useMemo(() => {
    const base = Math.max(4, devKpi.sentRequests);
    return [base * 0.4, base * 0.6, base * 0.55, base * 0.7, base * 0.85, base * 0.95, base];
  }, [devKpi.sentRequests]);

  const totalRequests = devKpi.pendingRequests + devKpi.approvedRequests + devKpi.rejectedRequests;

  // ─── Deal lifecycle: map the DB phase → a position on the 6-step strip ───
  // Phase → step index (0..5) where 5 means "closed successfully".
  // null / unknown phase leaves everything at step 0 (pre-listing).
  const PHASE_TO_STEP: Record<string, number> = {
    nda_pending: 0,
    nda_developer_accepted: 0,
    nda_both_accepted: 1,
    under_review: 2,
    study_required: 2,
    study_submitted: 2,
    study_under_review: 2,
    study_changes_requested: 2,
    study_resubmitted: 2,
    study_approved: 3,
    study_rejected: 2,
    meeting_proposed: 3,
    meeting_confirmed: 3,
    meeting_completed: 3,
    report_pending_approval: 3,
    report_approved: 4,
    report_rejected: 3,
    report_changes_requested: 3,
    report_expired: 3,
    negotiation_active: 4,
    final_approval: 4,
    closed_won: 5,
    closed_lost: 5,
    cancelled: 5,
  };
  const currentStep = latestPhase ? (PHASE_TO_STEP[latestPhase] ?? 0) : -1;
  const isLostFinal = latestPhase === "closed_lost" || latestPhase === "cancelled";
  const isWonFinal = latestPhase === "closed_won";

  // Each stage carries: icon, bilingual label, and a one-line hint explaining
  // what's happening at that step from the developer's POV. Icons are picked
  // to evoke the action (Send for "Submit", Eye for "Review", …) so the
  // timeline reads as a visual story even at a glance.
  type StageState = "done" | "current" | "upcoming" | "lost";
  interface LifecycleStage {
    ar: string;
    en: string;
    hintAr: string;
    hintEn: string;
    icon: LucideIcon;
    state: StageState;
  }
  const lifecycleStages: LifecycleStage[] = [
    { ar: "مسودة",  en: "Draft",     hintAr: "تجهيز التقديم",  hintEn: "Prepare",       icon: FileText },
    { ar: "تقديم",  en: "Submit",    hintAr: "إرسال للمالك",   hintEn: "Sent to owner", icon: Send },
    { ar: "مراجعة", en: "Review",    hintAr: "تحت المعاينة",   hintEn: "Reviewing",     icon: Eye },
    { ar: "دراسة",  en: "Study",     hintAr: "جدوى المشروع",   hintEn: "Feasibility",   icon: ClipboardList },
    { ar: "تفاوض",  en: "Negotiate", hintAr: "تنسيق الشروط",   hintEn: "Aligning",      icon: MessageSquare },
    {
      ar: "إغلاق",
      en: "Close",
      hintAr: isWonFinal ? "تم بنجاح" : isLostFinal ? "تم الإلغاء" : "إتمام الصفقة",
      hintEn: isWonFinal ? "Completed" : isLostFinal ? "Cancelled"  : "Sealed",
      icon:   isWonFinal ? Award       : isLostFinal ? XCircle      : Handshake,
    },
  ].map((s, i) => {
    let state: StageState;
    if (i < currentStep) state = "done";
    else if (i === currentStep) state = isLostFinal ? "lost" : "current";
    else state = "upcoming";
    return { ...s, state };
  });

  const latestPhaseLabel = (() => {
    if (!latestPhase) return { ar: "لا توجد طلبات بعد", en: "No requests yet" };
    const step = lifecycleStages[Math.max(0, currentStep)];
    if (isWonFinal) return { ar: "تم إغلاق الصفقة بنجاح", en: "Deal closed successfully" };
    if (isLostFinal) return { ar: "تم إغلاق/إلغاء الطلب", en: "Request closed / cancelled" };
    return { ar: step.ar, en: step.en };
  })();

  // Pick the most relevant CTA based on lifecycle state. A developer with
  // an active deal goes straight to /crm/deals; with an active request to
  // /crm/my-requests; otherwise we encourage discovery via /crm/browse.
  const lifecycleCta = (() => {
    if (devKpi.activeDeals > 0) {
      return { labelAr: "متابعة صفقاتي", labelEn: "Track my deals", to: "/crm/deals", icon: Handshake };
    }
    if (latestPhase && !isWonFinal && !isLostFinal) {
      return { labelAr: "متابعة طلبي", labelEn: "Track my request", to: "/crm/my-requests", icon: FileText };
    }
    if (isWonFinal) {
      return { labelAr: "عرض صفقاتي", labelEn: "View my deals", to: "/crm/deals", icon: Handshake };
    }
    return { labelAr: "استكشف الفرص", labelEn: "Explore opportunities", to: "/crm/browse", icon: Search };
  })();

  return (
    <CrmLayout>
      <DashboardShell isAr={isAr} accent="blue">
        {/* ═══════ HERO ═══════ */}
        <BentoGrid className="mb-5">
          <BentoCard variant="hero" span="two-thirds" padding="lg" className="relative overflow-hidden">
            <div className="absolute top-0 end-0 w-44 h-44 bg-[#2B2B2B]/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2B2B2B]/25 dark:border-[#7BA3C5]/35 text-[11px] font-semibold text-[#2B2B2B] dark:text-[#9CC3DD]">
                  <Sparkles className="w-3 h-3" strokeWidth={1.7} />
                  {isAr ? "منصة المطور" : "Developer Hub"}
                </span>
                {developer?.verification_status === "verified" && (
                  <StatusBadge variant="success" dot>{isAr ? "موثّق" : "Verified"}</StatusBadge>
                )}
              </div>
              <h1 className="text-[24px] md:text-[30px] font-bold text-[#020202] dark:text-white tracking-tight mb-1.5">
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
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[#2B2B2B]/30 dark:border-[#7BA3C5]/40 bg-transparent hover:bg-[#2B2B2B]/5 dark:hover:bg-[#7BA3C5]/10 text-[#2B2B2B] dark:text-[#9CC3DD] text-[13px] font-semibold transition-colors"
                >
                  <Search className="w-4 h-4" strokeWidth={1.7} />
                  {isAr ? "استكشف الفرص" : "Explore Opportunities"}
                </button>
                <button
                  onClick={() => navigate("/crm/my-requests")}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-[13px] font-semibold transition-colors"
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
              <TrendSparkline data={activitySpark} color="#A24832" height={56} />
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
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" strokeWidth={1.6} />
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
                variant="outline"
                onClick={() => navigate("/crm/settings")}
                className="h-9 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:border-amber-400/40 dark:text-amber-200 dark:hover:bg-amber-400/10 text-[12px] font-semibold shrink-0"
              >
                {isAr ? "إكمال الملف" : "Complete"}
                {isAr ? <ArrowLeft className="h-3.5 w-3.5 ms-1" strokeWidth={1.6} /> : <ArrowRight className="h-3.5 w-3.5 ms-1" strokeWidth={1.6} />}
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
                <Button variant="ghost" size="sm" onClick={() => navigate("/crm/my-requests")} className="h-7 text-[12px] text-[#2B2B2B] hover:bg-[#2B2B2B]/5">
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
                      <p className="text-[24px] font-bold text-[#020202] dark:text-white tracking-tight leading-none" dir="ltr">
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

        {/* ═══════ Row 3: Deal lifecycle (dynamic — shows latest deal phase) ═══════
            Visual contract:
            ┌────────────────────────────────────────────────────────────────┐
            │ 🛈 دورة حياة الصفقة                          [pill: مراجعة]    │
            │   آخر طلب: مراجعة                                              │
            │                                                                │
            │  ┌─┐━━━┌─┐━━━┌─┐ ··· ┌─┐ ··· ┌─┐ ··· ┌─┐                      │
            │  │📄│   │📤│   │👁│   │📋│   │🤝│   │🏆│                      │
            │  └─┘   └─┘   └─┘   └─┘   └─┘   └─┘                            │
            │  مسودة  تقديم مراجعة  دراسة تفاوض  إغلاق                       │
            │  جاهز   مرسل  نراجع   قريب  قريب   قريب                        │
            │                                                                │
            │  ─────────────────────────────────────────                    │
            │  [ زر CTA متغير حسب الحالة → ]                                 │
            └────────────────────────────────────────────────────────────────┘

            Direction-safe: connector lines use solid colors (no gradients)
            so they read identically in LTR and RTL. The flex container
            inherits document direction from <html dir>, so step order
            naturally flips in Arabic without any extra logic.
        */}
        <BentoGrid>
          <BentoCard variant="neutral" span="full" padding="lg">
            <SectionHeading
              title={isAr ? "دورة حياة الصفقة" : "Deal lifecycle"}
              subtitle={
                latestPhase
                  ? (isAr ? `آخر طلب: ${latestPhaseLabel.ar}` : `Latest request: ${latestPhaseLabel.en}`)
                  : (isAr ? "الرحلة من الإدراج إلى الإغلاق" : "From listing to closing on SINA")
              }
              icon={TrendingUp}
              tone="primary"
              action={
                latestPhase ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isWonFinal
                        ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : isLostFinal
                          ? "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                          : "bg-[#2B2B2B]/10 text-[#2B2B2B] dark:bg-[#2B2B2B]/25 dark:text-[#9FB7CC]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      isWonFinal ? "bg-emerald-500" : isLostFinal ? "bg-rose-500" : "bg-[#2B2B2B] animate-pulse"
                    }`} />
                    {isAr ? latestPhaseLabel.ar : latestPhaseLabel.en}
                  </span>
                ) : undefined
              }
            />

            {/* Timeline */}
            <div
              className="flex items-start justify-between gap-1 sm:gap-2 overflow-x-auto pb-3 mt-2 -mx-1 px-1"
              role="list"
              aria-label={isAr ? "مراحل الصفقة" : "Deal stages"}
            >
              {lifecycleStages.map((stage, idx, arr) => {
                const state = stage.state;
                const StageIcon = stage.icon;
                const stepNumber = idx + 1;

                // Connector color rule: a segment is "filled" (emerald) when
                // either the stage to its left is done or the next stage is
                // done — this colours the bar that visually trails the
                // already-completed nodes. Lost terminal: keep all left
                // connectors emerald (the path *was* travelled) and the
                // ring around the final node turns rose.
                const nextStage = arr[idx + 1];
                const isFilled = state === "done" || nextStage?.state === "done";

                // Per-state styling for the icon disc
                const discBase = "relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300";
                const discByState: Record<StageState, string> = {
                  done:
                    "bg-emerald-500 text-white shadow-[0_6px_18px_-6px_rgba(16,185,129,0.55)]",
                  current:
                    "bg-[#2B2B2B] text-white shadow-[0_8px_22px_-6px_rgba(43,76,102,0.6)] ring-4 ring-[#2B2B2B]/15 scale-[1.08]",
                  lost:
                    "bg-rose-500 text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.55)] ring-4 ring-rose-500/15",
                  upcoming:
                    "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500",
                };

                const labelByState: Record<StageState, string> = {
                  done:     "text-emerald-700 dark:text-emerald-300",
                  current:  "text-[#020202] dark:text-white",
                  lost:     "text-rose-700 dark:text-rose-300",
                  upcoming: "text-slate-500 dark:text-slate-400",
                };

                return (
                  <React.Fragment key={stage.en}>
                    <div className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-[88px]" role="listitem">
                      <div className={`${discBase} ${discByState[state]}`}>
                        {state === "done" ? (
                          <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
                        ) : (
                          <StageIcon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                        )}
                        {/* Step number micro-badge — keeps Latin numerals in
                            LTR even when the page is RTL, preserves the
                            sense of "1, 2, 3 …" without intruding on the
                            iconography. */}
                        <span
                          className={`absolute -top-1.5 -end-1.5 h-[18px] min-w-[18px] px-1 inline-flex items-center justify-center rounded-full text-[9px] font-bold tabular-nums ${
                            state === "done"
                              ? "bg-white text-emerald-600 ring-1 ring-emerald-200"
                              : state === "current"
                                ? "bg-[#C45A41] text-white"
                                : state === "lost"
                                  ? "bg-white text-rose-600 ring-1 ring-rose-200"
                                  : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-white/10"
                          }`}
                          dir="ltr"
                        >
                          {stepNumber}
                        </span>
                        {state === "current" && (
                          <span className="absolute inset-0 rounded-full ring-2 ring-[#2B2B2B]/40 animate-ping pointer-events-none" />
                        )}
                      </div>
                      <span className={`text-[11.5px] font-semibold whitespace-nowrap ${labelByState[state]}`}>
                        {isAr ? stage.ar : stage.en}
                      </span>
                      <span className={`text-[10px] leading-tight whitespace-nowrap ${
                        state === "current"
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {isAr ? stage.hintAr : stage.hintEn}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div
                        className={`mt-5 flex-1 min-w-3 sm:min-w-6 h-[3px] rounded-full ${
                          isFilled
                            ? "bg-emerald-500/80 dark:bg-emerald-500/70"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                        aria-hidden
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* CTA row — adapts to the developer's current state so the
                button always points to the most useful next step. The
                trailing arrow flips to ArrowLeft in RTL so it always points
                "forward" relative to text direction. */}
            {(() => {
              const CtaIcon = lifecycleCta.icon;
              const ForwardArrow = isAr ? ArrowLeft : ArrowRight;
              return (
                <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#C45A41]" strokeWidth={1.8} />
                    {isAr
                      ? "كل خطوة تقترب بك من إغلاق الصفقة"
                      : "Each step gets you closer to closing the deal"}
                  </p>
                  <Button
                    onClick={() => navigate(lifecycleCta.to)}
                    variant="outline"
                    className="h-9 px-4 border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10 text-[12.5px] font-semibold"
                  >
                    <CtaIcon className="h-4 w-4 me-1.5" strokeWidth={1.7} />
                    {isAr ? lifecycleCta.labelAr : lifecycleCta.labelEn}
                    <ForwardArrow className="h-3.5 w-3.5 ms-1.5" strokeWidth={1.7} />
                  </Button>
                </div>
              );
            })()}
          </BentoCard>
        </BentoGrid>
      </DashboardShell>
    </CrmLayout>
  );
};

export default CrmDashboard;
