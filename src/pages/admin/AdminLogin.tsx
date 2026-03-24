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
  const { t, lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "بوابة الإدارة" : "Admin Portal");
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
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
      setLoading(false);
      return;
    }
    if (data.user) {
      // Verify admin role
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
          title: isAr ? "غير مصرح" : "Unauthorized",
          description: isAr ? "ليس لديك صلاحية الوصول لهذه البوابة" : "You don't have access to this portal",
        });
        setLoading(false);
        return;
      }

      toast({ title: isAr ? "أهلاً مدير النظام 👋" : "Welcome, System Admin 👋" });
      // Small delay to let auth state propagate before navigating
      setTimeout(() => navigate("/admincp/overview"), 100);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute top-4 end-4">
        <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4" />{t.nav.language}
        </Button>
      </div>

      <div className="w-full max-w-sm mx-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-sm border border-border/50">
            <img src={logo} alt="SYNA" className="h-14 w-14 object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-medium text-foreground tracking-tight">
              {isAr ? "بوابة الإدارة" : "Admin Portal"}
            </h1>
          </div>
          <p className="text-sm font-light text-muted-foreground">
            {isAr ? "الوصول مقيّد لمسؤولي النظام فقط" : "Restricted access for system administrators only"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t.auth.email}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="h-12 rounded-xl border border-border/50 bg-background text-foreground transition-all focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t.auth.password}</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="h-12 rounded-xl border border-border/50 bg-background text-foreground transition-all focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="h-12 w-full gap-2 rounded-xl text-base shadow-sm mt-2" disabled={loading}>
            <Shield className="h-4 w-4" />
            {loading ? (isAr ? "جاري التحقق..." : "Verifying...") : (isAr ? "تسجيل الدخول" : "Sign In")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
