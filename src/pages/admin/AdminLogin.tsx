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
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  React.useEffect(() => {
    supabase.from("platform_content").select("body_en").eq("content_key", "demo_credentials_visible").eq("is_active", true).maybeSingle().then(({ data }) => {
      setShowDemoCredentials(data?.body_en === "true");
    });
  }, []);

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
    <div className="flex min-h-screen items-center justify-center bg-[hsl(210,25%,8%)]">
      <div className="absolute top-4 end-4">
        <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-[hsl(210,15%,55%)]">
          <Globe className="h-4 w-4" />{t.nav.language}
        </Button>
      </div>

      <div className="w-full max-w-sm mx-4">
        <div className="mb-6 text-center">
          <img src={logo} alt="DOMA" className="mx-auto mb-4 h-16 w-16 rounded-xl object-contain" />
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-medium text-white">
              {isAr ? "بوابة الإدارة" : "Admin Portal"}
            </h1>
          </div>
          <p className="text-xs text-[hsl(210,15%,55%)]">
            {isAr ? "الوصول مقيّد للمسؤولين فقط" : "Restricted access for administrators only"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-[hsl(210,20%,18%)] bg-[hsl(210,25%,11%)] p-6">
          {/* Quick-fill admin credentials */}
          {showDemoCredentials && (
            <button
              type="button"
              onClick={() => { setEmail("admin@doma.com"); setPassword("Admin1"); }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[hsl(210,20%,18%)] bg-[hsl(210,25%,14%)] px-3 py-2 text-xs text-[hsl(210,15%,55%)] transition-all hover:border-[hsl(200,80%,45%,0.3)] hover:text-[hsl(200,80%,65%)]"
            >
              <Shield className="h-3 w-3" />
              {isAr ? "تعبئة بيانات المدير التجريبية" : "Fill demo admin credentials"}
            </button>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-light text-[hsl(210,15%,70%)]">{t.auth.email}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="h-11 rounded-xl border-[hsl(210,20%,18%)] bg-[hsl(210,25%,14%)] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-light text-[hsl(210,15%,70%)]">{t.auth.password}</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="h-11 rounded-xl border-[hsl(210,20%,18%)] bg-[hsl(210,25%,14%)] text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[hsl(210,15%,55%)] hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="h-11 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading}>
            <Shield className="h-4 w-4" />
            {loading ? (isAr ? "جاري الدخول..." : "Signing in...") : (isAr ? "دخول" : "Sign In")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
