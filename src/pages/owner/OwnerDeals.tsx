import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import OwnerLayout from "@/components/owner/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DealStagePipeline from "@/components/deal/DealStagePipeline";
import MeetingsList from "@/components/deal/MeetingsList";
import CommissionBreakdown from "@/components/deal/CommissionBreakdown";
import LegalDocPrintView from "@/components/land/LegalDocPrintView";
import { stageConfig, healthLabels, commissionStatusLabels } from "@/components/deal/dealStageConfig";
import { defaultLandForm, LandFormData } from "@/components/land/LandFormConstants";
import {
  Handshake, Building2, MapPin, Eye, FileText,
} from "lucide-react";

const OwnerDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "صفقاتي" : "My Deals");
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDeal, setViewDeal] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showLegalDoc, setShowLegalDoc] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("deals")
        .select("*, developers(company_name, marketing_brand_name), lands(city, district, land_area_sqm, estimated_price_per_sqm, estimated_total_value, owner_name, usage_type, partnership_goal, project_model, deed_number, plan_number)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
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

  const buildLandForm = (land: any): LandFormData => ({
    ...defaultLandForm,
    city: land?.city || "",
    district: land?.district || "",
    land_area_sqm: String(land?.land_area_sqm || ""),
    estimated_price_per_sqm: String(land?.estimated_price_per_sqm || ""),
    estimated_total_value: String(land?.estimated_total_value || ""),
    usage_type: land?.usage_type || "residential",
    partnership_goal: land?.partnership_goal || "develop_sell",
    project_model: land?.project_model || "development_partnership",
    deed_number: land?.deed_number || "",
    plan_number: land?.plan_number || "",
    owner_name: land?.owner_name || "",
  });

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
            const isCancelled = deal.current_stage === "deal_cancelled";
            const isClosed = deal.current_stage === "deal_closed";
            const hc = healthLabels[deal.health] || healthLabels.green;

            return (
              <div key={deal.id} className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 cursor-pointer" onClick={() => openDealDetail(deal)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${hc.dot}`} />
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
                {!isCancelled && <DealStagePipeline currentStage={deal.current_stage} isAr={isAr} compact />}
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
            const isCancelled = viewDeal.current_stage === "deal_cancelled";
            const hc = healthLabels[viewDeal.health] || healthLabels.green;
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
                  <Badge variant="outline" className={`gap-1 ${hc.bg} ${hc.text} border-transparent`}>
                    <div className={`h-2 w-2 rounded-full ${hc.dot}`} />
                    {isAr ? hc.ar : hc.en}
                  </Badge>
                </div>

                {!isCancelled && <DealStagePipeline currentStage={viewDeal.current_stage} isAr={isAr} />}

                <MeetingsList meetings={meetings} isAr={isAr} showSupervisorInfo />

                <CommissionBreakdown
                  isAr={isAr}
                  estimatedPricePerSqm={viewDeal.lands?.estimated_price_per_sqm || 0}
                  estimatedTotalValue={viewDeal.lands?.estimated_total_value || 0}
                  landAreaSqm={viewDeal.lands?.land_area_sqm || 0}
                />

                {/* Legal Acknowledgment Button */}
                <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => setShowLegalDoc(true)}>
                  <FileText className="h-3.5 w-3.5" />
                  {isAr ? "عرض وثيقة الإقرار القانوني" : "View Legal Acknowledgment"}
                </Button>

                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "حالة العمولة:" : "Commission:"}{" "}
                  {isAr ? commissionStatusLabels[viewDeal.commission_status]?.ar : commissionStatusLabels[viewDeal.commission_status]?.en}
                  {" • "}
                  {isAr ? "تاريخ الإنشاء:" : "Created:"} {new Date(viewDeal.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Legal Doc Print View */}
      {viewDeal && (
        <LegalDocPrintView
          open={showLegalDoc}
          onClose={() => setShowLegalDoc(false)}
          form={buildLandForm(viewDeal.lands)}
          referenceNumber={viewDeal.id?.substring(0, 8).toUpperCase()}
          ownerName={viewDeal.lands?.owner_name}
          companyName={viewDeal.developers?.company_name}
          dealId={viewDeal.id}
          viewerRole="owner"
          ownerAcknowledged={viewDeal.owner_acknowledgment_accepted}
          ownerAcknowledgedDate={viewDeal.owner_acknowledgment_date}
          developerAcknowledged={viewDeal.developer_acknowledgment_accepted}
          developerAcknowledgedDate={viewDeal.developer_acknowledgment_date}
          onAcknowledged={() => {
            setViewDeal((prev: any) => prev ? { ...prev, owner_acknowledgment_accepted: true, owner_acknowledgment_date: new Date().toISOString() } : prev);
            setDeals(prev => prev.map(d => d.id === viewDeal.id ? { ...d, owner_acknowledgment_accepted: true, owner_acknowledgment_date: new Date().toISOString() } : d));
          }}
        />
      )}
    </OwnerLayout>
  );
};

export default OwnerDeals;
