import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import CrmLayout from "@/components/crm/CrmLayout";
import {
  FileText, Handshake, TrendingUp,
  HardHat, Search, Send, CheckCircle2,
} from "lucide-react";

const CrmDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [devKpi, setDevKpi] = useState({ browsedLands: 0, sentRequests: 0, activeDeals: 0, closedDeals: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get developer profile
      const { data: devProfile } = await supabase
        .from("developers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (devProfile) {
        const [landsRes, reqRes, dealsActive, dealsClosed] = await Promise.all([
          supabase.from("lands").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id),
          supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).neq("current_stage", "deal_closed").neq("current_stage", "deal_cancelled"),
          supabase.from("deals").select("id", { count: "exact", head: true }).eq("developer_id", devProfile.id).eq("current_stage", "deal_closed"),
        ]);
        setDevKpi({
          browsedLands: landsRes.count ?? 0,
          sentRequests: reqRes.count ?? 0,
          activeDeals: dealsActive.count ?? 0,
          closedDeals: dealsClosed.count ?? 0,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const devCards = [
    { label: isAr ? "فرص متاحة" : "Available Opportunities", value: devKpi.browsedLands, icon: Search },
    { label: isAr ? "طلباتي المقدمة" : "My Requests", value: devKpi.sentRequests, icon: Send },
    { label: isAr ? "صفقات نشطة" : "Active Deals", value: devKpi.activeDeals, icon: Handshake },
    { label: isAr ? "صفقات مُنجزة" : "Closed Deals", value: devKpi.closedDeals, icon: CheckCircle2 },
  ];

  return (
    <CrmLayout>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <HardHat className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-foreground">
            {isAr ? "لوحة تحكم المطور" : "Developer Dashboard"}
          </h1>
        </div>
        <p className="text-sm font-light text-muted-foreground">
          {isAr ? "متابعة الفرص والصفقات وطلبات الشراكة" : "Track opportunities, deals, and partnership requests"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {devCards.map((card) => (
          <div key={card.label} className="doma-card p-4">
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
