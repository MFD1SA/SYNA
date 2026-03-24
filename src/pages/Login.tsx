import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Eye, EyeOff, Loader2, Link2, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Building2, UserCircle, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saudiCities } from "@/data/saudiCities";
import { Checkbox } from "@/components/ui/checkbox";
import kafdImage from "@/assets/riyadh-kafd.png";
import residentialImage from "@/assets/riyadh-residential.png";

// SYNA High-End Color Palette
const COLORS = {
  primary: "#0E3A5D",
  secondary: "#0B2F4A",
  accent: "#2C78B7",
  softBlue: "#6FA4C9",
  bgLight: "#F1F4F7",
  bgSecondary: "#E4EAF0",
  textPrimary: "#0B2F4A",
  textSecondary: "#4B5563",
};

const IMAGES = {
    developer: kafdImage,
    owner: residentialImage
};

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
  usePageTitle(isAr ? "بوابة النفاذ للشركاء" : "Partners Access Portal");
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
    toast({ title: portalType === "owner" ? (isAr ? "تم النفاذ بنجاح 👋" : "Access Granted 👋") : (isAr ? "أهلاً بك في فضاء الشركاء 👋" : "Welcome to the Partners Portal 👋") });
  };

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
      toast({ variant: "destructive", title: isAr ? "خطأ في التحقق" : "Verification Error", description: error.message });
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
        toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized", description: isAr ? "حسابك غير مرتبط بأي نفاذ معتمد. تواصل مع الإدارة." : "Account not linked to any certified access. Contact management." });
        setLoading(false);
        return;
      }
      showWelcomeToast();
    }
    setLoading(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = isAr ? "مطلوب" : "Required";
    if (!contactPerson.trim()) errs.contactPerson = isAr ? "مطلوب" : "Required";
    if (!crNumber || !DIGITS_ONLY_REGEX.test(crNumber)) errs.crNumber = isAr ? "رقم سجل غير صحيح" : "Invalid CR";
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = isAr ? "بريد غير صحيح" : "Invalid email";
    if (!phone || !DIGITS_ONLY_REGEX.test(phone) || phone.length < 9) errs.phone = isAr ? "رقم غير صحيح" : "Invalid phone";
    if (!city) errs.city = isAr ? "مطلوب" : "Required";
    if (!crDriveLink || !isValidGoogleDriveLink(crDriveLink)) errs.crDriveLink = isAr ? "رابط غير صحيح" : "Invalid link";
    if (!profileDriveLink || !isValidGoogleDriveLink(profileDriveLink)) errs.profileDriveLink = isAr ? "رابط غير صحيح" : "Invalid link";
    if (selectedProjectTypes.length === 0) errs.projectTypes = isAr ? "مطلوب" : "Required";
    if (selectedTargetCities.length === 0) errs.targetCities = isAr ? "مطلوب" : "Required";
    if (!regPassword || regPassword.length < 8) errs.password = isAr ? "8 خانات على الأقل" : "Min 8 chars";
    if (!acceptTerms) errs.terms = isAr ? "الموافقة مطلوبة" : "Required";
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

      toast({
        title: isAr ? "تم استلام طلب الانضمام" : "Access Request Received",
        description: isAr
          ? "سيتم مراجعة البيانات من قبل الإدارة والموافقة عليها خلال ٤٨ ساعة."
          : "Your data will be reviewed and approved by management within 48 hours.",
      });
      setMode("login");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في التسجيل" : "Registration Error", description: err.message });
    }
    setLoading(false);
  };

  const toggleProjectType = (value: string) => {
    setSelectedProjectTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const inputClasses = "h-14 w-full px-5 transition-all border outline-none focus:ring-0 text-sm font-medium";
  const labelClasses = "text-[10px] font-bold uppercase tracking-[0.2em] ps-1 mb-2 block";
  const sectionTitleClasses = "mb-10 text-[11px] font-bold uppercase tracking-[0.3em] ps-4 border-s-2";

  const DriveLinkInput = ({ value, onChange, valid, placeholder, error }: { value: string; onChange: (v: string) => void; valid: boolean | null; placeholder: string; error?: string }) => (
    <div className="space-y-2">
      <div className="relative">
        <input 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            dir="ltr" 
            className={inputClasses} 
            placeholder={placeholder}
            style={{ 
                backgroundColor: COLORS.bgLight, 
                borderColor: COLORS.bgSecondary,
                color: COLORS.textPrimary,
                borderRadius: '2px'
            }}
        />
        <div className="absolute end-4 top-1/2 -translate-y-1/2">
          {valid === true && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          {valid === false && <XCircle className="h-4 w-4 text-destructive" />}
          {valid === null && value && <Link2 className="h-4 w-4 opacity-20" />}
        </div>
      </div>
      {error && <p className="text-[10px] uppercase font-bold tracking-wider text-destructive ps-1">{error}</p>}
    </div>
  );

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{t.auth.email}</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            dir="ltr" 
            className={inputClasses} 
            style={{ 
                backgroundColor: COLORS.bgLight, 
                borderColor: COLORS.bgSecondary,
                color: COLORS.textPrimary,
                borderRadius: '2px'
            }}
            placeholder="executive@syna.sa" 
          />
        </div>
        <div className="space-y-2">
          <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{t.auth.password}</label>
          <div className="relative">
            <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                dir="ltr" 
                className={inputClasses} 
                style={{ 
                    backgroundColor: COLORS.bgLight, 
                    borderColor: COLORS.bgSecondary,
                    color: COLORS.textPrimary,
                    borderRadius: '2px'
                }}
            />
            <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute end-4 top-1/2 -translate-y-1/2 transition-colors opacity-30 hover:opacity-100"
                style={{ color: COLORS.textPrimary }}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="group relative h-16 w-full flex items-center justify-center gap-4 transition-all duration-300 font-bold text-[11px] uppercase tracking-[0.3em] overflow-hidden"
        style={{ 
            backgroundColor: COLORS.primary, 
            color: "#FFFFFF",
            borderRadius: '2px'
        }}
      >
        <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : (
          <>
            {isAr ? "دخول المستشار" : "Enter Portal"}
            <LogIn className="h-4 w-4 transition-transform group-hover:scale-110" />
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Left Visual Panel - Dynamic Based on Role */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden lg:flex">
        {/* Role Image Transitions */}
        <div className="absolute inset-0 z-0">
            <div className={`absolute inset-0 z-10`} style={{ backgroundColor: `${portalType === 'owner' ? COLORS.secondary + 'CC' : COLORS.primary + 'CC'}` }} />
            <img 
                key={portalType}
                src={portalType === 'developer' ? IMAGES.developer : IMAGES.owner} 
                className="h-full w-full object-cover animate-in fade-in duration-1000 zoom-in-110" 
                alt="Saudi Architectural Excellence" 
            />
        </div>

        <div className="relative z-20 p-16">
            <div className="flex items-center gap-4 mb-20 animate-in slide-in-from-top-4 duration-700">
                <div className="h-10 w-[3px]" style={{ backgroundColor: COLORS.accent }} />
                <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-white">
                    SYNA <span className="opacity-40">{isAr ? "سينا" : "PLATFORM"}</span>
                </span>
            </div>

            <div className="max-w-md animate-in slide-in-from-left-4 duration-1000 delay-200">
                <span className="block text-[10px] font-bold uppercase tracking-[0.5em] text-accent mb-6">
                    {portalType === 'developer' ? (isAr ? "بيئة التطوير المؤسسي" : "Institutional Development") : (isAr ? "إدارة الأصول النوعية" : "Asset Management Node")}
                </span>
                <h1 className="text-5xl font-medium tracking-tight text-white uppercase leading-[1.05] mb-8">
                    {portalType === 'developer' ? (isAr ? "سيادة العقار والفرص" : "Real Estate Sovereignty") : (isAr ? "تحقق التميز في الأصـول" : "Verified Asset Excellence")}
                </h1>
                <p className="text-sm font-light leading-loose text-white/50 uppercase tracking-widest">
                    {portalType === 'owner'
                      ? (isAr ? "النظام الرباعي لمتابعة مؤشرات أداء الأصول وتدفق العوائد الاستثمارية." : "Quadratic system for tracking asset performance indicators and investment yield flows.")
                      : (isAr ? "بوابة الشركاء المعتمدين لمتابعة الصفقات المتأهلة وفرص التطوير المشترك." : "Certified partners portal for qualified deals and co-development opportunities.")}
                </p>
            </div>
        </div>

        <div className="relative z-20 p-16 animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">
                <div className="h-[1px] w-12 bg-white/20" />
                <span>{isAr ? "نظام سينا للاستثمار العقاري ٢٠٢٤" : "SYNA INVESTMENTS 2024"}</span>
            </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-white px-6 py-12 md:px-20 lg:py-20">
        <div className="mx-auto flex w-full max-w-lg flex-col">
            <div className="mb-20 flex items-center justify-between">
                <Link to="/" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 transition-colors hover:text-secondary">
                    {isAr ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    {isAr ? "الرئيسية" : "Index"}
                </Link>
                <div className="flex items-center gap-6">
                    <button onClick={toggleLang} className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 transition-colors hover:text-secondary">
                        {isAr ? "English" : "العربية"}
                    </button>
                    <Globe className="h-3 w-3 opacity-20" />
                </div>
            </div>

            <div className="mb-14">
                <Tabs value={portalType} onValueChange={(v) => { setPortalType(v as any); setMode("login"); }} className="mb-14">
                    <TabsList className="h-16 w-full rounded-none bg-slate-50 p-1 border border-slate-100">
                        <TabsTrigger 
                            value="developer" 
                            className="flex-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all duration-500"
                        >
                            <Building2 className="h-3 w-3" />
                            {isAr ? "بوابة المطور" : "Developer"}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="owner" 
                            className="flex-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all duration-500"
                        >
                            <UserCircle className="h-3 w-3" />
                            {isAr ? "بوابة المالك" : "Owner"}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="animate-in fade-in duration-700">
                  <h2 
                    className="text-3xl font-bold tracking-tight uppercase mb-4"
                    style={{ color: COLORS.primary }}
                  >
                    {portalType === "developer" ? (isAr ? "بوابة الشركاء" : "PARTNERS PORTAL") : (isAr ? "منطقة الملاك" : "OWNER ENCLAVE")}
                  </h2>
                  <p className="text-sm font-medium leading-relaxed opacity-60 max-w-sm" style={{ color: COLORS.textSecondary }}>
                    {portalType === "owner"
                      ? (isAr ? "تحقق من نفاذ الأصول والاطلاع على التقارير الربعية." : "Verify asset access and review quarterly executive reports.")
                      : mode === "login"
                        ? (isAr ? "النفاذ للنظم المؤسسية ومتابعة الفرص المتاحة." : "Access institutional systems and track active development opportunities.")
                        : (isAr ? "تسجيل اهتمامات التطوير المؤسسي للحصول على الاعتماد." : "Register institutional development interests for accreditation.")}
                  </p>
                </div>
            </div>

            <div className="flex-1">
                {portalType === "owner" && (
                    <div className="space-y-12">
                        {LoginForm}
                        <div className="pt-10 border-t border-slate-100">
                            <p className="text-[10px] font-bold leading-loose text-slate-300 uppercase tracking-[0.2em] max-w-sm">
                                {isAr ? "ملاحظة: يتم تفعيل حسابات الملاك عبر البريد الإداري المركزي المعتمد." : "System Note: Owner accounts are credentialed via verified central administrative email only."}
                            </p>
                        </div>
                    </div>
                )}

                {portalType === "developer" && mode === "login" && (
                    <div className="space-y-12">
                        {LoginForm}
                        <div className="pt-10 border-t border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-6">
                                {isAr ? "هل أنت مطور معتمد في سينا؟" : "Are you a SYNA certified developer?"}
                            </p>
                            <button 
                                type="button" 
                                onClick={() => setMode("register")} 
                                className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
                                style={{ color: COLORS.accent }}
                            >
                                {isAr ? "تقديم طلب الاعتماد الرقمي" : "Request Digital Accreditation"}
                                {isAr ? <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> : <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />}
                            </button>
                        </div>
                    </div>
                )}

                {portalType === "developer" && mode === "register" && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                        <form onSubmit={handleRegister} className="space-y-12">
                            <div className="space-y-10">
                                <h3 className={sectionTitleClasses} style={{ borderColor: COLORS.accent, color: COLORS.primary }}>
                                    {isAr ? "بيانات الكيان المؤسسي" : "Institutional Entity Data"}
                                </h3>
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "اسم الكيان الاستثماري *" : "Investment Entity Name *"}</label>
                                        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClasses} style={{ backgroundColor: COLORS.bgLight, borderColor: COLORS.bgSecondary, color: COLORS.textPrimary, borderRadius: '2px' }} />
                                    </div>
                                    <div className="grid gap-8 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "رقم السجل التجاري *" : "Commercial Register *"}</label>
                                            <input value={crNumber} onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} style={{ backgroundColor: COLORS.bgLight, borderColor: COLORS.bgSecondary, color: COLORS.textPrimary, borderRadius: '2px' }} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "المقر الرئيسي *" : "Corporate HQ *"}</label>
                                            <Select value={city} onValueChange={setCity}>
                                                <SelectTrigger className="h-14 bg-slate-50 border-none px-5 rounded-none text-sm font-medium">
                                                    <SelectValue placeholder={isAr ? "اختر المدينة" : "Select HQ City"} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none border-slate-100 bg-white">
                                                    {saudiCities.map(c => (
                                                        <SelectItem key={c.name.en} value={c.name.en} className="rounded-none">{isAr ? c.name.ar : c.name.en}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <h3 className={sectionTitleClasses} style={{ borderColor: COLORS.accent, color: COLORS.primary }}>
                                    {isAr ? "الاعتمادات الرقمية" : "Digital Credentials"}
                                </h3>
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "رابط السجل (OneDrive/G-Drive) *" : "CR Link *"}</label>
                                        <DriveLinkInput value={crDriveLink} onChange={setCrDriveLink} valid={crLinkValid} placeholder="https://..." error={errors.crDriveLink} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "ملف الكيان الاستثماري *" : "Investment Profile *"}</label>
                                        <DriveLinkInput value={profileDriveLink} onChange={setProfileDriveLink} valid={profileLinkValid} placeholder="https://..." error={errors.profileDriveLink} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <h3 className={sectionTitleClasses} style={{ borderColor: COLORS.accent, color: COLORS.primary }}>
                                    {isAr ? "قنوات التواصل الإداري" : "Management Channels"}
                                </h3>
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "البريد الإداري *" : "Management Email *"}</label>
                                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} style={{ backgroundColor: COLORS.bgLight, borderColor: COLORS.bgSecondary, color: COLORS.textPrimary, borderRadius: '2px' }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClasses} style={{ color: COLORS.textSecondary }}>{isAr ? "رقم جوال المدير المسؤول *" : "Manager Mobile *"}</label>
                                        <div className="flex gap-2">
                                            <div className="flex h-14 items-center bg-slate-50 px-4 text-[10px] font-bold text-slate-400">+966</div>
                                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} style={{ backgroundColor: COLORS.bgLight, borderColor: COLORS.bgSecondary, color: COLORS.textPrimary, borderRadius: '2px' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 space-y-10">
                                <div className="flex items-start gap-4 p-6 bg-slate-50" style={{ borderRadius: '2px' }}>
                                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} className="mt-1 border-slate-300 rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    <label htmlFor="terms" className="text-[10px] font-bold leading-loose text-slate-500 uppercase tracking-widest">
                                        {isAr ? "بإتمام التسجيل، يتم التحقق من صحة البيانات المؤسسية والموافقة على" : "By completing registration, institutional data is verified and subject to"}{" "}
                                        <Link to="/terms" className="underline" style={{ color: COLORS.accent }}>{t.auth.termsAndConditions}</Link>
                                    </label>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="group relative h-16 w-full flex items-center justify-center gap-4 transition-all duration-300 font-bold text-[11px] uppercase tracking-[0.3em] overflow-hidden"
                                    style={{ 
                                        backgroundColor: COLORS.primary, 
                                        color: "#FFFFFF",
                                        borderRadius: '2px'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                                    {loading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                    ) : (
                                        <>
                                            {isAr ? "إرسال طلب الاعتماد الرقمي" : "Submit Accreditation Request"}
                                            <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                                        </>
                                    )}
                                </button>
                                
                                <div className="text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setMode("login")} 
                                        className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300 hover:text-secondary transition-colors"
                                    >
                                        {isAr ? "العودة لتسجيل النفاذ" : "Back to Port Access"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
