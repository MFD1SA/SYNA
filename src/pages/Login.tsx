import React, { useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Globe, LogIn, UserPlus, Eye, EyeOff, Upload, FileText, Image, Home, HardHat, Landmark, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const showWelcomeToast = () => {
    toast({ title: portalType === "owner" ? (isAr ? "أهلاً بك 👋" : "Welcome 👋") : (isAr ? "أهلاً عزيزي المطور 👋" : "Welcome, Dear Developer 👋") });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
      setLoading(false);
      return;
    }
    showWelcomeToast();
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
    setVerifying(true);
    try {
      setVerificationResult({ success: true, message: isAr ? "جاري التحقق من السجل التجاري — سيتم المراجعة خلال 48 ساعة" : "CR verification in progress — will be reviewed within 48 hours" });
    } catch {
      setVerificationResult({ success: true, message: isAr ? "تم رفع الملف — سيتم التحقق يدوياً" : "File uploaded — manual verification pending" });
    }
    setVerifying(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: regEmail, password: regPassword,
      options: { emailRedirectTo: window.location.origin, data: { company_name: companyName, subscription_type: "individual", account_type: "developer", phone: `+966${phone}` } },
    });
    if (error) { toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message }); setLoading(false); return; }
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
        toast({ title: isAr ? "تم استلام طلب التسجيل" : "Registration request received", description: isAr ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. سيتم مراجعة البيانات خلال 48 ساعة." : "A verification link has been sent to your email. Your data will be reviewed within 48 hours." });
        setMode("login");
      } catch (uploadError: any) {
        toast({ variant: "destructive", title: isAr ? "خطأ في رفع الملفات" : "File upload error", description: uploadError.message });
      }
    }
    setLoading(false);
  };

  const inputClasses = "h-11 rounded-xl border-[hsl(210,22%,16%)] bg-[hsl(210,28%,8%)] text-white placeholder:text-[hsl(210,15%,35%)] focus:border-[hsl(200,80%,45%,0.4)] focus:ring-[hsl(200,80%,45%,0.2)]";
  const labelClasses = "font-light text-sm text-[hsl(210,15%,60%)]";
  const sectionTitleClasses = "mb-3 text-sm font-medium text-white border-b border-[hsl(210,22%,14%)] pb-2";

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${portalType}-email`} className={labelClasses}>{t.auth.email}</Label>
        <Input id={`${portalType}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${portalType}-password`} className={labelClasses}>{t.auth.password}</Label>
        <div className="relative">
          <Input id={`${portalType}-password`} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className={inputClasses} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-[hsl(210,15%,45%)] hover:text-white transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="h-12 w-full gap-2 rounded-xl syna-gradient text-base font-medium transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(200,80%,50%,0.3)] hover:scale-[1.01]" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {isAr ? "دخول" : "Sign In"}
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-screen bg-[hsl(210,30%,4%)]">
      {/* Left decorative panel */}
      <div className="relative hidden w-[45%] overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 start-1/3 h-[500px] w-[500px] rounded-full bg-[hsl(200,80%,45%,0.08)] blur-[160px]" />
          <div className="absolute bottom-1/4 end-1/4 h-[300px] w-[300px] rounded-full bg-[hsl(195,85%,50%,0.05)] blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: `radial-gradient(circle, hsl(200 80% 60%) 0.5px, transparent 0.5px)`, backgroundSize: "40px 40px" }}
          />
        </div>

        {/* Orbital rings */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute h-[500px] w-[500px] rounded-full border border-[hsl(200,80%,40%,0.06)]" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} className="absolute h-[650px] w-[650px] rounded-full border border-[hsl(195,85%,50%,0.04)]" />

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 scale-150 rounded-full bg-[hsl(200,80%,45%,0.12)] blur-[50px]" />
            <img src={logo} alt="SYNA" className="relative mx-auto h-36 w-36 object-contain drop-shadow-[0_0_30px_hsl(200,80%,50%,0.3)]" />
          </div>
          <h2 className="text-4xl font-medium tracking-tight" style={{ background: "linear-gradient(135deg, white, hsl(200,80%,70%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SYNA</h2>
          <p className="mt-3 text-sm font-light text-[hsl(210,15%,50%)]">{isAr ? "بوابة الشركاء" : "Partners Portal"}</p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 md:p-10">
        {/* Top bar */}
        <div className="fixed top-4 inset-x-6 z-10 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-[hsl(210,15%,50%)] hover:bg-[hsl(210,22%,12%)] hover:text-white">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-[hsl(210,15%,50%)] hover:bg-[hsl(210,22%,12%)] hover:text-white">
            <Link to="/"><Home className="h-4 w-4" />{isAr ? "الرئيسية" : "Home"}</Link>
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-[hsl(200,80%,45%,0.1)] blur-[30px]" />
              <img src={logo} alt="SYNA" className="relative h-20 w-20 object-contain" />
            </div>
            <span className="mt-3 text-2xl font-medium text-white tracking-tight">SYNA</span>
          </div>

          {/* Portal Type Tabs */}
          <Tabs value={portalType} onValueChange={(v) => { setPortalType(v as any); setMode("login"); }} className="mb-6">
            <TabsList className="w-full rounded-xl border border-[hsl(210,22%,14%)] bg-[hsl(210,28%,7%)] p-1">
              <TabsTrigger value="developer" className="flex-1 gap-1.5 rounded-lg text-[hsl(210,15%,55%)] data-[state=active]:bg-[hsl(210,22%,14%)] data-[state=active]:text-white data-[state=active]:shadow-none">
                <HardHat className="h-3.5 w-3.5" />
                {isAr ? "بوابة المطور" : "Developer Portal"}
              </TabsTrigger>
              <TabsTrigger value="owner" className="flex-1 gap-1.5 rounded-lg text-[hsl(210,15%,55%)] data-[state=active]:bg-[hsl(210,22%,14%)] data-[state=active]:text-white data-[state=active]:shadow-none">
                <Landmark className="h-3.5 w-3.5" />
                {isAr ? "بوابة المالك" : "Owner Portal"}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Welcome banner */}
          <div className="mb-6 rounded-2xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.04)] p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {portalType === "developer" ? <HardHat className="h-5 w-5 text-[hsl(200,80%,55%)]" /> : <Landmark className="h-5 w-5 text-[hsl(200,80%,55%)]" />}
              <p className="text-base font-medium text-white">
                {portalType === "developer" ? (isAr ? "بوابة المطور العقاري" : "Developer Portal") : (isAr ? "بوابة مالك الأرض" : "Land Owner Portal")}
              </p>
            </div>
            <p className="text-xs text-[hsl(210,15%,50%)]">
              {portalType === "owner"
                ? (isAr ? "تابع حالة أرضك ومؤشرات الاهتمام" : "Track your land status and interest indicators")
                : mode === "login"
                  ? (isAr ? "سجّل دخولك لبدء رحلة الشراكة" : "Sign in to start your partnership journey")
                  : (isAr ? "أنشئ حساباً جديداً لبدء رحلة الشراكة" : "Create an account to start your partnership journey")}
            </p>
          </div>

          {/* Owner Portal */}
          {portalType === "owner" && (
            <>
              {LoginForm}
              <div className="mt-5 rounded-xl border border-[hsl(210,22%,14%)] bg-[hsl(210,28%,7%)] p-4 text-center">
                <p className="text-xs font-light text-[hsl(210,15%,45%)]">
                  {isAr ? "يتم إنشاء حسابات الملاك من قبل مدير النظام. تواصل معنا للحصول على بيانات الدخول." : "Owner accounts are created by the admin. Contact us for login credentials."}
                </p>
              </div>
            </>
          )}

          {/* Developer Login */}
          {portalType === "developer" && mode === "login" && (
            <>
              {LoginForm}
              <p className="mt-6 text-center text-sm font-light text-[hsl(210,15%,50%)]">
                {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <button type="button" onClick={() => setMode("register")} className="text-[hsl(200,80%,55%)] hover:text-[hsl(200,80%,70%)] transition-colors">
                  {isAr ? "إنشاء حساب" : "Create Account"}
                </button>
              </p>
            </>
          )}

          {/* Developer Register */}
          {portalType === "developer" && mode === "register" && (
            <>
              <form onSubmit={handleRegister} className="space-y-6">
                {/* Company Info */}
                <div>
                  <h3 className={sectionTitleClasses}>{isAr ? "بيانات الشركة" : "Company Information"}</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "الاسم التجاري (عربي فقط) *" : "Brand Name (Arabic only) *"}</Label>
                      <Input value={brandName} onChange={(e) => { if (ARABIC_ONLY_REGEX.test(e.target.value)) setBrandName(e.target.value); }} required className={inputClasses} dir="rtl" placeholder={isAr ? "الاسم التجاري" : "Brand name in Arabic"} />
                      {errors.brandName && <p className="text-xs text-red-400">{errors.brandName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "اسم السجل التجاري *" : "Commercial Register Name *"}</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClasses} />
                      {errors.companyName && <p className="text-xs text-red-400">{errors.companyName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "رقم السجل التجاري *" : "Commercial Register Number *"}</Label>
                      <Input value={crNumber} onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} placeholder="1010XXXXXX" />
                      {errors.crNumber && <p className="text-xs text-red-400">{errors.crNumber}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className={sectionTitleClasses}>{isAr ? "بيانات التواصل" : "Contact Information"}</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                      <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="example@email.com" />
                      {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                      <p className="text-[10px] text-[hsl(210,15%,40%)]">{isAr ? "سيتم إرسال رسالة تحقق إلى هذا البريد" : "A verification email will be sent to this address"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "رقم الجوال *" : "Phone Number *"}</Label>
                      <div className="flex gap-2">
                        <div className="flex h-11 items-center rounded-xl border border-[hsl(210,22%,16%)] bg-[hsl(210,28%,8%)] px-3 text-sm text-[hsl(210,15%,50%)] shrink-0">+966</div>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} placeholder="5XXXXXXXX" maxLength={10} />
                      </div>
                      {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                      <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} dir="ltr" className={inputClasses} placeholder="https://example.com" />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className={sectionTitleClasses}>{isAr ? "بروفايل الشركة والوثائق" : "Company Profile & Documents"}</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "إرفاق السجل التجاري (PDF) *" : "Attach Commercial Register (PDF) *"}</Label>
                      <input ref={crFileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleCrFileChange(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => crFileRef.current?.click()} className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3.5 text-sm transition-all duration-300 ${crFile ? "border-[hsl(200,80%,45%,0.4)] bg-[hsl(200,80%,45%,0.06)]" : "border-[hsl(210,22%,16%)] hover:border-[hsl(200,80%,45%,0.2)] hover:bg-[hsl(210,28%,8%)]"}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${crFile ? "bg-[hsl(200,80%,45%,0.1)]" : "bg-[hsl(210,22%,14%)]"}`}>
                          <FileText className={`h-4 w-4 ${crFile ? "text-[hsl(200,80%,55%)]" : "text-[hsl(210,15%,45%)]"}`} />
                        </div>
                        <div className="text-start">
                          <p className={`font-light ${crFile ? "text-white" : "text-[hsl(210,15%,45%)]"}`}>{crFile ? crFile.name : (isAr ? "اضغط لرفع ملف PDF" : "Click to upload PDF")}</p>
                          {crFile && <p className="text-xs text-[hsl(210,15%,40%)]">{(crFile.size / 1024).toFixed(0)} KB</p>}
                        </div>
                        <Upload className="ms-auto h-4 w-4 text-[hsl(210,15%,45%)]" />
                      </button>
                      {errors.crFile && <p className="text-xs text-red-400">{errors.crFile}</p>}
                      {verifying && (
                        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                          <span className="text-xs font-light text-amber-400">{isAr ? "جاري التحقق من السجل التجاري..." : "Verifying commercial register..."}</span>
                        </div>
                      )}
                      {verificationResult && !verifying && (
                        <div className={`flex items-center gap-2 rounded-xl border p-3 ${verificationResult.success ? "border-[hsl(200,80%,45%,0.2)] bg-[hsl(200,80%,45%,0.05)]" : "border-red-500/20 bg-red-500/5"}`}>
                          <span className={`text-xs font-light ${verificationResult.success ? "text-[hsl(200,80%,55%)]" : "text-red-400"}`}>{verificationResult.message}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClasses}>{isAr ? "إضافة صورة هوية الشركة *" : "Upload Company Identity *"}</Label>
                      <input ref={identityFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setIdentityFile(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => identityFileRef.current?.click()} className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3.5 text-sm transition-all duration-300 ${identityFile ? "border-[hsl(200,80%,45%,0.4)] bg-[hsl(200,80%,45%,0.06)]" : "border-[hsl(210,22%,16%)] hover:border-[hsl(200,80%,45%,0.2)] hover:bg-[hsl(210,28%,8%)]"}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${identityFile ? "bg-[hsl(200,80%,45%,0.1)]" : "bg-[hsl(210,22%,14%)]"}`}>
                          <Image className={`h-4 w-4 ${identityFile ? "text-[hsl(200,80%,55%)]" : "text-[hsl(210,15%,45%)]"}`} />
                        </div>
                        <div className="text-start">
                          <p className={`font-light ${identityFile ? "text-white" : "text-[hsl(210,15%,45%)]"}`}>{identityFile ? identityFile.name : (isAr ? "اضغط لرفع ملف" : "Click to upload file")}</p>
                          {identityFile && <p className="text-xs text-[hsl(210,15%,40%)]">{(identityFile.size / 1024).toFixed(0)} KB</p>}
                        </div>
                        <Upload className="ms-auto h-4 w-4 text-[hsl(210,15%,45%)]" />
                      </button>
                      {errors.identityFile && <p className="text-xs text-red-400">{errors.identityFile}</p>}
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className={sectionTitleClasses}>{isAr ? "الأمان" : "Security"}</h3>
                  <div className="space-y-1.5">
                    <Label className={labelClasses}>{isAr ? "كلمة المرور *" : "Password *"}</Label>
                    <div className="relative">
                      <Input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={8} dir="ltr" className={inputClasses} placeholder={isAr ? "حروف + أرقام (8 خانات)" : "Letters + numbers (min 8 chars)"} />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-[hsl(210,15%,45%)] hover:text-white transition-colors">
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5">
                  <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} className="border-[hsl(210,22%,20%)] data-[state=checked]:bg-[hsl(200,80%,45%)] data-[state=checked]:border-[hsl(200,80%,45%)]" />
                  <label htmlFor="terms" className="text-sm font-light leading-relaxed text-[hsl(210,15%,50%)]">
                    {isAr ? "أوافق على" : "I agree to the"}{" "}
                    <Link to="/terms" className="text-[hsl(200,80%,55%)] hover:underline">{t.auth.termsAndConditions}</Link>
                    {" "}{isAr ? "و" : "and"}{" "}
                    <Link to="/privacy" className="text-[hsl(200,80%,55%)] hover:underline">{t.auth.privacyPolicy}</Link>
                  </label>
                </div>
                {errors.terms && <p className="text-xs text-red-400 -mt-2">{errors.terms}</p>}

                <Button type="submit" className="h-12 w-full gap-2 rounded-xl syna-gradient text-base font-medium transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(200,80%,50%,0.3)] hover:scale-[1.01]" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {isAr ? "إنشاء حساب" : "Create Account"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm font-light text-[hsl(210,15%,50%)]">
                {isAr ? "لديك حساب؟" : "Have an account?"}{" "}
                <button type="button" onClick={() => setMode("login")} className="text-[hsl(200,80%,55%)] hover:text-[hsl(200,80%,70%)] transition-colors">
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
