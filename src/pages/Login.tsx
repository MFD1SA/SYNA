import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Globe, LogIn, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage: React.FC = () => {
  const { t, toggleLang } = useLanguage();
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
      toast({ variant: "destructive", title: t.nav.login, description: error.message });
      setLoading(false);
      return;
    }

    // Check if admin
    if (data.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        navigate("/admin/overview");
      } else {
        navigate("/crm/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="relative hidden w-2/5 overflow-hidden doma-gradient lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute top-1/4 start-1/4 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute bottom-1/4 end-1/4 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary-foreground/10">
            <span className="text-2xl font-medium text-primary-foreground">D</span>
          </div>
          <h2 className="text-3xl font-medium text-primary-foreground">DOMA</h2>
          <p className="mt-2 text-sm font-light text-primary-foreground/70">Real Estate Management</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="absolute top-4 end-4">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
        </div>

        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg doma-gradient">
              <span className="text-sm font-medium text-primary-foreground">D</span>
            </div>
            <span className="text-xl font-medium text-foreground">DOMA</span>
          </Link>

          <h1 className="mb-2 text-2xl font-medium text-foreground">{t.nav.login}</h1>
          <p className="mb-8 text-sm font-light text-muted-foreground">{t.auth.loginSubtitle}</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-light text-sm">{t.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-light text-sm">{t.auth.password}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading}>
              <LogIn className="h-4 w-4" />{t.nav.login}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-light text-muted-foreground">
            {t.auth.noAccount}{" "}
            <Link to="/auth/register" className="text-primary hover:underline">{t.nav.register}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
