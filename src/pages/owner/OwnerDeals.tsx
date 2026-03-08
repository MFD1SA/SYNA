import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import OwnerLayout from "@/components/owner/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Handshake, TrendingUp, Building2, MapPin, CheckCircle2, XCircle,
  Video, CalendarClock, Eye, Link2, Shield,
} from "lucide-react";

const stageConfig: Record<string, { ar: string; en: string }> = {
  listed: { ar: "مدرجة", en: "Listed" },
  request_submitted: { ar: "طلب مقدم", en: "Submitted" },
  owner_review: { ar: "مراجعة", en: "Review" },
  owner_approved: { ar: "موافقة", en: "Approved" },
  meeting_scheduled: { ar: "اجتماع", en: "Meeting" },
  strategy_defined: { ar: "استراتيجية", en: "Strategy" },
  documents_exchanged: { ar: "مستندات", en: "Documents" },
  agreements_prepared: { ar: "اتفاقيات", en: "Agreements" },
  deal_closed: { ar: "مغلقة", en: "Closed" },
  deal_cancelled: { ar: "ملغاة", en: "Cancelled" },
};

const stageOrder = ["listed", "request_submitted", "owner_review", "owner_approved", "meeting_scheduled", "strategy_defined", "documents_exchanged", "agreements_prepared", "deal_closed"];

const OwnerDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "صفقاتي" : "My Deals");
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDeal, setViewDeal] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("deals").select("*, developers(company_name, marketing_brand_name), lands(city, district, land_area_sqm)").eq("owner_id", user.id).order("created_at", { ascending: false });
      setDeals(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const openDealDetail = async (deal: any) => {
    setViewDeal(deal);
    const { data } = await supabase.from("deal_meetings").select("*").eq("deal_id", deal.id).order("scheduled_at", { ascending: false });
    setMeetings(data || []);
  };

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
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Handshake className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد صفقات حالياً" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => {
            const stage = stageConfig[deal.current_stage] || { ar: deal.current_stage, en: deal.current_stage };
            const stageIdx = stageOrder.indexOf(deal.current_stage);
            const isCancelled = deal.current_stage === "deal_cancelled";
            const isClosed = deal.current_stage === "deal_closed";

            return (
              <div key={deal.id} className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 cursor-pointer" onClick={() => openDealDetail(deal)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${deal.health === "green" ? "bg-emerald-500" : deal.health === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                      <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {deal.developers?.marketing_brand_name || deal.developers?.company_name || (isAr ? "مطور" : "Developer")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground ps-5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{deal.lands?.city}{deal.lands?.district ? ` - ${deal.lands.district}` : ""}</span>
                      <span>• {Number(deal.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${
                      isClosed ? "bg-emerald-500/10 text-emerald-600" : isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    }`}>
                      {isAr ? stage.ar : stage.en}
                    </Badge>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                {!isCancelled && (
                  <div className="flex items-center gap-0.5">
                    {stageOrder.map((s, idx) => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= stageIdx ? "bg-primary" : "bg-border"}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deal Detail Dialog */}
      <Dialog open={!!viewDeal} onOpenChange={o => { if (!o) setViewDeal(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              {isAr ? "تفاصيل الصفقة" : "Deal Details"}
            </DialogTitle>
          </DialogHeader>
          {viewDeal && (() => {
            const stageIdx = stageOrder.indexOf(viewDeal.current_stage);
            const isCancelled = viewDeal.current_stage === "deal_cancelled";
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {viewDeal.developers?.marketing_brand_name || viewDeal.developers?.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {viewDeal.lands?.city}{viewDeal.lands?.district ? ` - ${viewDeal.lands.district}` : ""} • {Number(viewDeal.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                    </p>
                  </div>
                  <Badge variant="outline" className={`gap-1 ${viewDeal.health === "green" ? "bg-emerald-500/10 text-emerald-600" : viewDeal.health === "yellow" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"} border-transparent`}>
                    <div className={`h-2 w-2 rounded-full ${viewDeal.health === "green" ? "bg-emerald-500" : viewDeal.health === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                    {viewDeal.health === "green" ? (isAr ? "سليمة" : "Healthy") : viewDeal.health === "yellow" ? (isAr ? "تحتاج متابعة" : "Needs Attention") : (isAr ? "متعثرة" : "At Risk")}
                  </Badge>
                </div>

                {!isCancelled && (
                  <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                    <div className="flex items-center gap-1">
                      {stageOrder.map((s, idx) => {
                        const isActive = s === viewDeal.current_stage;
                        const isPast = idx < stageIdx;
                        return (
                          <div key={s} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                              isActive ? "border-primary bg-primary/10" : isPast ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                            }`}>
                              {isPast ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <span className={`text-[9px] font-bold ${isActive ? "text-primary" : "text-muted-foreground/30"}`}>{idx + 1}</span>}
                            </div>
                            <span className={`text-[8px] text-center ${isActive ? "font-medium text-primary" : isPast ? "text-emerald-600" : "text-muted-foreground/40"}`}>
                              {isAr ? stageConfig[s]?.ar : stageConfig[s]?.en}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {meetings.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-violet-600" />
                      {isAr ? "الاجتماعات" : "Meetings"}
                    </h6>
                    {meetings.map(m => (
                      <div key={m.id} className="rounded-lg border border-border/30 p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3 w-3 text-violet-600" />
                          <span className="text-xs font-medium">{new Date(m.scheduled_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                          <span className="text-xs text-muted-foreground">{new Date(m.scheduled_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                          <Badge variant="outline" className="text-[9px]">{m.meeting_type === "google_meet" ? "Google Meet" : (isAr ? "حضوري" : "In Person")}</Badge>
                        </div>
                        {m.meet_link && (
                          <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Link2 className="h-3 w-3" />{isAr ? "انضم للاجتماع" : "Join Meeting"}
                          </a>
                        )}
                        {m.notes && (
                          <div className="rounded-md bg-muted/30 p-2 mt-1">
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{isAr ? "تفاصيل الاجتماع (من المشرف):" : "Meeting Details (from supervisor):"}</p>
                            <p className="text-xs text-foreground">{m.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700">{isAr ? "حقوق المنصة محفوظة" : "Platform rights protected"}</p>
                </div>

                <p className="text-[10px] text-muted-foreground">{isAr ? "تاريخ الإنشاء:" : "Created:"} {new Date(viewDeal.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
};

export default OwnerDeals;
