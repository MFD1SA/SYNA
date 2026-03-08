import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import CrmLayout from "@/components/crm/CrmLayout";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Handshake, TrendingUp,
  HardHat, Search, Send, CheckCircle2,
  AlertTriangle, XCircle, Clock, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة التحكم" : "Dashboard");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [developer, setDeveloper] = useState<DevProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [devKpi, setDevKpi] = useState({
    browsedLands: 0, sentRequests: 0, activeDeals: 0, closedDeals: 0,
    pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0,
  });

  // Profile completeness
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
      // Get profile name
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      if (profile?.full_name) setProfileName(profile.full_name);

      // Get developer profile
      const { data: devProfile } = await supabase
        .from("developers")
        .select("id, company_name, marketing_brand_name, cr_number, cr_file_url, email, phone, website, verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (devProfile) {
        setDeveloper(devProfile as DevProfile);
        const [landsRes, reqRes, dealsActive, dealsClosed, reqPending, reqApproved, reqRejected] = await Promise.all([
          supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id),
          supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
          supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("current_stage", "deal_closed"),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("status", "pending"),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("status", "approved"),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("status", "rejected"),
        ]);
        setDevKpi({
          browsedLands: landsRes.count ?? 0,
          sentRequests: reqRes.count ?? 0,
          activeDeals: dealsActive.count ?? 0,
          closedDeals: dealsClosed.count ?? 0,
          pendingRequests: reqPending.count ?? 0,
          approvedRequests: reqApproved.count ?? 0,
          rejectedRequests: reqRejected.count ?? 0,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const completeness = getCompleteness(developer);
  const greeting = profileName || developer?.marketing_brand_name || developer?.company_name || user?.email?.split("@")[0] || "";

  const kpiCards = [
    { label: isAr ? "فرص متاحة" : "Available Opportunities", value: devKpi.browsedLands, icon: Search, href: "/crm/browse" },
    { label: isAr ? "طلباتي المقدمة" : "My Requests", value: devKpi.sentRequests, icon: Send, href: "/crm/my-requests" },
    { label: isAr ? "صفقات نشطة" : "Active Deals", value: devKpi.activeDeals, icon: Handshake, href: "/crm/deals" },
    { label: isAr ? "صفقات مُنجزة" : "Closed Deals", value: devKpi.closedDeals, icon: CheckCircle2, href: "/crm/deals" },
  ];

  const requestBreakdown = [
    { label: isAr ? "قيد المراجعة" : "Pending", value: devKpi.pendingRequests, icon: Clock, color: "text-yellow-600" },
    { label: isAr ? "مقبولة" : "Approved", value: devKpi.approvedRequests, icon: CheckCircle2, color: "text-emerald-600" },
    { label: isAr ? "مرفوضة" : "Rejected", value: devKpi.rejectedRequests, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <CrmLayout>
      {/* Greeting */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <HardHat className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-foreground">
            {isAr ? `مرحباً، ${greeting}` : `Welcome, ${greeting}`}
          </h1>
        </div>
        <p className="text-sm font-light text-muted-foreground">
          {isAr ? "متابعة الفرص والصفقات وطلبات الشراكة" : "Track opportunities, deals, and partnership requests"}
        </p>
      </div>

      {/* Profile Completeness Alert */}
      {!loading && completeness.percent < 100 && (
        <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                {isAr ? "معلوماتك غير مكتملة، يرجى إكمالها لتفادي خسارة الفرص." : "Your profile is incomplete. Please complete it to avoid missing opportunities."}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={completeness.percent} className="h-2 flex-1" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400" dir="ltr">{completeness.percent}%</span>
              </div>
              {completeness.missing.length > 0 && (
                <p className="mt-1.5 text-xs font-light text-yellow-700/80 dark:text-yellow-400/80">
                  {isAr ? "الحقول الناقصة: " : "Missing: "}{completeness.missing.join("، ")}
                </p>
              )}
              <Button variant="outline" size="sm" className="mt-2 text-xs border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/10" onClick={() => navigate("/crm/settings")}>
                {isAr ? "إكمال الملف التعريفي" : "Complete Profile"}
                <ArrowRight className="h-3 w-3 ms-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="syna-card p-4 cursor-pointer"
            onClick={() => navigate(card.href)}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">{card.label}</span>
              <card.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-medium text-foreground" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? <span className="inline-block h-7 w-14 animate-pulse rounded-lg bg-muted" /> : card.value.toLocaleString("en-US")}
            </p>
          </div>
        ))}
      </div>

      {/* Request Breakdown */}
      <div className="mt-5 doma-card p-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">
          {isAr ? "تفصيل الطلبات" : "Request Breakdown"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {requestBreakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/40 p-3">
              <item.icon className={`h-4 w-4 ${item.color}`} strokeWidth={1.5} />
              <div>
                <p className="text-lg font-medium text-foreground" dir="ltr">{loading ? "—" : item.value}</p>
                <p className="text-xs font-light text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-5 doma-card p-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">
          {isAr ? "إجراءات سريعة" : "Quick Actions"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div onClick={() => navigate("/crm/browse")} className="flex items-center gap-3 rounded-xl border border-border/40 p-4 transition-colors hover:bg-surface cursor-pointer">
            <Search className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">{isAr ? "استعراض الفرص" : "Browse Opportunities"}</p>
              <p className="text-xs font-light text-muted-foreground">{isAr ? "ابحث عن فرص تطوير جديدة" : "Find new development opportunities"}</p>
            </div>
          </div>
          <div onClick={() => navigate("/crm/my-requests")} className="flex items-center gap-3 rounded-xl border border-border/40 p-4 transition-colors hover:bg-surface cursor-pointer">
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">{isAr ? "متابعة طلباتي" : "Track My Requests"}</p>
              <p className="text-xs font-light text-muted-foreground">{isAr ? "تابع حالة طلبات الشراكة" : "Monitor partnership request status"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Flow Visual */}
      <div className="mt-5 doma-card p-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">
          {isAr ? "مسار الصفقة" : "Deal Flow"}
        </h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {[
            { ar: "مدرجة", en: "Listed" },
            { ar: "طلب مقدم", en: "Request" },
            { ar: "مراجعة الإدارة", en: "Admin Review" },
            { ar: "تمت الموافقة", en: "Approved" },
            { ar: "اجتماع", en: "Meeting" },
            { ar: "استراتيجية", en: "Strategy" },
            { ar: "مستندات", en: "Documents" },
            { ar: "إغلاق", en: "Closed" },
          ].map((stage, idx, arr) => (
            <React.Fragment key={stage.en}>
              <div className="flex shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card px-3 py-1.5">
                <span className="text-[10px] font-light text-muted-foreground whitespace-nowrap">
                  {isAr ? stage.ar : stage.en}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <TrendingUp className="h-3 w-3 shrink-0 text-border" strokeWidth={1.5} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </CrmLayout>
  );
};

export default CrmDashboard;
