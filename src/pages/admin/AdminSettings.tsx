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
import { Settings, User, Mail, KeyRound, Eye, EyeOff, Save, Loader2, ShieldCheck, FlaskConical } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إعدادات الحساب" : "Account Settings");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [demoCredentialsVisible, setDemoCredentialsVisible] = useState(false);
  const [savingDemo, setSavingDemo] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    setFullName(user.user_metadata?.full_name || "");
    // Also fetch from profiles
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.full_name) setFullName(data.full_name);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      // Update auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (authErr) throw authErr;

      // Update profiles table
      await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);

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
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }
    setSavingPassword(true);
    try {
      // Verify current password by signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (signInErr) {
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect" });
        setSavingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await logAudit(user.id, user.email, "update", "admin_password", user.id);
      toast({ title: isAr ? "تم تغيير كلمة المرور بنجاح ✓" : "Password changed successfully ✓" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSavingPassword(false);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={Settings}
        titleAr="إعدادات الحساب"
        titleEn="Account Settings"
        descAr="تعديل بيانات حساب مدير النظام"
        descEn="Manage your admin account settings"
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

        {/* Profile Name */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "الاسم الشخصي" : "Display Name"}</h3>
          </div>
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
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">{isAr ? "كلمة المرور الحالية" : "Current Password"}</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  dir="ltr"
                  className="pe-10"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  dir="ltr"
                  className="pe-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className="syna-gradient gap-2">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {isAr ? "تغيير كلمة المرور" : "Change Password"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
