import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// SYNA High-End Color Palette
const COLORS = {
  primary: "#0E3A5D",
  secondary: "#0B2F4A",
  accent: "#2C78B7",
  softBlue: "#6FA4C9",
  bgLight: "#F1F4F7",
  bgSecondary: "#E4EAF0",
  textPrimary: "#0B2F4A",
  textSecondary: "#4B5563",
};

const AdminLogin: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "بوابة النفاذ الإداري" : "Administrative Access");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ في التحقق" : "Verification Error", description: error.message });
      setLoading(false);
      return;
    }
    if (data.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: isAr ? "نفاذ غير مصرح" : "Unauthorized Access",
          description: isAr ? "لا يمتلك هذا الحساب صلاحيات الوصول الإداري." : "This account does not have administrative privileges.",
        });
        setLoading(false);
        return;
      }

      toast({ title: isAr ? "تم النفاذ بنجاح" : "Access Granted" });
      setTimeout(() => navigate("/admincp/overview"), 100);
    }
    setLoading(false);
  };

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ backgroundColor: COLORS.bgLight }}
    >
      {/* Abstract Institutional Background Layers */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div 
          className="absolute right-[-10%] top-[-20%] h-[800px] w-[800px] rounded-full blur-[120px]"
          style={{ backgroundColor: `${COLORS.softBlue}33` }}
        />
        <div 
          className="absolute left-[-5%] bottom-[-10%] h-[600px] w-[600px] rounded-full blur-[100px]"
          style={{ backgroundColor: `${COLORS.accent}1A` }}
        />
      </div>

      {/* Structural Framing Grid (Subtle) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ 
          backgroundImage: `linear-gradient(${COLORS.secondary} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.secondary} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Header/Language Bar */}
      <div className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
            <div className="h-8 w-[2px]" style={{ backgroundColor: COLORS.accent }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.secondary }}>
                SYNA <span className="opacity-40">SYSTEMS</span>
            </span>
        </div>
        <button 
          onClick={toggleLang} 
          className="text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:opacity-100 opacity-40"
          style={{ color: COLORS.secondary }}
        >
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      {/* Main Form Centerpiece */}
      <div className="relative z-20 w-full max-w-lg px-6">
        <div 
          className="relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(11,47,74,0.15)] transition-all"
          style={{ backgroundColor: "#FFFFFF", borderRadius: '4px', border: `1px solid ${COLORS.bgSecondary}` }}
        >
          {/* Subtle Decorative Accent Top Line */}
          <div className="h-[3px] w-full" style={{ backgroundColor: COLORS.primary }} />
          
          <div className="p-12 md:p-16">
            <div className="mb-14 text-center">
              <div 
                className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.bgLight }}
              >
                <Lock className="h-6 w-6" style={{ color: COLORS.primary }} />
              </div>
              
              <h1 
                className="mb-4 text-2xl font-bold tracking-tight uppercase"
                style={{ color: COLORS.primary }}
              >
                {isAr ? "تحقـق النفاذ الإداري" : "ADMINISTRATOR ACCESS"}
              </h1>
              <p className="text-xs font-medium tracking-wide opacity-50 uppercase" style={{ color: COLORS.textSecondary }}>
                {isAr ? "بروتوكول وصول آمن للنظم الإدارية" : "Secure Access Protocol for Internal Systems"}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label 
                    className="text-[10px] font-bold uppercase tracking-[0.2em] ps-1"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {isAr ? "البريد الإداري المركزي" : "Central Admin Email"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="h-14 w-full px-5 transition-all border outline-none focus:ring-0 text-sm font-medium"
                    style={{ 
                        backgroundColor: COLORS.bgLight, 
                        borderColor: COLORS.bgSecondary,
                        color: COLORS.textPrimary,
                        borderRadius: '2px'
                    }}
                    placeholder="executive@syna.sa"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label 
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: COLORS.textSecondary }}
                    >
                        {isAr ? "كلمة المرور المشفرة" : "Encrypted Password"}
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      dir="ltr"
                      className="h-14 w-full px-5 transition-all border outline-none focus:ring-0 text-sm font-medium"
                      style={{ 
                        backgroundColor: COLORS.bgLight, 
                        borderColor: COLORS.bgSecondary,
                        color: COLORS.textPrimary,
                        borderRadius: '2px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-4 top-1/2 -translate-y-1/2 transition-colors opacity-30 hover:opacity-100"
                      style={{ color: COLORS.textPrimary }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="group relative h-16 w-full flex items-center justify-center gap-4 transition-all duration-300 font-bold text-[11px] uppercase tracking-[0.3em] overflow-hidden"
                  style={{ 
                    backgroundColor: COLORS.primary, 
                    color: "#FFFFFF",
                    borderRadius: '2px'
                  }}
                >
                  <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      {isAr ? "تأكيـد الـدخول" : "Confirm Entry"}
                      {isAr ? <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> : <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div 
            className="px-12 py-8 text-center border-t flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.bgLight, borderColor: COLORS.bgSecondary }}
          >
            <Shield className="h-3 w-3 opacity-30" style={{ color: COLORS.textPrimary }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40" style={{ color: COLORS.textPrimary }}>
              {isAr ? "نظام مشفر ومراقب بالكامل" : "Fully Encrypted & Monitored System"}
            </p>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="mt-12 text-center opacity-40">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em]" style={{ color: COLORS.secondary }}>
                {isAr ? "سينا للاستثمارات العقارية ٢٠٢٤ | النفاذ الإداري" : "SYNA Real Estate Investments 2024 | Admin Node"}
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
