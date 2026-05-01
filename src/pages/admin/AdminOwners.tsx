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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Landmark, Mail, User, Eye, EyeOff, Copy, KeyRound, Trash2,
  Search, MapPin, Ruler, CheckCircle2, Loader2, Shield, Phone, LogIn,
  Send
} from "lucide-react";
import { log } from "@/lib/logger";
import { getInvokeErrorMessage } from "@/lib/edgeError";

const AdminOwners: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الملاك" : "Manage Owners");

  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);
  const [search, setSearch] = useState("");

  const [passwordDialog, setPasswordDialog] = useState<{ owner_id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{ owner_id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // Invite-by-email flow (separate from create-with-password)
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ full_name: "", email: "" });
  const [inviteResult, setInviteResult] = useState<{ email: string; email_sent: boolean; invite_url?: string } | null>(null);

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setInviting(true);
    try {
      const res = await supabase.functions.invoke("invite-owner", {
        body: { email: inviteForm.email, full_name: inviteForm.full_name },
      });
      if (res.error || res.data?.error) throw new Error(await getInvokeErrorMessage(res));
      setInviteResult({
        email: res.data.email,
        email_sent: !!res.data.email_sent,
        invite_url: res.data.invite_url,
      });
      toast({
        title: res.data.email_sent
          ? (isAr ? "تم إرسال الدعوة" : "Invitation sent")
          : (isAr ? "تم إنشاء الرابط — أرسله يدوياً" : "Link ready — send manually"),
      });
      fetchOwners();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "تعذّر إرسال الدعوة" : "Invite failed", description: err.message });
    } finally {
      setInviting(false);
    }
  };

  const handleImpersonate = async (userId: string, name: string) => {
    setImpersonating(userId);
    try {
      const { data, error } = await supabase.functions.invoke("impersonate-user", {
        body: { target_user_id: userId },
      });
      if (error || data?.error) throw new Error(await getInvokeErrorMessage({ data, error }));
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

  const fetchOwners = async () => {
    const { data: landsData } = await supabase
      .from("lands")
      .select("owner_id, owner_name, city, district, land_area_sqm, owner_approved")
      .order("created_at", { ascending: false });

    const ownerMap: Record<string, { owner_id: string; owner_name: string; lands: any[]; email?: string; phone?: string }> = {};
    landsData?.forEach((l) => {
      if (!ownerMap[l.owner_id]) {
        ownerMap[l.owner_id] = { owner_id: l.owner_id, owner_name: l.owner_name || "", lands: [] };
      }
      ownerMap[l.owner_id].lands.push(l);
    });

    const ownerIds = Object.keys(ownerMap);
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, email, full_name, phone").in("user_id", ownerIds);
      profiles?.forEach((p) => {
        if (ownerMap[p.user_id]) {
          ownerMap[p.user_id].owner_name = p.full_name || ownerMap[p.user_id].owner_name;
          ownerMap[p.user_id].email = p.email || undefined;
          ownerMap[p.user_id].phone = p.phone || undefined;
        }
      });
    }

    setOwners(Object.values(ownerMap));
    setLoading(false);
  };

  useEffect(() => { fetchOwners(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password) return;
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: { email: form.email, password: form.password, full_name: form.full_name },
      });
      if (res.error || res.data?.error) throw new Error(await getInvokeErrorMessage(res));
      if (user) await logAudit(user.id, user.email, "create", "owner", undefined, { email: form.email });
      // Send notification email to admin
      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: { type: "new_owner_registered", registered_name: form.full_name, registered_email: form.email, registered_phone: form.phone },
        });
      } catch {}
      toast({ title: isAr ? "تم إنشاء حساب المالك" : "Owner account created" });
      setCreatedInfo({ email: form.email, password: form.password });
      setForm({ full_name: "", email: "", password: "", phone: "" });
      fetchOwners();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setCreating(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordDialog || !newPassword) return;
    setUpdatingPassword(true);
    try {
      // target_kind: "owner" routes the permission check to perm_owners
      // (instead of the historical perm_developers fallback). Required
      // since the audit; without it, a staff member with only perm_owners
      // would have been blocked from resetting a password they should be
      // allowed to reset.
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "update_password", user_id: passwordDialog.owner_id, new_password: newPassword, target_kind: "owner" },
      });
      if (res.error || res.data?.error) throw new Error(await getInvokeErrorMessage(res));
      if (user) await logAudit(user.id, user.email, "reset_password", "owner", passwordDialog.owner_id);
      toast({ title: isAr ? "تم تحديث كلمة المرور" : "Password updated" });
      setPasswordDialog(null);
      setNewPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setUpdatingPassword(false);
  };

  const handleDeleteOwner = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      // Step 1 — soft-delete the owner's lands and close any open
      // deal_requests pointing at them inside a single transaction.
      // Without this RPC the edge function below would delete the
      // auth user but leave their lands with an owner_id that no
      // longer resolves, breaking RLS policies on dependent queries.
      const { error: cascadeErr } = await supabase.rpc(
        "admin_soft_delete_owner_lands" as any,
        { _owner_user_id: deleteDialog.owner_id } as any
      );
      if (cascadeErr) {
        log.warn("Owner cascade warning:", cascadeErr.message);
        // Don't abort — the owner may simply have no lands yet.
      }

      // Step 2 — drop the auth user via service-role edge function.
      // target_kind: "owner" routes the permission check to perm_owners.
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "delete_user", user_id: deleteDialog.owner_id, target_kind: "owner" },
      });
      if (res.error || res.data?.error) throw new Error(await getInvokeErrorMessage(res));
      if (user) await logAudit(user.id, user.email, "delete", "owner", deleteDialog.owner_id);
      toast({ title: isAr ? "تم حذف الحساب" : "Account deleted" });
      setDeleteDialog(null);
      fetchOwners();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setDeleting(false);
  };

  const copyCredentials = () => {
    if (!createdInfo) return;
    navigator.clipboard.writeText(`${isAr ? "البريد" : "Email"}: ${createdInfo.email}\n${isAr ? "كلمة المرور" : "Password"}: ${createdInfo.password}`);
    toast({ title: isAr ? "تم النسخ" : "Copied!" });
  };

  const filteredOwners = owners.filter(o =>
    o.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.lands?.some((l: any) => l.city?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalLands = owners.reduce((sum, o) => sum + o.lands.length, 0);
  const approvedLands = owners.reduce((sum, o) => sum + o.lands.filter((l: any) => l.owner_approved).length, 0);

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={Landmark}
          titleAr="إدارة ملاك الأراضي"
          titleEn="Manage Land Owners"
          descAr="إنشاء حسابات الملاك وإدارة بياناتهم"
          descEn="Create owner accounts and manage their data"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                <LogIn className="h-3.5 w-3.5" />
                {isAr ? "للدخول كمالك، اضغط أيقونة الدخول بجانب اسمه" : "To enter as owner, click login icon next to their name"}
              </div>
              <Button variant="outline" className="gap-2" onClick={() => { setShowInvite(true); setInviteResult(null); setInviteForm({ full_name: "", email: "" }); }}>
                <Send className="h-4 w-4" />{isAr ? "دعوة مالك بالبريد" : "Invite by Email"}
              </Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />{isAr ? "إضافة مالك" : "Add Owner"}
              </Button>
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: isAr ? "إجمالي الملاك" : "Total Owners", value: owners.length, icon: User, color: "text-[#2B2B2B]", bg: "bg-[#2B2B2B]/8" },
            { label: isAr ? "إجمالي الأراضي" : "Total Lands", value: totalLands, icon: MapPin, color: "text-amber-600", bg: "bg-amber-500/8" },
            { label: isAr ? "أراضي معتمدة" : "Approved Lands", value: approvedLands, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/8" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-gray-200/60 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">{kpi.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[22px] font-bold text-gray-900" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9" placeholder={isAr ? "بحث بالاسم أو البريد أو المدينة..." : "Search by name, email, or city..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : filteredOwners.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Landmark className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد ملاك مسجلين" : "No owners found"}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredOwners.map((owner) => (
              <div key={owner.owner_id} className="rounded-xl border border-border/60 bg-card p-4 hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{owner.owner_name || (isAr ? "بدون اسم" : "No name")}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {owner.email && <span className="truncate" dir="ltr">{owner.email}</span>}
                        {owner.phone && <span dir="ltr">• {owner.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" onClick={() => handleImpersonate(owner.owner_id, owner.owner_name)} disabled={impersonating === owner.owner_id} title={isAr ? "دخول كمالك" : "Login as owner"}>
                      {impersonating === owner.owner_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setPasswordDialog({ owner_id: owner.owner_id, name: owner.owner_name })}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog({ owner_id: owner.owner_id, name: owner.owner_name })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {owner.lands.map((l: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{l.city}{l.district ? ` - ${l.district}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground" dir="ltr">{Number(l.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                        {l.owner_approved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{owner.lands.length} {isAr ? "أرض" : "lands"}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${owner.lands.some((l: any) => l.owner_approved) ? "text-emerald-600 border-emerald-500/30" : "text-muted-foreground"}`}>
                    {owner.lands.filter((l: any) => l.owner_approved).length} {isAr ? "معتمدة" : "approved"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Owner Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) { setCreatedInfo(null); setForm({ full_name: "", email: "", password: "", phone: "" }); } }}>
        <DialogContent className="sm:max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {isAr ? "إنشاء حساب مالك أرض" : "Create Land Owner Account"}
            </DialogTitle>
          </DialogHeader>
          {createdInfo ? (
            <div className="space-y-4 py-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-emerald-700 mb-3">
                  {isAr ? "تم إنشاء الحساب بنجاح" : "Account created successfully"}
                </p>
                <div className="rounded-lg border border-border bg-card p-4 text-start space-y-2" dir="ltr">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{createdInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{createdInfo.password}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyCredentials}>
                  <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ البيانات" : "Copy Credentials"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{isAr ? "اسم المالك" : "Owner Name"} <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="ps-9" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder={isAr ? "الاسم الكامل" : "Full name"} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{isAr ? "رقم الجوال" : "Phone"}</Label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="ps-9" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966" dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" placeholder="owner@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "كلمة المرور" : "Password"} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9 pe-10" type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} dir="ltr" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-primary/80">
                  {isAr ? "سيتم إرسال بيانات الدخول للمالك عبر البريد الإلكتروني تلقائياً" : "Login credentials will be sent to the owner via email automatically"}
                </p>
              </div>
            </div>
          )}
          {!createdInfo && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={creating || !form.email || !form.password || !form.full_name}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الحساب" : "Create Account")}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Owner Dialog — secure invite flow (no shared password) */}
      <Dialog open={showInvite} onOpenChange={(v) => { setShowInvite(v); if (!v) { setInviteResult(null); setInviteForm({ full_name: "", email: "" }); } }}>
        <DialogContent className="sm:max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              {isAr ? "دعوة مالك بالبريد" : "Invite Owner by Email"}
            </DialogTitle>
          </DialogHeader>
          {inviteResult ? (
            <div className="space-y-4 py-4">
              <div className={`rounded-xl border p-5 text-center ${inviteResult.email_sent ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                <CheckCircle2 className={`h-10 w-10 mx-auto mb-3 ${inviteResult.email_sent ? "text-emerald-600" : "text-amber-600"}`} />
                <p className={`text-sm font-medium mb-2 ${inviteResult.email_sent ? "text-emerald-700" : "text-amber-700"}`}>
                  {inviteResult.email_sent
                    ? (isAr ? "تم إرسال الدعوة بنجاح" : "Invitation sent successfully")
                    : (isAr ? "تعذر إرسال البريد — انسخ الرابط أدناه" : "Email send failed — copy link below")}
                </p>
                <p className="text-[12px] text-muted-foreground mb-3" dir="ltr">{inviteResult.email}</p>
                {inviteResult.invite_url && (
                  <div className="rounded-lg border border-border bg-card p-3 text-start" dir="ltr">
                    <p className="text-[11px] font-mono break-all">{inviteResult.invite_url}</p>
                    <Button
                      variant="outline" size="sm" className="mt-2 gap-2"
                      onClick={() => { navigator.clipboard.writeText(inviteResult.invite_url!); toast({ title: isAr ? "تم النسخ" : "Copied!" }); }}
                    >
                      <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ الرابط" : "Copy Link"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "اسم المالك" : "Full Name"}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9" value={inviteForm.full_name} onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))} placeholder={isAr ? "الاسم الكامل (اختياري)" : "Full name (optional)"} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9" type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} dir="ltr" placeholder="owner@example.com" />
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-primary/80 leading-relaxed">
                  {isAr
                    ? "سيستلم المالك رابطاً آمناً لتعيين كلمة مرور خاصة به. لا يتم مشاركة أي كلمة مرور مسبقة."
                    : "The owner receives a secure link to set their own password. No shared password."}
                </p>
              </div>
            </div>
          )}
          {!inviteResult && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowInvite(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={handleInvite} disabled={inviting || !inviteForm.email}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {inviting ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الدعوة" : "Send Invite")}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={(open) => { if (!open) { setPasswordDialog(null); setNewPassword(""); } }}>
        <DialogContent className="max-w-sm" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr ? `تغيير كلمة مرور: ${passwordDialog?.name || ""}` : `Change password for: ${passwordDialog?.name || ""}`}
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
            <div className="relative">
              <Input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" dir="ltr" className="pe-10" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpdatePassword} disabled={updatingPassword || newPassword.length < 6} className="gap-1.5">
              {updatingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              {updatingPassword ? (isAr ? "جارٍ التحديث..." : "Updating...") : (isAr ? "تحديث" : "Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {isAr ? "حذف حساب المالك" : "Delete Owner Account"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `هل أنت متأكد من حذف حساب "${deleteDialog?.name || ""}"؟ سيتم حذف جميع الأراضي المرتبطة.`
              : `Are you sure you want to delete "${deleteDialog?.name || ""}"? All associated lands will be removed.`}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDeleteOwner} disabled={deleting} className="gap-1.5">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleting ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOwners;
