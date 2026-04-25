import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import OwnerLayout from "@/components/owner/OwnerLayout";
import LandSubmissionForm from "@/components/land/LandSubmissionForm";
import DashboardShell from "@/components/dashboard/DashboardShell";
import BentoCard from "@/components/dashboard/BentoCard";
import { LandFormData, usageLabels, goalLabels, projectModelLabels } from "@/components/land/LandFormConstants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Landmark, MapPin, Ruler, Building2, Pencil, CheckCircle2,
  Clock, Eye, Image as ImageIcon, FileText, Shield, Download, Banknote,
} from "lucide-react";
import { getContractsByLandIds, getContractFileUrl, type BrokerageContract } from "@/services/brokerage.service";
import { logAudit } from "@/lib/auditLog";

const submissionStatusConfig: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  draft: { ar: "مسودة — بانتظار مراجعتك", en: "Draft — Awaiting Your Review", color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Clock },
  submitted: { ar: "تم التقديم", en: "Submitted", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
  under_review: { ar: "قيد مراجعة الإدارة", en: "Under Admin Review", color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Eye },
};

const OwnerLands: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "أراضيي" : "My Lands");

  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInitialData, setEditInitialData] = useState<Partial<LandFormData>>({});
  const [contractsMap, setContractsMap] = useState<Record<string, BrokerageContract>>({});
  const [contractUrls, setContractUrls] = useState<Record<string, string>>({});
  const [contractDetailLand, setContractDetailLand] = useState<any>(null);

  /* Re-entry guard: LandSubmissionForm's submit button is complex and the
   * INSERT + storage signing chain takes a second or two. A second click
   * before state settles would insert two land rows with identical payloads
   * — and two rows fan out to two notify-new-opportunity invocations,
   * spamming every verified developer. */
  const submittingRef = useRef(false);

  const fetchLands = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("lands").select("*").eq("owner_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
      if (error) throw error;
      setLands(data || []);

      // Fetch contracts for all lands in one round trip, then sign
      // each contract file URL in parallel (one signed-URL call per
      // contract is unavoidable — Storage's createSignedUrl has no
      // batch API — but the contract SELECTs are now O(1) queries).
      if (data && data.length > 0) {
        const cMap = await getContractsByLandIds(data.map(l => l.id));
        setContractsMap(cMap);

        const urlPairs = await Promise.all(
          Object.values(cMap)
            .filter(c => c.contract_file_url)
            .map(async (c) => {
              const url = await getContractFileUrl(c.contract_file_url!);
              return [c.land_id, url] as const;
            }),
        );
        const urlMap: Record<string, string> = {};
        for (const [landId, url] of urlPairs) {
          if (url) urlMap[landId] = url;
        }
        setContractUrls(urlMap);
      }
    } catch (err: any) {
      console.error("Failed to fetch lands:", err);
      toast({
        variant: "destructive",
        title: isAr ? "فشل تحميل الأراضي" : "Failed to load lands",
        description: err?.message || (isAr ? "تعذر جلب البيانات" : "Could not fetch data"),
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, isAr]);

  useEffect(() => { fetchLands(); }, [fetchLands]);

  const handleSubmit = async (form: LandFormData) => {
    if (!user) return;
    // Hard gate against double-submit. LandSubmissionForm's button is
    // already `disabled` while its internal state spinner is on, but
    // the gap between our toast and `closeDialog()` is wide enough for
    // a second click if the user is impatient or the network hiccups.
    if (submittingRef.current) return;
    submittingRef.current = true;

    const payload: any = {
      owner_id: user.id,
      city: form.city,
      district: form.district || null,
      land_area_sqm: parseFloat(form.land_area_sqm),
      usage_type: form.usage_type as any,
      partnership_goal: form.partnership_goal as any,
      vision_summary: form.vision_summary || null,
      project_type: form.project_type || null,
      exact_location_lat: form.exact_location_lat ? parseFloat(form.exact_location_lat) : null,
      exact_location_lng: form.exact_location_lng ? parseFloat(form.exact_location_lng) : null,
      owner_name: form.owner_name || null,
      plot_number: form.plot_number || null,
      plan_number: form.plan_number || null,
      deed_number: form.deed_number || null,
      deed_date: form.deed_date || null,
      length_m: form.length_m ? parseFloat(form.length_m) : null,
      width_m: form.width_m ? parseFloat(form.width_m) : null,
      street_width_m: form.street_width_m ? parseFloat(form.street_width_m) : null,
      image_url: form.image_url || null,
      brokerage_license_number: form.brokerage_license_number || null,
      parcel_count: form.parcel_count ? parseInt(form.parcel_count) : 1,
      land_boundaries: form.land_boundaries || null,
      street_info: form.street_info || null,
      project_model: form.project_model || "development_partnership",
      development_subtype: form.development_subtype || null,
      contribution_model: form.contribution_model || null,
      exit_percentage: form.exit_percentage ? parseFloat(form.exit_percentage) : null,
      estimated_price_per_sqm: form.estimated_price_per_sqm ? parseFloat(form.estimated_price_per_sqm) : null,
      estimated_total_value: form.estimated_total_value ? parseFloat(form.estimated_total_value) : null,
      deed_file_url: form.deed_file_url || null,
      kroki_file_url: form.kroki_file_url || null,
      additional_docs_urls: form.additional_docs_urls?.length ? form.additional_docs_urls : [],
      gallery_urls: form.gallery_urls?.length ? form.gallery_urls : [],
      partnership_model: form.partnership_model || null,
      submission_status: form.legal_acknowledgment_accepted ? "submitted" : "draft",
      legal_acknowledgment_accepted: form.legal_acknowledgment_accepted,
      legal_acknowledgment_date: form.legal_acknowledgment_accepted ? new Date().toISOString() : null,
      platform_fee_acknowledged: form.platform_fee_acknowledged,
    };

    let error;
    let newLandId: string | null = null;
    if (editingId) {
      ({ error } = await supabase.from("lands").update(payload).eq("id", editingId));
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("lands")
        .insert(payload)
        .select("id")
        .single();
      error = insErr;
      newLandId = inserted?.id ?? null;
    }

    try {
      if (error) {
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
        return;
      }
      toast({ title: isAr ? (editingId ? "تم التحديث" : "تم إدراج الأرض بنجاح") : (editingId ? "Updated" : "Land submitted successfully") });
      // Audit trail: owner land create/update.
      const auditedId = editingId || newLandId || undefined;
      if (auditedId) {
        logAudit(
          user.id,
          user.email,
          editingId ? "land.update" : (payload.submission_status === "submitted" ? "land.submit" : "land.create_draft"),
          "land",
          auditedId,
          { city: payload.city, submission_status: payload.submission_status },
        );
      }
      // Fanout to all verified developers when a brand-new opportunity is
      // submitted. If fanout fails we surface a soft warning — the land is
      // saved either way, but developers won't see it until the next poll,
      // so the owner deserves to know.
      if (!editingId && newLandId && payload.submission_status === "submitted") {
        supabase.functions
          .invoke("notify-new-opportunity", { body: { land_id: newLandId } })
          .catch((e) => {
            console.error("notify-new-opportunity failed", e);
            toast({
              variant: "destructive",
              title: isAr ? "تم الحفظ لكن تعذر إشعار المطورين" : "Saved but developer notifications failed",
              description: isAr
                ? "سيتم الإشعار عند المحاولة التالية تلقائيًا."
                : "Notifications will retry automatically.",
            });
          });

        // P1.3 — mirror the event to the admin team so oversight has
        // a real-time feed of new submissions. Uses the allowlisted
        // notify_all_admins RPC (SECURITY DEFINER); the caller cannot
        // choose recipients.
        supabase
          .rpc("notify_all_admins", {
            _type: "land_new_submitted",
            _title_ar: "أرض جديدة بانتظار المراجعة",
            _title_en: "New land submission",
            _message_ar: `تم إدراج أرض جديدة في ${payload.city ?? "—"}${payload.district ? ` / ${payload.district}` : ""} — مطلوبة المراجعة`,
            _message_en: `New land submitted in ${payload.city ?? "—"}${payload.district ? ` / ${payload.district}` : ""} — review required`,
            _entity_type: "land",
            _entity_id: newLandId,
          })
          .then((res) => {
            if (res.error) console.warn("[OwnerLands] notify_all_admins:", res.error.message);
          });
      }
      closeDialog();
      fetchLands();
    } finally {
      submittingRef.current = false;
    }
  };

  const closeDialog = () => {
    setShowForm(false);
    setEditingId(null);
    setEditInitialData({});
  };

  const openEdit = (land: any) => {
    setEditingId(land.id);
    setEditInitialData({
      city: land.city || "", district: land.district || "", land_area_sqm: String(land.land_area_sqm || ""),
      usage_type: land.usage_type || "residential", partnership_goal: land.partnership_goal || "develop_sell",
      vision_summary: land.vision_summary || "", project_type: land.project_type || "",
      exact_location_lat: land.exact_location_lat ? String(land.exact_location_lat) : "",
      exact_location_lng: land.exact_location_lng ? String(land.exact_location_lng) : "",
      owner_name: land.owner_name || "", plot_number: land.plot_number || "", plan_number: land.plan_number || "",
      deed_number: land.deed_number || "", deed_date: land.deed_date || "",
      length_m: land.length_m ? String(land.length_m) : "", width_m: land.width_m ? String(land.width_m) : "",
      street_width_m: land.street_width_m ? String(land.street_width_m) : "", image_url: land.image_url || "",
      owner_approved: land.owner_approved || false, partnership_model: land.partnership_model || "",
      brokerage_license_number: land.brokerage_license_number || "", parcel_count: land.parcel_count ? String(land.parcel_count) : "1",
      land_boundaries: land.land_boundaries || "", street_info: land.street_info || "",
      project_model: land.project_model || "development_partnership", development_subtype: land.development_subtype || "",
      contribution_model: land.contribution_model || "", exit_percentage: land.exit_percentage ? String(land.exit_percentage) : "",
      estimated_price_per_sqm: land.estimated_price_per_sqm ? String(land.estimated_price_per_sqm) : "",
      estimated_total_value: land.estimated_total_value ? String(land.estimated_total_value) : "",
      deed_file_url: land.deed_file_url || "", kroki_file_url: land.kroki_file_url || "",
      additional_docs_urls: land.additional_docs_urls || [],
      gallery_urls: land.gallery_urls || [],
      legal_acknowledgment_accepted: land.legal_acknowledgment_accepted || false,
      platform_fee_acknowledged: land.platform_fee_acknowledged || false,
    });
    setShowForm(true);
  };

  const getImageUrl = (land: any) => {
    if (!land.image_url) return null;
    if (land.image_url.startsWith("http")) return land.image_url;
    const { data } = supabase.storage.from("land-images").getPublicUrl(land.image_url);
    return data?.publicUrl;
  };

  const fmtValue = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

  return (
    <OwnerLayout>
      <DashboardShell isAr={isAr} accent="gold">
        <BentoCard variant="hero" span="full" padding="lg" className="relative overflow-hidden mb-5">
          <div className="absolute top-0 end-0 w-60 h-60 bg-[#C2A86B]/15 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C2A86B]/15 text-[11px] font-semibold text-[#A88A4A] mb-2">
                <Landmark className="w-3 h-3" strokeWidth={2} />
                {isAr ? "أراضيي" : "My Lands"}
              </span>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#1E374B] dark:text-white tracking-tight">
                {isAr ? "محفظة الأراضي" : "Lands Portfolio"}
              </h1>
              <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                {isAr ? "إدارة أراضيك وإدراج فرص جديدة" : "Manage your lands and submit new opportunities"}
              </p>
            </div>
            <Button
              className="gap-2 h-10 bg-gradient-to-r from-[#2B4C66] to-[#1E374B] hover:from-[#1E374B] hover:to-[#2B4C66] text-white rounded-xl font-semibold shadow-[0_4px_14px_-4px_rgba(43,76,102,0.4)]"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4" />{isAr ? "إدراج أرض" : "Add Land"}
            </Button>
          </div>
        </BentoCard>

      {/* Draft notice */}
      {!loading && lands.some(l => l.submission_status === "draft") && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            {isAr
              ? "لديك مسودات أرض أنشأتها الإدارة نيابةً عنك. يرجى مراجعتها واعتمادها."
              : "You have land drafts created by admin on your behalf. Please review and approve them."}
          </p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) closeDialog(); else setShowForm(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAr ? (editingId ? "تعديل الأرض" : "إدراج أرض جديدة") : (editingId ? "Edit Land" : "Add New Land")}</DialogTitle>
          </DialogHeader>
          <LandSubmissionForm
            initialData={editInitialData}
            isAdmin={false}
            editingId={editingId}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : lands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Landmark className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "لم تُدرج أي أرض بعد" : "No lands submitted yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "ابدأ بإدراج أول أرض لتلقي عروض المطورين" : "Submit your first land to receive developer proposals"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lands.map(land => {
            const imgUrl = getImageUrl(land);
            const status = submissionStatusConfig[land.submission_status] || submissionStatusConfig.draft;
            const StatusIcon = status.icon;
            return (
              <div key={land.id} className="syna-card overflow-hidden">
                <div className="relative h-36 bg-muted">
                  {imgUrl ? (
                    <img src={imgUrl} alt={land.city} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>
                  )}
                  <div className="absolute top-2 end-2">
                    <Badge variant="outline" className={`text-[10px] gap-1 ${status.color}`}>
                      <StatusIcon className="h-2.5 w-2.5" />{isAr ? status.ar : status.en}
                    </Badge>
                  </div>
                  {land.owner_approved && (
                    <div className="absolute top-2 start-2">
                      <Badge className="text-[10px] bg-emerald-500/80 text-white border-0 backdrop-blur-sm gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />{isAr ? "معتمد" : "Approved"}
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-2 start-2">
                    <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">
                      {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                    <h3 className="font-medium text-foreground truncate">{land.city}</h3>
                    {land.district && <span className="text-xs font-light text-muted-foreground truncate">- {land.district}</span>}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs font-light text-muted-foreground">
                    <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en}</span>
                    {land.estimated_total_value && <span className="text-primary font-medium">{fmtValue(Number(land.estimated_total_value))} {isAr ? "ريال" : "SAR"}</span>}
                    {land.project_model && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{isAr ? projectModelLabels[land.project_model]?.ar : projectModelLabels[land.project_model]?.en}</span>}
                  </div>

                  {/* License + Contract info */}
                  {(land.brokerage_license_number || contractsMap[land.id]) && (
                    <div className="mt-2 space-y-1.5">
                      {land.brokerage_license_number && (
                        <div className="flex items-center gap-1.5 text-xs text-violet-600">
                          <Shield className="h-3 w-3" />
                          <span className="font-medium">{isAr ? "رخصة:" : "License:"}</span>
                          <span dir="ltr">{land.brokerage_license_number}</span>
                          {land.brokerage_license_status === "active" && <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-emerald-600 border-emerald-500/20">{isAr ? "سارية" : "Active"}</Badge>}
                          {land.brokerage_license_status === "expired" && <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-red-600 border-red-500/20">{isAr ? "منتهية" : "Expired"}</Badge>}
                        </div>
                      )}
                      {contractsMap[land.id] && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Banknote className="h-3 w-3" />
                          <span>{isAr ? "عقد:" : "Contract:"} {contractsMap[land.id].contract_number}</span>
                          {contractUrls[land.id] && (
                            <a href={contractUrls[land.id]} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                              <Download className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => openEdit(land)}>
                      <Pencil className="h-3 w-3" />{isAr ? (land.submission_status === "draft" ? "مراجعة واعتماد" : "تعديل") : (land.submission_status === "draft" ? "Review & Approve" : "Edit")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </DashboardShell>
    </OwnerLayout>
  );
};

export default OwnerLands;
