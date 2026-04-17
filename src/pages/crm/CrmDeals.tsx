import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import DealAutomationPanel, { DealDocumentItem } from "@/components/crm/DealAutomationPanel";
import DashboardShell from "@/components/dashboard/DashboardShell";
import BentoCard from "@/components/dashboard/BentoCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Handshake, Building2, Eye, FileText,
} from "lucide-react";
import DealStagePipeline from "@/components/deal/DealStagePipeline";
import MeetingsList from "@/components/deal/MeetingsList";
import CommissionBreakdown from "@/components/deal/CommissionBreakdown";
import LegalDocPrintView from "@/components/land/LegalDocPrintView";
import { stageConfig, healthLabels, commissionStatusLabels } from "@/components/deal/dealStageConfig";
import { defaultLandForm, LandFormData } from "@/components/land/LandFormConstants";

const driveUrlSchema = z
  .string().trim().url("invalid")
  .refine((value) => {
    try { const u = new URL(value); return ["drive.google.com", "docs.google.com"].includes(u.hostname); } catch { return false; }
  }, "invalid_drive");

const CrmDeals: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  usePageTitle(lang === "ar" ? "الصفقات" : "Deals");
  const isAr = lang === "ar";

  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDeal, setViewDeal] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [dealDocuments, setDealDocuments] = useState<DealDocumentItem[]>([]);
  const [driveUrl, setDriveUrl] = useState("");
  const [validatingLink, setValidatingLink] = useState(false);
  const [linkValidated, setLinkValidated] = useState(false);
  const [validationNote, setValidationNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState(false);

  const fetchDeals = useCallback(async () => {
    if (!user) return;
    const { data: devProfile } = await supabase.from("developers").select("id").eq("user_id", user.id).maybeSingle();
    if (!devProfile) {
      // No developer profile found — do not fetch deals without a filter
      setDeals([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("deals")
      .select("*, lands(city, district, land_area_sqm, estimated_price_per_sqm, estimated_total_value, usage_type, partnership_goal, project_model, deed_number, plan_number), developers(company_name, marketing_brand_name)")
      .eq("developer_id", devProfile.id)
      .order("created_at", { ascending: false });
    setDeals(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const fetchDealExtras = useCallback(async (dealId: string) => {
    const [meetingsRes, docsRes] = await Promise.all([
      supabase.from("deal_meetings").select("*").eq("deal_id", dealId).order("scheduled_at", { ascending: false }),
      (supabase as any).from("deal_documents").select("id, document_url, verified, created_at").eq("deal_id", dealId).order("created_at", { ascending: false }),
    ]);
    const docs: DealDocumentItem[] = docsRes?.data || [];
    setMeetings(meetingsRes.data || []);
    setDealDocuments(docs);
    if (docs.length > 0) {
      setDriveUrl(docs[0].document_url || "");
      setLinkValidated(Boolean(docs[0].verified));
      setValidationNote(docs[0].verified ? (isAr ? "تم حفظ الرابط والتحقق منه." : "Saved and verified.") : "");
    } else {
      setDriveUrl(""); setLinkValidated(false); setValidationNote("");
    }
  }, [isAr]);

  const openDealDetail = async (deal: any) => {
    setViewDeal(deal);
    await fetchDealExtras(deal.id);
  };

  const handleValidateDriveLink = async () => {
    const parsed = driveUrlSchema.safeParse(driveUrl);
    if (!parsed.success) {
      toast({ variant: "destructive", title: isAr ? "رابط غير صالح" : "Invalid link" });
      setLinkValidated(false); return;
    }
    setValidatingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke("deal-drive-automation", { body: { action: "validate_link", documentUrl: parsed.data } });
      if (error) throw new Error(error.message);
      if (!data?.valid) throw new Error(data?.error || "Validation failed");
      setLinkValidated(true);
      setValidationNote(isAr ? "تم التحقق من الرابط بنجاح." : "Link validated successfully.");
      toast({ title: isAr ? "تم التحقق من الرابط" : "Link validated" });
    } catch (err: any) {
      setLinkValidated(false);
      setValidationNote(isAr ? "تعذر التحقق من الرابط." : "Unable to validate link.");
      toast({ variant: "destructive", title: isAr ? "فشل التحقق" : "Validation failed", description: err.message });
    } finally { setValidatingLink(false); }
  };

  const handleSubmitDriveAndAdvance = async () => {
    if (!viewDeal || !linkValidated) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("deal-drive-automation", { body: { action: "submit_drive_link", dealId: viewDeal.id, documentUrl: driveUrl.trim() } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error);
      const nextStage = data?.deal?.current_stage || "agreements_prepared";
      setViewDeal((prev: any) => prev ? { ...prev, current_stage: nextStage } : prev);
      setDeals((prev) => prev.map((d) => (d.id === viewDeal.id ? { ...d, current_stage: nextStage } : d)));
      await fetchDealExtras(viewDeal.id);
      toast({ title: isAr ? "تم اعتماد الرابط" : "Link approved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally { setActionLoading(false); }
  };

  const handleCloseDeal = async () => {
    if (!viewDeal) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("deal-drive-automation", { body: { action: "close_deal", dealId: viewDeal.id } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error);
      setViewDeal((prev: any) => prev ? { ...prev, current_stage: "deal_closed", closed_at: data?.deal?.closed_at } : prev);
      setDeals((prev) => prev.map((d) => (d.id === viewDeal.id ? { ...d, current_stage: "deal_closed" } : d)));
      toast({ title: isAr ? "تم إغلاق الصفقة" : "Deal closed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally { setActionLoading(false); }
  };

  const buildLandForm = (land: any): LandFormData => ({
    ...defaultLandForm,
    city: land?.city || "", district: land?.district || "",
    land_area_sqm: String(land?.land_area_sqm || ""),
    estimated_price_per_sqm: String(land?.estimated_price_per_sqm || ""),
    estimated_total_value: String(land?.estimated_total_value || ""),
    usage_type: land?.usage_type || "residential",
    partnership_goal: land?.partnership_goal || "develop_sell",
    project_model: land?.project_model || "development_partnership",
    deed_number: land?.deed_number || "", plan_number: land?.plan_number || "",
    owner_name: "",  // Owner identity masked until final agreement phase
  });

  return (
    <CrmLayout>
      <DashboardShell isAr={isAr} accent="blue">
        <BentoCard variant="hero" span="full" padding="lg" className="relative overflow-hidden mb-5">
          <div className="absolute top-0 end-0 w-60 h-60 bg-[#C2A86B]/10 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C2A86B]/15 text-[11px] font-semibold text-[#A88A4A] mb-2">
                <Handshake className="w-3 h-3" strokeWidth={2} />
                {isAr ? "الصفقات" : "Deals"}
              </span>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#1E374B] dark:text-white tracking-tight">
                {isAr ? "صفقاتي النشطة" : "My Active Deals"}
              </h1>
              <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                {isAr ? "متابعة جميع صفقات الشراكة ومراحلها" : "Track all partnership deals and their stages"}
              </p>
            </div>
            {!loading && deals.length > 0 && (
              <div className="px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{isAr ? "الصفقات" : "Deals"}</p>
                <p className="text-[22px] font-bold text-[#1E374B] dark:text-white tracking-tight leading-none mt-1" dir="ltr">{deals.length}</p>
              </div>
            )}
          </div>
        </BentoCard>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Handshake className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد صفقات بعد" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "معلومات الصفقة" : "Deal Info"}</th>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide min-w-[300px]">{isAr ? "مسار الصفقة (Pipeline)" : "Pipeline Progress"}</th>
                  <th className="px-5 py-3.5 font-medium text-end text-xs tracking-wide">{isAr ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {deals.map((d) => {
                  const stage = stageConfig[d.current_stage] || { ar: d.current_stage, en: d.current_stage, color: "" };
                  const isCancelled = d.current_stage === "deal_cancelled";
                  const isClosed = d.current_stage === "deal_closed";
                  const hc = healthLabels[d.health] || healthLabels.green;
                  
                  return (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openDealDetail(d)}>
                      <td className="px-5 py-4 min-w-[200px] align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                          <h3 className="text-sm font-medium text-foreground">{d.lands?.city}{d.lands?.district ? ` - ${d.lands.district}` : ""}</h3>
                        </div>
                        <p className="text-xs font-light text-muted-foreground ms-6">{Number(d.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
                      </td>
                      <td className="px-5 py-4 align-top pt-5">
                        {!isCancelled ? (
                          <DealStagePipeline currentStage={d.current_stage} isAr={isAr} compact />
                        ) : (
                          <span className="text-xs text-muted-foreground italic px-2">{isAr ? "الصفقة ملغاة" : "Deal cancelled"}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-end align-top">
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant="outline" className={`text-[10px] ${isClosed ? "bg-emerald-500/10 text-emerald-600" : isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                            {isAr ? stage.ar : stage.en}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] gap-1 border-transparent ${hc.bg} ${hc.text}`}>
                            <div className={`h-1 w-1 rounded-full ${hc.dot}`} />
                            {isAr ? hc.ar : hc.en}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </DashboardShell>

      <Dialog open={!!viewDeal} onOpenChange={(o) => { if (!o) setViewDeal(null); }}>
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
                    <p className="text-sm font-medium text-foreground">{viewDeal.lands?.city}{viewDeal.lands?.district ? ` - ${viewDeal.lands.district}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{Number(viewDeal.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
                  </div>
                  <Badge variant="outline" className={`gap-1 ${hc.bg} ${hc.text} border-transparent`}>
                    <div className={`h-2 w-2 rounded-full ${hc.dot}`} />
                    {isAr ? hc.ar : hc.en}
                  </Badge>
                </div>
                {!isCancelled && <DealStagePipeline currentStage={viewDeal.current_stage} isAr={isAr} />}

                <DealAutomationPanel
                  isAr={isAr} currentStage={viewDeal.current_stage}
                  driveUrl={driveUrl} validationNote={validationNote}
                  validatingLink={validatingLink} linkValidated={linkValidated}
                  actionLoading={actionLoading} documents={dealDocuments}
                  onDriveUrlChange={(v) => { setDriveUrl(v); setLinkValidated(false); if (validationNote) setValidationNote(""); }}
                  onValidateLink={handleValidateDriveLink}
                  onSubmitLinkAndApprove={handleSubmitDriveAndAdvance}
                  onCloseDeal={handleCloseDeal}
                />

                <MeetingsList meetings={meetings} isAr={isAr} />

                <CommissionBreakdown
                  isAr={isAr}
                  estimatedPricePerSqm={viewDeal.lands?.estimated_price_per_sqm || 0}
                  estimatedTotalValue={viewDeal.lands?.estimated_total_value || 0}
                  landAreaSqm={viewDeal.lands?.land_area_sqm || 0}
                />

                <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => setShowLegalDoc(true)}>
                  <FileText className="h-3.5 w-3.5" />
                  {isAr ? "عرض وثيقة الإقرار القانوني" : "View Legal Acknowledgment"}
                </Button>

                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "حالة العمولة:" : "Commission:"}{" "}
                  {isAr ? commissionStatusLabels[viewDeal.commission_status]?.ar : commissionStatusLabels[viewDeal.commission_status]?.en}
                  {" • "}{isAr ? "تاريخ الإنشاء:" : "Created:"} {new Date(viewDeal.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {viewDeal && (
        <LegalDocPrintView
          open={showLegalDoc}
          onClose={() => setShowLegalDoc(false)}
          form={buildLandForm(viewDeal.lands)}
          referenceNumber={viewDeal.id?.substring(0, 8).toUpperCase()}
          ownerName=""
          companyName={viewDeal.developers?.company_name}
          dealId={viewDeal.id}
          viewerRole="developer"
          ownerAcknowledged={viewDeal.owner_acknowledgment_accepted}
          ownerAcknowledgedDate={viewDeal.owner_acknowledgment_date}
          developerAcknowledged={viewDeal.developer_acknowledgment_accepted}
          developerAcknowledgedDate={viewDeal.developer_acknowledgment_date}
          onAcknowledged={() => {
            setViewDeal((prev: any) => prev ? { ...prev, developer_acknowledgment_accepted: true, developer_acknowledgment_date: new Date().toISOString() } : prev);
            setDeals(prev => prev.map(d => d.id === viewDeal.id ? { ...d, developer_acknowledgment_accepted: true, developer_acknowledgment_date: new Date().toISOString() } : d));
          }}
        />
      )}
    </CrmLayout>
  );
};

export default CrmDeals;
