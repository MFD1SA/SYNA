import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import OwnerLayout from "@/components/owner/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Handshake, TrendingUp, Building2, MapPin } from "lucide-react";

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

const OwnerDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "صفقاتي" : "My Deals");
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("deals")
        .select("*, developers(company_name, marketing_brand_name), lands(city, district)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      setDeals(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <OwnerLayout>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "صفقاتي" : "My Deals"}</h1>
        </div>
        <p className="text-sm font-light text-muted-foreground">{isAr ? "متابعة مراحل الصفقات مع المطورين" : "Track deal stages with developers"}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Handshake className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد صفقات حالياً" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const stage = stageLabels[deal.current_stage] || { ar: deal.current_stage, en: deal.current_stage };
            return (
              <div key={deal.id} className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {deal.developers?.marketing_brand_name || deal.developers?.company_name || (isAr ? "مطور" : "Developer")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{deal.lands?.city}{deal.lands?.district ? ` - ${deal.lands.district}` : ""}</span>
                    </div>
                    {/* Deal flow */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 mt-2">
                      {Object.entries(stageLabels).filter(([k]) => k !== "deal_cancelled").map(([key, val], idx, arr) => {
                        const isCurrent = key === deal.current_stage;
                        const isPast = Object.keys(stageLabels).indexOf(key) < Object.keys(stageLabels).indexOf(deal.current_stage);
                        return (
                          <React.Fragment key={key}>
                            <div className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] ${isCurrent ? "bg-primary/15 text-primary font-medium" : isPast ? "bg-muted text-muted-foreground" : "text-muted-foreground/40"}`}>
                              {isAr ? val.ar : val.en}
                            </div>
                            {idx < arr.length - 1 && <TrendingUp className="h-2.5 w-2.5 shrink-0 text-border" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${healthColors[deal.health] || "bg-muted"}`} title={deal.health} />
                    <Badge variant="outline" className="text-[10px]">
                      {isAr ? stage.ar : stage.en}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OwnerLayout>
  );
};

export default OwnerDeals;
