import React, { useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { Globe, UserPlus, Eye, EyeOff, Upload, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ARABIC_ONLY_REGEX = /^[\u0600-\u06FF\s]*$/;
const DIGITS_ONLY_REGEX = /^[0-9]*$/;

const RegisterPage: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  usePageTitle(lang === "ar" ? "إنشاء حساب" : "Register");
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [brandName, setBrandName] = useState("");

  const [website, setWebsite] = useState("");
  const [crFile, setCrFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const crFileRef = useRef<HTMLInputElement>(null);
  const identityFileRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email";
    }
    if (!phone || !DIGITS_ONLY_REGEX.test(phone) || phone.length < 9) {
      errs.phone = isAr ? "يرجى إدخال رقم جوال صحيح (أرقام فقط)" : "Please enter a valid phone number (digits only)";
    }
    if (!companyName) {
      errs.companyName = isAr ? "يرجى إدخال اسم الشركة" : "Please enter company name";
    }
    if (!crNumber || !DIGITS_ONLY_REGEX.test(crNumber)) {
      errs.crNumber = isAr ? "يرجى إدخال رقم السجل التجاري (أرقام فقط)" : "Please enter CR number (digits only)";
    }
    if (!crFile) {
      errs.crFile = isAr ? "يرجى رفع ملف السجل التجاري" : "Please upload the commercial register file";
    }
    if (!identityFile) {
      errs.identityFile = isAr ? "يرجى رفع صورة هوية الشركة" : "Please upload company identity document";
    }
    if (brandName && !ARABIC_ONLY_REGEX.test(brandName)) {
      errs.brandName = isAr ? "يرجى إدخال الاسم التجاري باللغة العربية فقط" : "Brand name must be in Arabic only";
    }
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errs.password = isAr ? "كلمة المرور يجب أن تحتوي على حروف وأرقام (8 خانات على الأقل)" : "Password must contain letters and numbers (at least 8 characters)";
    }
    if (!acceptTerms) {
      errs.terms = isAr ? "يجب الموافقة على الشروط والأحكام" : "You must accept the terms and conditions";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadFile = async (file: File, userId: string, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("developer-docs").upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          company_name: companyName,
          subscription_type: "individual",
          account_type: "developer",
          phone: `+966${phone}`,
        },
      },
    });

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        // Upload files
        const crFileUrl = await uploadFile(crFile!, data.user.id, "cr");
        const identityFileUrl = await uploadFile(identityFile!, data.user.id, "identity");

        // Update profile
        await supabase.from("profiles").update({
          subscription_type: "individual" as any,
          phone: `+966${phone}`,
        }).eq("user_id", data.user.id);

        // Policy consents
        await supabase.from("policy_consents").insert([
          { user_id: data.user.id, policy_type: "terms", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "privacy", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "usage", policy_version: "1.0.0" },
        ]);

        // Create developer profile
        await supabase.from("developers").insert({
          user_id: data.user.id,
          company_name: companyName,
          cr_number: crNumber,
          cr_file_url: crFileUrl,
          marketing_brand_name: brandName || null,
          email,
          phone: `+966${phone}`,
          website: website.trim() || null,
        });

        // Notify admin about new developer
        try {
          await supabase.functions.invoke("send-deal-notification", {
            body: { type: "new_developer_registered", registered_name: companyName, registered_email: email, registered_phone: `+966${phone}` },
          });
        } catch {}

        toast({
          title: isAr ? "تم استلام طلب التسجيل" : "Registration request received",
          description: isAr
            ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. سيتم مراجعة البيانات وإفادتك بنتيجة التحقق خلال 48 ساعة لتفعيل حسابك."
            : "A verification link has been sent to your email. Your data will be reviewed and you'll be notified of verification results within 48 hours.",
        });
      } catch (uploadError: any) {
        toast({ variant: "destructive", title: isAr ? "خطأ في رفع الملفات" : "File upload error", description: uploadError.message });
      }
      navigate("/auth/login");
    }
    setLoading(false);
  };

  const handlePhoneInput = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setPhone(cleaned);
  };

  const handleCrNumberInput = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setCrNumber(cleaned);
  };

  const handleBrandNameInput = (val: string) => {
    if (ARABIC_ONLY_REGEX.test(val)) setBrandName(val);
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
          <img src={logo} alt="DOMA" className="mx-auto mb-6 h-28 w-28 rounded-2xl object-contain" />
          <h2 className="text-3xl font-bold text-primary-foreground tracking-wide">DOMA</h2>
          <p className="mt-2 text-sm font-light text-primary-foreground/70">
            {isAr ? "شراكات تطوير عقاري" : "Real Estate Development Partnerships"}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
        <div className="absolute top-4 end-4">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-5 flex flex-col items-center lg:hidden">
            <img src={logo} alt="DOMA" className="h-20 w-20 rounded-xl object-contain" />
            <span className="mt-2 text-xl font-bold text-foreground tracking-wide">DOMA</span>
          </div>

          <div className="mb-5 rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-base font-medium text-primary">
              {isAr ? "نسعد بك عزيزي المطور 🏗️" : "We're glad to have you, Dear Developer 🏗️"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "أكمل بياناتك لبدء رحلة الشراكة التطويرية" : "Complete your details to start your development partnership journey"}
            </p>
          </div>
          <h1 className="mb-1 text-xl font-semibold text-foreground">
            {isAr ? "تسجيل مطور عقاري" : "Developer Registration"} — DOMA
          </h1>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Contact Info Section */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">
                {isAr ? "بيانات التواصل" : "Contact Information"}
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-light text-sm">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-10 rounded-xl border-border/60" placeholder="example@email.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-light text-sm">{isAr ? "رقم الجوال *" : "Phone Number *"}</Label>
                  <div className="flex gap-2">
                    <div className="flex h-10 items-center rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-muted-foreground shrink-0">
                      +966
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneInput(e.target.value)}
                      required
                      dir="ltr"
                      className="h-10 rounded-xl border-border/60"
                      placeholder="5XXXXXXXX"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Company Info Section */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">
                {isAr ? "بيانات الشركة" : "Company Information"}
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="font-light text-sm">{isAr ? "اسم الشركة (حسب السجل التجاري) *" : "Company Name (per CR) *"}</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="h-10 rounded-xl border-border/60" />
                  {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="crNumber" className="font-light text-sm">{isAr ? "رقم السجل التجاري *" : "Commercial Register Number *"}</Label>
                  <Input
                    id="crNumber"
                    value={crNumber}
                    onChange={(e) => handleCrNumberInput(e.target.value)}
                    required
                    dir="ltr"
                    className="h-10 rounded-xl border-border/60"
                    placeholder="1010XXXXXX"
                  />
                  {errors.crNumber && <p className="text-xs text-destructive">{errors.crNumber}</p>}
                </div>

                {/* CR File Upload */}
                <div className="space-y-1.5">
                  <Label className="font-light text-sm">{isAr ? "إضافة السجل التجاري (PDF) *" : "Upload Commercial Register (PDF) *"}</Label>
                  <input
                    ref={crFileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setCrFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => crFileRef.current?.click()}
                    className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-sm transition-colors ${
                      crFile ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${crFile ? "bg-primary/10" : "bg-muted"}`}>
                      <FileText className={`h-4 w-4 ${crFile ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="text-start">
                      <p className={`font-light ${crFile ? "text-foreground" : "text-muted-foreground"}`}>
                        {crFile ? crFile.name : (isAr ? "اضغط لرفع ملف PDF" : "Click to upload PDF")}
                      </p>
                      {crFile && <p className="text-xs text-muted-foreground">{(crFile.size / 1024).toFixed(0)} KB</p>}
                    </div>
                    <Upload className="ms-auto h-4 w-4 text-muted-foreground" />
                  </button>
                  {errors.crFile && <p className="text-xs text-destructive">{errors.crFile}</p>}
                </div>

                {/* Identity File Upload */}
                <div className="space-y-1.5">
                  <Label className="font-light text-sm">{isAr ? "إضافة صورة هوية الشركة (PDF / JPG / PNG) *" : "Upload Company Identity (PDF/JPG/PNG) *"}</Label>
                  <input
                    ref={identityFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setIdentityFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => identityFileRef.current?.click()}
                    className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-sm transition-colors ${
                      identityFile ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${identityFile ? "bg-primary/10" : "bg-muted"}`}>
                      <Image className={`h-4 w-4 ${identityFile ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="text-start">
                      <p className={`font-light ${identityFile ? "text-foreground" : "text-muted-foreground"}`}>
                        {identityFile ? identityFile.name : (isAr ? "اضغط لرفع ملف" : "Click to upload file")}
                      </p>
                      {identityFile && <p className="text-xs text-muted-foreground">{(identityFile.size / 1024).toFixed(0)} KB</p>}
                    </div>
                    <Upload className="ms-auto h-4 w-4 text-muted-foreground" />
                  </button>
                  {errors.identityFile && <p className="text-xs text-destructive">{errors.identityFile}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brandName" className="font-light text-sm">{isAr ? "الاسم التجاري (عربي فقط)" : "Brand Name (Arabic only)"}</Label>
                  <Input
                    id="brandName"
                    value={brandName}
                    onChange={(e) => handleBrandNameInput(e.target.value)}
                    className="h-10 rounded-xl border-border/60"
                    dir="rtl"
                    placeholder={isAr ? "الاسم التجاري" : "Brand name in Arabic"}
                  />
                  {errors.brandName && <p className="text-xs text-destructive">{errors.brandName}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website" className="font-light text-sm">{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-10 rounded-xl border-border/60"
                    dir="ltr"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">
                {isAr ? "الأمان" : "Security"}
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-light text-sm">{isAr ? "كلمة المرور *" : "Password *"}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    dir="ltr"
                    className="h-10 rounded-xl border-border/60"
                    placeholder={isAr ? "حروف + أرقام (8 خانات على الأقل)" : "Letters + numbers (min 8 chars)"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} />
              <label htmlFor="terms" className="text-sm font-light leading-relaxed text-muted-foreground">
                {isAr ? "أوافق على" : "I agree to the"}{" "}
                <Link to="/terms" className="text-primary hover:underline">{t.auth.termsAndConditions}</Link>
                {" "}{isAr ? "و" : "and"}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{t.auth.privacyPolicy}</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-destructive -mt-2">{errors.terms}</p>}

            <Button type="submit" className="h-11 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading}>
              <UserPlus className="h-4 w-4" />{isAr ? "إنشاء حساب" : "Create Account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm font-light text-muted-foreground">
            {isAr ? "لديك حساب؟" : "Have an account?"}{" "}
            <Link to="/auth/login" className="text-primary hover:underline">{t.nav.login}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
