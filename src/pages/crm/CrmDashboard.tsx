import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import CrmLayout from "@/components/crm/CrmLayout";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Handshake, TrendingUp,
  Search, Send, CheckCircle2,
  AlertTriangle, XCircle, Clock, ArrowRight, ArrowUpRight,
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
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      if (profile?.full_name) setProfileName(profile.full_name);

      const { data: devProfile } = await supabase
        .from("developers")
        .select("id, company_name, marketing_brand_name, cr_number, cr_file_url, email, phone, website, verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (devProfile) {
        setDeveloper(devProfile as DevProfile);
        const [landsRes, reqRes, dealsActive, dealsClosed, reqPending, reqApproved, reqRejected] = await Promise.all([
          supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true).eq("owner_approved", true),
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
  const greeting = profileName || fullName || developer?.marketing_brand_name || developer?.company_name || "";

  const kpiCards = [
    { label: isAr ? "فرص متاحة" : "Opportunities", value: devKpi.browsedLands, icon: Search, href: "/crm/browse" },
    { label: isAr ? "طلباتي" : "My Requests", value: devKpi.sentRequests, icon: Send, href: "/crm/my-requests" },
    { label: isAr ? "صفقات نشطة" : "Active Deals", value: devKpi.activeDeals, icon: Handshake, href: "/crm/deals" },
    { label: isAr ? "صفقات منجزة" : "Closed Deals", value: devKpi.closedDeals, icon: CheckCircle2, href: "/crm/deals" },
  ];

  const requestBreakdown = [
    { label: isAr ? "قيد المراجعة" : "Pending", value: devKpi.pendingRequests, icon: Clock, accent: "text-amber-600" },
    { label: isAr ? "مقبولة" : "Approved", value: devKpi.approvedRequests, icon: CheckCircle2, accent: "text-emerald-600" },
    { label: isAr ? "مرفوضة" : "Rejected", value: devKpi.rejectedRequests, icon: XCircle, accent: "text-red-500" },
  ];

  return (
    <CrmLayout>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {isAr ? `مرحبا، ${greeting}` : `Welcome, ${greeting}`}
        </h1>
        <p className="mt-1.5 text-sm font-light text-muted-foreground">
          {isAr ? "متابعة الفرص والصفقات وطلبات الشراكة" : "Track opportunities, deals, and partnership requests"}
        </p>
      </div>

      {/* Profile Completeness Alert */}
      {!loading && completeness.percent < 100 && (
        <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {isAr ? "معلوماتك غير مكتملة" : "Your profile is incomplete"}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={completeness.percent} className="h-1.5 flex-1" />
                <span className="text-xs font-semibold text-amber-700" dir="ltr">{completeness.percent}%</span>
              </div>
              {completeness.missing.length > 0 && (
                <p className="mt-1.5 text-[11px] text-amber-700/70">
                  {isAr ? "ناقص: " : "Missing: "}{completeness.missing.join(isAr ? "، " : ", ")}
                </p>
              )}
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-amber-700 hover:bg-amber-100/60 px-2" onClick={() => navigate("/crm/settings")}>
                {isAr ? "إكمال الملف" : "Complete Profile"}
                <ArrowRight className="h-3 w-3 ms-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="group relative bg-card rounded-xl border border-border/50 p-5 cursor-pointer transition-all duration-200 hover:shadow-[0_2px_12px_rgba(43,76,102,0.06)] hover:border-[#2B4C66]/15"
            onClick={() => navigate(card.href)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{card.label}</span>
              <div className="h-8 w-8 rounded-lg bg-[#2B4C66]/[0.06] flex items-center justify-center">
                <card.icon className="h-4 w-4 text-[#2B4C66]/60" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[28px] font-bold text-foreground leading-none tracking-tight" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? <span className="inline-block h-7 w-14 animate-pulse rounded bg-muted" /> : card.value.toLocaleString("en-US")}
            </p>
            <ArrowUpRight className="absolute end-3 bottom-3 h-3.5 w-3.5 text-border transition-colors duration-200 group-hover:text-[#2B4C66]" />
          </div>
        ))}
      </div>

      {/* Request Breakdown */}
      <div className="mt-6 rounded-xl border border-border/50 bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">{isAr ? "تحليل مسار الطلبات" : "Requests Pipeline"}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/crm/my-requests")} className="h-7 text-xs text-[#2B4C66] hover:bg-[#2B4C66]/5 px-2">
            {isAr ? "عرض التفاصيل" : "View Details"}
            <ArrowRight className="h-3 w-3 ms-1" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {requestBreakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/5 p-4 transition-all duration-200 hover:bg-muted/15 hover:shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <item.icon className={`h-5 w-5 ${item.accent}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tracking-tight" dir="ltr">{loading ? "—" : item.value}</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Deal Flow + Quick Actions */}
      <div className="mt-6 grid lg:grid-cols-3 gap-5">
        {/* Deal Flow */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-6 flex flex-col shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-semibold text-foreground mb-2">{isAr ? "مسار الصفقة" : "Deal Lifecycle"}</h3>
          <p className="text-[11px] text-muted-foreground mb-5 max-w-lg leading-relaxed">
            {isAr ? "رحلة الصفقة من الإدراج وحتى الإغلاق عبر منصة سينا" : "The journey of an opportunity from listing to closing on SYNA"}
          </p>
          <div className="mt-auto flex items-center gap-0 overflow-x-auto pb-2">
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
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    idx === arr.length - 1
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{isAr ? stage.ar : stage.en}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-10 h-px bg-border mb-5">
                    <TrendingUp className="relative -top-[5px] start-3 h-2.5 w-2.5 text-gray-300" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-semibold text-foreground mb-4">{isAr ? "إجراءات سريعة" : "Quick Actions"}</h3>
          <div className="flex flex-col gap-2.5">
            <div onClick={() => navigate("/crm/browse")} className="group flex items-center gap-3 rounded-lg border border-border/40 p-3.5 transition-all hover:bg-primary/5 hover:border-primary/20 cursor-pointer">
              <Search className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{isAr ? "استكشاف الفرص" : "Explore Opportunities"}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "عرض وتحليل الأراضي المتاحة" : "View and analyze available lands"}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-primary transition-colors" />
            </div>
            <div onClick={() => navigate("/crm/my-requests")} className="group flex items-center gap-3 rounded-lg border border-border/40 p-3.5 transition-all hover:bg-primary/5 hover:border-primary/20 cursor-pointer">
              <FileText className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{isAr ? "طلبات الشراكة" : "Partnership Requests"}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "متابعة حالة طلباتك" : "Track your request status"}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </CrmLayout>
  );
};

export default CrmDashboard;
