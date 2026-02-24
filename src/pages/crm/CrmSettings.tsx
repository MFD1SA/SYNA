import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, FileText, Lock, Eye, EyeOff, Shield, Download,
  Globe, Phone, Mail, AlertTriangle, ExternalLink,
} from "lucide-react";

const CrmSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الإعدادات" : "Settings");
  const { toast } = useToast();
  const [developer, setDeveloper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [websiteInput, setWebsiteInput] = useState("");
  const [savingWebsite, setSavingWebsite] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    if (!user) return;
    const fetchDev = async () => {
      const { data } = await supabase
        .from("developers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setDeveloper(data);
      setWebsiteInput(data?.website || "");
      setLoading(false);
    };
    fetchDev();
  }, [user]);

  const handlePasswordChange = async () => {
    if (password.length < 8) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم التحديث" : "Updated", description: isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully" });
      setPassword("");
      setConfirmPassword("");
    }
  };

  // Profile completeness
  const getCompleteness = () => {
    if (!developer) return { percent: 0, missing: [] as string[] };
    const fields: { key: string; ar: string; en: string }[] = [
      { key: "company_name", ar: "اسم الشركة", en: "Company Name" },
      { key: "cr_number", ar: "رقم السجل التجاري", en: "CR Number" },
      { key: "cr_file_url", ar: "ملف السجل التجاري", en: "CR Document" },
      { key: "email", ar: "البريد الإلكتروني", en: "Email" },
      { key: "phone", ar: "رقم الجوال", en: "Phone" },
      { key: "website", ar: "الموقع الإلكتروني", en: "Website" },
      { key: "marketing_brand_name", ar: "الاسم التجاري", en: "Brand Name" },
    ];
    const missing = fields.filter(f => !developer[f.key]);
    const percent = Math.round(((fields.length - missing.length) / fields.length) * 100);
    return { percent, missing: missing.map(m => isAr ? m.ar : m.en) };
  };

  const completeness = getCompleteness();

  const statusLabel = (status: string) => {
    const map: Record<string, { ar: string; en: string; color: string }> = {
      pending_review: { ar: "قيد المراجعة", en: "Pending Review", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      verified: { ar: "موثّق", en: "Verified", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
      rejected: { ar: "مرفوض", en: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };
    const s = map[status] || map.pending_review;
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.color}`}><Shield className="h-3 w-3" />{isAr ? s.ar : s.en}</span>;
  };

  const getFileUrl = (url: string) => {
    if (!url) return null;
    if (!url.startsWith("http")) {
      const { data } = supabase.storage.from("developer-docs").getPublicUrl(url);
      return data?.publicUrl;
    }
    return url;
  };

  return (
    <CrmLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "الإعدادات" : "Settings"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "بيانات حسابك وإعدادات الأمان" : "Your account details and security settings"}
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : (
        <>
          {/* Profile Completeness Alert */}
          {completeness.percent < 100 && (
            <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    {isAr ? "معلوماتك غير مكتملة، يرجى إكمالها لتفادي خسارة الفرص." : "Your profile is incomplete. Please complete it to avoid missing opportunities."}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={completeness.percent} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400" dir="ltr">{completeness.percent}%</span>
                  </div>
                  {completeness.missing.length > 0 && (
                    <p className="mt-1.5 text-xs font-light text-yellow-700/80 dark:text-yellow-400/80">
                      {isAr ? "الحقول الناقصة: " : "Missing: "}{completeness.missing.join("، ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Information - Read Only */}
            <div className="doma-card p-6">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                {isAr ? "بيانات الشركة" : "Company Information"}
                {developer && statusLabel(developer.verification_status)}
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{isAr ? "اسم الشركة" : "Company Name"}</Label>
                  <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                    {developer?.company_name || "—"}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "لا يمكن تعديل الاسم إلا عن طريق الإدارة" : "Name can only be changed by admin"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{isAr ? "الاسم التجاري" : "Brand Name"}</Label>
                  <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                    {developer?.marketing_brand_name || "—"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{isAr ? "رقم السجل التجاري" : "CR Number"}</Label>
                  <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm font-mono text-foreground" dir="ltr">
                    {developer?.cr_number || "—"}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "لا يمكن تعديل رقم السجل التجاري" : "CR number cannot be modified"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                    <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground truncate" dir="ltr">
                      {developer?.email || user?.email || "—"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{isAr ? "رقم الجوال" : "Phone"}</Label>
                    <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground" dir="ltr">
                      {developer?.phone || "—"}
                    </div>
                  </div>
                </div>

                {/* Website - Editable */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder={isAr ? "https://example.com" : "https://example.com"}
                      className="flex-1"
                      dir="ltr"
                    />
                    {websiteInput && websiteInput.startsWith("http") && (
                      <a href={websiteInput} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={savingWebsite || websiteInput === (developer?.website || "")}
                    onClick={async () => {
                      if (!developer?.id) return;
                      setSavingWebsite(true);
                      const { error } = await supabase.from("developers").update({ website: websiteInput || null }).eq("id", developer.id);
                      setSavingWebsite(false);
                      if (error) {
                        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
                      } else {
                        setDeveloper({ ...developer, website: websiteInput || null });
                        toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم تحديث الموقع الإلكتروني" : "Website updated successfully" });
                      }
                    }}
                  >
                    {savingWebsite ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الموقع" : "Save Website")}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Documents */}
              <div className="doma-card p-6">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  {isAr ? "المستندات المرفقة" : "Attached Documents"}
                </h3>
                <div className="space-y-3">
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
                    {developer?.cr_file_url ? (
                      <a href={getFileUrl(developer.cr_file_url) || "#"} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">{isAr ? "غير متوفر" : "N/A"}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "لا يمكن حذف أو تعديل المستندات إلا عن طريق الإدارة" : "Documents can only be removed or modified by admin"}
                  </p>
                </div>
              </div>

              {/* Password Change */}
              <div className="doma-card p-6">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  {isAr ? "تغيير كلمة المرور" : "Change Password"}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isAr ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                        className="pe-10"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{isAr ? "8 أحرف على الأقل" : "At least 8 characters"}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={isAr ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                        className="pe-10"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={!password || !confirmPassword || saving}
                    className="doma-gradient w-full"
                  >
                    {saving
                      ? (isAr ? "جاري الحفظ..." : "Saving...")
                      : (isAr ? "تحديث كلمة المرور" : "Update Password")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </CrmLayout>
  );
};

export default CrmSettings;
