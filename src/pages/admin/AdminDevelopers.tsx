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
import { Search, CheckCircle2, XCircle, Clock, Trash2, HardHat, Pencil, KeyRound, Eye, EyeOff, Download, Globe, FileText, LogIn, Loader2, Banknote } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getAgreementByUserId, getAgreementsByUserIds, type DeveloperAgreement } from "@/services/agreements.service";

type Developer = Database["public"]["Tables"]["developers"]["Row"];

const safeUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  if (/^javascript:/i.test(url)) return "#";
  return `https://${url}`;
};

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

  // Agreement status map
  const [agreementMap, setAgreementMap] = useState<Record<string, DeveloperAgreement>>({});

  const handleImpersonate = async (userId: string, name: string) => {
    setImpersonating(userId);
    try {
      const { data, error } = await supabase.functions.invoke("impersonate-user", {
        body: { target_user_id: userId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.verify_url) {
        // Tokens live ONLY in the URL fragment of verify_url (never sent
        // to any server). Edge function no longer ships raw tokens in the
        // JSON body — this is the sole path.
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

      // Fetch agreements for all developers in one batch — previously
      // this was N+1 (one round trip per developer).
      if (data && data.length > 0) {
        const agMap = await getAgreementsByUserIds(data.map(d => d.user_id));
        setAgreementMap(agMap);
      }
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
      // Step 1 — run the cascade in a single DB transaction via RPC.
      // The RPC (admin_delete_developer_cascade) does all the child-row
      // cleanup atomically; if any table fails the whole delete rolls
      // back, so we never leave orphaned deals/deal_requests pointing
      // at a missing developer. It also writes a single "cascade_delete"
      // audit row with counts.
      const { error: cascadeErr } = await supabase.rpc(
        "admin_delete_developer_cascade" as any,
        { _developer_id: deleteDialog.id } as any
      );
      if (cascadeErr) throw cascadeErr;

      // Step 2 — drop the auth user. This call cannot be part of the
      // DB transaction (service-role key lives in the edge function).
      // If it fails we log a warning but do NOT roll back the cascade,
      // because the developer row is already gone and re-creating it
      // would be inconsistent. Orphan auth users are acceptable and
      // can be cleaned up manually.
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "delete_user", user_id: deleteDialog.user_id, target_kind: "developer" },
      });
      if (res.error || res.data?.error) {
        console.warn("Auth user delete warning:", res.data?.error || res.error?.message);
      }

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
    // Client-side validation must match the edge function's rule (≥10
    // chars + upper + lower + digit + symbol). If we let through a
    // weaker password the user sees a confusing server-side error
    // instead of an actionable hint.
    const strong =
      newPassword.length >= 10 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);
    if (!strong) {
      toast({
        variant: "destructive",
        title: isAr ? "كلمة مرور ضعيفة" : "Weak password",
        description: isAr
          ? "10 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص."
          : "At least 10 characters, with upper- and lower-case letters, a digit, and a symbol.",
      });
      return;
    }
    setUpdatingPassword(true);
    try {
      const devName = passwordDialog.name;
      const devUserId = passwordDialog.user_id;
      // `target_kind: "developer"` lets the edge function check the
      // caller's `perm_developers` flag explicitly, so an admin or
      // supervisor with that permission can change a developer's
      // password without needing super-admin status.
      const res = await supabase.functions.invoke("create-owner", {
        body: {
          action: "update_password",
          user_id: devUserId,
          new_password: newPassword,
          target_kind: "developer",
        },
      });
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
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
            <LogIn className="h-3.5 w-3.5" />
            {isAr ? "للدخول كمطور، اضغط \"دخول\" بجانب اسمه" : "To enter as developer, click \"Login\" next to their name"}
          </div>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="ps-9" placeholder={isAr ? "بحث بالاسم أو السجل..." : "Search by name or CR..."} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: isAr ? "إجمالي" : "Total", value: devs.length, icon: HardHat, color: "text-[#2B2B2B]", bg: "bg-[#2B2B2B]/8" },
          { label: isAr ? "موثق" : "Verified", value: devs.filter(d => d.verification_status === "verified").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/8" },
          { label: isAr ? "قيد المراجعة" : "Pending", value: devs.filter(d => d.verification_status === "pending_review").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/8" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200/60 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">{s.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[22px] font-bold text-gray-900" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "المطور" : "Developer"}</th>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "التواصل والسجل" : "Contact & CR"}</th>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "العمولة" : "Commission"}</th>
                  <th className="px-5 py-3.5 font-medium text-end text-xs tracking-wide">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(dev => {
                  const sc = statusConfig[dev.verification_status];
                  return (
                    <tr key={dev.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent dark:bg-white/5 border border-border/50 overflow-hidden">
                            {dev.logo_url ? (
                              <img
                                src={dev.logo_url}
                                alt={dev.company_name || "logo"}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => {
                                  // Hide broken image and fall back to icon
                                  const el = e.currentTarget;
                                  el.style.display = "none";
                                  const fb = el.nextElementSibling as HTMLElement | null;
                                  if (fb) fb.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="h-full w-full items-center justify-center"
                              style={{ display: dev.logo_url ? "none" : "flex" }}
                            >
                              <HardHat className="h-5 w-5 text-accent-foreground/70 dark:text-slate-300" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{dev.company_name}</p>
                            {dev.marketing_brand_name && <p className="text-[11px] text-muted-foreground">{dev.marketing_brand_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 min-w-[240px]">
                        <p className="text-xs text-foreground font-medium" dir="ltr">{dev.cr_number}</p>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                          {dev.phone && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                              <span className="text-[9px] opacity-70">📞</span>{dev.phone}
                            </span>
                          )}
                          {dev.email && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[180px]" dir="ltr" title={dev.email}>
                              <span className="text-[9px] opacity-70">✉</span>{dev.email}
                            </span>
                          )}
                          {!dev.phone && !dev.email && <span className="text-[11px] text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={sc.variant} className="gap-1 text-[10px] whitespace-nowrap">
                          <sc.icon className="h-3.5 w-3.5" />
                          {sc.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {agreementMap[dev.user_id] ? (
                          <Badge variant="default" className="gap-1 text-[10px] whitespace-nowrap bg-emerald-600 hover:bg-emerald-700">
                            <Banknote className="h-3 w-3" />
                            {isAr ? `${agreementMap[dev.user_id].commission_total}%` : `${agreementMap[dev.user_id].commission_total}%`}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{isAr ? "بدون اتفاقية" : "No agreement"}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {dev.verification_status === "pending_review" && (
                            <>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/10" onClick={() => updateStatus(dev.id, "verified")} title={isAr ? "توثيق" : "Verify"}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => updateStatus(dev.id, "rejected")} title={isAr ? "رفض" : "Reject"}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => handleImpersonate(dev.user_id, dev.company_name)} disabled={impersonating === dev.user_id}>
                            {impersonating === dev.user_id ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <LogIn className="h-3 w-3 me-1" />}
                            {isAr ? "دخول" : "Login"}
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(dev)} title={isAr ? "تعديل" : "Edit"}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setPasswordDialog({ user_id: dev.user_id, name: dev.company_name })} title={isAr ? "كلمة المرور" : "Password"}>
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog(dev)} title={isAr ? "حذف" : "Delete"}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا يوجد مطورون" : "No developers found"}</p>}
          </div>
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
                  <a href={safeUrl(editDev.website)} target="_blank" rel="noopener noreferrer">
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
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isAr
                ? "يجب أن تتكوّن من ١٠ أحرف على الأقل، وتشمل حرفاً كبيراً وصغيراً ورقماً ورمزاً خاصاً."
                : "Min 10 chars, with upper- & lower-case letters, a digit, and a symbol."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpdatePassword} disabled={updatingPassword || newPassword.length < 10}>
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
