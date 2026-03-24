import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

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
    <div className="relative flex min-h-screen items-center justify-center bg-primary overflow-hidden">
      {/* Cinematic Night Riyadh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/70 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1549413280-9280f2fc748a?q=80&w=2000&auto=format&fit=crop" 
          alt="Riyadh Excellence" 
          className="h-full w-full object-cover grayscale opacity-40 transition-transform duration-[20s] scale-110" 
        />
      </div>

      <div className="absolute top-12 end-12 z-20">
        <button 
          onClick={toggleLang} 
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
        >
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      <div className="relative z-20 w-full max-w-sm px-6">
        <div className="mb-16 border-s-2 border-accent ps-8">
          <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-accent mb-4">
            {isAr ? "بوابة الإدارة" : "Administrative Portal"}
          </span>
          <h1 className="text-3xl font-medium tracking-tight text-white uppercase">
            {isAr ? "النفاذ المؤسسي" : "Institutional Access"}
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-10">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{isAr ? "البريد الإلكتروني" : "Email Address"}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full bg-transparent text-white focus:outline-none text-sm placeholder:text-white/10"
                placeholder={isAr ? "admin@syna.sa" : "admin@syna.sa"}
              />
            </div>
            <div className="space-y-2 border-b border-white/10 pb-4 relative">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{isAr ? "كلمة المرور" : "Password"}</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="w-full bg-transparent text-white focus:outline-none text-sm placeholder:text-white/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-0 top-8 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="luxury-button w-full border-white/20 text-white hover:border-accent hover:bg-accent hover:text-primary h-16" 
            disabled={loading}
          >
            {loading ? (isAr ? "جاري التحقق..." : "Validating...") : (isAr ? "تسجيل الدخول" : "Enter Portal")}
          </button>
        </form>

        <div className="mt-20 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">
            {isAr ? "سينا للاستثمارات العقارية ٢٠٢٤" : "SYNA Real Estate Investments 2024"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
