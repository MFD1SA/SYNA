import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Globe, LogIn, UserPlus, Eye, EyeOff, Home, HardHat, Landmark, Loader2, Link2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { saudiCities } from "@/data/saudiCities";
import { Badge } from "@/components/ui/badge";

const DIGITS_ONLY_REGEX = /^[0-9]*$/;

const PROJECT_TYPES = [
  { value: "residential", ar: "سكني", en: "Residential" },
  { value: "commercial", ar: "تجاري", en: "Commercial" },
  { value: "mixed", ar: "سكني تجاري", en: "Mixed Use" },
  { value: "hospitality", ar: "ضيافة وفندقة", en: "Hospitality" },
  { value: "industrial", ar: "صناعي", en: "Industrial" },
  { value: "retail", ar: "تجزئة", en: "Retail" },
];

const isValidGoogleDriveLink = (url: string): boolean => {
  if (!url) return false;
  const patterns = [
    /^https:\/\/drive\.google\.com\//,
    /^https:\/\/docs\.google\.com\//,
  ];
  return patterns.some(p => p.test(url));
};

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

  // Registration fields
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [crDriveLink, setCrDriveLink] = useState("");
  const [profileDriveLink, setProfileDriveLink] = useState("");
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedTargetCities, setSelectedTargetCities] = useState<string[]>([]);
  const [crLinkValid, setCrLinkValid] = useState<boolean | null>(null);
  const [profileLinkValid, setProfileLinkValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showWelcomeToast = () => {
    toast({ title: portalType === "owner" ? (isAr ? "أهلاً بك 👋" : "Welcome 👋") : (isAr ? "أهلاً عزيزي المطور 👋" : "Welcome, Dear Developer 👋") });
  };

  // Validate Google Drive link
  const validateDriveLink = (url: string, setter: (v: boolean | null) => void) => {
    if (!url) { setter(null); return; }
    setter(isValidGoogleDriveLink(url));
  };

  useEffect(() => { validateDriveLink(crDriveLink, setCrLinkValid); }, [crDriveLink]);
  useEffect(() => { validateDriveLink(profileDriveLink, setProfileLinkValid); }, [profileDriveLink]);

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
      const [devRes, rolesRes] = await Promise.all([
        supabase.from("developers").select("id").eq("user_id", data.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      ]);
      const isDev = !!devRes.data;
      const roles = (rolesRes.data || []).map((r: any) => r.role);
      const isOwner = roles.includes("owner");
      if (!isDev && !isOwner) {
        await supabase.auth.signOut();
        toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "حسابك غير مرتبط بأي دور في المنصة. تواصل مع مدير النظام." : "Your account is not linked to any role. Contact the administrator." });
        setLoading(false);
        return;
      }
      showWelcomeToast();
    }
    setLoading(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = isAr ? "يرجى إدخال اسم الشركة" : "Please enter company name";
    if (!contactPerson.trim()) errs.contactPerson = isAr ? "يرجى إدخال اسم المسؤول" : "Please enter contact person name";
    if (!crNumber || !DIGITS_ONLY_REGEX.test(crNumber)) errs.crNumber = isAr ? "يرجى إدخال رقم السجل التجاري" : "Please enter CR number";
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email";
    if (!phone || !DIGITS_ONLY_REGEX.test(phone) || phone.length < 9) errs.phone = isAr ? "يرجى إدخال رقم جوال صحيح" : "Please enter a valid phone number";
    if (!city) errs.city = isAr ? "يرجى اختيار المدينة" : "Please select a city";
    if (!crDriveLink || !isValidGoogleDriveLink(crDriveLink)) errs.crDriveLink = isAr ? "يرجى إدخال رابط Google Drive صحيح للسجل التجاري" : "Please enter a valid Google Drive link for CR";
    if (!profileDriveLink || !isValidGoogleDriveLink(profileDriveLink)) errs.profileDriveLink = isAr ? "يرجى إدخال رابط Google Drive صحيح للبروفايل" : "Please enter a valid Google Drive link for profile";
    if (selectedProjectTypes.length === 0) errs.projectTypes = isAr ? "يرجى اختيار نوع المشاريع" : "Please select project types";
    if (selectedTargetCities.length === 0) errs.targetCities = isAr ? "يرجى اختيار المدن المستهدفة" : "Please select target cities";
    if (!regPassword || regPassword.length < 8 || !/[a-zA-Z]/.test(regPassword) || !/[0-9]/.test(regPassword)) errs.password = isAr ? "كلمة المرور يجب أن تحتوي على حروف وأرقام (8 خانات)" : "Password must contain letters and numbers (min 8 chars)";
    if (!acceptTerms) errs.terms = isAr ? "يجب الموافقة على الشروط والأحكام" : "You must accept the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("register-developer", {
        body: {
          email: regEmail,
          password: regPassword,
          company_name: companyName,
          contact_person_name: contactPerson,
          cr_number: crNumber,
          cr_file_url: crDriveLink,
          company_profile_url: profileDriveLink,
          phone: `+966${phone}`,
          city,
          website: website.trim() || null,
          project_types: selectedProjectTypes,
          target_cities: selectedTargetCities,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Registration failed");
      }

      try {
        await supabase.functions.invoke("send-deal-notification", {
          body: { type: "new_developer_registered", registered_name: companyName, registered_email: regEmail, registered_phone: `+966${phone}` },
        });
      } catch {}

      toast({
        title: isAr ? "تم استلام طلب التسجيل" : "Registration request received",
        description: isAr
          ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. سيتم مراجعة البيانات خلال 48 ساعة."
          : "A verification link has been sent to your email. Your data will be reviewed within 48 hours.",
      });
      setMode("login");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setLoading(false);
  };

  const toggleProjectType = (value: string) => {
    setSelectedProjectTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const toggleTargetCity = (value: string) => {
    setSelectedTargetCities(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const inputClasses = "h-11 rounded-xl border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all";
  const labelClasses = "font-medium text-sm text-foreground";
  const sectionTitleClasses = "mb-3 text-sm font-semibold text-foreground border-b border-border/50 pb-2";

  const DriveLinkInput = ({ value, onChange, valid, placeholder, error }: { value: string; onChange: (v: string) => void; valid: boolean | null; placeholder: string; error?: string }) => (
    <div className="space-y-1.5">
      <div className="relative">
        <Input value={value} onChange={e => onChange(e.target.value)} dir="ltr" className={`${inputClasses} pe-10`} placeholder={placeholder} />
        <div className="absolute end-3 top-1/2 -translate-y-1/2">
          {valid === true && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {valid === false && <XCircle className="h-4 w-4 text-destructive" />}
          {valid === null && value && <Link2 className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {valid === false && value && (
        <p className="text-[10px] text-destructive">{isAr ? "الرابط غير صالح — يجب أن يبدأ بـ https://drive.google.com/" : "Invalid link — must start with https://drive.google.com/"}</p>
      )}
      {valid === true && (
        <p className="text-[10px] text-emerald-500">{isAr ? "✓ رابط Google Drive صالح" : "✓ Valid Google Drive link"}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

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
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="h-12 w-full gap-2 rounded-xl text-base font-medium transition-all duration-300 shadow-sm" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {isAr ? "دخول" : "Sign In"}
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left decorative panel */}
      <div className="relative hidden w-[45%] overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center bg-card border-e border-border/50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 start-1/3 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 end-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, var(--primary) 0.5px, transparent 0.5px)`, backgroundSize: "40px 40px" }} />
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute h-[500px] w-[500px] rounded-full border border-primary/10" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute h-[650px] w-[650px] rounded-full border border-primary/5" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 scale-150 rounded-full bg-primary/5 blur-[40px]" />
            <img src={logo} alt="SYNA" className="relative mx-auto h-36 w-36 object-contain" />
          </div>
          <h2 className="text-4xl font-medium tracking-tight text-foreground">SYNA</h2>
          <p className="mt-3 text-sm font-light text-muted-foreground">{isAr ? "بوابة الشركاء" : "Partners Portal"}</p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 md:p-10">
        <div className="fixed top-4 inset-x-6 z-10 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Globe className="h-4 w-4" />{t.nav.language}
          </Button>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link to="/"><Home className="h-4 w-4" />{isAr ? "الرئيسية" : "Home"}</Link>
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-primary/5 blur-[30px]" />
              <img src={logo} alt="SYNA" className="relative h-20 w-20 object-contain" />
            </div>
            <span className="mt-3 text-2xl font-medium text-foreground tracking-tight">SYNA</span>
          </div>

          <Tabs value={portalType} onValueChange={(v) => { setPortalType(v as any); setMode("login"); }} className="mb-6">
            <TabsList className="w-full rounded-xl border border-border/50 bg-muted/30 p-1">
              <TabsTrigger value="developer" className="flex-1 gap-1.5 rounded-lg text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                <HardHat className="h-3.5 w-3.5" />
                {isAr ? "بوابة المطور" : "Developer Portal"}
              </TabsTrigger>
              <TabsTrigger value="owner" className="flex-1 gap-1.5 rounded-lg text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                <Landmark className="h-3.5 w-3.5" />
                {isAr ? "بوابة المالك" : "Owner Portal"}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mb-8 rounded-2xl border border-border/50 bg-muted/10 p-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              {portalType === "developer" ? <HardHat className="h-5 w-5 text-primary" /> : <Landmark className="h-5 w-5 text-primary" />}
              <p className="text-lg font-medium text-foreground">
                {portalType === "developer" ? (isAr ? "بوابة المطور العقاري" : "Developer Portal") : (isAr ? "بوابة مالك الأرض" : "Land Owner Portal")}
              </p>
            </div>
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              {portalType === "owner"
                ? (isAr ? "تابع حالة أرضك ومؤشرات الاهتمام عبر منصة سينا" : "Track your land status and interest indicators via SYNA platform")
                : mode === "login"
                  ? (isAr ? "سجل دخولك لمتابعة الصفقات وفرص الشراكة العقارية" : "Sign in to track deals and real estate partnership opportunities")
                  : (isAr ? "أنشئ حساباً كشريك تطوير معتمد واستعرض الفرص المتاحة" : "Create an account as a certified development partner and explore available opportunities")}
            </p>
          </div>

          {/* Owner Portal */}
          {portalType === "owner" && (
            <>
              {LoginForm}
              <div className="mt-6 rounded-xl border border-border bg-card p-5 text-center shadow-sm">
                <p className="text-xs font-light leading-relaxed text-muted-foreground">
                  {isAr ? "ملاحظة: يتم إنشاء حسابات الملاك تلقائياً من قبل فريق سينا عند بدء إجراءات الشراكة. إذا لم تتلقَ بيانات الدخول، تفضل بالتواصل معنا." : "Note: Owner accounts are automatically created by the SYNA team when partnership procedures start. If you haven't received login credentials, please contact us."}
                </p>
              </div>
            </>
          )}

          {/* Developer Login */}
          {portalType === "developer" && mode === "login" && (
            <>
              {LoginForm}
              <p className="mt-8 text-center text-sm font-light text-muted-foreground">
                {isAr ? "ليس لديك حساب كشريك مطور؟" : "Don't have a developer partner account?"}{" "}
                <button type="button" onClick={() => setMode("register")} className="text-primary font-medium hover:underline transition-all">
                  {isAr ? "إنشاء حساب جديد" : "Create New Account"}
                </button>
              </p>
            </>
          )}

          {/* Developer Register */}
          {portalType === "developer" && mode === "register" && (
            <>
              <form onSubmit={handleRegister} className="space-y-8">
                {/* Company Info */}
                <div className="p-1">
                  <h3 className={sectionTitleClasses}>{isAr ? "البيانات الأساسية للشركة" : "Basic Company Information"}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "اسم الشركة *" : "Company Name *"}</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClasses} />
                      {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "اسم المسؤول *" : "Contact Person *"}</Label>
                      <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className={inputClasses} />
                      {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "رقم السجل التجاري *" : "Commercial Register Number *"}</Label>
                      <Input value={crNumber} onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} placeholder="1010XXXXXX" />
                      {errors.crNumber && <p className="text-xs text-destructive">{errors.crNumber}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "المدينة الرئيسية *" : "Main City *"}</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className={inputClasses}>
                          <SelectValue placeholder={isAr ? "اختر المدينة" : "Select city"} />
                        </SelectTrigger>
                        <SelectContent>
                          {saudiCities.map(c => (
                            <SelectItem key={c.name.en} value={c.name.en}>{isAr ? c.name.ar : c.name.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                    </div>
                  </div>
                </div>

                {/* Project Types */}
                <div className="p-1">
                  <h3 className={sectionTitleClasses}>{isAr ? "مجالات التطوير العقاري *" : "Real Estate Development Types *"}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{isAr ? "حدد أنواع المشاريع التي تطورها شركتك" : "Select the project types your company develops"}</p>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_TYPES.map(pt => (
                      <button key={pt.value} type="button" onClick={() => toggleProjectType(pt.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedProjectTypes.includes(pt.value) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {isAr ? pt.ar : pt.en}
                      </button>
                    ))}
                  </div>
                  {errors.projectTypes && <p className="text-xs text-destructive mt-2">{errors.projectTypes}</p>}
                </div>

                {/* Target Cities */}
                <div className="p-1">
                  <h3 className={sectionTitleClasses}>{isAr ? "النطاق الجغرافي المستهدف *" : "Target Geographic Scope *"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {saudiCities.slice(0, 10).map(c => (
                      <button key={c.name.en} type="button" onClick={() => toggleTargetCity(c.name.en)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedTargetCities.includes(c.name.en) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {isAr ? c.name.ar : c.name.en}
                      </button>
                    ))}
                  </div>
                  {errors.targetCities && <p className="text-xs text-destructive mt-2">{errors.targetCities}</p>}
                </div>

                {/* Contact Info */}
                <div className="p-1">
                  <h3 className={sectionTitleClasses}>{isAr ? "معلومات التواصل" : "Contact Information"}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "البريد الإلكتروني للشركة *" : "Company Email *"}</Label>
                      <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="example@email.com" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      <p className="text-xs text-muted-foreground">{isAr ? "سيُستخدم هذا البريد لتسجيل الدخول واستلام التنبيهات" : "Used for login and notifications"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "رقم جوال المسؤول *" : "Contact Phone Number *"}</Label>
                      <div className="flex gap-2">
                        <div className="flex h-11 items-center rounded-xl border border-border/50 bg-muted px-4 text-sm font-medium text-foreground shrink-0">+966</div>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} placeholder="5XXXXXXXX" maxLength={10} />
                      </div>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                      <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} dir="ltr" className={inputClasses} placeholder="https://example.com" />
                    </div>
                  </div>
                </div>

                {/* Documents - Google Drive Links */}
                <div className="p-1">
                  <h3 className={sectionTitleClasses}>{isAr ? "الوثائق الرسمية والمستندات (روابط Google Drive)" : "Official Documents (Google Drive Links)"}</h3>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "رابط السجل التجاري *" : "Commercial Register Link *"}</Label>
                      <DriveLinkInput value={crDriveLink} onChange={setCrDriveLink} valid={crLinkValid} placeholder="https://drive.google.com/file/d/..." error={errors.crDriveLink} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClasses}>{isAr ? "رابط الملف التعريفي للشركة (Company Profile) *" : "Company Profile Link *"}</Label>
                      <DriveLinkInput value={profileDriveLink} onChange={setProfileDriveLink} valid={profileLinkValid} placeholder="https://drive.google.com/file/d/..." error={errors.profileDriveLink} />
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {isAr ? "يرجى التحقق من إعدادات مشاركة الرابط لتكون (أي شخص لديه الرابط - Anyone with the link)" : "Please verify link sharing settings are set to (Anyone with the link)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="p-1">
                  <h3 className={sectionTitleClasses}>{isAr ? "إعدادات الأمان" : "Security Settings"}</h3>
                  <div className="space-y-2">
                    <Label className={labelClasses}>{isAr ? "كلمة المرور *" : "Password *"}</Label>
                    <div className="relative">
                      <Input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={8} dir="ltr" className={inputClasses} placeholder={isAr ? "حروف + أرقام (8 خانات على الأقل)" : "Letters + numbers (min 8 chars)"} />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-1">
                  <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} className="mt-1" />
                  <label htmlFor="terms" className="text-sm font-light leading-relaxed text-muted-foreground">
                    {isAr ? "بإنشاء الحساب، أقر بأنني مفوض بتمثيل هذه الشركة، وأوافق على" : "By creating an account, I acknowledge that I am authorized to represent this company, and I agree to the"}{" "}
                    <Link to="/terms" className="text-primary font-medium hover:underline">{t.auth.termsAndConditions}</Link>
                    {" "}{isAr ? "و" : "and"}{" "}
                    <Link to="/privacy" className="text-primary font-medium hover:underline">{t.auth.privacyPolicy}</Link>
                    {isAr ? " الخاصة بمنصة سينا." : " of SYNA platform."}
                  </label>
                </div>
                {errors.terms && <p className="text-xs text-destructive -mt-2 px-1">{errors.terms}</p>}

                <Button type="submit" className="h-12 w-full gap-2 rounded-xl text-base font-medium shadow-sm" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {isAr ? "إرسال طلب التسجيل" : "Submit Registration Request"}
                </Button>
              </form>
              <p className="mt-8 text-center text-sm font-light text-muted-foreground">
                {isAr ? "لديك حساب كشريك معتمد؟" : "Have a certified partner account?"}{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary font-medium hover:underline transition-all">
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
