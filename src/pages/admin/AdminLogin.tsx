import React, { useState } from "react";
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

  if (!authLoading && !roleLoading && user && isAdmin) {
    return <Navigate to="/admincp/overview" replace />;
  }

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#111315]">
        <div className="h-7 w-7 animate-spin rounded-full border-r-2 border-t-2 border-white/20"></div>
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
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "فشل التحقق" : "Auth Failure", description: isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Incorrect email or password" });
      setLoading(false);
      return;
    }
    if (data.user) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      if (!roleData) {
        await supabase.auth.signOut();
        toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "هذه البوابة مخصصة للمسؤولين فقط" : "This portal is for administrators only" });
        setLoading(false);
        return;
      }
      toast({ title: isAr ? "تم التحقق" : "Verified" });
      navigate("/admincp/overview");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111315]" dir={isAr ? "rtl" : "ltr"}>
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2B4C66]/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 md:px-12 py-5">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-white/25 hover:text-white/40 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <button onClick={toggleLang} className="text-[13px] font-medium text-white/25 hover:text-white/40 transition-colors">
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <Link to="/">
              <img src={logoImg} alt="SYNA" className="h-9 w-auto object-contain invert opacity-90" />
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-[22px] font-bold text-white/90 tracking-tight mb-2">
              {isAr ? "لوحة الإدارة" : "Admin Panel"}
            </h1>
            <p className="text-[13px] text-white/25">
              {isAr ? "الدخول مقتصر على المسؤولين المصرح لهم" : "Access restricted to authorized administrators"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-white/30 mb-2 uppercase tracking-[0.1em]">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-white/20" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                  dir="ltr"
                  className={`w-full h-[46px] ps-11 pe-4 bg-white/[0.05] border rounded-xl text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:ring-1 transition-all ${
                    errors.email ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10" : "border-white/[0.08] focus:border-white/20 focus:ring-white/5"
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 mt-1.5 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/30 mb-2 uppercase tracking-[0.1em]">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-white/20" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                  dir="ltr"
                  className={`w-full h-[46px] ps-11 pe-12 bg-white/[0.05] border rounded-xl text-[14px] text-white placeholder:text-white/15 focus:outline-none focus:ring-1 transition-all ${
                    errors.password ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10" : "border-white/[0.08] focus:border-white/20 focus:ring-white/5"
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
              className="w-full h-[46px] bg-white text-[#111315] text-[14px] font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </>
              )}
            </button>
          </form>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] text-white/15 tracking-wide">
              {isAr ? "النظام نشط — اتصال مشفر" : "System active — encrypted connection"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-5 text-center">
        <p className="text-[10px] text-white/8 tracking-wider uppercase">SYNA Platform</p>
      </div>
    </div>
  );
};

export default AdminLogin;
