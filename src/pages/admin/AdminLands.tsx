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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, StarOff, MapPin, Search, Eye, EyeOff, Pencil, Ruler, Building2, Image as ImageIcon, Landmark, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LandSubmissionForm from "@/components/land/LandSubmissionForm";
import LegalDocPrintView from "@/components/land/LegalDocPrintView";
import { LandFormData, usageLabels, goalLabels } from "@/components/land/LandFormConstants";

const AdminLands: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الأراضي" : "Manage Lands");
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInitialData, setEditInitialData] = useState<Partial<LandFormData>>({});
  const [ownerProfiles, setOwnerProfiles] = useState<any[]>([]);
  const [legalDocLand, setLegalDocLand] = useState<any>(null);

  const fetchLands = async () => {
    const { data } = await supabase.from("lands").select("*").order("created_at", { ascending: false });
    setLands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLands(); }, []);

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
      submission_status: form.legal_acknowledgment_accepted ? "submitted" : "draft",
      legal_acknowledgment_accepted: form.legal_acknowledgment_accepted,
      legal_acknowledgment_date: form.legal_acknowledgment_accepted ? new Date().toISOString() : null,
      platform_fee_acknowledged: form.platform_fee_acknowledged,
    };

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
    await supabase.from("lands").update({ is_active: !current }).eq("id", id);
    if (user) await logAudit(user.id, user.email, "update", "land", id, { is_active: !current });
    fetchLands();
    toast({ title: isAr ? (!current ? "تم النشر" : "تم الإخفاء") : (!current ? "Published" : "Hidden") });
  };

  const deleteLand = async (id: string) => {
    await supabase.from("lands").delete().eq("id", id);
    if (user) await logAudit(user.id, user.email, "delete", "land", id);
    fetchLands();
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
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

        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
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
                          <p className="text-sm font-medium text-foreground" dir="ltr">{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
                          <Badge variant="outline" className="mt-1.5 text-[10px] bg-background text-muted-foreground border-border/60">{isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{land.owner_name || "—"}</p>
                          <p className="text-xs text-primary mt-1 font-medium" dir="ltr">{land.estimated_total_value ? `${fmtValue(Number(land.estimated_total_value))} SAR` : "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {!land.is_active && <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-muted border border-border/50">{isAr ? "مسودة" : "Draft"}</Badge>}
                            {land.is_active && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/5">{isAr ? "نشط" : "Active"}</Badge>}
                            {land.owner_approved && <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/20 bg-blue-500/5">{isAr ? "معتمد" : "Approved"}</Badge>}
                            {land.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end align-middle">
                          <div className="flex items-center justify-end gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg" onClick={() => openEdit(land)} title={isAr ? "تعديل" : "Edit"}>
                              <Pencil className="h-4 w-4" />
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => deleteLand(land.id)} title={isAr ? "حذف" : "Delete"}>
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
    </AdminLayout>
  );
};

export default AdminLands;
