import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, CheckCircle2, XCircle, Clock, Trash2, HardHat, Pencil, KeyRound, Eye, EyeOff, Download, Globe, FileText, LogIn, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Developer = Database["public"]["Tables"]["developers"]["Row"];

const AdminDevelopers: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة المطورين" : "Manage Developers");
  const [devs, setDevs] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDev, setEditDev] = useState<Developer | null>(null);
  const [editForm, setEditForm] = useState({
    company_name: "",
    marketing_brand_name: "",
    cr_number: "",
    email: "",
    phone: "",
    website: "",
    verification_notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Password reset
  const [passwordDialog, setPasswordDialog] = useState<{ user_id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<Developer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const handleImpersonate = async (userId: string, name: string) => {
    setImpersonating(userId);
    try {
      const { data, error } = await supabase.functions.invoke("impersonate-user", {
        body: { target_user_id: userId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.verify_url) {
        // Open in new tab
        window.open(data.verify_url, "_blank");
        toast({ title: isAr ? `تم فتح جلسة ${name} في تبويب جديد` : `Opened ${name}'s session in new tab` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setImpersonating(null);
  };

  const fetchDevs = async () => {
    try {
      const { data } = await supabase.from("developers").select("*").order("created_at", { ascending: false });
      setDevs(data || []);
    } catch (err) {
      console.error("fetchDevs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevs(); }, []);

  const openEdit = (dev: Developer) => {
    setEditDev(dev);
    setEditForm({
      company_name: dev.company_name || "",
      marketing_brand_name: dev.marketing_brand_name || "",
      cr_number: dev.cr_number || "",
      email: dev.email || "",
      phone: dev.phone || "",
      website: dev.website || "",
      verification_notes: dev.verification_notes || "",
    });
  };

  const saveEdit = async () => {
    if (!editDev) return;
    setSaving(true);
    const { error } = await supabase.from("developers").update({
      company_name: editForm.company_name,
      marketing_brand_name: editForm.marketing_brand_name || null,
      cr_number: editForm.cr_number,
      email: editForm.email || null,
      phone: editForm.phone || null,
      website: editForm.website || null,
      verification_notes: editForm.verification_notes || null,
    }).eq("id", editDev.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      if (user) await logAudit(user.id, user.email, "update", "developer", editDev.id, { company_name: editForm.company_name });
      toast({ title: isAr ? "تم تحديث البيانات" : "Updated successfully" });
      setEditDev(null);
      fetchDevs();
    }
  };

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    try {
      const { error } = await supabase.from("developers").update({
        verification_status: status,
        verified_at: status === "verified" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
        if (user) await logAudit(user.id, user.email, status === "verified" ? "approve" : "reject", "developer", id);
        toast({ title: isAr ? (status === "verified" ? "تم التوثيق" : "تم الرفض") : (status === "verified" ? "Verified" : "Rejected") });
      }
    } catch (err) {
      console.error("updateStatus error:", err);
    } finally {
      fetchDevs();
    }
  };

  const handleDeleteDev = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      // 1. Find all deals linked to this developer
      const { data: deals } = await supabase
        .from("deals")
        .select("id")
        .eq("developer_id", deleteDialog.id);

      if (deals && deals.length > 0) {
        const dealIds = deals.map((d) => d.id);

        // 2. Delete deal-related records in correct order
        await supabase.from("deal_tasks").delete().in("deal_id", dealIds);
        await supabase.from("deal_meetings").delete().in("deal_id", dealIds);
        await supabase.from("deal_stages_log").delete().in("deal_id", dealIds);
        await supabase.from("deal_logs").delete().in("deal_id", dealIds);
        await supabase.from("deals").delete().in("id", dealIds);
      }

      // 3. Delete deal_requests linked to this developer
      await supabase.from("deal_requests").delete().eq("developer_id", deleteDialog.id);

      // 4. Delete developer record
      const { error: dbError } = await supabase.from("developers").delete().eq("id", deleteDialog.id);
      if (dbError) throw dbError;

      // 5. Delete the auth user via edge function
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "delete_user", user_id: deleteDialog.user_id },
      });
      if (res.error || res.data?.error) {
        console.warn("Auth user delete warning:", res.data?.error || res.error?.message);
      }

      if (user) await logAudit(user.id, user.email, "delete", "developer", deleteDialog.id, { company: deleteDialog.company_name });
      toast({ title: isAr ? "تم حذف المطور" : "Developer deleted" });
      setDeleteDialog(null);
      fetchDevs();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setDeleting(false);
  };

    const handleUpdatePassword = async () => {
    if (!passwordDialog || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters" });
      return;
    }
    setUpdatingPassword(true);
    try {
      const devName = passwordDialog.name;
      const devUserId = passwordDialog.user_id;
      console.log(`[Admin] Changing password for developer: ${devName} (user_id: ${devUserId})`);
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "update_password", user_id: devUserId, new_password: newPassword },
      });
      console.log("[Admin] Password update response:", JSON.stringify(res.data), "error:", res.error?.message);
      if (res.error) throw new Error(res.error.message || "Function call failed");
      if (res.data?.error) throw new Error(res.data.error);
      if (!res.data?.success) throw new Error(isAr ? "لم يتم تحديث كلمة المرور" : "Password was not updated");
      toast({ 
        title: isAr ? "تم تحديث كلمة المرور بنجاح ✓" : "Password updated successfully ✓",
        description: isAr ? `تم تغيير كلمة مرور المطور: ${devName}` : `Developer password changed: ${devName}`,
      });
      setPasswordDialog(null);
      setNewPassword("");
    } catch (err: any) {
      console.error("[Admin] Password update failed:", err);
      toast({ variant: "destructive", title: isAr ? "فشل تحديث كلمة المرور" : "Password update failed", description: err.message });
    }
    setUpdatingPassword(false);
  };

  const filtered = devs.filter(d =>
    d.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.cr_number?.includes(search) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = {
    pending_review: { label: isAr ? "قيد المراجعة" : "Pending", icon: Clock, variant: "outline" as const },
    verified: { label: isAr ? "موثق" : "Verified", icon: CheckCircle2, variant: "default" as const },
    rejected: { label: isAr ? "مرفوض" : "Rejected", icon: XCircle, variant: "destructive" as const },
  };

  const fields: { key: keyof typeof editForm; label: string; required?: boolean; dir?: string }[] = [
    { key: "company_name", label: isAr ? "اسم الشركة" : "Company Name", required: true },
    { key: "marketing_brand_name", label: isAr ? "الاسم التجاري" : "Brand Name" },
    { key: "cr_number", label: isAr ? "رقم السجل التجاري" : "CR Number", required: true },
    { key: "email", label: isAr ? "البريد الإلكتروني" : "Email", dir: "ltr" },
    { key: "phone", label: isAr ? "الهاتف" : "Phone", dir: "ltr" },
    { key: "website", label: isAr ? "الموقع الإلكتروني" : "Website", dir: "ltr" },
    { key: "verification_notes", label: isAr ? "ملاحظات التوثيق" : "Verification Notes" },
  ];

  const getFileUrl = (url: string | null) => {
    if (!url) return null;
    if (!url.startsWith("http")) {
      const { data } = supabase.storage.from("developer-docs").getPublicUrl(url);
      return data?.publicUrl;
    }
    return url;
  };

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
      <AdminPageHeader
        icon={HardHat}
        titleAr="إدارة المطورين"
        titleEn="Manage Developers"
        descAr="تفعيل وإدارة حسابات المطورين"
        descEn="Activate and manage developer accounts"
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="ps-9" placeholder={isAr ? "بحث بالاسم أو السجل..." : "Search by name or CR..."} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: isAr ? "إجمالي" : "Total", value: devs.length },
          { label: isAr ? "موثق" : "Verified", value: devs.filter(d => d.verification_status === "verified").length },
          { label: isAr ? "قيد المراجعة" : "Pending", value: devs.filter(d => d.verification_status === "pending_review").length },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-3 text-center">
            <p className="text-2xl font-medium text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(dev => {
            const sc = statusConfig[dev.verification_status];
            return (
              <div key={dev.id} className="rounded-xl border border-border/60 bg-card flex items-center justify-between p-4 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <HardHat className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{dev.company_name}</p>
                      {dev.marketing_brand_name && <span className="text-xs text-muted-foreground">({dev.marketing_brand_name})</span>}
                    </div>
                    <p className="text-xs font-light text-muted-foreground">
                      {isAr ? "سجل تجاري:" : "CR:"} {dev.cr_number} • {dev.email || "—"} • {dev.phone || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sc.variant} className="gap-1">
                    <sc.icon className="h-3 w-3" />
                    {sc.label}
                  </Badge>
                  {dev.verification_status === "pending_review" && (
                    <>
                      <Button size="sm" variant="outline" className="text-primary border-primary/20 hover:bg-primary/5" onClick={() => updateStatus(dev.id, "verified")}>
                        <CheckCircle2 className="h-3.5 w-3.5 me-1" />{isAr ? "توثيق" : "Verify"}
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => updateStatus(dev.id, "rejected")}>
                        <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? "رفض" : "Reject"}
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(dev)}>
                    <Pencil className="h-3.5 w-3.5 me-1" />{isAr ? "تعديل" : "Edit"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPasswordDialog({ user_id: dev.user_id, name: dev.company_name })}>
                    <KeyRound className="h-3.5 w-3.5 me-1" />{isAr ? "كلمة المرور" : "Password"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteDialog(dev)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا يوجد مطورون" : "No developers found"}</p>}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editDev} onOpenChange={(open) => !open && setEditDev(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل بيانات المطور" : "Edit Developer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-sm">{f.label} {f.required && <span className="text-destructive">*</span>}</Label>
                <Input
                  value={editForm[f.key]}
                  onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  dir={f.dir}
                />
              </div>
            ))}

            {/* Attached Documents Section */}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                {isAr ? "المستندات المرفقة" : "Attached Documents"}
              </h4>

              {/* CR File */}
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-light text-foreground">{isAr ? "السجل التجاري" : "Commercial Registration"}</p>
                    <p className="text-[11px] text-muted-foreground">PDF</p>
                  </div>
                </div>
                {editDev?.cr_file_url ? (
                  <a href={getFileUrl(editDev.cr_file_url) || "#"} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">{isAr ? "غير متوفر" : "N/A"}</span>
                )}
              </div>

              {/* Website link display */}
              {editDev?.website && (
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-light text-foreground">{isAr ? "الموقع الإلكتروني" : "Website"}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" dir="ltr">{editDev.website}</p>
                    </div>
                  </div>
                  <a href={editDev.website.startsWith("http") ? editDev.website : `https://${editDev.website}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Globe className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              )}

              {/* AI extracted data */}
              {(editDev?.cr_extracted_name || editDev?.cr_extracted_number) && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{isAr ? "بيانات مستخرجة بالذكاء الاصطناعي" : "AI Extracted Data"}</p>
                  {editDev?.cr_extracted_name && (
                    <p className="text-sm text-foreground">{isAr ? "الاسم:" : "Name:"} {editDev.cr_extracted_name}</p>
                  )}
                  {editDev?.cr_extracted_number && (
                    <p className="text-sm text-foreground" dir="ltr">{isAr ? "الرقم:" : "Number:"} {editDev.cr_extracted_number}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDev(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveEdit} disabled={saving || !editForm.company_name || !editForm.cr_number}>
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={(open) => { if (!open) { setPasswordDialog(null); setNewPassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "تغيير كلمة مرور المطور" : "Change Developer Password"}</DialogTitle>
          </DialogHeader>
          <div className="rounded-md bg-accent/50 p-3 text-sm">
            <p className="font-medium text-foreground">
              {isAr ? "المطور:" : "Developer:"} {passwordDialog?.name || ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "⚠️ سيتم تغيير كلمة مرور حساب المطور فقط، وليس حساب مدير النظام" : "⚠️ This will only change the developer's password, not the admin's"}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpdatePassword} disabled={updatingPassword || newPassword.length < 6}>
              {updatingPassword ? (isAr ? "جارٍ التحديث..." : "Updating...") : (isAr ? "تحديث" : "Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">{isAr ? "حذف حساب المطور" : "Delete Developer Account"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `هل أنت متأكد من حذف حساب "${deleteDialog?.company_name || ""}"؟ سيتم حذف جميع البيانات المرتبطة ولا يمكن التراجع.`
              : `Are you sure you want to delete "${deleteDialog?.company_name || ""}"? All related data will be removed.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDeleteDev} disabled={deleting}>
              {deleting ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف نهائي" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDevelopers;
