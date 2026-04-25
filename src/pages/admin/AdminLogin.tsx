import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import logoImg from "@/assets/logo.png";

const AdminLogin: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة الإدارة" : "Admin Panel");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  // Hard re-entry guard — identical pattern to /auth/login.
  const submittingRef = useRef(false);
  // Redirect timer id so unmount can cancel; previously a pending
  // setTimeout would navigate even after the user clicked "Home".
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  if (!authLoading && !roleLoading && user && isAdmin) {
    return <Navigate to="/admincp/overview" replace />;
  }

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0F1419]">
        <div className="h-7 w-7 animate-spin rounded-full border-r-2 border-t-2 border-[#C2A86B]/40"></div>
      </div>
    );
  }

  if (loginSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0F1419]">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white/90">
            {isAr ? "تم الدخول بنجاح" : "Login Successful"}
          </h2>
          <p className="text-sm text-white/40">
            {isAr ? "جاري التحويل للوحة الإدارة..." : "Redirecting to admin panel..."}
          </p>
          <div className="pt-2">
            <div className="h-5 w-5 mx-auto animate-spin rounded-full border-r-2 border-t-2 border-[#C2A86B]/40"></div>
          </div>
        </div>
      </div>
    );
  }

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
        toast({ variant: "destructive", title: isAr ? "فشل التحقق" : "Auth Failure", description: isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Incorrect email or password" });
        return;
      }
      if (data.user) {
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        if (!roleData) {
          await supabase.auth.signOut();
          toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "هذه البوابة مخصصة للمسؤولين فقط" : "This portal is for administrators only" });
          return;
        }
        // Success animation + redirect. Previous code used a flat 3s
        // delay (a) with no way to cancel on unmount, and (b) long
        // enough that users clicked "Home" only to be yanked back to
        // the admin panel 3 seconds later. Cut to 900ms — enough to
        // show the success card animate in, short enough that the
        // user doesn't have time to navigate away.
        setLoginSuccess(true);
        redirectTimerRef.current = window.setTimeout(() => {
          redirectTimerRef.current = null;
          navigate("/admincp/overview", { replace: true });
        }, 900);
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0F1419]"
      dir={isAr ? "rtl" : "ltr"}
      style={{ fontFamily: isAr ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif" }}
    >
      {/* Subtle background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#2B4C66]/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 end-0 w-[400px] h-[400px] bg-[#C2A86B]/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 md:px-12 py-5">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-white/25 hover:text-white/50 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <button onClick={toggleLang} className="text-[13px] font-medium text-white/25 hover:text-white/50 transition-colors tracking-wide">
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/">
              <img src={logoImg} alt="SINA" className="h-10 w-auto object-contain invert opacity-90" />
            </Link>
          </div>

          {/* Admin badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C2A86B]/20 bg-[#C2A86B]/5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C2A86B]" strokeWidth={1.5} />
              <span className="text-[11.5px] font-semibold text-[#C2A86B] tracking-wide">
                {isAr ? "لوحة الإدارة" : "Administration Panel"}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-[24px] font-bold text-white/90 tracking-tight mb-2.5">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </h1>
            <p className="text-[13px] text-white/30 leading-relaxed">
              {isAr ? "الدخول مقتصر على المسؤولين المصرح لهم" : "Access restricted to authorized administrators"}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.04] rounded-2xl border border-white/[0.06] backdrop-blur-sm p-8">
            <form onSubmit={handleLogin} noValidate className="space-y-5">
              <div>
                <label className="block text-[11.5px] font-semibold text-white/35 mb-2 uppercase tracking-[0.08em]">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-white/20" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                    dir="ltr"
                    placeholder="admin@example.com"
                    className={`w-full h-12 ps-11 pe-4 bg-white/[0.04] border rounded-xl text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:bg-white/[0.06] transition-all ${
                      errors.email ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10" : "border-white/[0.08] focus:border-[#2B4C66]/50 focus:ring-[#2B4C66]/20"
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-400 mt-1.5 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-white/35 mb-2 uppercase tracking-[0.08em]">
                  {isAr ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-white/20" strokeWidth={1.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                    dir="ltr"
                    placeholder="********"
                    className={`w-full h-12 ps-11 pe-12 bg-white/[0.04] border rounded-xl text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:bg-white/[0.06] transition-all ${
                      errors.password ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10" : "border-white/[0.08] focus:border-[#2B4C66]/50 focus:ring-[#2B4C66]/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[16px] h-[16px]" strokeWidth={1.5} /> : <Eye className="w-[16px] h-[16px]" strokeWidth={1.5} />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-400 mt-1.5 font-medium">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2B4C66] hover:bg-[#1E374B] text-white text-[14px] font-semibold rounded-xl disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-[0_2px_12px_-2px_rgba(43,76,102,0.4)]"
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

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
            <span className="text-[11px] text-white/20 tracking-wide">
              {isAr ? "بياناتك محمية ومشفرة" : "Your data is protected and encrypted"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-5 text-center">
        <p className="text-[10px] text-white/[0.08] tracking-wider uppercase">SINA Platform</p>
      </div>
    </div>
  );
};

export default AdminLogin;
