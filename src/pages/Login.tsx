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
  usePageTitle(isAr ? "نظام النفاذ المؤسسي" : "Institutional Access System");
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
      toast({ title: isAr ? "تم الاتصال" : "System Entry Validated" });
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

  const inputClasses = "h-16 w-full px-5 transition-all border-2 border-slate-200 outline-none focus:border-primary text-sm font-bold bg-white rounded-[2px]";
  const labelClasses = "text-[11px] font-bold text-slate-800 mb-2 block uppercase tracking-wider";

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "System Identifier"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="EXECUTIVE@CIDOMA.COM" />
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>{isAr ? "كلمة المرور" : "Password Authenticator"}</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className={inputClasses} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="h-18 w-full flex items-center justify-center gap-3 transition-all duration-300 font-bold text-[13px] uppercase tracking-[0.2em] bg-primary text-white hover:bg-slate-900 rounded-[2px]"
      >
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
          <>
            {isAr ? "دخول النظام" : "Initialize Entry"}
            <ShieldCheck className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">
            {isAr ? "نسيت بيانات الدخول؟" : "Forgot Credentials?"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Left Panel: The Institutional Foundation */}
      <div className="relative hidden w-[45%] flex-col justify-between lg:flex overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-slate-950/60 mix-blend-multiply" />
          <img 
            key={portalType}
            src={portalType === 'developer' ? kafdElite : saudiAbstract} 
            className="h-full w-full object-cover animate-in fade-in duration-500" 
            alt="Infrastructure" 
          />
        </div>

        <div className="relative z-20 p-20 pt-24">
          <div className="mb-40 flex items-center gap-6">
            <div className="h-14 w-[5px] bg-accent" />
            <div className="flex flex-col">
                <span className="text-4xl font-black tracking-widest text-white leading-none">SYNA</span>
                <span className="text-[11px] uppercase font-bold tracking-[0.4em] text-white/40">Controlled Asset Environment</span>
            </div>
          </div>

          <div className="max-w-md space-y-10 animate-in slide-in-from-left-4 duration-500">
               <h1 className="text-5xl font-bold tracking-tight text-white leading-[1] uppercase">
                  {portalType === 'developer' ? (isAr ? "نظام كبار المطورين" : "Developer Command") : (isAr ? "مركز أصول العقار" : "Asset Authority")}
               </h1>
               <div className="h-1 w-20 bg-accent" />
               <p className="text-xl font-medium leading-relaxed text-white/80">
                  {portalType === 'developer' 
                    ? (isAr ? "بوابة التواصل الموحد للمطورين المعتمدين لإتمام صفقات التطوير العقاري الاستراتيجية." : "Unified command portal for certified developers facilitating strategic real estate development mandates.")
                    : (isAr ? "مركز تحكم الملاك للاطلاع على أداء المحفظة الاستثمارية والتقارير التنفيذية للأصول." : "Institutional owner's hub for portfolio auditing and high-value asset performance monitoring.")}
               </p>
          </div>
        </div>

        <div className="relative z-20 p-20 text-[11px] font-bold text-white/20 uppercase tracking-[0.5em] border-t border-white/5">
           KSA / RIYADH / CIDOMA.COM
        </div>
      </div>

      {/* Right Panel: Structural Dominance */}
      <div className="relative flex-1 bg-slate-50 flex items-center justify-center p-8 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-[540px] flex flex-col items-center">
            {/* Header / Navigation Actions */}
            <div className="w-full flex items-center justify-between mb-16">
                <Link to="/" className="group flex items-center gap-3 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                    {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {isAr ? "الرئيسية" : "Index"}
                </Link>
                <div className="flex items-center gap-8">
                   <button onClick={toggleLang} className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.3em]">
                      {isAr ? "ENGLISH" : "العربية"}
                   </button>
                   <Globe className="h-4 w-4 text-slate-200" />
                </div>
            </div>

           {/* THE ROLE SELECTOR (Structural Command) */}
           <div className="w-full mb-12">
              <div className="flex bg-slate-200 p-1 rounded-[3px]">
                 <button 
                  onClick={() => { setPortalType("developer"); setMode("login"); }}
                  className={`flex-1 flex items-center justify-center gap-3 py-5 transition-all duration-200 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.2em] ${portalType === 'developer' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <Building2 className="h-4 w-4" />
                    {isAr ? "مطور عقاري" : "Developer"}
                 </button>
                 <button 
                  onClick={() => { setPortalType("owner"); setMode("login"); }}
                  className={`flex-1 flex items-center justify-center gap-3 py-5 transition-all duration-200 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.2em] ${portalType === 'owner' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <UserCircle className="h-4 w-4" />
                    {isAr ? "مالك عقار" : "Owner"}
                 </button>
              </div>
           </div>

           {/* THE CORE FORM CARD (Dominance through Structure) */}
           <div className="w-full bg-white border-2 border-slate-200 p-12 lg:p-16 rounded-[4px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-14">
                 <h2 className="text-3xl font-bold tracking-tight text-primary uppercase mb-2">
                    {mode === 'login' ? (isAr ? "تسجيل النفاذ" : "Identity Verification") : (isAr ? "طلب اعتماد" : "Accreditation")}
                 </h2>
                 <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                    {isAr ? "التحقق من بيانات الدخول الموحد" : "Institutional Credential Protocol"}
                 </p>
              </div>

              {portalType === "owner" && LoginForm}

              {portalType === "developer" && mode === "login" && (
                <div className="space-y-12">
                   {LoginForm}
                   <div className="pt-10 flex flex-col items-center gap-6 border-t-2 border-slate-50">
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
                         <label className={labelClasses}>{isAr ? "الكيان التجاري" : "Legal Entity Name"}</label>
                         <input value={companyName} onChange={e => setCompanyName(e.target.value)} required className={inputClasses} placeholder="CIDOMA CO." />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "رقم السجل" : "CR Number"}</label>
                            <input value={crNumber} onChange={e => setCrNumber(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} />
                         </div>
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "المقر الرئيسي" : "Corporate HQ"}</label>
                            <Select value={city} onValueChange={setCity}>
                               <SelectTrigger className="h-16 w-full border-2 border-slate-200 bg-white px-5 font-bold text-sm rounded-[2px] focus:border-primary">
                                  <SelectValue placeholder={isAr ? "اختر المدينة" : "Select City"} />
                               </SelectTrigger>
                               <SelectContent className="bg-white border-2 border-slate-100 rounded-[2px]">
                                  {saudiCities.map(c => (
                                     <SelectItem key={c.name.en} value={c.name.en} className="text-xs font-bold uppercase tracking-widest">{isAr ? c.name.ar : c.name.en}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className={labelClasses}>{isAr ? "ملف الاعتماد (Drive)" : "Credentials Link"}</label>
                         <input value={crDriveLink} onChange={e => setCrDriveLink(e.target.value)} required dir="ltr" className={inputClasses} placeholder="HTTPS://..." />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
                            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required dir="ltr" className={inputClasses} />
                         </div>
                         <div className="space-y-3">
                            <label className={labelClasses}>{isAr ? "رقم التواصل" : "Mobile"}</label>
                            <div className="flex gap-2">
                               <div className="flex h-16 w-16 items-center justify-center bg-slate-100 border-2 border-slate-200 text-[11px] font-bold text-slate-400 rounded-[2px] tracking-wider">+966</div>
                               <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required dir="ltr" className={inputClasses} maxLength={10} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 space-y-10">
                      <div className="flex items-start gap-4 p-6 bg-slate-50 border-2 border-slate-50 rounded-[2px]">
                         <Checkbox id="terms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(c === true)} className="mt-0.5 h-4 w-4 data-[state=checked]:bg-primary rounded-none border-slate-300 shadow-none ring-0" />
                         <label htmlFor="terms" className="text-[10px] font-bold leading-relaxed text-slate-500 uppercase tracking-[0.2em]">
                            {isAr ? "أوافق على سياسات النفاذ والالتزام لـ" : "I AGREE TO SOVEREIGN COMPLIANCE TERMS OF"}{" "}
                            <Link to="/terms" className="text-primary underline">CIDOMA</Link>
                         </label>
                      </div>

                      <button type="submit" disabled={loading} className="h-18 w-full flex items-center justify-center gap-3 transition-all duration-300 font-bold text-[13px] uppercase tracking-[0.3em] bg-primary text-white hover:bg-slate-900 rounded-[2px] shadow-lg shadow-primary/5">
                         {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                           <>
                             {isAr ? "إرسال طلب النفاذ" : "Submit Access Request"}
                             <UserPlus className="h-4 w-4" />
                           </>
                         )}
                      </button>

                      <div className="text-center pt-2">
                        <button onClick={() => setMode("login")} className="text-[10px] font-bold text-slate-300 hover:text-primary transition-colors uppercase tracking-[0.2em]">
                            {isAr ? "الرجوع لتسجيل النفاذ" : "Back to Identification"}
                        </button>
                      </div>
                   </div>
                </form>
              )}
           </div>
           
           <div className="mt-16 text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
              Controlled System Environment / 2026 CIDOMA
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
