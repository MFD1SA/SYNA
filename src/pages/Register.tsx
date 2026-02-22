import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState("individual");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

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
          subscription_type: subscriptionType,
        },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: t.nav.register,
        description: error.message,
      });
    } else {
      // Update profile with subscription type
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ subscription_type: subscriptionType as any, full_name: fullName })
          .eq("user_id", data.user.id);

        // Record policy consent
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
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 end-4">
        <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5">
          <Globe className="h-4 w-4" />
          {t.nav.language}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mb-4 inline-block text-2xl font-medium text-primary">DOMA</Link>
          <CardTitle className="text-xl font-medium">{t.nav.register}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-light">
                {lang === "ar" ? "الاسم الكامل" : "Full Name"}
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-light">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-light">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-light">
                {lang === "ar" ? "نوع الاشتراك" : "Subscription Type"}
              </Label>
              <div className="grid gap-2">
                {subscriptionOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-light transition-colors ${
                      subscriptionType === opt.value
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscription"
                      value={opt.value}
                      checked={subscriptionType === opt.value}
                      onChange={(e) => setSubscriptionType(e.target.value)}
                      className="accent-primary"
                    />
                    {lang === "ar" ? opt.labelAr : opt.labelEn}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-sm font-light leading-relaxed text-muted-foreground">
                {lang === "ar" ? (
                  <>أوافق على <Link to="/terms" className="text-primary hover:underline">الشروط والأحكام</Link> و<Link to="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link></>
                ) : (
                  <>I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></>
                )}
              </label>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading || !acceptTerms}>
              <UserPlus className="h-4 w-4" />
              {t.nav.register}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-light text-muted-foreground">
            {lang === "ar" ? "لديك حساب؟ " : "Already have an account? "}
            <Link to="/login" className="text-primary hover:underline">
              {t.nav.login}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
