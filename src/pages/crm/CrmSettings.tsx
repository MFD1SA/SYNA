import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
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
  Building2,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Download,
  Globe,
  Phone,
  Mail,
  AlertTriangle,
  ExternalLink,
  Upload,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getMyCommissionAgreement, type DeveloperAgreement } from "@/services/agreements.service";

type DeveloperRow = Tables<"developers">;

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const CrmSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الإعدادات" : "Settings");
  const { toast } = useToast();

  const [developer, setDeveloper] = useState<DeveloperRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [crFile, setCrFile] = useState<File | null>(null);
  const [crSignedUrl, setCrSignedUrl] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [agreement, setAgreement] = useState<DeveloperAgreement | null>(null);

  const isAr = lang === "ar";

  useEffect(() => {
    if (!user) return;

    const fetchDev = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: isAr ? "خطأ" : "Error",
          description: error.message,
        });
        setLoading(false);
        return;
      }

      setDeveloper(data);
      setEmailInput(data?.email || user.email || "");
      setPhoneInput(data?.phone || "");
      setWebsiteInput(data?.website || "");
      setLoading(false);
    };

    const fetchAgreement = async () => {
      const ag = await getMyCommissionAgreement();
      setAgreement(ag);
    };

    fetchDev();
    fetchAgreement();
  }, [user, isAr, toast]);

  useEffect(() => {
    if (!developer?.cr_file_url) {
      setCrSignedUrl(null);
      return;
    }

    if (developer.cr_file_url.startsWith("http")) {
      setCrSignedUrl(developer.cr_file_url);
      return;
    }

    const createSignedUrl = async () => {
      const { data, error } = await supabase.storage
        .from("developer-docs")
        .createSignedUrl(developer.cr_file_url, 3600);

      if (error) {
        setCrSignedUrl(null);
        return;
      }

      setCrSignedUrl(data?.signedUrl ?? null);
    };

    createSignedUrl();
  }, [developer?.cr_file_url]);

  const normalizeWebsite = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  };

  const handlePasswordChange = async () => {
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr
          ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
          : "Password must be at least 8 characters",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match",
      });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: error.message,
      });
      return;
    }

    toast({
      title: isAr ? "تم التحديث" : "Updated",
      description: isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully",
    });
    setPassword("");
    setConfirmPassword("");
  };

  const handleSaveAllProfileData = async () => {
    if (!user || !developer?.id) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr
          ? "لم يتم العثور على ملف المطور لهذا الحساب"
          : "No developer profile was found for this account",
      });
      return;
    }

    const trimmedEmail = emailInput.trim();
    const trimmedPhone = phoneInput.trim();
    const normalizedWebsite = normalizeWebsite(websiteInput);

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format",
      });
      return;
    }

    setSavingProfile(true);

    try {
      let uploadedCrPath = developer.cr_file_url;

      if (crFile) {
        const isPdf =
          crFile.type === "application/pdf" || crFile.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
          throw new Error(isAr ? "يرجى رفع ملف PDF فقط" : "Please upload a PDF file only");
        }

        if (crFile.size > MAX_FILE_SIZE) {
          throw new Error(
            isAr
              ? "حجم ملف السجل التجاري يجب أن يكون أقل من 20MB"
              : "CR file size must be less than 20MB",
          );
        }

        const filePath = `${user.id}/cr_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("developer-docs")
          .upload(filePath, crFile, { contentType: "application/pdf" });

        if (uploadError) throw uploadError;
        uploadedCrPath = filePath;
      }

      const emailChanged =
        !!trimmedEmail && trimmedEmail !== (user.email || developer.email || "");

      if (emailChanged) {
        const { error: authEmailError } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (authEmailError) throw authEmailError;
      }

      const { error: updateError } = await supabase
        .from("developers")
        .update({
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
          website: normalizedWebsite,
          cr_file_url: uploadedCrPath,
        })
        .eq("id", developer.id);

      if (updateError) throw updateError;

      const updatedDeveloper: DeveloperRow = {
        ...developer,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        website: normalizedWebsite,
        cr_file_url: uploadedCrPath,
      };

      setDeveloper(updatedDeveloper);
      setCrFile(null);

      if (uploadedCrPath.startsWith("http")) {
        setCrSignedUrl(uploadedCrPath);
      } else {
        const { data } = await supabase.storage
          .from("developer-docs")
          .createSignedUrl(uploadedCrPath, 3600);
        setCrSignedUrl(data?.signedUrl ?? null);
      }

      toast({
        title: isAr ? "تم الحفظ" : "Saved",
        description: emailChanged
          ? isAr
            ? "تم حفظ البيانات وإرسال رسالة تأكيد للبريد الإلكتروني الجديد"
            : "Data saved and a confirmation email was sent for the new email address"
          : isAr
            ? "تم حفظ جميع البيانات بنجاح"
            : "All profile data was saved successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: error.message || (isAr ? "فشل حفظ البيانات" : "Failed to save data"),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const completeness = useMemo(() => {
    if (!developer) return { percent: 0, missing: [] as string[] };

    const fields: { key: keyof DeveloperRow; ar: string; en: string }[] = [
      { key: "company_name", ar: "اسم الشركة", en: "Company Name" },
      { key: "cr_number", ar: "رقم السجل التجاري", en: "CR Number" },
      { key: "cr_file_url", ar: "ملف السجل التجاري", en: "CR Document" },
      { key: "email", ar: "البريد الإلكتروني", en: "Email" },
      { key: "phone", ar: "رقم الجوال", en: "Phone" },
      { key: "website", ar: "الموقع الإلكتروني", en: "Website" },
      { key: "marketing_brand_name", ar: "الاسم التجاري", en: "Brand Name" },
    ];

    const missing = fields.filter((f) => !developer[f.key]);
    const percent = Math.round(((fields.length - missing.length) / fields.length) * 100);

    return { percent, missing: missing.map((m) => (isAr ? m.ar : m.en)) };
  }, [developer, isAr]);

  const statusLabel = (status: string) => {
    const map: Record<string, { ar: string; en: string; color: string }> = {
      pending_review: {
        ar: "قيد المراجعة",
        en: "Pending Review",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      verified: {
        ar: "موثّق",
        en: "Verified",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      rejected: {
        ar: "مرفوض",
        en: "Rejected",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
    };
    const s = map[status] || map.pending_review;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>
        <Shield className="h-3 w-3" />
        {isAr ? s.ar : s.en}
      </span>
    );
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
          {completeness.percent < 100 && (
            <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    {isAr
                      ? "معلوماتك غير مكتملة، يرجى إكمالها لتفادي خسارة الفرص."
                      : "Your profile is incomplete. Please complete it to avoid missing opportunities."}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={completeness.percent} className="h-2 flex-1" />
                    <span
                      className="text-xs font-medium text-yellow-700 dark:text-yellow-400"
                      dir="ltr"
                    >
                      {completeness.percent}%
                    </span>
                  </div>
                  {completeness.missing.length > 0 && (
                    <p className="mt-1.5 text-xs font-light text-yellow-700/80 dark:text-yellow-400/80">
                      {isAr ? "الحقول الناقصة: " : "Missing: "}
                      {completeness.missing.join("، ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="doma-card p-6">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                {isAr ? "بيانات الشركة" : "Company Information"}
                {developer && statusLabel(developer.verification_status)}
              </h3>

              {!developer ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {isAr
                    ? "لا يوجد ملف مطوّر مرتبط بهذا الحساب. تواصل مع الإدارة."
                    : "No developer profile is linked to this account. Please contact admin."}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isAr ? "اسم الشركة" : "Company Name"}
                    </Label>
                    <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                      {developer.company_name || "—"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isAr ? "الاسم التجاري" : "Brand Name"}
                    </Label>
                    <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                      {developer.marketing_brand_name || "—"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isAr ? "رقم السجل التجاري" : "CR Number"}
                    </Label>
                    <div
                      className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-sm font-mono text-foreground"
                      dir="ltr"
                    >
                      {developer.cr_number || "—"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {isAr ? "البريد الإلكتروني" : "Email"}
                      </Label>
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {isAr ? "رقم الجوال" : "Phone"}
                      </Label>
                      <Input
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder={isAr ? "05xxxxxxxx" : "05xxxxxxxx"}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {isAr ? "الموقع الإلكتروني" : "Website"}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={websiteInput}
                        onChange={(e) => setWebsiteInput(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1"
                        dir="ltr"
                      />
                      {normalizeWebsite(websiteInput) && (
                        <a
                          href={normalizeWebsite(websiteInput) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Upload className="h-3 w-3" />
                      {isAr ? "رفع السجل التجاري (PDF)" : "Upload CR (PDF)"}
                    </Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setCrFile(e.target.files?.[0] || null)}
                    />
                    {crFile && (
                      <p className="text-xs text-muted-foreground">
                        {isAr ? "الملف المحدد:" : "Selected file:"} {crFile.name}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveAllProfileData}
                    disabled={savingProfile}
                    className="doma-gradient w-full"
                  >
                    {savingProfile
                      ? isAr
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : isAr
                        ? "حفظ جميع البيانات"
                        : "Save All Data"}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
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
                        <p className="text-sm font-light text-foreground">
                          {isAr ? "السجل التجاري" : "Commercial Registration"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">PDF</p>
                      </div>
                    </div>

                    {crSignedUrl ? (
                      <a href={crSignedUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isAr ? "غير متوفر" : "N/A"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="doma-card p-6">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  {isAr ? "تغيير كلمة المرور" : "Change Password"}
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isAr ? "كلمة المرور الجديدة" : "New Password"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isAr ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                        className="pe-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "8 أحرف على الأقل" : "At least 8 characters"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={isAr ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                        className="pe-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={!password || !confirmPassword || savingPassword}
                    className="doma-gradient w-full"
                  >
                    {savingPassword
                      ? isAr
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : isAr
                        ? "تحديث كلمة المرور"
                        : "Update Password"}
                  </Button>
                </div>
              </div>

              {/* Commission Agreement Section */}
              {agreement && (
                <div className="doma-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    {isAr ? "اتفاقية العمولة" : "Commission Agreement"}
                  </h3>

                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                      <span className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        agreement.accepted
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {agreement.accepted
                          ? <><CheckCircle2 className="h-3 w-3" /> {isAr ? "تم القبول" : "Accepted"}</>
                          : <><Clock className="h-3 w-3" /> {isAr ? "معلقة" : "Pending"}</>
                        }
                      </span>
                    </div>

                    {/* Commission breakdown */}
                    <div className="rounded-lg border border-border/40 p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "عمولة الوساطة" : "Brokerage Commission"}</span>
                        <span className="font-semibold text-foreground" dir="ltr">{agreement.commission_brokerage}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "أتعاب تشغيلية" : "Operational Fee"}</span>
                        <span className="font-semibold text-foreground" dir="ltr">{agreement.commission_operational}%</span>
                      </div>
                      <div className="border-t border-border/40 pt-2 flex justify-between text-xs">
                        <span className="font-bold text-foreground">{isAr ? "الإجمالي" : "Total"}</span>
                        <span className="font-bold text-primary" dir="ltr">{agreement.commission_total}%</span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="rounded-lg border border-border/40 p-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "الإصدار" : "Version"}</span>
                        <span className="font-medium text-foreground">{agreement.agreement_version}</span>
                      </div>
                      {agreement.accepted_at && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{isAr ? "تاريخ القبول" : "Accepted At"}</span>
                          <span className="font-medium text-foreground" dir="ltr">
                            {new Date(agreement.accepted_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                              year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Full agreement text (collapsible) */}
                    <details className="rounded-lg border border-border/40 overflow-hidden">
                      <summary className="px-3 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        {isAr ? "عرض نص الاتفاقية الكامل" : "View Full Agreement Text"}
                      </summary>
                      <div className="px-3 pb-3 text-[11px] leading-[1.8] text-muted-foreground whitespace-pre-line max-h-[300px] overflow-y-auto">
                        {isAr ? agreement.agreement_text_ar : agreement.agreement_text_en}
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </CrmLayout>
  );
};

export default CrmSettings;
