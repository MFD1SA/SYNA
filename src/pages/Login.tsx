import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Building2, Landmark, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

const LoginPage: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  const [searchParams] = useSearchParams();
  const isOwnerMode = searchParams.get("type") === "owner";
  usePageTitle(isAr ? "تسجيل الدخول" : "Sign In");
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.trim()) {
      e.email = isAr ? "البريد الإلكتروني مطلوب" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email format";
    }
    if (!password) {
      e.password = isAr ? "كلمة المرور مطلوبة" : "Password is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ في تسجيل الدخول" : "Login Failed", description: isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Incorrect email or password" });
      setLoading(false);
      return;
    }
    if (data.user) {
      const [devRes, rolesRes] = await Promise.all([
        supabase.from("developers").select("id").eq("user_id", data.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      ]);
      const isDev = !!devRes.data;
      const roles = (rolesRes.data || []).map((r: any) => r.role);
      const isOwner = roles.includes("owner");
      const isAdmin = roles.includes("admin");

      if (isAdmin && !isDev && !isOwner) {
        await supabase.auth.signOut();
        toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "هذه البوابة مخصصة للمطورين والملاك فقط" : "This portal is for developers and owners only" });
        setLoading(false);
        return;
      }

      if (!isDev && !isOwner) {
        await supabase.auth.signOut();
        toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "لا يوجد لديك صلاحية للدخول" : "You do not have access" });
        setLoading(false);
        return;
      }
      toast({ title: isAr ? "تم تسجيل الدخول" : "Signed in successfully" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F7F8FA]" dir={isAr ? "rtl" : "ltr"}>
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 end-0 w-[600px] h-[600px] bg-[#2B4C66]/[0.015] rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 start-0 w-[500px] h-[500px] bg-[#C2A86B]/[0.01] rounded-full translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 md:px-12 py-5 z-10">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <button onClick={toggleLang} className="text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[420px] px-6 py-20">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link to="/">
            <img src={logoImg} alt="SYNA" className="h-9 w-auto object-contain" />
          </Link>
        </div>

        {/* Portal indicator */}
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
            isOwnerMode
              ? "border-[#C2A86B]/25 bg-[#C2A86B]/5 text-[#C2A86B]"
              : "border-[#2B4C66]/15 bg-[#2B4C66]/5 text-[#2B4C66]"
          }`}>
            {isOwnerMode
              ? <Landmark className="h-3.5 w-3.5" strokeWidth={1.5} />
              : <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            }
            <span className="text-[12px] font-semibold">
              {isOwnerMode
                ? (isAr ? "بوابة المالك" : "Owner Portal")
                : (isAr ? "بوابة المطور" : "Developer Portal")
              }
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">
            {isOwnerMode
              ? (isAr ? "تسجيل دخول المالك" : "Owner Sign In")
              : (isAr ? "تسجيل دخول المطور" : "Developer Sign In")
            }
          </h1>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            {isOwnerMode
              ? (isAr ? "حسابك تم إنشاؤه من قبل الإدارة" : "Your account was created by the admin team")
              : (isAr ? "سجّل دخولك للوصول إلى لوحة التحكم" : "Sign in to access your dashboard")
            }
          </p>
        </div>

        {/* Owner notice */}
        {isOwnerMode && (
          <div className="mb-6 rounded-xl border border-[#C2A86B]/20 bg-[#C2A86B]/5 px-4 py-3">
            <p className="text-[12px] text-[#C2A86B] leading-relaxed font-medium">
              {isAr
                ? "حسابات الملاك تُنشأ حصريًا عبر الإدارة"
                : "Owner accounts are created exclusively by administration"
              }
            </p>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] p-8">
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.1em]">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-300" strokeWidth={1.5} />
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                  placeholder="example@email.com"
                  className={`w-full h-[46px] ps-11 pe-4 bg-gray-50/80 border rounded-xl text-[14px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200/80 focus:border-[#2B4C66]/30 focus:ring-[#2B4C66]/10"
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.1em]">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-300" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                  className={`w-full h-[46px] ps-11 pe-12 bg-gray-50/80 border rounded-xl text-[14px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200/80 focus:border-[#2B4C66]/30 focus:ring-[#2B4C66]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[16px] h-[16px]" strokeWidth={1.5} /> : <Eye className="w-[16px] h-[16px]" strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-[46px] text-white text-[14px] font-semibold rounded-xl disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 mt-1 ${
                isOwnerMode
                  ? "bg-[#2B4C66] hover:bg-[#1E374B]"
                  : "bg-[#2B4C66] hover:bg-[#1E374B]"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom links */}
        {!isOwnerMode && (
          <p className="text-center text-[13px] text-gray-400 mt-8">
            {t.login.noAccount}{" "}
            <Link to="/auth/register" className="font-semibold text-[#2B4C66] hover:text-[#1E374B] transition-colors">
              {t.login.createAccount}
            </Link>
          </p>
        )}

        {/* Portal switcher */}
        <div className="flex justify-center mt-6">
          <Link
            to={isOwnerMode ? "/auth/login" : "/auth/login?type=owner"}
            className={`inline-flex items-center gap-2 text-[12px] font-medium transition-colors ${
              isOwnerMode ? "text-[#2B4C66]/50 hover:text-[#2B4C66]" : "text-[#C2A86B]/60 hover:text-[#C2A86B]"
            }`}
          >
            {isOwnerMode
              ? <><Building2 className="w-3.5 h-3.5" /> {isAr ? "الدخول كمطور" : "Sign in as Developer"}</>
              : <><Landmark className="w-3.5 h-3.5" /> {isAr ? "الدخول كمالك" : "Sign in as Owner"}</>
            }
          </Link>
        </div>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-gray-300 tracking-wide">
            {isAr ? "اتصال آمن ومشفر" : "Secure & encrypted"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
