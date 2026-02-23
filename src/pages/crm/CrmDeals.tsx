import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import { Handshake, TrendingUp } from "lucide-react";

const stageLabels: Record<string, { ar: string; en: string }> = {
  listed: { ar: "مدرجة", en: "Listed" },
  request_submitted: { ar: "طلب مقدم", en: "Request Submitted" },
  owner_review: { ar: "مراجعة المالك", en: "Owner Review" },
  owner_approved: { ar: "تمت الموافقة", en: "Approved" },
  meeting_scheduled: { ar: "اجتماع محدد", en: "Meeting Scheduled" },
  strategy_defined: { ar: "استراتيجية محددة", en: "Strategy Defined" },
  documents_exchanged: { ar: "تبادل مستندات", en: "Documents Exchanged" },
  agreements_prepared: { ar: "اتفاقيات جاهزة", en: "Agreements Ready" },
  deal_closed: { ar: "مغلقة", en: "Closed" },
  deal_cancelled: { ar: "ملغاة", en: "Cancelled" },
};

const healthColors: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

const CrmDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الصفقات" : "Deals");
  const isAr = lang === "ar";
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: devProfile } = await supabase.from("developers").select("id").eq("user_id", user.id).maybeSingle();
      const isDev = !!devProfile;
      setIsDeveloper(isDev);

      const { data } = await supabase
        .from("deals")
        .select("*, lands(city, district, land_area_sqm), developers(company_name, marketing_brand_name)")
        .order("created_at", { ascending: false });

      setDeals(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const stageOrder = ["listed", "request_submitted", "owner_review", "owner_approved", "meeting_scheduled", "strategy_defined", "documents_exchanged", "agreements_prepared", "deal_closed"];

  const getStageIndex = (stage: string) => stageOrder.indexOf(stage);

  return (
    <CrmLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "الصفقات" : "Deals"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "متابعة جميع صفقات الشراكة ومراحلها" : "Track all partnership deals and their stages"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Handshake className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد صفقات بعد" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((d) => {
            const stage = stageLabels[d.current_stage] || { ar: d.current_stage, en: d.current_stage };
            const stageIdx = getStageIndex(d.current_stage);
            const isClosed = d.current_stage === "deal_closed";
            const isCancelled = d.current_stage === "deal_cancelled";

            return (
              <div key={d.id} className="doma-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${healthColors[d.health] || "bg-muted"}`} />
                      <h3 className="text-sm font-medium text-foreground">
                        {d.lands?.city}{d.lands?.district ? ` - ${d.lands.district}` : ""}
                      </h3>
                    </div>
                    <p className="text-xs font-light text-muted-foreground ps-4">
                      {isDeveloper
                        ? (isAr ? "المساحة: " : "Area: ") + Number(d.lands?.land_area_sqm).toLocaleString() + (isAr ? " م²" : " sqm")
                        : (isAr ? "المطور: " : "Developer: ") + (d.developers?.company_name || d.developers?.marketing_brand_name || "-")}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${
                      isClosed ? "bg-green-500/10 text-green-600" :
                      isCancelled ? "bg-destructive/10 text-destructive" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {isAr ? stage.ar : stage.en}
                    </span>
                    <p className="mt-1 text-[10px] font-light text-muted-foreground">{isAr ? "العمولة:" : "Commission:"} {d.commission_rate}%</p>
                  </div>
                </div>

                {/* Progress bar */}
                {!isCancelled && (
                  <div className="flex items-center gap-0.5">
                    {stageOrder.slice(0, -1).map((s, idx) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          idx <= stageIdx ? "bg-primary" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmDeals;
