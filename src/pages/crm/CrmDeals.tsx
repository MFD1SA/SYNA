import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import DealAutomationPanel, { DealDocumentItem } from "@/components/crm/DealAutomationPanel";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Handshake,
  Building2,
  Eye,
  Shield,
} from "lucide-react";
import DealStagePipeline from "@/components/deal/DealStagePipeline";
import MeetingsList from "@/components/deal/MeetingsList";
import CommissionBreakdown from "@/components/deal/CommissionBreakdown";
import { stageConfig, stageOrder, healthLabels, commissionStatusLabels } from "@/components/deal/dealStageConfig";

const driveUrlSchema = z
  .string()
  .trim()
  .url("invalid")
  .refine((value) => {
    try {
      const u = new URL(value);
      return ["drive.google.com", "docs.google.com"].includes(u.hostname);
    } catch {
      return false;
    }
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

  const fetchDeals = useCallback(async () => {
    if (!user) return;

    const { data: devProfile } = await supabase.from("developers").select("id").eq("user_id", user.id).maybeSingle();

    let query = supabase
      .from("deals")
      .select("*, lands(city, district, land_area_sqm), developers(company_name, marketing_brand_name)")
      .order("created_at", { ascending: false });

    if (devProfile) query = query.eq("developer_id", devProfile.id);

    const { data } = await query;
    setDeals(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const fetchDealExtras = useCallback(
    async (dealId: string) => {
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
        setDriveUrl("");
        setLinkValidated(false);
        setValidationNote("");
      }
    },
    [isAr],
  );

  const openDealDetail = async (deal: any) => {
    setViewDeal(deal);
    await fetchDealExtras(deal.id);
  };

  const handleValidateDriveLink = async () => {
    const parsed = driveUrlSchema.safeParse(driveUrl);

    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: isAr ? "رابط غير صالح" : "Invalid link",
        description: isAr ? "يرجى إدخال رابط Google Drive صحيح." : "Please enter a valid Google Drive URL.",
      });
      setLinkValidated(false);
      return;
    }

    setValidatingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke("deal-drive-automation", {
        body: { action: "validate_link", documentUrl: parsed.data },
      });

      if (error) throw new Error(error.message || "Validation failed");
      if (!data?.valid) throw new Error(data?.error || "Validation failed");

      setLinkValidated(true);
      setValidationNote(isAr ? "تم جلب الرابط بنجاح. يمكنك الآن الضغط على الموافقة." : "Link fetched successfully. You can now approve.");
      toast({ title: isAr ? "تم التحقق من الرابط" : "Link validated" });
    } catch (err: any) {
      setLinkValidated(false);
      setValidationNote(isAr ? "تعذر جلب الرابط. تأكد من صلاحية الرابط وإتاحته." : "Unable to fetch the link. Ensure it is valid and accessible.");
      toast({
        variant: "destructive",
        title: isAr ? "فشل التحقق" : "Validation failed",
        description: err.message,
      });
    } finally {
      setValidatingLink(false);
    }
  };

  const handleSubmitDriveAndAdvance = async () => {
    if (!viewDeal) return;

    if (!linkValidated) {
      toast({
        variant: "destructive",
        title: isAr ? "يلزم التحقق أولاً" : "Validation required",
        description: isAr ? "تحقق من الرابط قبل الضغط على الموافقة." : "Validate the link before approving.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("deal-drive-automation", {
        body: {
          action: "submit_drive_link",
          dealId: viewDeal.id,
          documentUrl: driveUrl.trim(),
        },
      });

      if (error) throw new Error(error.message || "Automation failed");
      if (!data?.success) throw new Error(data?.error || "Automation failed");

      const nextStage = data?.deal?.current_stage || "agreements_prepared";
      setViewDeal((prev: any) => (prev ? { ...prev, current_stage: nextStage } : prev));
      setDeals((prev) => prev.map((d) => (d.id === viewDeal.id ? { ...d, current_stage: nextStage } : d)));
      await fetchDealExtras(viewDeal.id);

      toast({ title: isAr ? "تم اعتماد الرابط وبدء مرحلة الاتفاقيات" : "Link approved and agreements stage started" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isAr ? "تعذر المتابعة" : "Could not continue",
        description: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDeal = async () => {
    if (!viewDeal) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("deal-drive-automation", {
        body: {
          action: "close_deal",
          dealId: viewDeal.id,
        },
      });

      if (error) throw new Error(error.message || "Close failed");
      if (!data?.success) throw new Error(data?.error || "Close failed");

      setViewDeal((prev: any) =>
        prev
          ? {
              ...prev,
              current_stage: "deal_closed",
              closed_at: data?.deal?.closed_at || new Date().toISOString(),
            }
          : prev,
      );

      setDeals((prev) => prev.map((d) => (d.id === viewDeal.id ? { ...d, current_stage: "deal_closed", closed_at: data?.deal?.closed_at } : d)));

      toast({ title: isAr ? "مبروك! تم إغلاق الصفقة" : "Congratulations! Deal closed" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isAr ? "تعذر إغلاق الصفقة" : "Failed to close deal",
        description: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <CrmLayout>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "الصفقات" : "Deals"}</h1>
        </div>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "متابعة جميع صفقات الشراكة ومراحلها" : "Track all partnership deals and their stages"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Handshake className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد صفقات بعد" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => {
            const stage = stageConfig[d.current_stage] || { ar: d.current_stage, en: d.current_stage, color: "" };
            const stageIdx = stageOrder.indexOf(d.current_stage);
            const isCancelled = d.current_stage === "deal_cancelled";
            const isClosed = d.current_stage === "deal_closed";

            return (
              <div
                key={d.id}
                className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 cursor-pointer"
                onClick={() => openDealDetail(d)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${d.health === "green" ? "bg-emerald-500" : d.health === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                      <Building2 className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                      <h3 className="text-sm font-medium text-foreground">
                        {d.lands?.city}
                        {d.lands?.district ? ` - ${d.lands.district}` : ""}
                      </h3>
                    </div>
                    <p className="text-xs font-light text-muted-foreground ps-5">
                      {Number(d.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                    </p>
                  </div>
                  <div className="text-end flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isClosed
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : isCancelled
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
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

      <Dialog
        open={!!viewDeal}
        onOpenChange={(o) => {
          if (!o) setViewDeal(null);
        }}
      >
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
                    <p className="text-sm font-medium text-foreground">
                      {viewDeal.lands?.city}
                      {viewDeal.lands?.district ? ` - ${viewDeal.lands.district}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(viewDeal.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`gap-1 ${
                      viewDeal.health === "green"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : viewDeal.health === "yellow"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-red-500/10 text-red-600"
                    } border-transparent`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        viewDeal.health === "green" ? "bg-emerald-500" : viewDeal.health === "yellow" ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                    {isAr ? healthLabels[viewDeal.health]?.ar : healthLabels[viewDeal.health]?.en}
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
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                                isActive ? "border-primary bg-primary/10" : isPast ? "border-primary bg-primary/10" : "border-border"
                              }`}
                            >
                              {isPast ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <span className={`text-[9px] font-bold ${isActive ? "text-primary" : "text-muted-foreground/30"}`}>{idx + 1}</span>
                              )}
                            </div>
                            <span className={`text-[8px] text-center ${isActive ? "font-medium text-primary" : isPast ? "text-primary" : "text-muted-foreground/40"}`}>
                              {isAr ? stageConfig[s]?.ar : stageConfig[s]?.en}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <DealAutomationPanel
                  isAr={isAr}
                  currentStage={viewDeal.current_stage}
                  driveUrl={driveUrl}
                  validationNote={validationNote}
                  validatingLink={validatingLink}
                  linkValidated={linkValidated}
                  actionLoading={actionLoading}
                  documents={dealDocuments}
                  onDriveUrlChange={(value) => {
                    setDriveUrl(value);
                    setLinkValidated(false);
                    if (validationNote) setValidationNote("");
                  }}
                  onValidateLink={handleValidateDriveLink}
                  onSubmitLinkAndApprove={handleSubmitDriveAndAdvance}
                  onCloseDeal={handleCloseDeal}
                />

                {meetings.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "الاجتماعات" : "Meetings"}
                    </h6>
                    {meetings.map((m) => (
                      <div key={m.id} className="rounded-lg border border-border/30 p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium">
                            {new Date(m.scheduled_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(m.scheduled_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <Badge variant="outline" className="text-[9px]">
                            {m.meeting_type === "google_meet" ? "Google Meet" : isAr ? "حضوري" : "In Person"}
                          </Badge>
                        </div>
                        {m.meet_link && (
                          <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Link2 className="h-3 w-3" />
                            {isAr ? "انضم للاجتماع" : "Join Meeting"}
                          </a>
                        )}
                        {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-primary">
                      {isAr ? "حقوق المنصة محفوظة — عمولة 2.5%" : "Platform rights protected — 2.5% commission"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isAr ? "حالة العمولة:" : "Commission Status:"}{" "}
                      {isAr
                        ? commissionStatusLabels[viewDeal.commission_status]?.ar || viewDeal.commission_status
                        : commissionStatusLabels[viewDeal.commission_status]?.en || viewDeal.commission_status}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "تاريخ الإنشاء:" : "Created:"} {new Date(viewDeal.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </CrmLayout>
  );
};

export default CrmDeals;
