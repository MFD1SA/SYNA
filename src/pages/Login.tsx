import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Globe, LogIn, UserPlus, Eye, EyeOff, Home, Loader2, Link2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { saudiCities } from "@/data/saudiCities";
import { Checkbox } from "@/components/ui/checkbox";

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

  const toggleTargetCity = (value: string) => {
    setSelectedTargetCities(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const inputClasses = "h-14 w-full bg-transparent border-b border-white/10 text-white focus:border-accent focus:outline-none transition-all placeholder:text-white/10 text-sm";
  const labelClasses = "text-[10px] font-bold uppercase tracking-[0.2em] text-white/30";
  const sectionTitleClasses = "mb-10 text-xs font-bold uppercase tracking-[0.3em] text-white border-s-2 border-accent ps-4";

  const DriveLinkInput = ({ value, onChange, valid, placeholder, error }: { value: string; onChange: (v: string) => void; valid: boolean | null; placeholder: string; error?: string }) => (
    <div className="space-y-2">
      <div className="relative">
        <input value={value} onChange={e => onChange(e.target.value)} dir="ltr" className={inputClasses} placeholder={placeholder} />
        <div className="absolute end-0 top-1/2 -translate-y-1/2">
          {valid === true && <CheckCircle2 className="h-4 w-4 text-accent" />}
          {valid === false && <XCircle className="h-4 w-4 text-destructive" />}
          {valid === null && value && <Link2 className="h-4 w-4 text-white/10" />}
        </div>
      </div>
      {error && <p className="text-[10px] uppercase tracking-wider text-destructive">{error}</p>}
    </div>
  );

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-12">
      <div className="space-y-8">
        <div className="space-y-3">
          <label className={labelClasses}>{t.auth.email}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="executive@syna.sa" />
        </div>
        <div className="space-y-3">
          <label className={labelClasses}>{t.auth.password}</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className={inputClasses} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-0 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      <button type="submit" className="luxury-button w-full h-16 border-white/10 text-white hover:border-accent hover:bg-accent hover:text-primary" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {isAr ? "دخول البوابة" : "Enter Portal"}
      </button>
    </form>
  );

  return (
    <div className="relative flex min-h-screen bg-primary overflow-hidden">
      {/* Cinematic Riyadh Background (Shared) */}
      <div className="absolute inset-0 z-0 lg:w-[40%]">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
            src="https://images.unsplash.com/photo-1549413280-9280f2fc748a?q=80&w=2000&auto=format&fit=crop" 
            alt="Riyadh Architectural Excellence" 
            className="h-full w-full object-cover grayscale opacity-40" 
        />
        <div className="absolute inset-x-12 bottom-12 z-20 hidden lg:block">
            <div className="border-s-2 border-accent ps-8">
                <span className="block text-[10px] font-bold uppercase tracking-[0.5em] text-accent mb-4">
                    {isAr ? "سينا للاستثمارات العقارية" : "SYNA Real Estate Investments"}
                </span>
                <h2 className="text-4xl font-medium tracking-tight text-white uppercase leading-[1.1]">
                    {isAr ? "سيـــادة العقـــــار" : "Real Estate Sovereignty"}
                </h2>
            </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative z-20 flex flex-1 flex-col overflow-y-auto px-6 py-12 md:px-20 lg:py-20 lg:ms-[40%] bg-primary">
        <div className="mb-16 flex items-center justify-between">
            <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors">
                {isAr ? "العودة للرئيسية" : "Back to Home"}
            </Link>
            <button onClick={toggleLang} className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors">
                {isAr ? "English" : "العربية"}
            </button>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-16">
            <Tabs value={portalType} onValueChange={(v) => { setPortalType(v as any); setMode("login"); }} className="mb-12">
                <TabsList className="h-14 w-full rounded-none bg-white/5 p-1 border border-white/10">
                <TabsTrigger value="developer" className="flex-1 text-[10px] font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                    {isAr ? "المطور" : "Developer"}
                </TabsTrigger>
                <TabsTrigger value="owner" className="flex-1 text-[10px] font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                    {isAr ? "المالك" : "Owner"}
                </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="mb-12">
              <h1 className="text-3xl font-medium tracking-tight text-white uppercase mb-4">
                {portalType === "developer" ? (isAr ? "بوابة المطور" : "Developer Portal") : (isAr ? "بوابة المالك" : "Owner Portal")}
              </h1>
              <p className="text-sm font-light text-white/40 leading-relaxed">
                {portalType === "owner"
                  ? (isAr ? "منطقة متابعة حالة الأصول ومؤشرات الاهتمام الاستثماري." : "Dedicated area for asset status and investment interest tracking.")
                  : mode === "login"
                    ? (isAr ? "النفاذ لمتابعة الصفقات المتأهلة وفرص التطوير المشترك." : "Access to track qualified deals and co-development opportunities.")
                    : (isAr ? "تسجيل اهتمام كشريك تطوير مؤسسي لاستعراض الفرص النوعية." : "Register interest as an institutional developer to explore curated opportunities.")}
              </p>
            </div>
          </div>

          {portalType === "owner" && (
            <div className="space-y-12">
              {LoginForm}
              <div className="border-t border-white/5 pt-10">
                <p className="text-[10px] font-medium leading-loose text-white/20 uppercase tracking-widest">
                  {isAr ? "ملاحظة: يتم تفعيل حسابات الملاك تلقائياً من قبل الإدارة. يرجى مراجعة البريد الإلكتروني للحصول على بيانات النفاذ." : "Note: Owner accounts are activated by management. Please refer to your executive email for access credentials."}
                </p>
              </div>
            </div>
          )}

          {portalType === "developer" && mode === "login" && (
            <div className="space-y-12">
              {LoginForm}
              <div className="text-center pt-10 border-t border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-6">
                   {isAr ? "ليس لديك حساب معتمد؟" : "NOT A CERTIFIED PARTNER?"}
                </p>
                <button type="button" onClick={() => setMode("register")} className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent hover:underline">
                  {isAr ? "طلب الانضمام كشريك" : "Request Partner Access"}
                </button>
              </div>
            </div>
          )}

          {portalType === "developer" && mode === "register" && (
            <div className="space-y-16">
              <form onSubmit={handleRegister} className="space-y-16">
                <div className="space-y-12">
                  <h3 className={sectionTitleClasses}>{isAr ? "بيانات الهوية" : "Identity Data"}</h3>
                  <div className="space-y-10">
                    <div className="space-y-2">
                        <label className={labelClasses}>{isAr ? "اسم الكيان *" : "Entity Name *"}</label>
                        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClasses} />
                    </div>
                    <div className="space-y-2">
                        <label className={labelClasses}>{isAr ? "المسؤول التنفيذي *" : "Executive Person *"}</label>
                        <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className={inputClasses} />
                    </div>
                    <div className="grid gap-10 md:grid-cols-2">
                        <div className="space-y-2">
                        <label className={labelClasses}>{isAr ? "السجل التجاري *" : "Commercial Register *"}</label>
                        <input value={crNumber} onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                        <label className={labelClasses}>{isAr ? "المقر *" : "HQ *"}</label>
                        <Select value={city} onValueChange={setCity}>
                            <SelectTrigger className="h-14 bg-transparent border-none border-b border-white/10 rounded-none focus:ring-0 px-0 text-white">
                                <SelectValue placeholder={isAr ? "اختر" : "Select"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-white/10 bg-primary text-white">
                            {saudiCities.map(c => (
                                <SelectItem key={c.name.en} value={c.name.en} className="rounded-none focus:bg-white/5">{isAr ? c.name.ar : c.name.en}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <h3 className={sectionTitleClasses}>{isAr ? "نطاق الاستثمار *" : "Investment Scope *"}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {PROJECT_TYPES.map(pt => (
                      <button key={pt.value} type="button" onClick={() => toggleProjectType(pt.value)}
                        className={`px-4 py-3 text-[9px] font-bold uppercase tracking-[0.1em] transition-all border ${selectedProjectTypes.includes(pt.value) ? "border-accent bg-accent text-primary" : "border-white/10 text-white/30 hover:border-accent"}`}>
                        {isAr ? pt.ar : pt.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-12">
                  <h3 className={sectionTitleClasses}>{isAr ? "التواصل" : "Communication"}</h3>
                  <div className="space-y-10">
                    <div className="space-y-2">
                      <label className={labelClasses}>{isAr ? "البريد الإداري *" : "Management Email *"}</label>
                      <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClasses}>{isAr ? "رقم الجوال *" : "Mobile *"}</label>
                      <div className="flex gap-4">
                        <div className="flex h-14 items-center border-b border-white/10 text-[10px] font-bold text-white/20 tracking-tighter">+966</div>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <h3 className={sectionTitleClasses}>{isAr ? "الاعتمادات (Google Drive)" : "Credentials (Google Drive)"}</h3>
                  <div className="space-y-10">
                    <div className="space-y-3">
                      <label className={labelClasses}>{isAr ? "رابط السجل التجاري *" : "CR Link *"}</label>
                      <DriveLinkInput value={crDriveLink} onChange={setCrDriveLink} valid={crLinkValid} placeholder="https://drive.google.com/..." error={errors.crDriveLink} />
                    </div>
                    <div className="space-y-3">
                      <label className={labelClasses}>{isAr ? "رابط ملف الكيان *" : "Profile Link *"}</label>
                      <DriveLinkInput value={profileDriveLink} onChange={setProfileDriveLink} valid={profileLinkValid} placeholder="https://drive.google.com/..." error={errors.profileDriveLink} />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                    <div className="flex items-start gap-4">
                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} className="mt-1 border-white/20 rounded-none data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                    <label htmlFor="terms" className="text-[9px] font-medium leading-[1.8] text-white/20 uppercase tracking-[0.15em]">
                        {isAr ? "بإتمام التسجيل، أقر بصحة البيانات ومسؤوليتي القانونية، وأوافق على" : "By registering, I certify data accuracy and legal authority, agreeing to"}{" "}
                        <Link to="/terms" className="text-accent underline">{t.auth.termsAndConditions}</Link>
                    </label>
                    </div>
                    
                    <button type="submit" className="luxury-button w-full h-16 border-white/10 text-white hover:border-accent hover:bg-accent hover:text-primary" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        {isAr ? "إرسال طلب الاعتماد" : "Submit Credentials"}
                    </button>
                </div>
              </form>
              
              <div className="text-center pt-10 border-t border-white/5">
                <button type="button" onClick={() => setMode("login")} className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors">
                  {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
