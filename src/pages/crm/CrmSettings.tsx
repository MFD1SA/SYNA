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
  Globe,
  Phone,
  Mail,
  AlertTriangle,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  Download,
  User,
  MapPin,
  Scale,
  LockKeyhole,
  Pencil,
  Save,
  Loader2,
} from "lucide-react";
import { getMyCommissionAgreement, type DeveloperAgreement } from "@/services/agreements.service";
import AvatarUpload from "@/components/shared/AvatarUpload";

type DeveloperRow = Tables<"developers">;

const MAX_FILE_SIZE = 20 * 1024 * 1024;

/* ── Helper: Generate agreement PDF in new tab ─────────────────── */
function generateAgreementPdf(agreement: DeveloperAgreement, isAr: boolean) {
  const text = isAr ? agreement.agreement_text_ar : agreement.agreement_text_en;
  const title = isAr ? "اتفاقية الخدمات والأتعاب المهنية" : "Professional Services & Fees Agreement";
  const acceptedDate = agreement.accepted_at
    ? new Date(agreement.accepted_at).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const html = `<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${isAr ? "'IBM Plex Sans Arabic'" : "'Inter'"}, sans-serif;
      padding: 50px 60px;
      color: #1a1a1a;
      line-height: 1.9;
      font-size: 14px;
      background: #fff;
    }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2B4C66; padding-bottom: 20px; }
    .header h1 { font-size: 22px; color: #2B4C66; font-weight: 700; margin-bottom: 8px; }
    .header p { font-size: 12px; color: #666; }
    .content { white-space: pre-line; font-size: 14px; line-height: 2; margin-bottom: 40px; }
    .meta { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
    .meta div { margin-bottom: 6px; }
    .meta strong { color: #333; }
    .status { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    @media print { body { padding: 30px 40px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>SINA Real Estate Development Platform — ${isAr ? "منصة سينا للتطوير العقاري" : "cidoma.com"}</p>
  </div>
  <div class="content">${text}</div>
  <div class="meta">
    <div><strong>${isAr ? "الحالة:" : "Status:"}</strong> <span class="status">${isAr ? "تم القبول" : "Accepted"}</span></div>
    <div><strong>${isAr ? "تاريخ القبول:" : "Accepted At:"}</strong> ${acceptedDate}</div>
    <div><strong>${isAr ? "الإصدار:" : "Version:"}</strong> ${agreement.agreement_version}</div>
    <div><strong>${isAr ? "عمولة الوساطة:" : "Brokerage:"}</strong> ${agreement.commission_brokerage}%</div>
    <div><strong>${isAr ? "الأتعاب التشغيلية:" : "Operational Fee:"}</strong> ${agreement.commission_operational}%</div>
    <div><strong>${isAr ? "الإجمالي:" : "Total:"}</strong> ${agreement.commission_total}%</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

/* ── Locked field display ──────────────────────────────────────── */
const LockedField: React.FC<{
  label: string;
  value: string;
  icon?: React.ReactNode;
  dir?: string;
}> = ({ label, value, icon, dir }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
      {icon}
      {label}
    </Label>
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-gray-50/60 px-3 py-2.5">
      <LockKeyhole className="h-3.5 w-3.5 text-gray-300 shrink-0" />
      <span className="text-sm text-foreground flex-1" dir={dir}>
        {value}
      </span>
    </div>
  </div>
);

/* ── Main Component ────────────────────────────────────────────── */
const CrmSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الإعدادات" : "Settings");
  const { toast } = useToast();

  const [developer, setDeveloper] = useState<DeveloperRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable inputs
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [brandNameInput, setBrandNameInput] = useState("");
  const [crNumberInput, setCrNumberInput] = useState("");
  const [contactPersonInput, setContactPersonInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [crFile, setCrFile] = useState<File | null>(null);
  const [crSignedUrl, setCrSignedUrl] = useState<string | null>(null);

  // Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
        setLoading(false);
        return;
      }

      setDeveloper(data);
      setCompanyNameInput(data?.company_name || "");
      setBrandNameInput(data?.marketing_brand_name || "");
      setCrNumberInput(data?.cr_number || "");
      setContactPersonInput(data?.contact_person_name || "");
      setCityInput(data?.city || "");
      setEmailInput(data?.email || user.email || "");
      setPhoneInput(data?.phone || "");
      setWebsiteInput(data?.website || "");
      setLogoUrl((data as any)?.logo_url || null);
      setLoading(false);
    };

    const fetchAgreement = async () => {
      const ag = await getMyCommissionAgreement();
      setAgreement(ag);
    };

    fetchDev();
    fetchAgreement();
  }, [user]);

  // Generate signed URL for CR file
  useEffect(() => {
    if (!developer?.cr_file_url) { setCrSignedUrl(null); return; }
    if (developer.cr_file_url.startsWith("http")) { setCrSignedUrl(developer.cr_file_url); return; }

    const createSignedUrl = async () => {
      const { data } = await supabase.storage.from("developer-docs").createSignedUrl(developer.cr_file_url, 3600);
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

  // Helper: check if field was already filled in DB (locked)
  const isLocked = (key: keyof DeveloperRow) => {
    if (!developer) return false;
    const val = developer[key];
    return val !== null && val !== undefined && val !== "" && val !== "—";
  };

  /* ── Password change ───────────────────────────────────────── */
  const handlePasswordChange = async () => {
    if (password.length < 8) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
      return;
    }

    toast({ title: isAr ? "تم التحديث" : "Updated", description: isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully" });
    setPassword("");
    setConfirmPassword("");
  };

  /* ── Save profile data ─────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!user || !developer?.id) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "لم يتم العثور على ملف المطور" : "Developer profile not found" });
      return;
    }

    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format" });
      return;
    }

    setSavingProfile(true);
    try {
      let uploadedCrPath = developer.cr_file_url;

      // Upload CR file if selected
      if (crFile) {
        const isPdf = crFile.type === "application/pdf" || crFile.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) throw new Error(isAr ? "يرجى رفع ملف PDF فقط" : "Please upload a PDF file only");
        if (crFile.size > MAX_FILE_SIZE) throw new Error(isAr ? "حجم الملف يجب أن يكون أقل من 20MB" : "File size must be less than 20MB");

        const filePath = `${user.id}/cr_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage.from("developer-docs").upload(filePath, crFile, { contentType: "application/pdf" });
        if (uploadError) throw uploadError;
        uploadedCrPath = filePath;
      }

      // Build update object — only include fields that are NOT locked
      const updateObj: Record<string, any> = {};

      if (!isLocked("company_name") && companyNameInput.trim()) updateObj.company_name = companyNameInput.trim();
      if (!isLocked("marketing_brand_name") && brandNameInput.trim()) updateObj.marketing_brand_name = brandNameInput.trim();
      if (!isLocked("cr_number") && crNumberInput.trim()) updateObj.cr_number = crNumberInput.trim();
      if (!isLocked("contact_person_name") && contactPersonInput.trim()) updateObj.contact_person_name = contactPersonInput.trim();
      if (!isLocked("city") && cityInput.trim()) updateObj.city = cityInput.trim();
      if (!isLocked("email") && trimmedEmail) updateObj.email = trimmedEmail;
      if (!isLocked("phone") && phoneInput.trim()) updateObj.phone = phoneInput.trim();
      if (!isLocked("website") && normalizeWebsite(websiteInput)) updateObj.website = normalizeWebsite(websiteInput);
      if (crFile && uploadedCrPath) updateObj.cr_file_url = uploadedCrPath;
      updateObj.logo_url = logoUrl;

      if (Object.keys(updateObj).length === 0 && !crFile) {
        toast({ title: isAr ? "تنبيه" : "Notice", description: isAr ? "لا توجد تغييرات لحفظها" : "No changes to save" });
        setSavingProfile(false);
        return;
      }

      // Update email in auth if changed
      if (updateObj.email && updateObj.email !== (user.email || developer.email)) {
        const { error: authEmailError } = await supabase.auth.updateUser({ email: updateObj.email });
        if (authEmailError) throw authEmailError;
      }

      const { error: updateError } = await supabase.from("developers").update(updateObj).eq("id", developer.id);
      if (updateError) throw updateError;

      // Refresh developer data
      const { data: refreshed } = await supabase.from("developers").select("*").eq("id", developer.id).single();
      if (refreshed) {
        setDeveloper(refreshed);
        setCompanyNameInput(refreshed.company_name || "");
        setBrandNameInput(refreshed.marketing_brand_name || "");
        setCrNumberInput(refreshed.cr_number || "");
        setContactPersonInput(refreshed.contact_person_name || "");
        setCityInput(refreshed.city || "");
        setEmailInput(refreshed.email || user.email || "");
        setPhoneInput(refreshed.phone || "");
        setWebsiteInput(refreshed.website || "");
      }

      setCrFile(null);

      if (uploadedCrPath && !uploadedCrPath.startsWith("http")) {
        const { data } = await supabase.storage.from("developer-docs").createSignedUrl(uploadedCrPath, 3600);
        setCrSignedUrl(data?.signedUrl ?? null);
      }

      toast({
        title: isAr ? "تم الحفظ" : "Saved",
        description: isAr ? "تم حفظ جميع البيانات بنجاح" : "All data saved successfully",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message || (isAr ? "فشل حفظ البيانات" : "Failed to save data") });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Completeness ──────────────────────────────────────────── */
  const completeness = useMemo(() => {
    if (!developer) return { percent: 0, missing: [] as string[] };

    const fields: { key: keyof DeveloperRow; ar: string; en: string }[] = [
      { key: "company_name", ar: "اسم الشركة", en: "Company Name" },
      { key: "marketing_brand_name", ar: "الاسم التجاري", en: "Brand Name" },
      { key: "cr_number", ar: "رقم السجل التجاري", en: "CR Number" },
      { key: "cr_file_url", ar: "ملف السجل التجاري", en: "CR Document" },
      { key: "contact_person_name", ar: "اسم المسؤول", en: "Contact Person" },
      { key: "email", ar: "البريد الإلكتروني", en: "Email" },
      { key: "phone", ar: "رقم الجوال", en: "Phone" },
      { key: "website", ar: "الموقع الإلكتروني", en: "Website" },
      { key: "city", ar: "المدينة", en: "City" },
    ];

    const missing = fields.filter((f) => !developer[f.key]);
    const percent = Math.round(((fields.length - missing.length) / fields.length) * 100);
    return { percent, missing: missing.map((m) => (isAr ? m.ar : m.en)) };
  }, [developer, isAr]);

  /* ── Status badge ──────────────────────────────────────────── */
  const statusBadge = (status: string) => {
    const map: Record<string, { ar: string; en: string; cls: string; Icon: typeof CheckCircle2 }> = {
      pending_review: { ar: "قيد المراجعة", en: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
      verified: { ar: "موثّق", en: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
      rejected: { ar: "مرفوض", en: "Rejected", cls: "bg-red-50 text-red-700 border-red-200", Icon: AlertTriangle },
    };
    const s = map[status] || map.pending_review;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${s.cls}`}>
        <s.Icon className="h-3 w-3" />
        {isAr ? s.ar : s.en}
      </span>
    );
  };

  // Count how many editable (unlocked) fields exist
  const editableFields = developer ? (["company_name", "marketing_brand_name", "cr_number", "contact_person_name", "city", "email", "phone", "website"] as (keyof DeveloperRow)[]).filter(k => !isLocked(k)) : [];
  const hasEditableFields = editableFields.length > 0 || !developer?.cr_file_url;

  return (
    <CrmLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{isAr ? "الإعدادات" : "Settings"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAr ? "بيانات حسابك وإعدادات الأمان" : "Your account details and security settings"}
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : (
        <>
          {/* Completeness warning */}
          {completeness.percent < 100 && (
            <div className="mb-6 rounded-xl border border-amber-300/40 bg-amber-50/80 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    {isAr ? "معلوماتك غير مكتملة، يرجى إكمالها لتفادي خسارة الفرص." : "Your profile is incomplete. Complete it to avoid missing opportunities."}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={completeness.percent} className="h-2 flex-1" />
                    <span className="text-xs font-bold text-amber-700" dir="ltr">{completeness.percent}%</span>
                  </div>
                  {completeness.missing.length > 0 && (
                    <p className="mt-1.5 text-xs text-amber-700/80">
                      {isAr ? "الحقول الناقصة: " : "Missing: "}{completeness.missing.join("، ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ─── LEFT COLUMN: Company Data ─────────────────────── */}
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-[#2B4C66]" strokeWidth={1.5} />
                  {isAr ? "بيانات الشركة" : "Company Information"}
                </h3>
                {developer && statusBadge(developer.verification_status)}
              </div>

              {!developer ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {isAr ? "لا يوجد ملف مطوّر مرتبط بهذا الحساب." : "No developer profile linked to this account."}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Company Logo */}
                  <AvatarUpload
                    currentUrl={logoUrl}
                    displayName={developer.company_name || developer.marketing_brand_name || "D"}
                    label={isAr ? "شعار الشركة" : "Company Logo"}
                    isAr={isAr}
                    folder="logos"
                    size="lg"
                    onUpload={(url) => setLogoUrl(url)}
                    onRemove={() => setLogoUrl(null)}
                  />

                  {/* Company Name */}
                  {isLocked("company_name") ? (
                    <LockedField label={isAr ? "اسم الشركة" : "Company Name"} value={developer.company_name} icon={<Building2 className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "اسم الشركة" : "Company Name"}
                      </Label>
                      <Input value={companyNameInput} onChange={(e) => setCompanyNameInput(e.target.value)} placeholder={isAr ? "أدخل اسم الشركة" : "Enter company name"} />
                    </div>
                  )}

                  {/* Brand Name */}
                  {isLocked("marketing_brand_name") ? (
                    <LockedField label={isAr ? "الاسم التجاري" : "Brand Name"} value={developer.marketing_brand_name!} icon={<Building2 className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "الاسم التجاري" : "Brand Name"}
                      </Label>
                      <Input value={brandNameInput} onChange={(e) => setBrandNameInput(e.target.value)} placeholder={isAr ? "أدخل الاسم التجاري" : "Enter brand name"} />
                    </div>
                  )}

                  {/* CR Number */}
                  {isLocked("cr_number") ? (
                    <LockedField label={isAr ? "رقم السجل التجاري" : "CR Number"} value={developer.cr_number!} icon={<FileText className="h-3 w-3" />} dir="ltr" />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "رقم السجل التجاري" : "CR Number"}
                      </Label>
                      <Input value={crNumberInput} onChange={(e) => setCrNumberInput(e.target.value)} placeholder="1010XXXXXX" dir="ltr" />
                    </div>
                  )}

                  {/* Contact Person */}
                  {isLocked("contact_person_name") ? (
                    <LockedField label={isAr ? "اسم المسؤول" : "Contact Person"} value={developer.contact_person_name!} icon={<User className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "اسم المسؤول" : "Contact Person"}
                      </Label>
                      <Input value={contactPersonInput} onChange={(e) => setContactPersonInput(e.target.value)} placeholder={isAr ? "الاسم الكامل" : "Full name"} />
                    </div>
                  )}

                  {/* City */}
                  {isLocked("city") ? (
                    <LockedField label={isAr ? "المدينة" : "City"} value={developer.city!} icon={<MapPin className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "المدينة" : "City"}
                      </Label>
                      <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder={isAr ? "الرياض، جدة..." : "Riyadh, Jeddah..."} />
                    </div>
                  )}

                  {/* Email & Phone row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isLocked("email") ? (
                      <LockedField label={isAr ? "البريد الإلكتروني" : "Email"} value={developer.email!} icon={<Mail className="h-3 w-3" />} dir="ltr" />
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Pencil className="h-3 w-3 text-amber-500" />
                          {isAr ? "البريد الإلكتروني" : "Email"}
                        </Label>
                        <Input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="name@example.com" dir="ltr" />
                      </div>
                    )}

                    {isLocked("phone") ? (
                      <LockedField label={isAr ? "رقم الجوال" : "Phone"} value={developer.phone!} icon={<Phone className="h-3 w-3" />} dir="ltr" />
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Pencil className="h-3 w-3 text-amber-500" />
                          {isAr ? "رقم الجوال" : "Phone"}
                        </Label>
                        <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  {isLocked("website") ? (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {isAr ? "الموقع الإلكتروني" : "Website"}
                      </Label>
                      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-gray-50/60 px-3 py-2.5">
                        <LockKeyhole className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        <span className="text-sm text-foreground flex-1" dir="ltr">{developer.website}</span>
                        <a href={developer.website!} target="_blank" rel="noopener noreferrer" className="text-[#2B4C66] hover:text-[#1E374B]">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "الموقع الإلكتروني" : "Website"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={websiteInput} onChange={(e) => setWebsiteInput(e.target.value)} placeholder="https://example.com" className="flex-1" dir="ltr" />
                        {normalizeWebsite(websiteInput) && (
                          <a href={normalizeWebsite(websiteInput)!} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#2B4C66] hover:text-[#1E374B]">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CR File upload — only if not already uploaded */}
                  {!isLocked("cr_file_url") && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Upload className="h-3 w-3 text-amber-500" />
                        {isAr ? "رفع السجل التجاري (PDF)" : "Upload CR (PDF)"}
                      </Label>
                      <Input type="file" accept=".pdf" onChange={(e) => setCrFile(e.target.files?.[0] || null)} />
                      {crFile && <p className="text-xs text-muted-foreground">{isAr ? "الملف المحدد:" : "Selected:"} {crFile.name}</p>}
                    </div>
                  )}

                  {/* Save button — only show if there are editable fields */}
                  {hasEditableFields && (
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-[#2B4C66] hover:bg-[#1E374B] text-white mt-2">
                      {savingProfile ? (
                        <><Loader2 className="h-4 w-4 animate-spin me-2" />{isAr ? "جاري الحفظ..." : "Saving..."}</>
                      ) : (
                        <><Save className="h-4 w-4 me-2" />{isAr ? "حفظ البيانات" : "Save Data"}</>
                      )}
                    </Button>
                  )}

                  {/* All locked message */}
                  {!hasEditableFields && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        {isAr ? "تم استكمال جميع البيانات. لتعديل أي معلومة يرجى التواصل مع الإدارة." : "All data is complete. Contact admin to modify any information."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── RIGHT COLUMN ──────────────────────────────────── */}
            <div className="space-y-6">
              {/* Documents */}
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-[#2B4C66]" strokeWidth={1.5} />
                  {isAr ? "المستندات المرفقة" : "Attached Documents"}
                </h3>

                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B4C66]/10">
                      <FileText className="h-4 w-4 text-[#2B4C66]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{isAr ? "السجل التجاري" : "Commercial Registration"}</p>
                      <p className="text-[11px] text-muted-foreground">PDF</p>
                    </div>
                  </div>
                  {crSignedUrl ? (
                    <a href={crSignedUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#2B4C66]">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{isAr ? "غير متوفر" : "N/A"}</span>
                  )}
                </div>
              </div>

              {/* Password Change */}
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-[#2B4C66]" strokeWidth={1.5} />
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

                  <Button onClick={handlePasswordChange} disabled={!password || !confirmPassword || savingPassword} className="w-full bg-[#2B4C66] hover:bg-[#1E374B] text-white">
                    {savingPassword ? (
                      <><Loader2 className="h-4 w-4 animate-spin me-2" />{isAr ? "جاري الحفظ..." : "Saving..."}</>
                    ) : (
                      <><Lock className="h-4 w-4 me-2" />{isAr ? "تحديث كلمة المرور" : "Update Password"}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Commission Agreement */}
              {agreement && (
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Scale className="h-4 w-4 text-[#2B4C66]" strokeWidth={1.5} />
                    {isAr ? "اتفاقية الخدمات والأتعاب" : "Services & Fees Agreement"}
                  </h3>

                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                      <span className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        agreement.accepted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
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
                        <span className="text-muted-foreground">{isAr ? "أتعاب الوساطة" : "Brokerage Fee"}</span>
                        <span className="font-semibold text-foreground" dir="ltr">{agreement.commission_brokerage}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "الأتعاب التشغيلية" : "Operational Fee"}</span>
                        <span className="font-semibold text-foreground" dir="ltr">{agreement.commission_operational}%</span>
                      </div>
                      <div className="border-t border-border/40 pt-2 flex justify-between text-xs">
                        <span className="font-bold text-foreground">{isAr ? "الإجمالي" : "Total"}</span>
                        <span className="font-bold text-[#2B4C66]" dir="ltr">{agreement.commission_total}%</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="rounded-lg border border-border/40 p-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "الإصدار" : "Version"}</span>
                        <span className="font-medium">{agreement.agreement_version}</span>
                      </div>
                      {agreement.accepted_at && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{isAr ? "تاريخ القبول" : "Accepted At"}</span>
                          <span className="font-medium" dir="ltr">
                            {new Date(agreement.accepted_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Download as PDF */}
                    <Button
                      variant="outline"
                      className="w-full border-[#2B4C66]/20 text-[#2B4C66] hover:bg-[#2B4C66]/5"
                      onClick={() => generateAgreementPdf(agreement, isAr)}
                    >
                      <Download className="h-4 w-4 me-2" />
                      {isAr ? "تحميل الاتفاقية (PDF)" : "Download Agreement (PDF)"}
                    </Button>
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
