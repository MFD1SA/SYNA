import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Eye, EyeOff, Loader2, Link2, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Building2, UserCircle, Globe, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saudiCities } from "@/data/saudiCities";
import { Checkbox } from "@/components/ui/checkbox";
import kafdElite from "@/assets/riyadh-kafd-elite.png";
import saudiAbstract from "@/assets/saudi-abstract.png";

// SYNA High-End Institutional Color Palette
const COLORS = {
  primary: "#0E3A5D",
  secondary: "#0B2F4A",
  accent: "#2C78B7",
  softBlue: "#6FA4C9",
  bgLight: "#F8FAFC",
  bgSecondary: "#F1F5F9",
  textPrimary: "#0B2F4A",
  textSecondary: "#64748B",
  border: "#E2E8F0"
};

const IMAGES = {
    developer: kafdElite,
    owner: saudiAbstract
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
  usePageTitle(isAr ? "بوابة النفاذ للشركاء والملاك" : "Partners & Owners Portal");
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
  const [crDriveLink, setCrDriveLink] = useState("");
  const [profileDriveLink, setProfileDriveLink] = useState("");
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedTargetCities, setSelectedTargetCities] = useState<string[]>([]);
  const [crLinkValid, setCrLinkValid] = useState<boolean | null>(null);
  const [profileLinkValid, setProfileLinkValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showWelcomeToast = () => {
    toast({ title: portalType === "owner" ? (isAr ? "تم إثبات النفاذ" : "Access Confirmed") : (isAr ? "تم الاتصال بنظام الشركاء" : "Partners System Connected") });
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
      toast({ variant: "destructive", title: isAr ? "فشل التحقق" : "Verification Failed", description: error.message });
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
        toast({ variant: "destructive", title: isAr ? "دخول غير مصرح" : "Unauthorized Entry", description: isAr ? "عذراً، هذا الحساب غير مفعل للنفاذ المؤسسي." : "Sorry, this account is not activated for institutional access." });
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
          project_types: selectedProjectTypes,
          target_cities: selectedTargetCities,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Registration failed");
      }

      toast({
        title: isAr ? "تم استلام الطلب المؤسسي" : "Institutional Request Received",
        description: isAr
          ? "يتم مراجعة الطلب من قبل قسم الالتزام والموافقة عليه." 
          : "The request is being reviewed and approved by the compliance department.",
      });
      setMode("login");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الاعتماد" : "Accreditation Error", description: err.message });
    }
    setLoading(false);
  };

  const toggleProjectType = (value: string) => {
    setSelectedProjectTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const inputClasses = "h-16 w-full px-6 transition-all border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-accent/20 text-sm font-medium bg-slate-50";
  const labelClasses = "text-[11px] font-bold uppercase tracking-[0.25em] ps-1 mb-3 block text-slate-400";
  const sectionTitleClasses = "mb-12 text-[12px] font-bold uppercase tracking-[0.4em] ps-5 border-s-4 border-accent text-primary";

  const DriveLinkInput = ({ value, onChange, valid, placeholder, error }: { value: string; onChange: (v: string) => void; valid: boolean | null; placeholder: string; error?: string }) => (
    <div className="space-y-3">
      <div className="relative">
        <input 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            dir="ltr" 
            className={inputClasses} 
            placeholder={placeholder}
            style={{ borderRadius: '4px' }}
        />
        <div className="absolute end-5 top-1/2 -translate-y-1/2">
          {valid === true && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          {valid === false && <XCircle className="h-5 w-5 text-destructive" />}
          {valid === null && value && <Link2 className="h-5 w-5 opacity-20" />}
        </div>
      </div>
      {error && <p className="text-[10px] uppercase font-bold tracking-widest text-destructive ps-1">{error}</p>}
    </div>
  );

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-8">
        <div className="space-y-2">
          <label className={labelClasses}>{t.auth.email}</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            dir="ltr" 
            className={inputClasses} 
            style={{ borderRadius: '4px' }}
            placeholder="executive@syna.sa" 
          />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>{t.auth.password}</label>
          <div className="relative">
            <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                dir="ltr" 
                className={inputClasses} 
                style={{ borderRadius: '4px' }}
            />
            <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute end-5 top-1/2 -translate-y-1/2 transition-colors text-slate-400 hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="group relative h-20 w-full flex items-center justify-center gap-5 transition-all duration-500 font-bold text-[13px] uppercase tracking-[0.4em] overflow-hidden bg-primary text-white shadow-xl shadow-primary/10 hover:shadow-primary/30"
        style={{ borderRadius: '4px' }}
      >
        <div className="absolute inset-0 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20" />
        {loading ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : (
          <>
            {isAr ? "إثبات النفاذ" : "Authenticate Entrance"}
            <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
          </>
        )}
      </button>

      <div className="pt-8 text-center" />
    </form>
  );

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F1F4F7]">
      {/* Left Visual Content Panel */}
      <div className="relative hidden w-[42%] flex-col justify-between lg:flex overflow-hidden">
        {/* Extreme High-Quality Saudi Visual */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-secondary/95 via-secondary/70 to-transparent" />
            <img 
                key={portalType}
                src={portalType === 'developer' ? IMAGES.developer : IMAGES.owner} 
                className="h-full w-full object-cover animate-in fade-in duration-2000 zoom-in-110" 
                alt="Institutional Excellence" 
            />
        </div>

        <div className="relative z-20 p-20 pt-24">
            <div className="flex items-center gap-6 mb-32 animate-in slide-in-from-top-6 duration-1000">
                <div className="h-10 w-[4px] bg-accent" />
                <div className="flex flex-col">
                    <span className="text-[16px] font-bold uppercase tracking-[0.5em] text-white">SYNA</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{isAr ? "النظام العقاري الموحد" : "ULTIMATE ASSET ENGINE"}</span>
                </div>
            </div>

            <div className="max-w-xl space-y-12 animate-in slide-in-from-left-8 duration-1200 delay-300">
                <div className="space-y-6">
                    <span className="inline-block px-4 py-1.5 border border-accent/30 bg-accent/10 backdrop-blur-md text-[9px] font-bold uppercase tracking-[0.6em] text-accent">
                        {isAr ? "بوابة الأمان المؤسسي" : "SECURE INSTITUTIONAL ARCHWAY"}
                    </span>
                    <h1 className="text-6xl font-medium tracking-tight text-white uppercase leading-[1.05]">
                        {portalType === 'developer' 
                            ? (isAr ? "سيادة التطوير" : "Development Sovereignty") 
                            : (isAr ? "إدارة الأصول" : "Asset Authority")}
                    </h1>
                </div>

                <div className="h-[1px] w-40 bg-white/20" />

                <div className="space-y-8">
                    <p className="text-[13px] font-light leading-relaxed text-white/60 uppercase tracking-[0.2em]">
                        {portalType === 'owner'
                          ? (isAr ? "مركز تحكم الملاك للاطلاع على أداء المحفظة الاستثمارية والتقارير التنفيذية للأصول." : "Owners' command center for portfolio performance monitoring and executive asset reporting.")
                          : (isAr ? "منصة المطورين المعتمدين لمتابعة الصفقات المتأهلة وفرص الاستثمار والنمو المشترك." : "Certified developers' platform for qualified deals, investment opportunities, and joint growth.")}
                    </p>
                    
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col gap-1">
                            <span className="text-[16px] font-bold text-white tracking-widest">2024</span>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{isAr ? "النظام" : "VERSION"}</span>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[16px] font-bold text-white tracking-widest">SR 1B+</span>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{isAr ? "قيمة الأصول" : "ASSET VALUE"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="relative z-20 p-20 animate-in fade-in duration-1000 delay-700">
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.5em] text-white/30">
                <div className="h-[1px] w-20 bg-white/10" />
                <span>{isAr ? "سينا لحلول الاستثمار العقاري - المملكة العربية السعودية" : "SYNA REAL ESTATE SOLUTIONS - KSA"}</span>
            </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="relative flex flex-1 flex-col overflow-y-auto px-8 py-12 md:px-24 lg:py-20 lg:justify-center">
        {/* Top Navigation */}
        <div className="absolute top-12 left-8 right-8 flex items-center justify-between md:left-24 md:right-24">
            <Link to="/" className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 transition-colors hover:text-primary">
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {isAr ? "رجوع بالفهرس" : "INDEX"}
            </Link>
            <div className="flex items-center gap-10">
                <button onClick={toggleLang} className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 transition-colors hover:text-primary">
                    {isAr ? "ENGLISH" : "العربية"}
                </button>
                <div className="h-4 w-[1px] bg-slate-200" />
                <Globe className="h-4 w-4 text-slate-200" />
            </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
            {/* ELITE ROLE SELECTION (Side-by-Side Professional Choice) */}
            <div className="mb-20 grid grid-cols-2 gap-6 p-1.5 bg-white shadow-sm border border-slate-100" style={{ borderRadius: '6px' }}>
                <button 
                    onClick={() => { setPortalType("developer"); setMode("login"); }}
                    className={`relative flex items-center justify-center gap-4 p-5 transition-all duration-500 overflow-hidden ${portalType === 'developer' ? 'text-white' : 'text-slate-400 hover:text-primary'}`}
                >
                    {portalType === 'developer' && <div className="absolute inset-0 bg-primary animate-in fade-in zoom-in-95 duration-500" style={{ borderRadius: '4px' }} />}
                    <Building2 className={`relative z-10 h-4 w-4 ${portalType === 'developer' ? 'opacity-100' : 'opacity-40'}`} />
                    <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.3em]">{isAr ? "بوابة المطور" : "DEVELOPER"}</span>
                </button>
                <button 
                    onClick={() => { setPortalType("owner"); setMode("login"); }}
                    className={`relative flex items-center justify-center gap-4 p-5 transition-all duration-500 overflow-hidden ${portalType === 'owner' ? 'text-white' : 'text-slate-400 hover:text-primary'}`}
                >
                    {portalType === 'owner' && <div className="absolute inset-0 bg-primary animate-in fade-in zoom-in-95 duration-500" style={{ borderRadius: '4px' }} />}
                    <UserCircle className={`relative z-10 h-4 w-4 ${portalType === 'owner' ? 'opacity-100' : 'opacity-40'}`} />
                    <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.3em]">{isAr ? "بوابة المالك" : "OWNER"}</span>
                </button>
            </div>

            {/* THE FORM CARD (High Precision & Depth) */}
            <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Visual context switch */}
                <div className="mb-14 ps-2">
                    <h2 className="text-4xl font-bold tracking-tight text-primary uppercase mb-5 leading-tight">
                        {portalType === "developer" ? (isAr ? "نظام الشركاء المعتمدين" : "CERTIFIED PARTNERS PORTAL") : (isAr ? "بوابة ملاك الأصول" : "ASSET OWNERS PORTAL")}
                    </h2>
                    <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">
                        {portalType === "owner"
                        ? (isAr ? "التحقق من بيانات النفاذ للوصول للمحفظة العقارية." : "Validate executive credentials to access the property portfolio.")
                        : mode === "login"
                            ? (isAr ? "تسجيل النفاذ للأدوات المؤسسية وفرص التطوير." : "Sign in to access institutional tools and development flow.")
                            : (isAr ? "تقديم وثائق الاعتماد للانضمام لشبكة مطوري سينا." : "Submit accreditation documents to join SYNA developer network.")}
                    </p>
                </div>

                <div className="bg-white border border-slate-100 shadow-[0_50px_100px_-30px_rgba(14,58,93,0.18)] p-12 md:p-16" style={{ borderRadius: '8px' }}>
                    {portalType === "owner" && (
                        <div className="space-y-12">
                            {LoginForm}
                            <div className="pt-10 border-t border-slate-50 flex items-start gap-4">
                                <div className="h-10 w-[2px] bg-slate-100" />
                                <p className="text-[10px] font-bold leading-loose text-slate-300 uppercase tracking-[0.2em] max-w-xs">
                                    {isAr ? "تفعيل الحسابات يتم حصرياً عبر قنوات الربط المركزية." : "Account activation is handled exclusively via central linkage channels."}
                                </p>
                            </div>
                        </div>
                    )}

                    {portalType === "developer" && mode === "login" && (
                        <div className="space-y-12">
                            {LoginForm}
                            <div className="pt-12 border-t border-slate-50 flex flex-col items-center gap-8">
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
                                    {isAr ? "طلب اعتماد مطور جديد" : "NEW DEVELOPER ACCREDITATION"}
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => setMode("register")} 
                                    className="group flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.3em] text-accent transition-all hover:gap-6"
                                >
                                    {isAr ? "بدء عملية التسجيل المؤسسي" : "Begin Institutional Registration"}
                                    {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {portalType === "developer" && mode === "register" && (
                        <div className="space-y-16 animate-in fade-in slide-in-from-right-4 duration-500">
                            <form onSubmit={handleRegister} className="space-y-16">
                                <div className="space-y-12">
                                    <h3 className={sectionTitleClasses}>{isAr ? "بيانات الكيان الاستثماري" : "Investment Entity DATA"}</h3>
                                    <div className="grid gap-10 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "الاسم التجاري *" : "Commercial Name *"}</label>
                                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} required className={inputClasses} style={{ borderRadius: '4px' }} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "رقم السجل التجاري *" : "CR Number *"}</label>
                                            <input value={crNumber} onChange={e => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} style={{ borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div className="grid gap-10 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "المقر الرئيسي *" : "Corporate HQ *"}</label>
                                            <Select value={city} onValueChange={setCity}>
                                                <SelectTrigger className="h-16 bg-slate-50 border-none ring-1 ring-slate-100 text-sm font-medium px-6 rounded-[4px] focus:ring-2 focus:ring-accent/20">
                                                    <SelectValue placeholder={isAr ? "اختر المدينة" : "Select HQ"} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-[4px] border-slate-100 bg-white">
                                                    {saudiCities.map(c => (
                                                        <SelectItem key={c.name.en} value={c.name.en} className="focus:bg-slate-50">{isAr ? c.name.ar : c.name.en}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "نطاق التطوير *" : "Development Scope *"}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PROJECT_TYPES.slice(0, 4).map(pt => (
                                                    <button key={pt.value} type="button" onClick={() => toggleProjectType(pt.value)} 
                                                            className={`h-16 border text-[9px] font-bold uppercase tracking-widest transition-all ${selectedProjectTypes.includes(pt.value) ? 'bg-primary border-primary text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                                                            style={{ borderRadius: '4px' }}>
                                                        {isAr ? pt.ar : pt.en}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <h3 className={sectionTitleClasses}>{isAr ? "الاعتمادات التنفيذية" : "EXECUTIVE CREDENTIALS"}</h3>
                                    <div className="grid gap-10 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "رابط السجل (OneDrive/Drive) *" : "CR Link *"}</label>
                                            <DriveLinkInput value={crDriveLink} onChange={setCrDriveLink} valid={crLinkValid} placeholder="https://..." error={errors.crDriveLink} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "ملف الكيان التنفيذي *" : "Entity Profile *"}</label>
                                            <DriveLinkInput value={profileDriveLink} onChange={setProfileDriveLink} valid={profileLinkValid} placeholder="https://..." error={errors.profileDriveLink} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <h3 className={sectionTitleClasses}>{isAr ? "قنوات التواصل المؤسسي" : "INSTITUTIONAL CHANNELS"}</h3>
                                    <div className="grid gap-10 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "البريد الإلكتروني *" : "Official Email *"}</label>
                                            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} style={{ borderRadius: '4px' }} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className={labelClasses}>{isAr ? "رقم جوال المسؤول *" : "Official Mobile *"}</label>
                                            <div className="flex gap-3">
                                                <div className="flex h-16 w-20 items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-400" style={{ borderRadius: '4px' }}>+966</div>
                                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} style={{ borderRadius: '4px' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 space-y-12">
                                    <div className="flex items-start gap-5 p-8 bg-slate-50 border border-slate-100" style={{ borderRadius: '4px' }}>
                                        <Checkbox id="terms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(c === true)} className="mt-1.5 h-5 w-5 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                        <label htmlFor="terms" className="text-[11px] font-medium leading-loose text-slate-500 uppercase tracking-widest">
                                            {isAr ? "بطلب التسجيل أوافق على شروط سياسة الالتزام و" : "BY REQUESTING, I AGREE TO COMPLIANCE TERMS AND"}{" "}
                                            <Link to="/terms" className="text-accent underline font-bold">{t.auth.termsAndConditions}</Link>
                                        </label>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="group relative h-22 w-full flex items-center justify-center gap-5 transition-all duration-500 font-bold text-[13px] uppercase tracking-[0.4em] overflow-hidden bg-primary text-white shadow-2xl shadow-primary/20"
                                        style={{ borderRadius: '4px' }}
                                    >
                                        <div className="absolute inset-0 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20" />
                                        {loading ? (
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        ) : (
                                            <>
                                                {isAr ? "إرسال طلب الاعتماد" : "Submit For Accreditation"}
                                                <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
                                            </>
                                        )}
                                    </button>
                                    
                                    <div className="text-center pt-6">
                                        <button type="button" onClick={() => setMode("login")} className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300 hover:text-primary transition-colors">
                                            {isAr ? "العودة لتسجيل النفاذ" : "BACK TO PORTAL ACCESS"}
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
    </div>
  );
};

export default LoginPage;
