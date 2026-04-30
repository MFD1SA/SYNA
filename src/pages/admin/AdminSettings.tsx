import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Mail, KeyRound, Eye, EyeOff, Save, Loader2, ShieldCheck, Clock, Timer, ShieldAlert, RotateCcw } from "lucide-react";
import AvatarUpload from "@/components/shared/AvatarUpload";
import { log } from "@/lib/logger";

const DEFAULT_DEADLINES = {
  request_acceptance_days: 14,
  owner_response_days: 5,
  negotiation_days: 10,
  opportunity_validity_days: 30,
};

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إعدادات الحساب" : "Account Settings");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState("");
  const [loadingPrimaryAdmin, setLoadingPrimaryAdmin] = useState(false);
  const [savingPrimaryAdminEmail, setSavingPrimaryAdminEmail] = useState(false);
  const [primaryAdminPassword, setPrimaryAdminPassword] = useState("");
  const [confirmPrimaryAdminPassword, setConfirmPrimaryAdminPassword] = useState("");
  const [showPrimaryAdminPassword, setShowPrimaryAdminPassword] = useState(false);
  const [showPrimaryAdminConfirm, setShowPrimaryAdminConfirm] = useState(false);
  const [resettingPrimaryAdminPassword, setResettingPrimaryAdminPassword] = useState(false);
  const [triggeringPrimaryRecovery, setTriggeringPrimaryRecovery] = useState(false);

  // Deadline settings
  const [deadlines, setDeadlines] = useState(DEFAULT_DEADLINES);
  const [savingDeadlines, setSavingDeadlines] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    setFullName(user.user_metadata?.full_name || "");
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.full_name) setFullName(data.full_name);
      if ((data as any)?.avatar_url) setAvatarUrl((data as any).avatar_url);
    }, console.error);
    // Load deadline settings from platform_content
    supabase.from("platform_content").select("*").eq("content_key", "opportunity_deadlines").maybeSingle().then(({ data }) => {
      if (data?.body_en) {
        try {
          const parsed = JSON.parse(data.body_en);
          setDeadlines({ ...DEFAULT_DEADLINES, ...parsed });
        } catch {}
      }
    }, console.error);

    supabase
      .from("admin_permissions")
      .select("is_super_admin")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const superAdmin = !!data?.is_super_admin;
        setIsSuperAdmin(superAdmin);
        if (superAdmin) {
          setLoadingPrimaryAdmin(true);
          supabase.functions.invoke("create-owner", {
            body: { action: "get_primary_admin_config" },
          }).then(({ data, error }) => {
            if (!error && data?.primary_admin_email) {
              setPrimaryAdminEmail(data.primary_admin_email);
            }
            setLoadingPrimaryAdmin(false);
          }, console.error);
        }
      }, console.error);
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error: authErr } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (authErr) throw authErr;
      await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl } as any).eq("user_id", user.id);
      await logAudit(user.id, user.email, "update", "admin_profile", user.id, { full_name: fullName });
      toast({ title: isAr ? "تم تحديث الاسم بنجاح ✓" : "Name updated successfully ✓" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSavingProfile(false);
  };

  const handleSaveEmail = async () => {
    if (!user || !email) return;
    if (email === user.email) {
      toast({ variant: "destructive", title: isAr ? "تنبيه" : "Notice", description: isAr ? "البريد الإلكتروني مطابق للحالي" : "Email is the same as current" });
      return;
    }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      await logAudit(user.id, user.email, "update", "admin_email", user.id, { new_email: email });
      toast({
        title: isAr ? "تم إرسال رابط التأكيد ✓" : "Confirmation link sent ✓",
        description: isAr ? "تحقق من بريدك الإلكتروني الجديد لتأكيد التغيير" : "Check your new email to confirm the change",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSavingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    // Enforce 10-char minimum to match Register.tsx / SetPassword.tsx.
    if (newPassword.length < 10) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور يجب أن تكون 10 أحرف على الأقل" : "Password must be at least 10 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }
    setSavingPassword(true);
    try {
      // IMPORTANT — do NOT call signInWithPassword() as a pre-verify step.
      // That rotates the access/refresh token pair mid-request, which can
      // wipe the in-flight admin session and break concurrent tabs. Supabase
      // has no first-class "verify current password" API; we rely on the
      // server-side session freshness check inside updateUser() and surface
      // AuthSessionMissingError back to the user so they can re-authenticate.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        // Session too stale → GoTrue rejects the change. Ask the user to sign in again.
        const stale =
          error.name === "AuthSessionMissingError" ||
          /session/i.test(error.message ?? "");
        if (stale) {
          toast({
            variant: "destructive",
            title: isAr ? "انتهت صلاحية الجلسة" : "Session expired",
            description: isAr
              ? "لأسباب أمنية، يرجى تسجيل الخروج ثم تسجيل الدخول مجددًا قبل تغيير كلمة المرور."
              : "For security, please sign out and sign in again before changing your password.",
          });
          setSavingPassword(false);
          return;
        }
        throw error;
      }
      await logAudit(user.id, user.email, "update", "admin_password", user.id);
      toast({ title: isAr ? "تم تغيير كلمة المرور بنجاح ✓" : "Password changed successfully ✓" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSavingPassword(false);
  };

  const handleSaveDeadlines = async () => {
    if (!user) return;
    setSavingDeadlines(true);
    try {
      // Upsert into platform_content
      const { data: existing } = await supabase.from("platform_content").select("id").eq("content_key", "opportunity_deadlines").maybeSingle();
      const payload = {
        content_key: "opportunity_deadlines",
        content_type: "config",
        title_en: "Opportunity Deadlines",
        title_ar: "المدد الزمنية للفرص",
        body_en: JSON.stringify(deadlines),
        body_ar: JSON.stringify(deadlines),
        updated_by: user.id,
      };
      if (existing) {
        await supabase.from("platform_content").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("platform_content").insert(payload);
      }
      await logAudit(user.id, user.email, "update", "opportunity_deadlines", "system", deadlines);
      toast({ title: isAr ? "تم حفظ المدد الزمنية ✓" : "Deadlines saved ✓" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSavingDeadlines(false);
  };

  const handleUpdatePrimaryAdminEmail = async () => {
    if (!primaryAdminEmail.trim()) return;
    setSavingPrimaryAdminEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-owner", {
        body: { action: "update_primary_admin_email", email: primaryAdminEmail.trim().toLowerCase() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setPrimaryAdminEmail(data.primary_admin_email);
      toast({ title: isAr ? "تم تحديث بريد المسؤول الرئيسي ✓" : "Primary admin email updated ✓" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSavingPrimaryAdminEmail(false);
  };

  const handleResetPrimaryAdminPassword = async (action: "reset_primary_admin_password" | "trigger_primary_admin_recovery") => {
    if (!primaryAdminPassword || !confirmPrimaryAdminPassword) return;
    if (primaryAdminPassword.length < 10) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور يجب أن تكون 10 أحرف على الأقل" : "Password must be at least 10 characters" });
      return;
    }
    if (primaryAdminPassword !== confirmPrimaryAdminPassword) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }

    if (action === "reset_primary_admin_password") setResettingPrimaryAdminPassword(true);
    else setTriggeringPrimaryRecovery(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-owner", {
        body: { action, new_password: primaryAdminPassword, display_name: "Primary Admin" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({
        title: action === "trigger_primary_admin_recovery"
          ? (isAr ? "تم تنفيذ استعادة المسؤول الرئيسي ✓" : "Primary admin recovery triggered ✓")
          : (isAr ? "تم تحديث كلمة مرور المسؤول الرئيسي ✓" : "Primary admin password reset ✓"),
      });
      setPrimaryAdminPassword("");
      setConfirmPrimaryAdminPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }

    if (action === "reset_primary_admin_password") setResettingPrimaryAdminPassword(false);
    else setTriggeringPrimaryRecovery(false);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={Settings}
        titleAr="إعدادات الحساب"
        titleEn="Account Settings"
        descAr="تعديل بيانات حساب مدير النظام وإعدادات المنصة"
        descEn="Manage your admin account and platform settings"
      />

      <div className="max-w-2xl space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Admin Badge */}
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">{isAr ? "مدير النظام الرئيسي" : "Super Admin"}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{user?.email}</p>
          </div>
        </div>

        {/* Profile Name & Avatar */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "الملف الشخصي" : "Profile"}</h3>
          </div>
          {/* Avatar */}
          <AvatarUpload
            currentUrl={avatarUrl}
            displayName={fullName}
            label={isAr ? "الصورة الشخصية" : "Profile Photo"}
            isAr={isAr}
            folder="avatars"
            onUpload={(url) => setAvatarUrl(url)}
            onRemove={() => setAvatarUrl(null)}
          />
          <div className="space-y-2">
            <Label className="text-xs">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isAr ? "أدخل الاسم" : "Enter name"} />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="syna-gradient gap-2">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? "حفظ الاسم" : "Save Name"}
          </Button>
        </div>

        {/* Email */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "البريد الإلكتروني" : "Email Address"}</h3>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
            <p className="text-[11px] text-muted-foreground">
              {isAr ? "سيتم إرسال رابط تأكيد إلى البريد الجديد" : "A confirmation link will be sent to the new email"}
            </p>
          </div>
          <Button onClick={handleSaveEmail} disabled={savingEmail} variant="outline" className="gap-2">
            {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? "تحديث البريد" : "Update Email"}
          </Button>
        </div>

        {/* Password */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "كلمة المرور" : "Password"}</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isAr
              ? "لأسباب أمنية، قد يُطلب منك تسجيل الدخول من جديد إذا مضى على جلستك الحالية وقت طويل."
              : "For security, you may be asked to sign in again if your current session is too old."}
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  dir="ltr"
                  className="pe-10"
                  autoComplete="new-password"
                  minLength={10}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isAr ? "10 أحرف كحد أدنى" : "At least 10 characters"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  dir="ltr"
                  className="pe-10"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword || newPassword.length < 10 || newPassword !== confirmPassword} className="syna-gradient gap-2">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {isAr ? "تغيير كلمة المرور" : "Change Password"}
          </Button>
        </div>

        {/* Opportunity Deadlines */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "المدد الزمنية للفرص" : "Opportunity Deadlines"}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr ? "تحكم في المدد الزمنية الافتراضية لإدارة الفرص" : "Control default deadlines for opportunity management"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {isAr ? "مدة استقبال الطلبات (يوم)" : "Request acceptance (days)"}
              </Label>
              <Input type="number" min={1} max={90} value={deadlines.request_acceptance_days} onChange={e => setDeadlines(d => ({ ...d, request_acceptance_days: parseInt(e.target.value) || 14 }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {isAr ? "مدة رد المالك (يوم)" : "Owner response (days)"}
              </Label>
              <Input type="number" min={1} max={30} value={deadlines.owner_response_days} onChange={e => setDeadlines(d => ({ ...d, owner_response_days: parseInt(e.target.value) || 5 }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {isAr ? "مدة التفاوض (يوم)" : "Negotiation period (days)"}
              </Label>
              <Input type="number" min={1} max={60} value={deadlines.negotiation_days} onChange={e => setDeadlines(d => ({ ...d, negotiation_days: parseInt(e.target.value) || 10 }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {isAr ? "صلاحية الفرصة (يوم)" : "Opportunity validity (days)"}
              </Label>
              <Input type="number" min={7} max={180} value={deadlines.opportunity_validity_days} onChange={e => setDeadlines(d => ({ ...d, opportunity_validity_days: parseInt(e.target.value) || 30 }))} dir="ltr" />
            </div>
          </div>
          <Button onClick={handleSaveDeadlines} disabled={savingDeadlines} className="syna-gradient gap-2">
            {savingDeadlines ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? "حفظ المدد الزمنية" : "Save Deadlines"}
          </Button>
        </div>

        {isSuperAdmin && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">{isAr ? "إدارة بيانات المسؤول الرئيسي" : "Primary Admin Credentials"}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr ? "إدارة البريد وكلمة المرور واستعادة حساب المسؤول الرئيسي بشكل آمن" : "Securely manage primary admin email, password, and recovery"}
            </p>

            <div className="space-y-2">
              <Label className="text-xs">{isAr ? "البريد الإلكتروني للمسؤول الرئيسي" : "Primary Admin Email"}</Label>
              <Input
                type="email"
                value={primaryAdminEmail}
                onChange={(e) => setPrimaryAdminEmail(e.target.value)}
                dir="ltr"
                disabled={loadingPrimaryAdmin}
              />
              <Button onClick={handleUpdatePrimaryAdminEmail} disabled={savingPrimaryAdminEmail || loadingPrimaryAdmin} variant="outline" className="gap-2">
                {savingPrimaryAdminEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isAr ? "تحديث بريد المسؤول الرئيسي" : "Update Primary Admin Email"}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">{isAr ? "كلمة المرور الجديدة للمسؤول الرئيسي" : "New Primary Admin Password"}</Label>
                <div className="relative">
                  <Input type={showPrimaryAdminPassword ? "text" : "password"} value={primaryAdminPassword} onChange={(e) => setPrimaryAdminPassword(e.target.value)} dir="ltr" className="pe-10" />
                  <button type="button" onClick={() => setShowPrimaryAdminPassword(!showPrimaryAdminPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPrimaryAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</Label>
                <div className="relative">
                  <Input type={showPrimaryAdminConfirm ? "text" : "password"} value={confirmPrimaryAdminPassword} onChange={(e) => setConfirmPrimaryAdminPassword(e.target.value)} dir="ltr" className="pe-10" />
                  <button type="button" onClick={() => setShowPrimaryAdminConfirm(!showPrimaryAdminConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPrimaryAdminConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleResetPrimaryAdminPassword("reset_primary_admin_password")}
                  disabled={resettingPrimaryAdminPassword || !primaryAdminPassword || !confirmPrimaryAdminPassword}
                  className="syna-gradient gap-2"
                >
                  {resettingPrimaryAdminPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                </Button>
                <Button
                  onClick={() => handleResetPrimaryAdminPassword("trigger_primary_admin_recovery")}
                  disabled={triggeringPrimaryRecovery || !primaryAdminPassword || !confirmPrimaryAdminPassword}
                  variant="outline"
                  className="gap-2"
                >
                  {triggeringPrimaryRecovery ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  {isAr ? "تشغيل استعادة المسؤول" : "Trigger Recovery"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isAr ? "لن يتم عرض أو تخزين كلمة المرور الحالية كنص صريح." : "Current password is never displayed or stored in plaintext."}
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
