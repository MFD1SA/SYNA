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
  usePageTitle(isAr ? "بوابة النفاذ المؤسسي" : "Institutional Access Portal");
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
      toast({ variant: "destructive", title: isAr ? "فشل التحقق" : "Auth Failure", description: error.message });
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
        toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized" });
        setLoading(false);
        return;
      }
      toast({ title: isAr ? "تم الاتصال بنجاح" : "System Connected" });
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
      if (res.error || res.data?.error) throw new Error(res.data?.error || "Failed");
      toast({ title: isAr ? "تم استلام الطلب" : "Request Submitted" });
      setMode("login");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  const inputClasses = "h-15 w-full px-5 transition-all border border-slate-200 outline-none block focus:border-primary focus:bg-white text-sm font-medium bg-slate-50/40 rounded-[2px]";
  const labelClasses = "text-[11px] font-black text-primary/40 mb-2 block uppercase tracking-[0.2em]";

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className={labelClasses}>{isAr ? "معرف النفاذ" : "SYSTEM IDENTIFIER"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="EXECUTIVE@CIDOMA.COM" />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>{isAr ? "كلمة المرور" : "ACCESS AUTHENTICATOR"}</label>
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
        className="h-16 w-full flex items-center justify-center gap-3 transition-all duration-300 font-black text-[12px] uppercase tracking-[0.3em] bg-primary text-white shadow-xl shadow-primary/10 hover:bg-slate-900 rounded-[2px]"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <>
            {isAr ? "دخول النظام" : "INITIALIZE ACCESS"}
            <ShieldCheck className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <button type="button" className="text-[10px] font-black text-slate-300 hover:text-primary transition-colors uppercase tracking-[0.2em]">
            {isAr ? "فقدان البيانات" : "LOST CREDENTIALS"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Visual Anchor: Absolute Authority */}
      <div className="relative hidden w-[42%] flex-col justify-between lg:flex overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-slate-950/50 mix-blend-multiply" />
          <img 
            key={portalType}
            src={portalType === 'developer' ? kafdElite : saudiAbstract} 
            className="h-full w-full object-cover animate-in fade-in duration-500 active:scale-100" 
            alt="Infrastructure" 
          />
        </div>

        <div className="relative z-20 p-20 pt-24">
          <div className="mb-40 flex items-center gap-5">
            <div className="h-12 w-[4px] bg-accent" />
            <div className="flex flex-col">
                <span className="text-3xl font-black tracking-widest text-white leading-none">SYNA</span>
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-white/40">Sovereign Asset Node</span>
            </div>
          </div>

          <div className="max-w-md space-y-10 animate-in slide-in-from-left-4 duration-500">
               <h1 className="text-5xl font-black tracking-tighter text-white leading-[1] uppercase py-2">
                  {portalType === 'developer' ? (isAr ? "نظام كبار المطورين" : "DEVELOPER COMMAND") : (isAr ? "إدارة الأصول العقارية" : "ASSET SOVEREIGNTY")}
               </h1>
               <div className="h-[1px] w-20 bg-white/20" />
               <p className="text-lg font-medium leading-relaxed text-white/60">
                  {portalType === 'developer' 
                    ? (isAr ? "بوابة التواصل المؤسسي للمطورين المعتمدين لمتابعة الأصول والفرص الاستثمارية النوعية." : "Unified institutional portal for certified developers monitoring strategic assets and growth mandates.")
                    : (isAr ? "مركز تحكم الملاك للاطلاع على أداء المحفظة الاستثمارية والتقارير التنفيذية للأصول." : "Sovereign owners' command center for portfolio performance monitoring and executive asset auditing.")}
               </p>
          </div>
        </div>

        <div className="relative z-20 p-20 text-[10px] font-black text-white/20 uppercase tracking-[0.5em] border-t border-white/5">
           KSA / RIYADH OFFICE / CIDOMA.COM
        </div>
      </div>

      {/* Control Panel: Engineered Decision */}
      <div className="relative flex flex-1 flex-col overflow-y-auto px-8 py-16 lg:px-20 lg:justify-center">
        {/* Navigation Actions */}
        <div className="absolute top-10 left-8 right-8 flex items-center justify-between lg:left-20 lg:right-20">
            <Link to="/" className="group flex items-center gap-3 text-[11px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {isAr ? "الرئيسية" : "INDEX"}
            </Link>
            <div className="flex items-center gap-8">
               <button onClick={toggleLang} className="text-[11px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                  {isAr ? "ENGLISH" : "العربية"}
               </button>
               <Globe className="h-4 w-4 text-slate-200" />
            </div>
        </div>

        <div className="mx-auto w-full max-w-[520px]">
           {/* SOVEREIGN ROLE SELECTOR (Solid High-Weight Control) */}
           <div className="mb-14">
              <div className="flex bg-slate-100 p-1 rounded-[2px] border border-slate-200/40">
                 <button 
                  onClick={() => { setPortalType("developer"); setMode("login"); }}
                  className={`flex-1 flex items-center justify-center gap-3 py-5 transition-all duration-200 rounded-[1px] text-[11px] font-black uppercase tracking-[0.2em] ${portalType === 'developer' ? 'bg-primary text-white shadow-xl shadow-primary/10' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <Building2 className="h-4 w-4" />
                    {isAr ? "مطور عقاري" : "DEVELOPER"}
                 </button>
                 <button 
                  onClick={() => { setPortalType("owner"); setMode("login"); }}
                  className={`flex-1 flex items-center justify-center gap-3 py-5 transition-all duration-200 rounded-[1px] text-[11px] font-black uppercase tracking-[0.2em] ${portalType === 'owner' ? 'bg-primary text-white shadow-xl shadow-primary/10' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <UserCircle className="h-4 w-4" />
                    {isAr ? "مالك عقار" : "PROPERTY OWNER"}
                 </button>
              </div>
           </div>

           {/* THE CORE ENGINEERED CARD */}
           <div className="relative bg-white border border-slate-200/60 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] p-12 lg:p-16 rounded-[2px] animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-14">
                 <h2 className="text-3xl font-black tracking-tighter text-primary uppercase mb-1">
                    {mode === 'login' ? (isAr ? "إثبات النفاذ" : "SYSTEM ACCESS") : (isAr ? "طلب اعتماد" : "ACCREDITATION")}
                 </h2>
                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    {isAr ? "التحقق من بيانات النفاذ المؤسسي" : "INITIALIZING CREDENTIAL PROTOCOL"}
                 </p>
              </div>

              {portalType === "owner" && LoginForm}

              {portalType === "developer" && mode === "login" && (
                <div className="space-y-12">
                   {LoginForm}
                   <div className="pt-10 flex flex-col items-center gap-6 border-t border-slate-100">
                      <button onClick={() => setMode("register")} className="group flex items-center gap-3 text-[11px] font-black text-accent hover:text-primary transition-colors uppercase tracking-[0.2em]">
                         {isAr ? "بدء طلب اعتماد مطور" : "REQUEST ACCREDITATION"}
                         <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                   </div>
                </div>
              )}

              {portalType === "developer" && mode === "register" && (
                <form onSubmit={handleRegister} className="space-y-10 animate-in fade-in duration-300">
                   <div className="space-y-8">
                      <div className="space-y-2.5">
                         <label className={labelClasses}>{isAr ? "الكيان التجاري" : "LEGAL ENTITY NAME"}</label>
                         <input value={companyName} onChange={e => setCompanyName(e.target.value)} required className={inputClasses} />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-2.5">
                            <label className={labelClasses}>{isAr ? "رقم السجل" : "CR IDENTIFIER"}</label>
                            <input value={crNumber} onChange={e => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} />
                         </div>
                         <div className="space-y-2.5">
                            <label className={labelClasses}>{isAr ? "المقر الرسمي" : "CORPORATE HQ"}</label>
                            <Select value={city} onValueChange={setCity}>
                               <SelectTrigger className="h-15 w-full border border-slate-200 bg-slate-50/40 px-5 font-semibold text-sm rounded-[2px] focus:bg-white focus:border-primary">
                                  <SelectValue placeholder={isAr ? "اختر المدينة" : "SELECT CITY"} />
                               </SelectTrigger>
                               <SelectContent className="bg-white border-slate-200 rounded-[2px]">
                                  {saudiCities.map(c => (
                                     <SelectItem key={c.name.en} value={c.name.en} className="text-xs font-bold uppercase tracking-widest">{isAr ? c.name.ar : c.name.en}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                      <div className="space-y-2.5">
                         <label className={labelClasses}>{isAr ? "ملف الاعتماد (Drive)" : "CREDENTIALS LINK"}</label>
                         <input value={crDriveLink} onChange={e => setCrDriveLink(e.target.value)} required dir="ltr" className={inputClasses} placeholder="HTTPS://..." />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-2.5">
                            <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "EMAIL"}</label>
                            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} />
                         </div>
                         <div className="space-y-2.5">
                            <label className={labelClasses}>{isAr ? "رقم الجوال" : "MOBILE"}</label>
                            <div className="flex gap-2">
                               <div className="flex h-15 w-16 items-center justify-center bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-400 rounded-[2px] tracking-wider">+966</div>
                               <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 space-y-10">
                      <div className="flex items-start gap-4 p-6 bg-slate-50 border border-slate-100 rounded-[1px]">
                         <Checkbox id="terms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(c === true)} className="mt-0.5 h-4 w-4 data-[state=checked]:bg-primary rounded-none border-slate-300" />
                         <label htmlFor="terms" className="text-[10px] font-black leading-relaxed text-slate-400 uppercase tracking-[0.2em]">
                            {isAr ? "أوافق على معايير الالتزام وسياسات النفاذ لـ" : "I AGREE TO SOVEREIGN COMPLIANCE TERMS OF"}{" "}
                            <Link to="/terms" className="text-primary underline">CIDOMA</Link>
                         </label>
                      </div>

                      <button type="submit" disabled={loading} className="h-18 w-full flex items-center justify-center gap-3 transition-all duration-300 font-black text-[13px] uppercase tracking-[0.3em] bg-primary text-white shadow-2xl shadow-primary/10 rounded-[2px]">
                         {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                           <>
                             {isAr ? "إرسال الطلب" : "SUBMIT ACCESS REQUEST"}
                             <UserPlus className="h-4 w-4" />
                           </>
                         )}
                      </button>

                      <div className="text-center pt-2">
                        <button onClick={() => setMode("login")} className="text-[10px] font-black text-slate-300 hover:text-primary transition-colors uppercase tracking-[0.2em]">
                            {isAr ? "الرجوع للهوية" : "BACK TO IDENTIFICATION"}
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
