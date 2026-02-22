import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { Globe, UserPlus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const subscriptionOptions = [
  { value: "individual", labelAr: "أفراد (وسطاء/باحثين)", labelEn: "Individual (Brokers/Seekers)" },
  { value: "brokerage", labelAr: "شركات الوساطة", labelEn: "Brokerage Firms" },
  { value: "brand", labelAr: "شركات البراندات", labelEn: "Brand Companies" },
  { value: "property_management", labelAr: "إدارة العقود والمشاريع", labelEn: "Contract & Project Management" },
  { value: "bank", labelAr: "البنوك", labelEn: "Banks" },
];

const RegisterPage: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [city, setCity] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("individual");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const showCompanyField = subscriptionType !== "individual";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: lang === "ar" ? "خطأ" : "Error",
        description: lang === "ar" ? "يجب الموافقة على الشروط والأحكام" : "You must accept the terms and conditions",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          company_name: companyName || fullName,
          subscription_type: subscriptionType,
        },
      },
    });

    if (error) {
      toast({ variant: "destructive", title: t.nav.register, description: error.message });
    } else {
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ subscription_type: subscriptionType as any, full_name: fullName })
          .eq("user_id", data.user.id);

        await supabase.from("policy_consents").insert([
          { user_id: data.user.id, policy_type: "terms", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "privacy", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "usage", policy_version: "1.0.0" },
        ]);
      }

      toast({
        title: lang === "ar" ? "تم التسجيل" : "Registration successful",
        description: lang === "ar"
          ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني"
          : "A verification link has been sent to your email",
      });
      navigate("/auth/login");
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
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg doma-gradient">
              <span className="text-sm font-medium text-primary-foreground">D</span>
            </div>
            <span className="text-xl font-medium text-foreground">DOMA</span>
          </Link>

          <h1 className="mb-2 text-2xl font-medium text-foreground">{t.nav.register}</h1>
          <p className="mb-6 text-sm font-light text-muted-foreground">{t.auth.registerSubtitle}</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-light text-sm">{t.auth.fullName}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 rounded-xl border-border/60" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-light text-sm">{t.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-light text-sm">{t.auth.password}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" className="h-11 rounded-xl border-border/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-light text-sm">{t.auth.subscriptionType}</Label>
              <div className="grid gap-2">
                {subscriptionOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-light transition-all ${
                      subscriptionType === opt.value
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border/60 text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    <input type="radio" name="subscription" value={opt.value} checked={subscriptionType === opt.value} onChange={(e) => setSubscriptionType(e.target.value)} className="accent-primary" />
                    {lang === "ar" ? opt.labelAr : opt.labelEn}
                  </label>
                ))}
              </div>
            </div>

            {showCompanyField && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="font-light text-sm">{t.auth.companyName}</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-11 rounded-xl border-border/60" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="city" className="font-light text-sm">{t.auth.city}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl border-border/60" />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} />
              <label htmlFor="terms" className="text-sm font-light leading-relaxed text-muted-foreground">
                {t.auth.acceptTerms}{" "}
                <Link to="/terms" className="text-primary hover:underline">{t.auth.termsAndConditions}</Link>
                {" "}{t.auth.and}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{t.auth.privacyPolicy}</Link>
              </label>
            </div>

            <Button type="submit" className="h-11 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading || !acceptTerms}>
              <UserPlus className="h-4 w-4" />{t.auth.createAccount}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-light text-muted-foreground">
            {t.auth.alreadyHaveAccount}{" "}
            <Link to="/auth/login" className="text-primary hover:underline">{t.nav.login}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
