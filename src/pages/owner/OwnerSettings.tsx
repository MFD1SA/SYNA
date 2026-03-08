import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import OwnerLayout from "@/components/owner/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";

const OwnerSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الإعدادات" : "Settings");
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (password.length < 6) {
      toast({ variant: "destructive", title: isAr ? "كلمة المرور قصيرة جداً" : "Password too short" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: isAr ? "كلمتا المرور غير متطابقتين" : "Passwords don't match" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم تغيير كلمة المرور" : "Password changed" });
      setPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "الإعدادات" : "Settings"}</h1>
        <p className="text-sm font-light text-muted-foreground">{isAr ? "إدارة حسابك وبياناتك الشخصية" : "Manage your account and personal data"}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Info */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="text-sm font-medium text-foreground">{isAr ? "البيانات الشخصية" : "Personal Information"}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input value={user?.email || ""} disabled className="mt-1 bg-muted/50" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{isAr ? "رقم الجوال" : "Phone"}</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" dir="ltr" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="syna-gradient">
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="text-sm font-medium text-foreground">{isAr ? "تغيير كلمة المرور" : "Change Password"}</h2>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Label className="text-xs text-muted-foreground">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <div className="relative mt-1">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1" dir="ltr" />
            </div>
            <Button onClick={handleChangePassword} disabled={saving || !password} size="sm" variant="outline">
              <Lock className="h-3.5 w-3.5 me-1.5" />
              {isAr ? "تحديث كلمة المرور" : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerSettings;
