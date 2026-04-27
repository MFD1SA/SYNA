import React, { useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Building2, Crown, ShieldCheck, MapPin, FileCheck, BarChart3, MessageCircle } from "lucide-react";
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
  const navigate = useNavigate();
  // Hard re-entry guard: React state updates are async, so a double-click
  // can pass the `loading` check twice before the re-render. A ref flips
  // synchronously and blocks the second call.
  const submittingRef = useRef(false);

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
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast({ variant: "destructive", title: isAr ? "خطأ في تسجيل الدخول" : "Login Failed", description: isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Incorrect email or password" });
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
          return;
        }

        if (!isDev && !isOwner) {
          await supabase.auth.signOut();
          toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "لا يوجد لديك صلاحية للدخول" : "You do not have access" });
          return;
        }

        toast({ title: isAr ? "تم تسجيل الدخول" : "Signed in successfully" });
        // Navigate explicitly so the user doesn't see a ~1s lag while
        // PublicOnlyRoute re-evaluates. Role precedence matches
        // useUserType: developer > owner (a hybrid account lands on
        // the CRM dashboard, never flickers between two shells).
        if (isDev) {
          navigate("/crm/dashboard", { replace: true });
        } else {
          navigate("/owner/dashboard", { replace: true });
        }
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const ownerFeatures = isAr
    ? [
        { icon: MapPin, text: "تسجيل ومتابعة بيانات أراضيك" },
        { icon: FileCheck, text: "استقبال طلبات الشراكة ومراجعتها" },
        { icon: BarChart3, text: "متابعة مراحل المشاريع والصفقات" },
      ]
    : [
        { icon: MapPin, text: "Register and track your land data" },
        { icon: FileCheck, text: "Receive and review partnership requests" },
        { icon: BarChart3, text: "Track project stages and deals" },
      ];

  return (
    <div
      className="min-h-screen relative flex"
      dir={isAr ? "rtl" : "ltr"}
      style={{ fontFamily: isAr ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif" }}
    >
      {/* Left brand panel - desktop only */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-[#020202] relative flex-col items-center justify-center px-12">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-[360px] text-center">
          <Link to="/">
            <img src={logoImg} alt="SINA" className="h-12 w-auto object-contain mx-auto mb-10 brightness-0 invert opacity-90" />
          </Link>

          {isOwnerMode ? (
            <>
              <h2 className="text-[22px] font-bold text-white/90 leading-relaxed mb-4">
                {isAr ? "لوحة تحكم المالك لإدارة أراضيك" : "Owner Dashboard to Manage Your Lands"}
              </h2>
              <p className="text-[14px] text-white/40 leading-relaxed mb-8">
                {isAr
                  ? "سجّل دخولك لإدارة أراضيك ومتابعة طلبات الشراكة والاطلاع على مراحل مشاريعك"
                  : "Sign in to manage your lands, track partnership requests, and monitor your project stages"
                }
              </p>
              <div className="space-y-4 text-start">
                {ownerFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <f.icon className="w-4 h-4 text-[#C45A41]/70 shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] text-white/50">{f.text}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-bold text-white/90 leading-relaxed mb-4">
                {isAr ? "سينا لإدارة المشاريع العقارية" : "An integrated platform for real estate management"}
              </h2>
              <p className="text-[14px] text-white/40 leading-relaxed">
                {isAr
                  ? "نوفر حلولًا رقمية متقدمة للمطورين والملاك لإدارة استثماراتهم العقارية بكفاءة واحترافية"
                  : "We provide advanced digital solutions for developers and owners to manage their real estate investments efficiently and professionally"
                }
              </p>
            </>
          )}

          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="w-8 h-px bg-[#C45A41]/30" />
            <div className="w-2 h-2 rounded-full bg-[#C45A41]/40" />
            <div className="w-8 h-px bg-[#C45A41]/30" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center relative">
        {/* Top bar */}
        <div className="fixed top-0 start-0 end-0 lg:absolute lg:start-auto flex items-center justify-between px-6 md:px-12 py-4 z-30 bg-white/95 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none border-b border-gray-100 lg:border-0">
          <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-[#2B2B2B] transition-colors py-2 px-1">
            {isAr ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          <button onClick={toggleLang} className="text-[13px] font-medium text-gray-400 hover:text-[#2B2B2B] transition-colors tracking-wide py-2 px-1">
            {isAr ? "English" : "العربية"}
          </button>
        </div>

        {/* Form content */}
        <div className="w-full max-w-[440px] px-6 py-20">
          {/* Logo - mobile only */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/">
              <img src={logoImg} alt="SINA" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          {/* Portal indicator */}
          <div className="flex justify-center mb-7">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-[12px] tracking-wide text-[#2B2B2B]">
              {isOwnerMode
                ? <Crown className="h-4.5 w-4.5" strokeWidth={1.5} />
                : <Building2 className="h-4.5 w-4.5" strokeWidth={1.5} />
              }
              <span>
                {isOwnerMode
                  ? (isAr ? "بوابة المالك" : "Owner Portal")
                  : (isAr ? "بوابة المطور" : "Developer Portal")
                }
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-9">
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-3">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </h1>
            <p className="text-[14px] text-gray-400 leading-relaxed max-w-[320px] mx-auto">
              {isOwnerMode
                ? (isAr ? "سجّل دخولك لإدارة أراضيك ومتابعة طلبات الشراكة" : "Sign in to manage your lands and track partnership requests")
                : (isAr ? "سينا لإدارة المشاريع العقارية بكفاءة" : "An integrated platform for efficient real estate project management")
              }
            </p>
          </div>

          {/* Owner notice */}
          {isOwnerMode && (
            <p className="mb-7 text-center text-[13px] text-red-500 font-bold">
              {isAr
                ? "حسابات الملاك تُنشأ حصرياً عبر الإدارة"
                : "Owner accounts are created exclusively by administration"
              }
            </p>
          )}

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-[0_4px_32px_-8px_rgba(43,76,102,0.1)] p-8">
            <form onSubmit={handleLogin} noValidate className="space-y-5">
              <div>
                <label className="block text-[11.5px] font-bold text-gray-500 mb-2.5 uppercase tracking-[0.08em]">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-300" strokeWidth={1.5} />
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                    placeholder="example@email.com"
                    className={`w-full h-[52px] ps-12 pe-4 bg-gray-50/60 border rounded-xl text-[14px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200/80 focus:border-[#2B2B2B]/30 focus:ring-[#2B2B2B]/10"
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-500 mb-2.5 uppercase tracking-[0.08em]">
                  {isAr ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-300" strokeWidth={1.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                    placeholder="********"
                    className={`w-full h-[52px] ps-12 pe-12 bg-gray-50/60 border rounded-xl text-[14px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200/80 focus:border-[#2B2B2B]/30 focus:ring-[#2B2B2B]/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[17px] h-[17px]" strokeWidth={1.5} /> : <Eye className="w-[17px] h-[17px]" strokeWidth={1.5} />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-gradient-to-b from-[#2B2B2B] to-[#020202] hover:from-[#020202] hover:to-[#162B3A] text-white text-[15px] font-bold rounded-xl disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2.5 mt-3 shadow-[0_4px_12px_-2px_rgba(43,76,102,0.35)]"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : (
                  <>
                    <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* WhatsApp Contact - Owner Mode */}
          {isOwnerMode && (
            <a
              href="https://wa.me/966504566777"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 mt-6 w-full h-[48px] bg-[#25D366] hover:bg-[#1fba59] text-white text-[14px] font-bold rounded-xl transition-all duration-200 shadow-sm"
            >
              <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {isAr ? "تواصل معنا عبر الواتساب" : "Contact Us via WhatsApp"}
            </a>
          )}

          {/* Bottom links - developer only */}
          {!isOwnerMode && (
            <p className="text-center text-[13px] text-gray-400 mt-8">
              {t.login.noAccount}{" "}
              <Link to="/auth/register" className="font-bold text-[#2B2B2B] hover:text-[#020202] transition-colors">
                {t.login.createAccount}
              </Link>
            </p>
          )}

          {/* Portal switcher - only show on developer mode */}
          {!isOwnerMode && (
            <div className="flex justify-center mt-6">
              <Link
                to="/auth/login?type=owner"
                className="inline-flex items-center gap-2 text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" /> {isAr ? "الدخول كمالك" : "Sign in as Owner"}
              </Link>
            </div>
          )}

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            <span className="text-[11px] text-gray-300 tracking-wide">
              {isAr ? "بياناتك محمية ومشفرة" : "Your data is protected and encrypted"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
