import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { Globe, UserPlus, Eye, EyeOff, Landmark, HardHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AccountType = "landowner" | "developer";

const RegisterPage: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Developer-specific fields
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [brandName, setBrandName] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "يجب الموافقة على الشروط والأحكام" : "You must accept the terms and conditions",
      });
      return;
    }

    if (!accountType) return;

    setLoading(true);

    const subscriptionType = accountType === "landowner" ? "property_management" : "individual";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          company_name: accountType === "developer" ? companyName : fullName,
          subscription_type: subscriptionType,
          account_type: accountType,
          phone,
        },
      },
    });

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            subscription_type: subscriptionType as any,
            full_name: fullName,
            phone,
          })
          .eq("user_id", data.user.id);

        await supabase.from("policy_consents").insert([
          { user_id: data.user.id, policy_type: "terms", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "privacy", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "usage", policy_version: "1.0.0" },
        ]);

        // If developer, create developer profile
        if (accountType === "developer" && crNumber) {
          await supabase.from("developers").insert({
            user_id: data.user.id,
            company_name: companyName,
            cr_number: crNumber,
            cr_file_url: "", // Will be uploaded later in onboarding
            marketing_brand_name: brandName || null,
            email,
            phone,
          });
        }
      }

      toast({
        title: isAr ? "تم التسجيل" : "Registration successful",
        description: isAr
          ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني"
          : "A verification link has been sent to your email",
      });
      navigate("/auth/login");
    }
    setLoading(false);
  };

  // Account type selection screen
  if (!accountType) {
    return (
      <div className="flex min-h-screen">
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
            <p className="mt-2 text-sm font-light text-primary-foreground/70">
              {isAr ? "شراكات تطوير عقاري" : "Real Estate Development Partnerships"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-background p-6">
          <div className="absolute top-4 end-4">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
              <Globe className="h-4 w-4" />{t.nav.language}
            </Button>
          </div>

          <div className="w-full max-w-md">
            <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg doma-gradient">
                <span className="text-sm font-medium text-primary-foreground">D</span>
              </div>
              <span className="text-xl font-medium text-foreground">DOMA</span>
            </Link>

            <h1 className="mb-2 text-2xl font-medium text-foreground">
              {isAr ? "إنشاء حساب" : "Create Account"}
            </h1>
            <p className="mb-8 text-sm font-light text-muted-foreground">
              {isAr ? "اختر نوع حسابك للمتابعة" : "Choose your account type to continue"}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setAccountType("landowner")}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:doma-shadow"
              >
                <Landmark className="h-8 w-8 text-primary" strokeWidth={1.5} />
                <div className="text-center">
                  <h3 className="text-base font-medium text-foreground">
                    {isAr ? "مالك أرض" : "Landowner"}
                  </h3>
                  <p className="mt-1 text-xs font-light text-muted-foreground">
                    {isAr ? "أملك أرضاً وأبحث عن مطور" : "I own land and seek a developer"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAccountType("developer")}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:doma-shadow"
              >
                <HardHat className="h-8 w-8 text-primary" strokeWidth={1.5} />
                <div className="text-center">
                  <h3 className="text-base font-medium text-foreground">
                    {isAr ? "مطور عقاري" : "Developer"}
                  </h3>
                  <p className="mt-1 text-xs font-light text-muted-foreground">
                    {isAr ? "أبحث عن أراضٍ للتطوير" : "I'm looking for lands to develop"}
                  </p>
                </div>
              </button>
            </div>

            <p className="mt-6 text-center text-sm font-light text-muted-foreground">
              {t.auth.alreadyHaveAccount}{" "}
              <Link to="/auth/login" className="text-primary hover:underline">{t.nav.login}</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-2/5 overflow-hidden doma-gradient lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute top-1/4 start-1/4 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute bottom-1/4 end-1/4 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary-foreground/10">
            {accountType === "landowner" ? (
              <Landmark className="h-7 w-7 text-primary-foreground" strokeWidth={1.5} />
            ) : (
              <HardHat className="h-7 w-7 text-primary-foreground" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-2xl font-medium text-primary-foreground">
            {accountType === "landowner"
              ? (isAr ? "حساب مالك أرض" : "Landowner Account")
              : (isAr ? "حساب مطور عقاري" : "Developer Account")}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="absolute top-4 end-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-4 flex items-center gap-2">
            <button onClick={() => setAccountType(null)} className="text-sm font-light text-primary hover:underline">
              {isAr ? "← تغيير نوع الحساب" : "← Change account type"}
            </button>
          </div>

          <h1 className="mb-1 text-2xl font-medium text-foreground">
            {accountType === "landowner"
              ? (isAr ? "تسجيل مالك أرض" : "Landowner Registration")
              : (isAr ? "تسجيل مطور عقاري" : "Developer Registration")}
          </h1>
          <p className="mb-5 text-sm font-light text-muted-foreground">{t.auth.registerSubtitle}</p>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="font-light text-sm">{t.auth.fullName}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-10 rounded-xl border-border/60" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-light text-sm">{t.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-10 rounded-xl border-border/60" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-light text-sm">{isAr ? "رقم الجوال" : "Phone Number"}</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" placeholder="+966" className="h-10 rounded-xl border-border/60" />
            </div>

            {accountType === "developer" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="font-light text-sm">{isAr ? "اسم الشركة" : "Company Name"}</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="h-10 rounded-xl border-border/60" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crNumber" className="font-light text-sm">{isAr ? "رقم السجل التجاري" : "Commercial Register Number"}</Label>
                  <Input id="crNumber" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} required dir="ltr" className="h-10 rounded-xl border-border/60" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brandName" className="font-light text-sm">{isAr ? "الاسم التجاري / البراند (اختياري)" : "Brand Name (optional)"}</Label>
                  <Input id="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="h-10 rounded-xl border-border/60" />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-light text-sm">{t.auth.password}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" className="h-10 rounded-xl border-border/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} />
              <label htmlFor="terms" className="text-sm font-light leading-relaxed text-muted-foreground">
                {t.auth.acceptTerms}{" "}
                <Link to="/terms" className="text-primary hover:underline">{t.auth.termsAndConditions}</Link>
                {" "}{t.auth.and}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{t.auth.privacyPolicy}</Link>
              </label>
            </div>

            <Button type="submit" className="h-10 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading || !acceptTerms}>
              <UserPlus className="h-4 w-4" />{t.auth.createAccount}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm font-light text-muted-foreground">
            {t.auth.alreadyHaveAccount}{" "}
            <Link to="/auth/login" className="text-primary hover:underline">{t.nav.login}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
