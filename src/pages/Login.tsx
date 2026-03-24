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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        toast({ variant: "destructive", title: isAr ? "دخول غير مصرح" : "Unauthorized Entry" });
        setLoading(false);
        return;
      }
      toast({ title: portalType === "owner" ? (isAr ? "تم إثبات النفاذ" : "Access Confirmed") : (isAr ? "تم الاتصال بنظام الشركاء" : "Partners System Connected") });
    }
    setLoading(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Required";
    if (!crNumber) errs.crNumber = "Required";
    if (!regEmail) errs.email = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("register-developer", {
        body: { email: regEmail, password: regPassword, company_name: companyName, contact_person_name: contactPerson, cr_number: crNumber, cr_file_url: crDriveLink, company_profile_url: profileDriveLink, phone: `+966${phone}`, city, project_types: selectedProjectTypes },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || "Registration failed");
      toast({ title: isAr ? "تم استلام الطلب" : "Request Received" });
      setMode("login");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  const inputClasses = "h-14 w-full px-5 transition-all border border-slate-200 outline-none focus:border-primary/60 text-sm font-medium bg-white rounded-[4px] shadow-sm";
  const labelClasses = "text-[12px] font-bold text-slate-600 mb-2.5 block ps-0.5 uppercase tracking-wider";

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "Institutional Email"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="executive@cidoma.com" />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>{isAr ? "كلمة المرور" : "Password"}</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className={inputClasses} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="h-16 w-full flex items-center justify-center gap-3 transition-all duration-300 font-bold text-[13px] uppercase tracking-[0.2em] bg-primary text-white shadow-lg shadow-primary/5 hover:bg-primary/95 rounded-[4px]"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <>
            {isAr ? "دخول النظام" : "Authenticate Entrance"}
            <ShieldCheck className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="pt-4 text-center">
        <button type="button" className="text-[10px] font-bold text-slate-300 hover:text-primary transition-colors uppercase tracking-[0.2em]">
            {isAr ? "نسيت كلمة المرور؟" : "Forgot Credentials?"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Left Panel: Contextual Authority */}
      <div className="relative hidden w-[42%] flex-col justify-between lg:flex overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-slate-900/40 mix-blend-multiply" />
          <img 
            key={portalType}
            src={portalType === 'developer' ? kafdElite : saudiAbstract} 
            className="h-full w-full object-cover animate-in fade-in duration-700" 
            alt="Context" 
          />
        </div>

        <div className="relative z-20 p-20 pt-24">
          <div className="mb-32 flex items-center gap-5">
            <div className="h-10 w-[3px] bg-accent" />
            <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-widest text-white">SYNA</span>
                <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-white/30">Asset Intelligence Node</span>
            </div>
          </div>

          <div className="max-w-md space-y-8 animate-in slide-in-from-left-4 duration-500">
               <h1 className="text-4xl font-bold tracking-tight text-white leading-[1.1] uppercase">
                  {portalType === 'developer' ? (isAr ? "نظام الدخول الموحد للمطورين" : "Enterprise Developer Access") : (isAr ? "بوابة إدارة الأصول العقارية" : "Core Asset Management")}
               </h1>
               <p className="text-base font-normal leading-relaxed text-white/70 max-w-sm">
                  {portalType === 'developer' 
                    ? (isAr ? "تحقق الهوية المؤسسية للوصول لفرص التطوير العقاري المعتمدة صب في مدن المملكة." : "Institutional identity verification for authorized real estate development mandates across the Kingdom.")
                    : (isAr ? "مركز تحكم الملاك المعتمد لمتابعة أداء المحفظة الاستثمارية والتقارير التنفيذية للأصول." : "Certified owners' command center for portfolio performance monitoring and executive asset auditing.")}
               </p>
          </div>
        </div>

        <div className="relative z-20 p-20 text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] border-t border-white/5">
           {isAr ? "المملكة العربية السعودية - الرياض" : "Kingdom of Saudi Arabia - Riyadh / CIDOMA"}
        </div>
      </div>

      {/* Right Panel: Engineered Form Control */}
      <div className="relative flex flex-1 flex-col overflow-y-auto px-8 py-16 lg:px-20 lg:justify-center">
        {/* Navigation Actions */}
        <div className="absolute top-10 left-8 right-8 flex items-center justify-between lg:left-20 lg:right-20">
            <Link to="/" className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {isAr ? "رجوع" : "Index"}
            </Link>
            <div className="flex items-center gap-8">
               <button onClick={toggleLang} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                  {isAr ? "ENGLISH" : "العربية"}
               </button>
               <Globe className="h-4 w-4 text-slate-200" />
            </div>
        </div>

        <div className="mx-auto w-full max-w-[500px]">
           {/* ENGINEERED ROLE SELECTOR (Segmented Solid Control) */}
           <div className="mb-14">
              <div className="flex bg-slate-200/50 p-1.5 rounded-[4px] border border-slate-200/50">
                 <button 
                  onClick={() => { setPortalType("developer"); setMode("login"); }}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 transition-all duration-200 rounded-[2px] text-[10px] font-bold uppercase tracking-[0.2em] ${portalType === 'developer' ? 'bg-primary text-white shadow-md shadow-primary/10' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <Building2 className="h-3.5 w-3.5" />
                    {isAr ? "مطور عقاري" : "Developer"}
                 </button>
                 <button 
                  onClick={() => { setPortalType("owner"); setMode("login"); }}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 transition-all duration-200 rounded-[2px] text-[10px] font-bold uppercase tracking-[0.2em] ${portalType === 'owner' ? 'bg-primary text-white shadow-md shadow-primary/10' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <UserCircle className="h-3.5 w-3.5" />
                    {isAr ? "مالك عقار" : "Property Owner"}
                 </button>
              </div>
           </div>

           {/* THE CORE SYSTEM CARD */}
           <div className="relative bg-white border border-slate-200/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] p-12 lg:p-14 rounded-[4px] animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-12">
                 <h2 className="text-2xl font-bold tracking-tight text-primary uppercase mb-1.5">
                    {mode === 'login' ? (isAr ? "تسجيل المراجعة" : "System Identity") : (isAr ? "طلب اعتماد" : "Accreditation Submission")}
                 </h2>
                 <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                    {isAr ? "التحقق من بيانات النفاذ المؤسسي" : "INSTITUTIONAL CREDENTIAL VALIDATION"}
                 </p>
              </div>

              {portalType === "owner" && LoginForm}

              {portalType === "developer" && mode === "login" && (
                <div className="space-y-10">
                   {LoginForm}
                   <div className="pt-10 flex flex-col items-center gap-6 border-t border-slate-50">
                      <button onClick={() => setMode("register")} className="group flex items-center gap-3 text-[11px] font-bold text-accent hover:text-primary transition-colors uppercase tracking-[0.2em]">
                         {isAr ? "بدء طلب اعتماد مطور" : "Request Accreditation"}
                         <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                   </div>
                </div>
              )}

              {portalType === "developer" && mode === "register" && (
                <form onSubmit={handleRegister} className="space-y-10 animate-in fade-in duration-300">
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className={labelClasses}>{isAr ? "الاسم التجاري" : "Legal Entity Name"}</label>
                         <input value={companyName} onChange={e => setCompanyName(e.target.value)} required className={inputClasses} />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "رقم السجل" : "CR Number"}</label>
                            <input value={crNumber} onChange={e => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} />
                         </div>
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "المقر الرئيسي" : "Corporate HQ"}</label>
                            <Select value={city} onValueChange={setCity}>
                               <SelectTrigger className="h-14 w-full border border-slate-200 bg-white px-5 font-medium text-sm rounded-[4px] focus:border-primary/60 shadow-sm">
                                  <SelectValue placeholder={isAr ? "اختر المدينة" : "Select City"} />
                               </SelectTrigger>
                               <SelectContent className="bg-white border-slate-200 rounded-[4px]">
                                  {saudiCities.map(c => (
                                     <SelectItem key={c.name.en} value={c.name.en} className="text-sm">{isAr ? c.name.ar : c.name.en}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className={labelClasses}>{isAr ? "رابط الوثائق" : "Documentation Link"}</label>
                         <input value={crDriveLink} onChange={e => setCrDriveLink(e.target.value)} required dir="ltr" className={inputClasses} placeholder="https://..." />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
                            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} />
                         </div>
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "رقم التواصل" : "Mobile"}</label>
                            <div className="flex gap-1.5">
                               <div className="flex h-14 w-16 items-center justify-center bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-[4px] tracking-wider">+966</div>
                               <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-4 space-y-8">
                      <div className="flex items-start gap-3.5 p-5 bg-slate-50 border border-slate-100 rounded-[2px]">
                         <Checkbox id="terms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(c === true)} className="mt-0.5 h-4 w-4 data-[state=checked]:bg-primary rounded-sm shadow-none border-slate-300" />
                         <label htmlFor="terms" className="text-[10px] font-medium leading-relaxed text-slate-400 uppercase tracking-[0.15em]">
                            {isAr ? "أوافق على سياسات الالتزام بطلب النفاذ لـ" : "I AGREE TO COMPLIANCE AND ACCESS TERMS OF"}{" "}
                            <Link to="/terms" className="text-primary underline font-bold">CIDOMA</Link>
                         </label>
                      </div>

                      <button type="submit" disabled={loading} className="h-16 w-full flex items-center justify-center gap-3 transition-all duration-300 font-bold text-[13px] uppercase tracking-[0.2em] bg-primary text-white shadow-lg shadow-primary/5 rounded-[4px]">
                         {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                           <>
                             {isAr ? "إرسال طلب النفاذ" : "Submit Request"}
                             <UserPlus className="h-4 w-4" />
                           </>
                         )}
                      </button>

                      <div className="text-center pt-2">
                        <button onClick={() => setMode("login")} className="text-[10px] font-bold text-slate-300 hover:text-primary transition-colors uppercase tracking-[0.2em]">
                            {isAr ? "الرجوع للهوية" : "Back to Identification"}
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
