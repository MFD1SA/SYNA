import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "react-router-dom";
import {
  HardHat, Loader2, User, Mail, Lock, ArrowRight, ArrowLeft,
  Building2, Phone, MapPin, Globe, FileText, CheckCircle2, Upload, X as XIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";
import CommissionAgreementModal from "@/components/agreements/CommissionAgreementModal";

interface RegForm {
  company_name: string;
  contact_person_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  website: string;
  company_description: string;
  logo_url: string;
}

const emptyForm: RegForm = {
  company_name: "",
  contact_person_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  city: "",
  website: "",
  company_description: "",
  logo_url: "",
};

const Register: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "تسجيل مطور عقاري" : "Developer Registration");
  const { toast } = useToast();

  const [form, setForm] = useState<RegForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: isAr ? "صيغة غير مدعومة" : "Unsupported format",
        description: isAr ? "يرجى رفع صورة بصيغة PNG / JPG" : "Please upload PNG / JPG image",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: isAr ? "حجم كبير" : "File too large",
        description: isAr ? "الحد الأقصى 2 ميجابايت" : "Max size is 2MB",
      });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `pending-registrations/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("developer-logos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        // Fallback: some projects may not have the bucket; use developer-docs
        const alt = await supabase.storage.from("developer-docs").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (alt.error) throw alt.error;
        const { data: pub } = supabase.storage.from("developer-docs").getPublicUrl(path);
        set("logo_url", pub.publicUrl);
      } else {
        const { data: pub } = supabase.storage.from("developer-logos").getPublicUrl(path);
        set("logo_url", pub.publicUrl);
      }
      toast({ title: isAr ? "تم رفع الشعار" : "Logo uploaded" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isAr ? "فشل الرفع" : "Upload failed",
        description: err.message || "",
      });
    }
    setUploadingLogo(false);
  };

  const set = (key: keyof RegForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.company_name.trim())
      e.company_name = isAr ? "اسم الشركة مطلوب" : "Company name is required";

    if (!form.contact_person_name.trim())
      e.contact_person_name = isAr ? "اسم المسؤول مطلوب" : "Contact person name is required";

    if (!form.email.trim()) {
      e.email = isAr ? "البريد الإلكتروني مطلوب" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email format";
    } else {
      // Require a corporate/business email — reject free personal webmail domains
      const freeDomains = [
        "gmail.com", "googlemail.com",
        "yahoo.com", "yahoo.co.uk", "ymail.com",
        "hotmail.com", "hotmail.co.uk", "outlook.com", "outlook.sa", "live.com", "msn.com",
        "icloud.com", "me.com", "mac.com",
        "aol.com", "protonmail.com", "proton.me", "mail.com",
        "gmx.com", "zoho.com", "yandex.com", "yandex.ru",
        "qq.com", "163.com", "126.com",
        "rediffmail.com", "inbox.com", "tutanota.com",
      ];
      const domain = form.email.trim().toLowerCase().split("@")[1] || "";
      if (freeDomains.includes(domain)) {
        e.email = isAr
          ? "يجب استخدام بريد إلكتروني رسمي للشركة (example@yourcompany.com) — لا يُقبل البريد الشخصي"
          : "A corporate email is required (example@yourcompany.com) — personal email not accepted";
      }
    }

    if (!form.password) {
      e.password = isAr ? "كلمة المرور مطلوبة" : "Password is required";
    } else {
      const p = form.password;
      if (p.length < 10)
        e.password = isAr ? "كلمة المرور يجب أن تكون 10 أحرف على الأقل" : "Password must be at least 10 characters";
      else if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/\d/.test(p) || !/[^A-Za-z0-9]/.test(p))
        e.password = isAr
          ? "يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص"
          : "Must include uppercase, lowercase, number, and symbol";
    }

    if (!form.confirmPassword) {
      e.confirmPassword = isAr ? "تأكيد كلمة المرور مطلوب" : "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = isAr ? "كلمة المرور غير متطابقة" : "Passwords don't match";
    }

    if (!agreedTerms) {
      e.terms = isAr ? "يجب الموافقة على الشروط والأحكام" : "You must agree to terms and conditions";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setShowAgreement(true);
  };

  const handleAcceptAgreement = async () => {
    setShowAgreement(false);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-developer", {
        body: {
          email: form.email.trim().toLowerCase(),
          password: form.password,
          company_name: form.company_name.trim(),
          contact_person_name: form.contact_person_name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          website: form.website.trim(),
          company_description: form.company_description.trim(),
          logo_url: form.logo_url || null,
          commission_accepted: true,
        },
      });

      // Handle Edge Function errors — extract the actual message from the response
      if (error) {
        let errMsg = isAr ? "فشل التسجيل" : "Registration failed";
        try {
          // supabase-js wraps non-2xx as FunctionsHttpError; the real body is in error.context
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            if (body?.error) errMsg = body.error;
          }
        } catch { /* ignore parsing errors */ }

        // Translate known server messages to Arabic
        if (isAr) {
          if (errMsg.includes("already registered")) errMsg = "هذا البريد الإلكتروني مسجّل مسبقاً";
          else if (errMsg.includes("Missing or invalid")) errMsg = "يرجى تعبئة جميع الحقول المطلوبة";
          else if (errMsg.includes("Password must be")) errMsg = "كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي على حرف كبير وصغير ورقم ورمز";
          else if (errMsg.includes("corporate email") || errMsg.includes("personal email")) errMsg = "يجب استخدام بريد إلكتروني رسمي للشركة — البريد الشخصي غير مقبول";
          else if (errMsg.includes("Commission agreement")) errMsg = "يجب الموافقة على اتفاقية الأتعاب المهنية";
          else if (errMsg.includes("Failed to create")) errMsg = "فشل إنشاء الحساب — يرجى المحاولة لاحقاً";
        }
        throw new Error(errMsg);
      }
      if (data?.error) throw new Error(data.error);

      setRegistered(true);
      toast({
        title: isAr ? "تم التسجيل بنجاح" : "Registration successful",
        description: isAr ? "يمكنك الآن تسجيل الدخول" : "You can now sign in",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ في التسجيل" : "Registration Error",
        description: err.message,
      });
    }
    setLoading(false);
  };

  const handleDeclineAgreement = () => {
    setShowAgreement(false);
  };

  const inputClass =
    "w-full h-[48px] ps-11 pe-4 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2B4C66]/40 focus:ring-2 focus:ring-[#2B4C66]/10 focus:bg-white transition-all";

  const textareaClass =
    "w-full ps-11 pe-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2B4C66]/40 focus:ring-2 focus:ring-[#2B4C66]/10 focus:bg-white transition-all resize-none";

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]" dir={isAr ? "rtl" : "ltr"}>
        <div className="w-full max-w-[440px] px-6 text-center">
          <div className="flex justify-center mb-8">
            <Link to="/"><img src={logoImg} alt="SINA" className="h-10 w-auto object-contain" /></Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] p-10">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={1.5} />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-3">
              {isAr ? "تم التسجيل بنجاح" : "Registration Complete"}
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
              {isAr
                ? "تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول والبدء في استخدام سينا."
                : "Your account has been created successfully. You can now sign in and start using the platform."}
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center w-full h-[48px] bg-[#2B4C66] text-white text-[14px] font-semibold rounded-xl hover:bg-[#1E374B] transition-all"
            >
              {isAr ? "تسجيل الدخول الآن" : "Sign in now"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F7F8FA]" dir={isAr ? "rtl" : "ltr"}>
      {/* Top bar */}
      <div className="fixed top-0 start-0 end-0 flex items-center justify-between px-6 md:px-12 py-4 z-30 bg-[#F7F8FA]/95 backdrop-blur-sm border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors py-2 px-1">
          {isAr ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <button onClick={toggleLang} className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors py-2 px-1">
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      {/* Main */}
      <div className="relative z-10 w-full max-w-[520px] px-6 py-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/"><img src={logoImg} alt="SINA" className="h-10 w-auto object-contain" /></Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
            {isAr ? "تسجيل مطور عقاري" : "Developer Registration"}
          </h1>
        </div>

        {/* Welcome notice */}
        <div className="mb-5 rounded-xl border border-[#2B4C66]/10 bg-[#2B4C66]/[0.03] px-5 py-3.5 text-center">
          <p className="text-[13px] text-[#2B4C66]/80 leading-relaxed font-medium">
            {isAr
              ? "مرحباً بك في سينا للاستثمارات العقارية — هذا التسجيل مخصص للمطورين العقاريين فقط."
              : "Welcome to SINA — this registration is exclusively for real estate developers."}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "اسم الشركة" : "Company Name"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder={isAr ? "اسم الشركة أو المؤسسة" : "Company or organization name"}
                  className={`${inputClass} ${errors.company_name ? "!border-red-400 focus:!ring-red-100" : ""}`}
                />
              </div>
              {errors.company_name && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.company_name}</p>}
            </div>

            {/* Company Logo Upload */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "شعار الشركة" : "Company Logo"} <span className="text-gray-400 font-normal">({isAr ? "اختياري" : "optional"})</span>
              </label>
              {form.logo_url ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                  <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={form.logo_url} alt="logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-700">
                      {isAr ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {isAr ? "سيظهر في اتفاقياتك ومستنداتك الرسمية" : "Will appear on your agreements and official documents"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("logo_url", "")}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                    title={isAr ? "إزالة" : "Remove"}
                  >
                    <XIcon className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2.5 h-[80px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-white hover:border-[#2B4C66]/30 transition-all cursor-pointer">
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#2B4C66] animate-spin" />
                      <span className="text-[13px] text-gray-500">{isAr ? "جاري الرفع..." : "Uploading..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      <div className="text-center">
                        <p className="text-[13px] text-gray-600 font-medium">
                          {isAr ? "رفع شعار الشركة" : "Upload company logo"}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          PNG / JPG • {isAr ? "الحد الأقصى 2MB" : "Max 2MB"}
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "اسم المسؤول" : "Contact Person"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={form.contact_person_name}
                  onChange={(e) => set("contact_person_name", e.target.value)}
                  placeholder={isAr ? "الاسم الكامل للمسؤول" : "Full name of contact person"}
                  className={`${inputClass} ${errors.contact_person_name ? "!border-red-400 focus:!ring-red-100" : ""}`}
                />
              </div>
              {errors.contact_person_name && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.contact_person_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "البريد الإلكتروني المهني" : "Corporate Email"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@yourcompany.com"
                  className={`${inputClass} ${errors.email ? "!border-red-400 focus:!ring-red-100" : ""}`}
                />
              </div>
              {errors.email ? (
                <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.email}</p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  {isAr
                    ? "يُشترط استخدام بريد مهني مرتبط بنطاق شركتك (example@yourcompany.com). لا يُقبل Gmail / Yahoo / Hotmail وغيرها."
                    : "A corporate email on your company's domain is required (example@yourcompany.com). Free providers (Gmail / Yahoo / Hotmail / etc.) are not accepted."}
                </p>
              )}
            </div>

            {/* Phone + City row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                  {isAr ? "رقم الجوال" : "Phone"}
                </label>
                <div className="relative">
                  <Phone className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                  <input
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="05xxxxxxxx"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                  {isAr ? "المدينة" : "City"}
                </label>
                <div className="relative">
                  <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder={isAr ? "الرياض" : "Riyadh"}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "الموقع الإلكتروني" : "Website"}
              </label>
              <div className="relative">
                <Globe className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="url"
                  dir="ltr"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Company Description */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "وصف الشركة" : "Company Description"}
              </label>
              <div className="relative">
                <FileText className="absolute start-4 top-3.5 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <textarea
                  rows={3}
                  value={form.company_description}
                  onChange={(e) => set("company_description", e.target.value)}
                  placeholder={isAr ? "نبذة مختصرة عن نشاط الشركة..." : "Brief description of company activities..."}
                  className={textareaClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "كلمة المرور" : "Password"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="password"
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••••"
                  className={`${inputClass} ${errors.password ? "!border-red-400 focus:!ring-red-100" : ""}`}
                />
              </div>
              {errors.password
                ? <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.password}</p>
                : <p className="text-[11px] text-gray-500 mt-1.5">
                    {isAr
                      ? "10 أحرف على الأقل، حرف كبير وصغير ورقم ورمز خاص"
                      : "Min 10 chars, uppercase, lowercase, number, and symbol"}
                  </p>
              }
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 tracking-wide">
                {isAr ? "تأكيد كلمة المرور" : "Confirm Password"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="password"
                  dir="ltr"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="••••••••••"
                  className={`${inputClass} ${errors.confirmPassword ? "!border-red-400 focus:!ring-red-100" : ""}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.confirmPassword}</p>}
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className={`flex items-start gap-3 cursor-pointer select-none ${errors.terms ? "" : ""}`}>
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => { setAgreedTerms(e.target.checked); if (errors.terms) setErrors(prev => { const n = { ...prev }; delete n.terms; return n; }); }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2B4C66] focus:ring-[#2B4C66]/20 accent-[#2B4C66]"
                />
                <span className="text-[13px] text-gray-600 leading-relaxed">
                  {isAr ? "بإنشاء حسابك أنت توافق على " : "By creating your account you agree to the "}
                  {/* Open in a new tab so the registration form data is preserved */}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-[#2B4C66] hover:underline"
                  >
                    {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                  </a>
                  {isAr ? " و " : " and "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-[#2B4C66] hover:underline"
                  >
                    {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                  </a>
                </span>
              </label>
              {errors.terms && <p className="text-[11px] text-red-500 mt-1.5 font-medium ms-7">{errors.terms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] bg-[#2B4C66] text-white text-[14px] font-semibold rounded-xl hover:bg-[#1E374B] disabled:opacity-40 transition-all duration-200 flex items-center justify-center gap-2.5 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <HardHat className="w-4 h-4" strokeWidth={1.5} />
                  {isAr ? "متابعة التسجيل" : "Continue Registration"}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom link */}
        <p className="text-center text-[13px] text-gray-500 mt-8">
          {isAr ? "لديك حساب؟" : "Already have an account?"}{" "}
          <Link to="/auth/login" className="font-semibold text-[#2B4C66] hover:underline transition-colors">
            {isAr ? "سجّل دخولك" : "Sign In"}
          </Link>
        </p>

        {/* Trust */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-gray-500 tracking-wide">
            {isAr ? "بياناتك محمية ومشفرة" : "Your data is protected & encrypted"}
          </span>
        </div>
      </div>

      {/* Commission Agreement Modal */}
      <CommissionAgreementModal
        isAr={isAr}
        open={showAgreement}
        onAccept={handleAcceptAgreement}
        onDecline={handleDeclineAgreement}
        companyName={form.company_name}
        contactPersonName={form.contact_person_name}
        phone={form.phone}
        developerLogoUrl={form.logo_url}
      />
    </div>
  );
};

export default Register;
