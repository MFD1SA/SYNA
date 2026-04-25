import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, StarOff, MapPin, Search, Eye, EyeOff, Pencil, Ruler, Building2, Image as ImageIcon, Landmark, FileText, Shield, Upload, Download, Banknote, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import LandSubmissionForm from "@/components/land/LandSubmissionForm";
import LegalDocPrintView from "@/components/land/LegalDocPrintView";
import { LandFormData, usageLabels, goalLabels } from "@/components/land/LandFormConstants";
import { getContractByLandId, createBrokerageContract, updateBrokerageContract, getContractFileUrl, type BrokerageContract } from "@/services/brokerage.service";

const AdminLands: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الأراضي" : "Manage Lands");
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInitialData, setEditInitialData] = useState<Partial<LandFormData>>({});
  const [ownerProfiles, setOwnerProfiles] = useState<any[]>([]);
  const [legalDocLand, setLegalDocLand] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Brokerage dialog state
  const [brokerageLand, setBrokerageLand] = useState<any>(null);
  const [brokerageContract, setBrokerageContract] = useState<BrokerageContract | null>(null);
  const [brokerageLoading, setBrokerageLoading] = useState(false);
  const [brokerageSaving, setBrokerageSaving] = useState(false);
  const [contractFileUploading, setContractFileUploading] = useState(false);
  const [contractSignedUrl, setContractSignedUrl] = useState<string | null>(null);
  const [licenseForm, setLicenseForm] = useState({
    brokerage_license_number: "",
    brokerage_license_status: "pending",
    brokerage_license_date: "",
    brokerage_license_expiry: "",
  });
  const [contractForm, setContractForm] = useState({
    contract_number: "",
    contract_date: "",
    contract_expiry: "",
    commission_rate: "2.50",
    status: "draft",
    notes: "",
  });

  const fetchLands = async () => {
    // Soft-delete awareness: hide rows where deleted_at is set by default.
    // Admin can opt-in to see soft-deleted lands via the "عرض المحذوفة" toggle
    // for recovery / audit workflows. Without this filter, admins were
    // editing ghosts — UI listed deleted lands as "active" and all mutations
    // silently failed against the RLS soft-delete guard.
    let query = supabase.from("lands").select("*").order("created_at", { ascending: false });
    if (!showDeleted) query = query.is("deleted_at", null);
    const { data } = await query;
    setLands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLands(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [showDeleted]);

  useEffect(() => {
    const fetchOwnerProfiles = async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      setOwnerProfiles(data || []);
    };
    fetchOwnerProfiles();
  }, []);

  const handleSubmit = async (form: LandFormData) => {
    if (!user || !form.city || !form.land_area_sqm) return;
    const ownerId = form.selected_owner_id || user.id;
    const payload: any = {
      owner_id: ownerId,
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
      is_featured: true,
      is_active: true,
      owner_approved: form.owner_approved,
      partnership_model: form.partnership_model || null,
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
      submission_status: form.legal_acknowledgment_accepted ? "submitted" : "draft",
      legal_acknowledgment_accepted: form.legal_acknowledgment_accepted,
      legal_acknowledgment_date: form.legal_acknowledgment_accepted ? new Date().toISOString() : null,
      platform_fee_acknowledged: form.platform_fee_acknowledged,
    };

    // P1.4 — capture previous state BEFORE the update so we can detect
    // approval/unapproval flips and notify the owner.
    let prevOwnerApproved = false;
    if (editingId) {
      const existingLand = lands.find((l) => l.id === editingId);
      prevOwnerApproved = !!existingLand?.owner_approved;
    }

    let error;
    if (editingId) {
      ({ error } = await supabase.from("lands").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("lands").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      if (user) await logAudit(user.id, user.email, editingId ? "update" : "create", "land", editingId || undefined, { city: payload.city });
      toast({ title: isAr ? (editingId ? "تم التحديث" : "تمت الإضافة") : (editingId ? "Updated" : "Land Added") });

      // P1.4 — notify owner when admin flips owner_approved on edit.
      // Admin RLS allows direct INSERT into notifications (has_role check),
      // so this is a straight client-side fan-out — no RPC needed.
      // Fire-and-forget: a notification failure must never block the land save.
      if (editingId && ownerId !== user?.id && prevOwnerApproved !== payload.owner_approved) {
        const approved = payload.owner_approved === true;
        const locLabel = `${payload.city}${payload.district ? ` - ${payload.district}` : ""}`;
        supabase
          .from("notifications")
          .insert({
            user_id: ownerId,
            type: approved ? "land_approved" : "land_changes_required",
            title_ar: approved ? "تمت الموافقة على أرضك" : "طلب مراجعة على أرضك",
            title_en: approved ? "Your land has been approved" : "Changes required on your land",
            message_ar: approved
              ? `تمت الموافقة على أرضك في ${locLabel} وأصبحت جاهزة للعرض على المطورين.`
              : `هناك حاجة لمراجعة بيانات أرضك في ${locLabel}. يرجى التواصل مع الإدارة لمزيد من التفاصيل.`,
            message_en: approved
              ? `Your land in ${locLabel} has been approved and is now visible to developers.`
              : `Changes required on your land in ${locLabel}. Please contact the admin for details.`,
            entity_type: "land",
            entity_id: editingId,
          })
          .then(({ error: notifError }) => {
            if (notifError) console.warn("[AdminLands] owner approval notification failed:", notifError.message);
          });
      }

      // Send notification to owner when admin creates a draft
      if (!editingId && ownerId !== user?.id) {
        try {
          const ownerProfile = ownerProfiles.find(p => p.user_id === ownerId);
          await supabase.functions.invoke("send-deal-notification", {
            body: {
              type: "draft_created_for_owner",
              owner_name: ownerProfile?.full_name || form.owner_name || "",
              owner_email: ownerProfile?.email || "",
              owner_user_id: ownerId,
              land_city: form.city,
              land_district: form.district,
            },
          });
        } catch (e) {
          console.error("Draft notification error:", e);
        }
      }

      closeDialog();
      fetchLands();
    }
  };

  const closeDialog = () => {
    setShowAdd(false);
    setEditingId(null);
    setEditInitialData({});
  };

  const openEdit = (land: any) => {
    setEditingId(land.id);
    setEditInitialData({
      city: land.city || "",
      district: land.district || "",
      land_area_sqm: String(land.land_area_sqm || ""),
      usage_type: land.usage_type || "residential",
      partnership_goal: land.partnership_goal || "develop_sell",
      vision_summary: land.vision_summary || "",
      project_type: land.project_type || "",
      exact_location_lat: land.exact_location_lat ? String(land.exact_location_lat) : "",
      exact_location_lng: land.exact_location_lng ? String(land.exact_location_lng) : "",
      owner_name: land.owner_name || "",
      plot_number: land.plot_number || "",
      plan_number: land.plan_number || "",
      deed_number: land.deed_number || "",
      deed_date: land.deed_date || "",
      length_m: land.length_m ? String(land.length_m) : "",
      width_m: land.width_m ? String(land.width_m) : "",
      street_width_m: land.street_width_m ? String(land.street_width_m) : "",
      image_url: land.image_url || "",
      owner_approved: land.owner_approved || false,
      partnership_model: land.partnership_model || "",
      selected_owner_id: land.owner_id || "",
      brokerage_license_number: land.brokerage_license_number || "",
      parcel_count: land.parcel_count ? String(land.parcel_count) : "1",
      land_boundaries: land.land_boundaries || "",
      street_info: land.street_info || "",
      project_model: land.project_model || "development_partnership",
      development_subtype: land.development_subtype || "",
      contribution_model: land.contribution_model || "",
      exit_percentage: land.exit_percentage ? String(land.exit_percentage) : "",
      estimated_price_per_sqm: land.estimated_price_per_sqm ? String(land.estimated_price_per_sqm) : "",
      estimated_total_value: land.estimated_total_value ? String(land.estimated_total_value) : "",
      deed_file_url: land.deed_file_url || "",
      kroki_file_url: land.kroki_file_url || "",
      additional_docs_urls: land.additional_docs_urls || [],
      gallery_urls: land.gallery_urls || [],
      legal_acknowledgment_accepted: land.legal_acknowledgment_accepted || false,
      platform_fee_acknowledged: land.platform_fee_acknowledged || false,
    });
    setShowAdd(true);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("lands").update({ is_featured: !current }).eq("id", id);
    if (user) await logAudit(user.id, user.email, "update", "land", id, { is_featured: !current });
    fetchLands();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const land = lands.find((l) => l.id === id);
    await supabase.from("lands").update({ is_active: !current }).eq("id", id);
    if (user) await logAudit(user.id, user.email, "update", "land", id, { is_active: !current });

    // P1.4 — notify owner when admin publishes/unpublishes their land.
    // Owners must know when their listing disappears from the marketplace
    // or (re)appears. Fire-and-forget — publish toggle must not block on notif.
    if (land?.owner_id && land.owner_id !== user?.id) {
      const published = !current;
      const locLabel = `${land.city}${land.district ? ` - ${land.district}` : ""}`;
      supabase
        .from("notifications")
        .insert({
          user_id: land.owner_id,
          type: published ? "land_published" : "land_unpublished",
          title_ar: published ? "تم نشر أرضك" : "تم إيقاف نشر أرضك",
          title_en: published ? "Your land is now published" : "Your land has been unpublished",
          message_ar: published
            ? `تم نشر أرضك في ${locLabel} على المنصة وأصبحت متاحة للمطورين.`
            : `تم إيقاف نشر أرضك في ${locLabel}. للمزيد من التفاصيل تواصل مع الإدارة.`,
          message_en: published
            ? `Your land in ${locLabel} is now live on the platform.`
            : `Your land in ${locLabel} has been unpublished. Contact admin for details.`,
          entity_type: "land",
          entity_id: id,
        })
        .then(({ error: notifError }) => {
          if (notifError) console.warn("[AdminLands] publish toggle notification failed:", notifError.message);
        });
    }

    fetchLands();
    toast({ title: isAr ? (!current ? "تم النشر" : "تم الإخفاء") : (!current ? "Published" : "Hidden") });
  };

  const confirmDeleteLand = async () => {
    if (!deleteDialog) return;
    const id = deleteDialog.id;
    setDeleting(true);
    try {
      // Soft-delete so FK cascade doesn't wipe historical deal_requests.
      // The DB trigger `trg_prevent_land_delete_with_active_deals`
      // still blocks any hard DELETE that slips through while open
      // deals reference this land — this path is the intended one.
      const { error } = await supabase
        .from("lands")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", id);

      if (error) {
        toast({
          variant: "destructive",
          title: isAr ? "تعذر الحذف" : "Delete failed",
          description: error.message,
        });
        return;
      }

      if (user) await logAudit(user.id, user.email, "delete", "land", id);
      setDeleteDialog(null);
      fetchLands();
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    } finally {
      setDeleting(false);
    }
  };

  const openBrokerage = async (land: any) => {
    setBrokerageLand(land);
    setBrokerageLoading(true);
    setLicenseForm({
      brokerage_license_number: land.brokerage_license_number || "",
      brokerage_license_status: land.brokerage_license_status || "pending",
      brokerage_license_date: land.brokerage_license_date || "",
      brokerage_license_expiry: land.brokerage_license_expiry || "",
    });
    const contract = await getContractByLandId(land.id);
    setBrokerageContract(contract);
    if (contract) {
      setContractForm({
        contract_number: contract.contract_number || "",
        contract_date: contract.contract_date || "",
        contract_expiry: contract.contract_expiry || "",
        commission_rate: String(contract.commission_rate ?? "2.50"),
        status: contract.status || "draft",
        notes: contract.notes || "",
      });
      if (contract.contract_file_url) {
        const url = await getContractFileUrl(contract.contract_file_url);
        setContractSignedUrl(url);
      } else {
        setContractSignedUrl(null);
      }
    } else {
      setContractForm({ contract_number: "", contract_date: "", contract_expiry: "", commission_rate: "2.50", status: "draft", notes: "" });
      setContractSignedUrl(null);
    }
    setBrokerageLoading(false);
  };

  const closeBrokerage = () => {
    setBrokerageLand(null);
    setBrokerageContract(null);
    setContractSignedUrl(null);
  };

  const saveLicenseFields = async () => {
    if (!brokerageLand) return;
    setBrokerageSaving(true);
    const { error } = await supabase.from("lands").update({
      brokerage_license_number: licenseForm.brokerage_license_number || null,
      brokerage_license_status: licenseForm.brokerage_license_status,
      brokerage_license_date: licenseForm.brokerage_license_date || null,
      brokerage_license_expiry: licenseForm.brokerage_license_expiry || null,
    }).eq("id", brokerageLand.id);
    setBrokerageSaving(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      if (user) await logAudit(user.id, user.email, "update", "land", brokerageLand.id, { action: "update_license" });
      toast({ title: isAr ? "تم حفظ بيانات الرخصة" : "License data saved" });
      fetchLands();
    }
  };

  const saveContract = async () => {
    if (!brokerageLand || !contractForm.contract_number) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "رقم العقد مطلوب" : "Contract number is required" });
      return;
    }
    setBrokerageSaving(true);
    try {
      if (brokerageContract) {
        await updateBrokerageContract(brokerageContract.id, {
          contract_number: contractForm.contract_number,
          contract_date: contractForm.contract_date || null,
          contract_expiry: contractForm.contract_expiry || null,
          commission_rate: parseFloat(contractForm.commission_rate) || 2.50,
          status: contractForm.status,
          notes: contractForm.notes || null,
        });
      } else {
        const newContract = await createBrokerageContract({
          land_id: brokerageLand.id,
          owner_id: brokerageLand.owner_id,
          contract_number: contractForm.contract_number,
          contract_date: contractForm.contract_date || undefined,
          contract_expiry: contractForm.contract_expiry || undefined,
          commission_rate: parseFloat(contractForm.commission_rate) || 2.50,
          status: contractForm.status,
          notes: contractForm.notes || undefined,
          created_by: user?.id,
        });
        setBrokerageContract(newContract);
      }
      if (user) await logAudit(user.id, user.email, brokerageContract ? "update" : "create", "brokerage_contract", brokerageContract?.id || brokerageLand.id, { contract_number: contractForm.contract_number });
      toast({ title: isAr ? "تم حفظ عقد الوساطة" : "Brokerage contract saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setBrokerageSaving(false);
  };

  const handleContractFileUpload = async (file: File) => {
    if (!brokerageContract?.id && !brokerageLand) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "PDF فقط" : "PDF only" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "الحد الأقصى 20MB" : "Max 20MB" });
      return;
    }
    setContractFileUploading(true);
    try {
      const filePath = `contracts/${brokerageLand.id}/${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("brokerage-docs").upload(filePath, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      if (brokerageContract) {
        await updateBrokerageContract(brokerageContract.id, { contract_file_url: filePath });
        setBrokerageContract({ ...brokerageContract, contract_file_url: filePath });
      } else {
        // Create contract first if not exists
        if (!contractForm.contract_number) {
          toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "احفظ العقد أولاً" : "Save contract first" });
          setContractFileUploading(false);
          return;
        }
        const newContract = await createBrokerageContract({
          land_id: brokerageLand.id,
          owner_id: brokerageLand.owner_id,
          contract_number: contractForm.contract_number,
          contract_file_url: filePath,
          commission_rate: parseFloat(contractForm.commission_rate) || 2.50,
          status: contractForm.status,
          created_by: user?.id,
        });
        setBrokerageContract(newContract);
      }
      const url = await getContractFileUrl(filePath);
      setContractSignedUrl(url);
      toast({ title: isAr ? "تم رفع ملف العقد" : "Contract file uploaded" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setContractFileUploading(false);
  };

  const filtered = lands.filter(l =>
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.district?.toLowerCase().includes(search.toLowerCase()) ||
    l.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getImageUrl = (land: any) => {
    if (!land.image_url) return null;
    if (land.image_url.startsWith("http")) return land.image_url;
    const { data } = supabase.storage.from("land-images").getPublicUrl(land.image_url);
    return data?.publicUrl;
  };

  const fmtValue = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={Landmark}
          titleAr="إدارة الأراضي"
          titleEn="Manage Lands"
          descAr="إضافة وتعديل الأراضي — تنعكس تلقائياً في الواجهة الرئيسية"
          descEn="Add and manage lands — reflected automatically on homepage"
          actions={
            <Button className="gap-2 syna-gradient" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />{isAr ? "إدراج أرض" : "Add Land"}
            </Button>
          }
        />

        <Dialog open={showAdd} onOpenChange={(v) => { if (!v) closeDialog(); else setShowAdd(true); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isAr ? (editingId ? "تعديل الأرض" : "إدراج أرض جديدة") : (editingId ? "Edit Land" : "Add New Land")}</DialogTitle>
            </DialogHeader>
            <LandSubmissionForm
              initialData={editInitialData}
              ownerProfiles={ownerProfiles}
              isAdmin={true}
              editingId={editingId}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          </DialogContent>
        </Dialog>

        {/* Search + soft-delete toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[220px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="ps-9" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary h-4 w-4"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            {isAr ? "عرض الأراضي المحذوفة" : "Show deleted lands"}
          </label>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "العقار والموقع" : "Property & Location"}</th>
                    <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "المساحة والاستخدام" : "Area & Usage"}</th>
                    <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "المالك والقيمة" : "Owner & Value"}</th>
                    <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "الحالة" : "Status"}</th>
                    <th className="px-5 py-3.5 font-medium text-end text-xs tracking-wide">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map(land => {
                    const imgUrl = getImageUrl(land);
                    return (
                      <tr key={land.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 shrink-0 rounded-lg bg-muted overflow-hidden relative border border-border/60 shadow-sm">
                              {imgUrl ? <img src={imgUrl} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary"/>{land.city}</p>
                              <p className="text-xs font-light text-muted-foreground mt-1">{land.district || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="text-sm font-medium text-foreground whitespace-nowrap" dir="ltr">{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
                            <Badge variant="outline" className="text-[10px] bg-background text-muted-foreground border-border/60 shrink-0">{isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{land.owner_name || "—"}</p>
                          <p className="text-xs text-primary mt-1 font-medium" dir="ltr">{land.estimated_total_value ? `${fmtValue(Number(land.estimated_total_value))} ${isAr ? "ريال" : "SAR"}` : "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {!land.is_active && <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-muted border border-border/50">{isAr ? "مسودة" : "Draft"}</Badge>}
                            {land.is_active && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/5">{isAr ? "نشط" : "Active"}</Badge>}
                            {land.owner_approved && <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/20 bg-blue-500/5">{isAr ? "معتمد" : "Approved"}</Badge>}
                            {land.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                            {land.brokerage_license_number && (
                              <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-500/20 bg-violet-500/5 gap-1">
                                <Shield className="h-2.5 w-2.5" />{isAr ? "رخصة" : "License"}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end align-middle">
                          <div className="flex items-center justify-end gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg" onClick={() => openEdit(land)} title={isAr ? "تعديل" : "Edit"}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-violet-600 hover:bg-violet-500/5 rounded-lg" onClick={() => openBrokerage(land)} title={isAr ? "الوساطة" : "Brokerage"}>
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => toggleActive(land.id, land.is_active)} title={isAr ? "تبديل النشر" : "Toggle Publish"}>
                              {land.is_active ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5 rounded-lg" onClick={() => toggleFeatured(land.id, land.is_featured)} title={isAr ? "تميز" : "Feature"}>
                              {land.is_featured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => setLegalDocLand(land)} title={isAr ? "طباعة الوثيقة" : "Print Doc"}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => setDeleteDialog(land)} title={isAr ? "حذف" : "Delete"}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <Landmark className="h-10 w-10 text-muted-foreground/30 mb-3" />
                          <p>{isAr ? "لا توجد مسجلات تطابق بحثك" : "No records match your search"}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Legal Document Print View */}
      {legalDocLand && (
        <LegalDocPrintView
          open={!!legalDocLand}
          onClose={() => setLegalDocLand(null)}
          form={{
            city: legalDocLand.city || "", district: legalDocLand.district || "",
            land_area_sqm: String(legalDocLand.land_area_sqm || ""),
            usage_type: legalDocLand.usage_type || "residential",
            partnership_goal: legalDocLand.partnership_goal || "develop_sell",
            plan_number: legalDocLand.plan_number || "", plot_number: legalDocLand.plot_number || "",
            deed_number: legalDocLand.deed_number || "", deed_date: legalDocLand.deed_date || "",
            project_model: legalDocLand.project_model || "development_partnership",
            development_subtype: legalDocLand.development_subtype || "",
            contribution_model: legalDocLand.contribution_model || "",
            exit_percentage: legalDocLand.exit_percentage ? String(legalDocLand.exit_percentage) : "",
            estimated_price_per_sqm: legalDocLand.estimated_price_per_sqm ? String(legalDocLand.estimated_price_per_sqm) : "",
            estimated_total_value: legalDocLand.estimated_total_value ? String(legalDocLand.estimated_total_value) : "",
            brokerage_license_number: legalDocLand.brokerage_license_number || "",
          } as any}
          referenceNumber={legalDocLand.id?.slice(0, 8).toUpperCase()}
          ownerName={legalDocLand.owner_name}
        />
      )}
      {/* Brokerage Dialog */}
      <Dialog open={!!brokerageLand} onOpenChange={(open) => { if (!open) closeBrokerage(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-600" />
              {isAr ? "رخصة وعقد الوساطة" : "Brokerage License & Contract"}
            </DialogTitle>
          </DialogHeader>

          {brokerageLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-6">
              {/* Land info */}
              <div className="rounded-lg bg-muted/30 border border-border/40 p-3">
                <p className="text-sm font-medium text-foreground">{brokerageLand?.city} {brokerageLand?.district ? `- ${brokerageLand.district}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{brokerageLand?.owner_name || "—"} | {Number(brokerageLand?.land_area_sqm || 0).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
              </div>

              {/* License Section */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-600" />
                  {isAr ? "رخصة الوساطة" : "Brokerage License"}
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "رقم الرخصة" : "License Number"}</Label>
                    <Input value={licenseForm.brokerage_license_number} onChange={e => setLicenseForm(p => ({ ...p, brokerage_license_number: e.target.value }))} dir="ltr" placeholder="e.g. 12345678" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "حالة الرخصة" : "License Status"}</Label>
                    <Select value={licenseForm.brokerage_license_status} onValueChange={v => setLicenseForm(p => ({ ...p, brokerage_license_status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{isAr ? "معلقة" : "Pending"}</SelectItem>
                        <SelectItem value="active">{isAr ? "سارية" : "Active"}</SelectItem>
                        <SelectItem value="expired">{isAr ? "منتهية" : "Expired"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "تاريخ الإصدار" : "Issue Date"}</Label>
                      <Input type="date" value={licenseForm.brokerage_license_date} onChange={e => setLicenseForm(p => ({ ...p, brokerage_license_date: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
                      <Input type="date" value={licenseForm.brokerage_license_expiry} onChange={e => setLicenseForm(p => ({ ...p, brokerage_license_expiry: e.target.value }))} dir="ltr" />
                    </div>
                  </div>
                  <Button size="sm" onClick={saveLicenseFields} disabled={brokerageSaving} className="w-full">
                    {brokerageSaving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ بيانات الرخصة" : "Save License Data")}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Contract Section */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-violet-600" />
                  {isAr ? "عقد الوساطة" : "Brokerage Contract"}
                  {brokerageContract && (
                    <Badge variant="outline" className="text-[10px]">
                      {brokerageContract.status === "active" ? (isAr ? "ساري" : "Active") :
                       brokerageContract.status === "expired" ? (isAr ? "منتهي" : "Expired") :
                       brokerageContract.status === "terminated" ? (isAr ? "ملغي" : "Terminated") :
                       (isAr ? "مسودة" : "Draft")}
                    </Badge>
                  )}
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "رقم العقد" : "Contract Number"} <span className="text-destructive">*</span></Label>
                    <Input value={contractForm.contract_number} onChange={e => setContractForm(p => ({ ...p, contract_number: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "تاريخ العقد" : "Contract Date"}</Label>
                      <Input type="date" value={contractForm.contract_date} onChange={e => setContractForm(p => ({ ...p, contract_date: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
                      <Input type="date" value={contractForm.contract_expiry} onChange={e => setContractForm(p => ({ ...p, contract_expiry: e.target.value }))} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "نسبة العمولة %" : "Commission Rate %"}</Label>
                      <Input type="number" step="0.01" value={contractForm.commission_rate} onChange={e => setContractForm(p => ({ ...p, commission_rate: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isAr ? "حالة العقد" : "Contract Status"}</Label>
                      <Select value={contractForm.status} onValueChange={v => setContractForm(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                          <SelectItem value="active">{isAr ? "ساري" : "Active"}</SelectItem>
                          <SelectItem value="expired">{isAr ? "منتهي" : "Expired"}</SelectItem>
                          <SelectItem value="terminated">{isAr ? "ملغي" : "Terminated"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
                    <Textarea value={contractForm.notes} onChange={e => setContractForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                  </div>

                  {/* Contract File */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" />{isAr ? "ملف العقد (PDF)" : "Contract File (PDF)"}</Label>
                    {contractSignedUrl && (
                      <div className="flex items-center gap-2 rounded-lg border border-border/40 p-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground flex-1">{isAr ? "ملف العقد مرفق" : "Contract file attached"}</span>
                        <a href={contractSignedUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        </a>
                      </div>
                    )}
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".pdf"
                        disabled={contractFileUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleContractFileUpload(f); }}
                      />
                      {contractFileUploading && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </div>

                  <Button size="sm" onClick={saveContract} disabled={brokerageSaving || !contractForm.contract_number} className="w-full">
                    {brokerageSaving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : brokerageContract ? (isAr ? "تحديث العقد" : "Update Contract") : (isAr ? "إنشاء العقد" : "Create Contract")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => { if (!open && !deleting) setDeleteDialog(null); }}>
        <DialogContent className="max-w-sm" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {isAr ? "حذف الأرض" : "Delete Land"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {isAr
                ? `هل أنت متأكد من حذف هذه الأرض في "${deleteDialog?.city || ""}${deleteDialog?.district ? ` - ${deleteDialog.district}` : ""}"؟`
                : `Are you sure you want to delete this land in "${deleteDialog?.city || ""}${deleteDialog?.district ? ` - ${deleteDialog.district}` : ""}"?`}
            </p>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isAr
                  ? "سيتم إخفاء الأرض من المنصة مع الحفاظ على السجلات المرتبطة بها (الصفقات، الطلبات). لا يمكن حذف أرض بها صفقات نشطة."
                  : "The land will be hidden from the platform while preserving related records (deals, requests). Lands with active deals cannot be deleted."}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} disabled={deleting}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLand} disabled={deleting}>
              {deleting ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLands;
