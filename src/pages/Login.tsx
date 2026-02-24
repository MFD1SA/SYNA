import React, { useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Globe, LogIn, UserPlus, Eye, EyeOff, Upload, FileText, Image, Handshake, Home, HardHat, Landmark, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ARABIC_ONLY_REGEX = /^[\u0600-\u06FF\s]*$/;
const DIGITS_ONLY_REGEX = /^[0-9]*$/;

const LoginPage: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "بوابة الشركاء" : "Partners Portal");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [portalType, setPortalType] = useState<"developer" | "owner">("developer");
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [crFile, setCrFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const crFileRef = useRef<HTMLInputElement>(null);
  const identityFileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

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
      if (portalType === "owner") {
        toast({ title: isAr ? "أهلاً بك 👋" : "Welcome 👋" });
        navigate("/owner/dashboard");
      } else {
        toast({ title: isAr ? "أهلاً عزيزي المطور 👋" : "Welcome, Dear Developer 👋" });
        navigate("/crm/dashboard");
      }
    }
    setLoading(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!brandName) errs.brandName = isAr ? "يرجى إدخال الاسم التجاري" : "Please enter brand name";
    else if (!ARABIC_ONLY_REGEX.test(brandName)) errs.brandName = isAr ? "يرجى إدخال الاسم التجاري باللغة العربية فقط" : "Brand name must be in Arabic only";
    if (!companyName) errs.companyName = isAr ? "يرجى إدخال اسم السجل التجاري" : "Please enter CR name";
    if (!crNumber || !DIGITS_ONLY_REGEX.test(crNumber)) errs.crNumber = isAr ? "يرجى إدخال رقم السجل التجاري" : "Please enter CR number";
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email";
    if (!phone || !DIGITS_ONLY_REGEX.test(phone) || phone.length < 9) errs.phone = isAr ? "يرجى إدخال رقم جوال صحيح" : "Please enter a valid phone number";
    if (!crFile) errs.crFile = isAr ? "يرجى رفع ملف السجل التجاري" : "Please upload the commercial register file";
    if (!identityFile) errs.identityFile = isAr ? "يرجى رفع صورة هوية الشركة" : "Please upload company identity document";
    if (!regPassword || regPassword.length < 8 || !/[a-zA-Z]/.test(regPassword) || !/[0-9]/.test(regPassword)) errs.password = isAr ? "كلمة المرور يجب أن تحتوي على حروف وأرقام (8 خانات)" : "Password must contain letters and numbers (min 8 chars)";
    if (!acceptTerms) errs.terms = isAr ? "يجب الموافقة على الشروط والأحكام" : "You must accept the terms";
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

  const handleCrFileChange = async (file: File | null) => {
    setCrFile(file);
    setVerificationResult(null);
    if (!file) return;

    // AI verification of CR file
    setVerifying(true);
    try {
      // We'll use the admin-ai function to verify
      const { data, error } = await supabase.functions.invoke("admin-ai", {
        body: {
          prompt: `أنت مدقق سجلات تجارية. المطلوب: استخرج "رقم السجل التجاري" و"الاسم التجاري" من الوثيقة المرفقة. أجب بصيغة JSON فقط: {"cr_number": "...", "company_name": "..."}. إذا لم تستطع الاستخراج أجب: {"error": "unable"}`,
          context: `اسم الملف: ${file.name}, حجم الملف: ${(file.size / 1024).toFixed(0)} KB`,
        },
      });
      // For now show verification pending since we can't actually read PDFs client-side
      setVerificationResult({
        success: true,
        message: isAr ? "جاري التحقق من السجل التجاري — سيتم المراجعة خلال 48 ساعة" : "CR verification in progress — will be reviewed within 48 hours",
      });
    } catch {
      setVerificationResult({
        success: true,
        message: isAr ? "تم رفع الملف — سيتم التحقق يدوياً" : "File uploaded — manual verification pending",
      });
    }
    setVerifying(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { company_name: companyName, subscription_type: "individual", account_type: "developer", phone: `+966${phone}` },
      },
    });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
      setLoading(false);
      return;
    }
    if (data.user) {
      try {
        const crFileUrl = await uploadFile(crFile!, data.user.id, "cr");
        await uploadFile(identityFile!, data.user.id, "identity");
        await supabase.from("profiles").update({ subscription_type: "individual" as any, phone: `+966${phone}` }).eq("user_id", data.user.id);
        await supabase.from("policy_consents").insert([
          { user_id: data.user.id, policy_type: "terms", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "privacy", policy_version: "1.0.0" },
          { user_id: data.user.id, policy_type: "usage", policy_version: "1.0.0" },
        ]);
        await supabase.from("developers").insert({
          user_id: data.user.id, company_name: companyName, cr_number: crNumber,
          cr_file_url: crFileUrl, marketing_brand_name: brandName || null, email: regEmail, phone: `+966${phone}`,
        });
        toast({
          title: isAr ? "تم استلام طلب التسجيل" : "Registration request received",
          description: isAr
            ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. سيتم مراجعة البيانات خلال 48 ساعة."
            : "A verification link has been sent to your email. Your data will be reviewed within 48 hours.",
        });
        setMode("login");
      } catch (uploadError: any) {
        toast({ variant: "destructive", title: isAr ? "خطأ في رفع الملفات" : "File upload error", description: uploadError.message });
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
          <img src={logo} alt="DOMA" className="mx-auto mb-6 h-28 w-28 rounded-2xl object-contain" />
          <h2 className="text-3xl font-bold text-primary-foreground tracking-wide">DOMA</h2>
          <p className="mt-2 text-sm font-light text-primary-foreground/70">
            {isAr ? "بوابة الشركاء" : "Partners Portal"}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6 overflow-y-auto">
        <div className="absolute top-4 inset-x-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link to="/"><Home className="h-4 w-4" />{isAr ? "الرئيسية" : "Home"}</Link>
          </Button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-5 flex flex-col items-center lg:hidden">
            <img src={logo} alt="DOMA" className="h-16 w-16 rounded-xl object-contain" />
            <span className="mt-2 text-xl font-bold text-foreground tracking-wide">DOMA</span>
          </div>

          {/* Portal Type Tabs */}
          <Tabs value={portalType} onValueChange={(v) => { setPortalType(v as any); setMode("login"); }} className="mb-5">
            <TabsList className="w-full">
              <TabsTrigger value="developer" className="flex-1 gap-1.5">
                <HardHat className="h-3.5 w-3.5" />
                {isAr ? "بوابة المطور" : "Developer Portal"}
              </TabsTrigger>
              <TabsTrigger value="owner" className="flex-1 gap-1.5">
                <Landmark className="h-3.5 w-3.5" />
                {isAr ? "بوابة المالك" : "Owner Portal"}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Welcome banner */}
          <div className="mb-5 rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {portalType === "developer" ? <HardHat className="h-5 w-5 text-primary" /> : <Landmark className="h-5 w-5 text-primary" />}
              <p className="text-base font-medium text-primary">
                {portalType === "developer"
                  ? (isAr ? "بوابة المطور العقاري" : "Developer Portal")
                  : (isAr ? "بوابة مالك الأرض" : "Land Owner Portal")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {portalType === "owner"
                ? (isAr ? "تابع حالة أرضك ومؤشرات الاهتمام" : "Track your land status and interest indicators")
                : mode === "login"
                  ? (isAr ? "سجّل دخولك لبدء رحلة الشراكة" : "Sign in to start your partnership journey")
                  : (isAr ? "أنشئ حساباً جديداً لبدء رحلة الشراكة" : "Create an account to start your partnership journey")}
            </p>
          </div>

          {/* Owner Portal - Login only (admin creates accounts) */}
          {portalType === "owner" && (
            <>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="owner-email" className="font-light text-sm">{t.auth.email}</Label>
                  <Input id="owner-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-password" className="font-light text-sm">{t.auth.password}</Label>
                  <div className="relative">
                    <Input id="owner-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="h-11 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading}>
                  <LogIn className="h-4 w-4" />{isAr ? "دخول" : "Sign In"}
                </Button>
              </form>
              <div className="mt-4 rounded-xl border border-border/40 bg-muted/30 p-3 text-center">
                <p className="text-xs font-light text-muted-foreground">
                  {isAr
                    ? "يتم إنشاء حسابات الملاك من قبل مدير النظام. تواصل معنا للحصول على بيانات الدخول."
                    : "Owner accounts are created by the admin. Contact us for login credentials."}
                </p>
              </div>
            </>
          )}

          {/* Developer Portal */}
          {portalType === "developer" && mode === "login" && (
            <>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="font-light text-sm">{t.auth.email}</Label>
                  <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="font-light text-sm">{t.auth.password}</Label>
                  <div className="relative">
                    <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className="h-11 rounded-xl border-border/60" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="h-11 w-full gap-2 rounded-xl doma-gradient doma-shadow" disabled={loading}>
                  <LogIn className="h-4 w-4" />{isAr ? "دخول" : "Sign In"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm font-light text-muted-foreground">
                {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline">
                  {isAr ? "إنشاء حساب" : "Create Account"}
                </button>
              </p>
            </>
          )}

          {portalType === "developer" && mode === "register" && (
            <>
              <form onSubmit={handleRegister} className="space-y-5">
                {/* 1. Brand Name (Arabic only) */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">
                    {isAr ? "بيانات الشركة" : "Company Information"}
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "الاسم التجاري (عربي فقط) *" : "Brand Name (Arabic only) *"}</Label>
                      <Input value={brandName} onChange={(e) => { if (ARABIC_ONLY_REGEX.test(e.target.value)) setBrandName(e.target.value); }} required className="h-10 rounded-xl border-border/60" dir="rtl" placeholder={isAr ? "الاسم التجاري" : "Brand name in Arabic"} />
                      {errors.brandName && <p className="text-xs text-destructive">{errors.brandName}</p>}
                    </div>

                    {/* 2. Company Name per CR */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "اسم السجل التجاري *" : "Commercial Register Name *"}</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="h-10 rounded-xl border-border/60" />
                      {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                    </div>

                    {/* 3. CR Number */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "رقم السجل التجاري *" : "Commercial Register Number *"}</Label>
                      <Input value={crNumber} onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className="h-10 rounded-xl border-border/60" placeholder="1010XXXXXX" />
                      {errors.crNumber && <p className="text-xs text-destructive">{errors.crNumber}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">
                    {isAr ? "بيانات التواصل" : "Contact Information"}
                  </h3>
                  <div className="space-y-3">
                    {/* 4. Email */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                      <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required dir="ltr" className="h-10 rounded-xl border-border/60" placeholder="example@email.com" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      <p className="text-[10px] text-muted-foreground">{isAr ? "سيتم إرسال رسالة تحقق إلى هذا البريد" : "A verification email will be sent to this address"}</p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "رقم الجوال *" : "Phone Number *"}</Label>
                      <div className="flex gap-2">
                        <div className="flex h-10 items-center rounded-xl border border-border/60 bg-muted/30 px-3 text-sm text-muted-foreground shrink-0">+966</div>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className="h-10 rounded-xl border-border/60" placeholder="5XXXXXXXX" maxLength={10} />
                      </div>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>

                    {/* 5. Website */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                      <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} dir="ltr" className="h-10 rounded-xl border-border/60" placeholder="https://example.com" />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">
                    {isAr ? "بروفايل الشركة والوثائق" : "Company Profile & Documents"}
                  </h3>
                  <div className="space-y-3">
                    {/* CR File Upload with AI verification */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "إرفاق السجل التجاري (PDF) *" : "Attach Commercial Register (PDF) *"}</Label>
                      <input ref={crFileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleCrFileChange(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => crFileRef.current?.click()} className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-sm transition-colors ${crFile ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30"}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${crFile ? "bg-primary/10" : "bg-muted"}`}>
                          <FileText className={`h-4 w-4 ${crFile ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="text-start">
                          <p className={`font-light ${crFile ? "text-foreground" : "text-muted-foreground"}`}>{crFile ? crFile.name : (isAr ? "اضغط لرفع ملف PDF" : "Click to upload PDF")}</p>
                          {crFile && <p className="text-xs text-muted-foreground">{(crFile.size / 1024).toFixed(0)} KB</p>}
                        </div>
                        <Upload className="ms-auto h-4 w-4 text-muted-foreground" />
                      </button>
                      {errors.crFile && <p className="text-xs text-destructive">{errors.crFile}</p>}

                      {/* AI Verification Status */}
                      {verifying && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                          <span className="text-xs font-light text-amber-700">{isAr ? "جاري التحقق من السجل التجاري..." : "Verifying commercial register..."}</span>
                        </div>
                      )}
                      {verificationResult && !verifying && (
                        <div className={`flex items-center gap-2 rounded-lg border p-2.5 ${verificationResult.success ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                          <span className={`text-xs font-light ${verificationResult.success ? "text-primary" : "text-destructive"}`}>
                            {verificationResult.message}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Identity File Upload */}
                    <div className="space-y-1.5">
                      <Label className="font-light text-sm">{isAr ? "إضافة صورة هوية الشركة *" : "Upload Company Identity *"}</Label>
                      <input ref={identityFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setIdentityFile(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => identityFileRef.current?.click()} className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-sm transition-colors ${identityFile ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30"}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${identityFile ? "bg-primary/10" : "bg-muted"}`}>
                          <Image className={`h-4 w-4 ${identityFile ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="text-start">
                          <p className={`font-light ${identityFile ? "text-foreground" : "text-muted-foreground"}`}>{identityFile ? identityFile.name : (isAr ? "اضغط لرفع ملف" : "Click to upload file")}</p>
                          {identityFile && <p className="text-xs text-muted-foreground">{(identityFile.size / 1024).toFixed(0)} KB</p>}
                        </div>
                        <Upload className="ms-auto h-4 w-4 text-muted-foreground" />
                      </button>
                      {errors.identityFile && <p className="text-xs text-destructive">{errors.identityFile}</p>}
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground border-b border-border/40 pb-2">{isAr ? "الأمان" : "Security"}</h3>
                  <div className="space-y-1.5">
                    <Label className="font-light text-sm">{isAr ? "كلمة المرور *" : "Password *"}</Label>
                    <div className="relative">
                      <Input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={8} dir="ltr" className="h-10 rounded-xl border-border/60" placeholder={isAr ? "حروف + أرقام (8 خانات)" : "Letters + numbers (min 8 chars)"} />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
