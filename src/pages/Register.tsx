import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "react-router-dom";
import {
  HardHat, Loader2, User, Mail, Lock, ArrowRight, ArrowLeft,
  Building2, Phone, MapPin, Globe, FileText, CheckCircle2,
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
          commission_accepted: true,
        },
      });

      if (error) throw new Error(error.message || (isAr ? "فشل التسجيل" : "Registration failed"));
      if (data?.error) throw new Error(data.error);

      setRegistered(true);
      toast({
        title: isAr ? "تم إنشاء الحساب بنجاح" : "Account created successfully",
        description: isAr ? "تحقق من بريدك الإلكتروني لتفعيل الحساب" : "Check your email to verify your account",
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
                ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد لإكمال التسجيل."
                : "A verification link has been sent to your email. Please check your inbox to complete registration."}
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center w-full h-[48px] bg-[#2B4C66] text-white text-[14px] font-semibold rounded-xl hover:bg-[#1E374B] transition-all"
            >
              {isAr ? "العودة لتسجيل الدخول" : "Back to Login"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F7F8FA]" dir={isAr ? "rtl" : "ltr"}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 start-0 w-[600px] h-[600px] bg-[#2B4C66]/[0.02] rounded-full -translate-y-1/2 -translate-x-1/4" />
        <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-[#C2A86B]/[0.02] rounded-full translate-y-1/3 translate-x-1/4" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 start-0 end-0 flex items-center justify-between px-8 md:px-12 py-5 z-10">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <button onClick={toggleLang} className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
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
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mb-2">
            {isAr ? "تسجيل مطور عقاري" : "Developer Registration"}
          </h1>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            {isAr ? "أنشئ حسابك للوصول إلى فرص التطوير العقاري" : "Create your account to access real estate development opportunities"}
          </p>
        </div>

        {/* Developer badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#2B4C66]/15 bg-[#2B4C66]/5">
            <HardHat className="h-4 w-4 text-[#2B4C66]" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold text-[#2B4C66] tracking-wide">
              {isAr ? "حساب مطور عقاري" : "Real Estate Developer Account"}
            </span>
          </div>
        </div>

        {/* Welcome notice */}
        <div className="mb-5 rounded-xl border border-[#2B4C66]/10 bg-[#2B4C66]/[0.03] px-5 py-3.5 text-center">
          <p className="text-[13px] text-[#2B4C66]/80 leading-relaxed font-medium">
            {isAr
              ? "مرحباً بك في منصة سينا — هذا التسجيل مخصص للمطورين العقاريين فقط."
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
                {isAr ? "البريد الإلكتروني" : "Email"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400" strokeWidth={1.5} />
                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@company.com"
                  className={`${inputClass} ${errors.email ? "!border-red-400 focus:!ring-red-100" : ""}`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.email}</p>}
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
                  <Link to="/terms" className="font-semibold text-[#2B4C66] hover:underline">
                    {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                  </Link>
                  {isAr ? " و " : " and "}
                  <Link to="/privacy" className="font-semibold text-[#2B4C66] hover:underline">
                    {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                  </Link>
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
      />
    </div>
  );
};

export default Register;
