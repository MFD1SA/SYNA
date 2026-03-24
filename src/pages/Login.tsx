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
  const [crLinkValid, setCrLinkValid] = useState<boolean | null>(null);
  const [profileLinkValid, setProfileLinkValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showWelcomeToast = () => {
    toast({ title: portalType === "owner" ? (isAr ? "تم إثبات النفاذ" : "Access Confirmed") : (isAr ? "تم الاتصال بنظام الشركاء" : "Partners System Connected") });
  };

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
    if (!crNumber) errs.crNumber = isAr ? "مطلوب" : "Required";
    if (!regEmail) errs.email = isAr ? "مطلوب" : "Required";
    if (!phone) errs.phone = isAr ? "مطلوب" : "Required";
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
        },
      });

      if (res.error || res.data?.error) throw new Error(res.data?.error || "Registration failed");

      toast({ title: isAr ? "تم استلام الطلب المؤسسي" : "Request Received" });
      setMode("login");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setLoading(false);
  };

  const inputClasses = "h-16 w-full px-6 transition-all border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm font-medium bg-white rounded-md";
  const labelClasses = "text-sm font-bold text-slate-700 mb-3 block ps-1";

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-8">
        <div className="space-y-3">
          <label className={labelClasses}>{isAr ? "البريد الإلكتروني المؤسسي" : "Official Executive Email"}</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            dir="ltr" 
            className={inputClasses} 
            placeholder="executive@cidoma.com" 
          />
        </div>
        <div className="space-y-3">
          <label className={labelClasses}>{isAr ? "كلمة المرور" : "Password"}</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              dir="ltr" 
              className={inputClasses} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute end-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="h-20 w-full flex items-center justify-center gap-4 transition-all duration-300 font-bold text-sm uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/10 hover:shadow-primary/30 rounded-md active:scale-[0.98]"
      >
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
          <>
            {isAr ? "دخول النظام" : "Authenticate Entry"}
            <ShieldCheck className="h-5 w-5" />
          </>
        )}
      </button>

      <div className="pt-8 text-center">
        <button type="button" className="text-xs font-bold text-slate-300 hover:text-primary transition-colors uppercase tracking-widest">
            {isAr ? "نسيت كلمة المرور؟" : "Forgot Credentials?"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Panel: Authority & Context */}
      <div className="relative hidden w-[42%] flex-col justify-between lg:flex overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-secondary/80 mix-blend-multiply" />
          <img 
            key={portalType}
            src={portalType === 'developer' ? kafdElite : saudiAbstract} 
            className="h-full w-full object-cover animate-in fade-in duration-1000 scale-105" 
            alt="Institutional Authority" 
          />
        </div>

        <div className="relative z-20 p-24">
          <div className="mb-40 flex items-center gap-6">
            <div className="h-12 w-1 bg-accent" />
            <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-widest text-white">SYNA</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Real Estate Infrastructure</span>
            </div>
          </div>

          <div className="max-w-md space-y-10 animate-in slide-in-from-left-8 duration-700">
            <div className="space-y-4">
               <span className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-widest">
                  {isAr ? "تحكم النفاذ المركزي" : "Central Access Control"}
               </span>
               <h1 className="text-5xl font-bold tracking-tight text-white leading-tight uppercase">
                  {portalType === 'developer' ? (isAr ? "نظام كبار المطورين" : "Strategic Developer Access") : (isAr ? "بوابة ملاك الأصول" : "Asset Owner Sovereignty")}
               </h1>
            </div>
            <p className="text-lg font-light leading-relaxed text-white/60">
                {portalType === 'developer' 
                  ? (isAr ? "إثبات الهوية للوصول لفرص التطوير العقاري والفرص النوعية المدعومة بالبيانات." : "Authenticate identity to access strategic development mandates and data-backed opportunities.")
                  : (isAr ? "تتبع وحماية الأصول العقارية وإدارة المحفظة الاستثمارية بموثوقية عالية." : "Secure monitoring of property portfolios and autonomous asset management with ultimate trust.")}
            </p>
          </div>
        </div>

        <div className="relative z-20 p-24">
           <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em] border-t border-white/5 pt-10">
              {isAr ? "المملكة العربية السعودية - الرياض" : "Kingdom of Saudi Arabia - Riyadh"}
           </p>
        </div>
      </div>

      {/* Right Panel: The Core Form */}
      <div className="relative flex flex-1 flex-col overflow-y-auto px-8 py-20 lg:px-24 lg:justify-center">
        {/* Top Actions */}
        <div className="absolute top-12 left-8 right-8 flex items-center justify-between lg:left-24 lg:right-24">
            <Link to="/" className="group flex items-center gap-4 text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {isAr ? "العودة للرئيسية" : "Back to Index"}
            </Link>
            <div className="flex items-center gap-8">
               <button onClick={toggleLang} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                  {isAr ? "ENGLISH" : "العربية"}
               </button>
               <Globe className="h-4 w-4 text-slate-200" />
            </div>
        </div>

        <div className="mx-auto w-full max-w-lg">
           {/* SIMPLE & POWERFUL ROLE SELECTION */}
           <div className="mb-16">
              <span className="mb-6 block text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] text-center">
                 {isAr ? "حدد نوع النفاذ" : "Select Entrance Protocol"}
              </span>
              <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100/50 rounded-xl">
                 <button 
                  onClick={() => { setPortalType("developer"); setMode("login"); }}
                  className={`flex flex-col items-center justify-center gap-3 py-6 transition-all duration-300 rounded-lg ${portalType === 'developer' ? 'bg-white shadow-xl shadow-slate-200/50 text-primary border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <Building2 className="h-5 w-5" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{isAr ? "مطور عقاري" : "Developer"}</span>
                 </button>
                 <button 
                  onClick={() => { setPortalType("owner"); setMode("login"); }}
                  className={`flex flex-col items-center justify-center gap-3 py-6 transition-all duration-300 rounded-lg ${portalType === 'owner' ? 'bg-white shadow-xl shadow-slate-200/50 text-primary border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <UserCircle className="h-5 w-5" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{isAr ? "مالك عقار" : "Property Owner"}</span>
                 </button>
              </div>
           </div>

           {/* THE CORE FORM CARD */}
           <div className="relative bg-white border border-slate-100 shadow-[0_40px_100px_-20px_rgba(14,58,93,0.12)] p-12 lg:p-16 rounded-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-12 border-s-4 border-primary ps-6">
                 <h2 className="text-3xl font-bold tracking-tight text-primary uppercase mb-2">
                    {mode === 'login' ? (isAr ? "تسجيل النفاذ" : "Portal Access") : (isAr ? "طلب اعتماد" : "Accreditation")}
                 </h2>
                 <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                    {portalType === "developer" ? (isAr ? "نظام الشراكات العقارية" : "Institutional Partner Network") : (isAr ? "تحقق الملاك المعتمدين" : "Verified Owner Environment")}
                 </p>
              </div>

              {portalType === "owner" && LoginForm}

              {portalType === "developer" && mode === "login" && (
                <div className="space-y-12">
                   {LoginForm}
                   <div className="pt-10 flex flex-col items-center gap-8 border-t border-slate-50">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{isAr ? "أو يمكنك" : "OR INITIATE"}</span>
                      <button onClick={() => setMode("register")} className="flex items-center gap-4 text-xs font-bold text-accent hover:text-primary transition-colors uppercase tracking-widest">
                         {isAr ? "تقديم طلب اعتماد جديد" : "Request New Accreditation"}
                         <ArrowRight className="h-4 w-4" />
                      </button>
                   </div>
                </div>
              )}

              {portalType === "developer" && mode === "register" && (
                <form onSubmit={handleRegister} className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="space-y-10">
                      <div className="space-y-8">
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "الاسم التجاري للكيان" : "Official Company Name"}</label>
                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} required className={inputClasses} />
                         </div>
                         <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                               <label className={labelClasses}>{isAr ? "رقم السجل التجاري" : "CR Number"}</label>
                               <input value={crNumber} onChange={e => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} />
                            </div>
                            <div className="space-y-3">
                               <label className={labelClasses}>{isAr ? "المقر الرئيسي" : "Corporate City"}</label>
                               <Select value={city} onValueChange={setCity}>
                                  <SelectTrigger className="h-16 w-full border border-slate-200 bg-white px-6 font-medium text-sm rounded-md focus:border-primary focus:ring-4 focus:ring-primary/5">
                                     <SelectValue placeholder={isAr ? "اختر المدينة" : "Select City"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-slate-200">
                                     {saudiCities.map(c => (
                                        <SelectItem key={c.name.en} value={c.name.en}>{isAr ? c.name.ar : c.name.en}</SelectItem>
                                     ))}
                                  </SelectContent>
                               </Select>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "رابط السجل (Drive/Pdf)" : "CR Documents Link"}</label>
                            <div className="relative">
                              <input value={crDriveLink} onChange={e => setCrDriveLink(e.target.value)} required dir="ltr" className={inputClasses} placeholder="https://..." />
                              <Link2 className="absolute end-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                         </div>
                         <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                               <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
                               <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} />
                            </div>
                            <div className="space-y-3">
                               <label className={labelClasses}>{isAr ? "رقم الجوال" : "Mobile"}</label>
                               <div className="flex gap-2">
                                  <div className="flex h-16 w-20 items-center justify-center bg-slate-50 border border-slate-200 text-xs font-bold text-slate-400 rounded-md">+966</div>
                                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-10 pt-6">
                      <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-md border border-slate-100">
                         <Checkbox id="terms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(c === true)} className="mt-1 h-5 w-5 data-[state=checked]:bg-primary rounded-sm" />
                         <label htmlFor="terms" className="text-xs font-medium leading-relaxed text-slate-400 uppercase tracking-widest">
                            {isAr ? "أوافق على معايير الالتزام والموافقة على" : "I AGREE TO COMPLIANCE STANDARDS AND"}{" "}
                            <Link to="/terms" className="text-primary underline font-bold">TERMS</Link>
                         </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="h-20 w-full flex items-center justify-center gap-4 transition-all duration-300 font-bold text-sm uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/10 hover:shadow-primary/30 rounded-md"
                      >
                         {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                           <>
                             {isAr ? "إرسال طلب الاعتماد" : "Submit Accreditation"}
                             <UserPlus className="h-5 w-5" />
                           </>
                         )}
                      </button>

                      <div className="text-center pt-4">
                        <button onClick={() => setMode("login")} className="text-xs font-bold text-slate-300 hover:text-primary transition-colors uppercase tracking-widest">
                            {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
                        </button>
                      </div>
                   </div>
                </form>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
