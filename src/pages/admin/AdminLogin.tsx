import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2, ChevronLeft, ChevronRight, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import saudiAbstract from "@/assets/saudi-abstract.png";

const AdminLogin: React.FC = () => {
    const { t, lang, toggleLang } = useLanguage();
    const isAr = lang === "ar";
    usePageTitle(isAr ? "نظام الإشراف المركزي" : "Central Oversight System");
    const { toast } = useToast();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

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
            const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
            if (!roleData) {
                await supabase.auth.signOut();
                toast({ variant: "destructive", title: isAr ? "غير مصرح" : "Unauthorized" });
                setLoading(false);
                return;
            }
            toast({ title: isAr ? "تم التحقق" : "Verified" });
            navigate("/admincp/overview");
        }
        setLoading(false);
    };

    const inputClasses = "h-15 w-full px-5 transition-all border border-slate-200 outline-none block focus:border-primary focus:bg-white text-sm font-medium bg-slate-50/40 rounded-[2px]";
    const labelClasses = "text-[11px] font-black text-primary/40 mb-2.5 block uppercase tracking-[0.2em] text-start";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A263D]">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 z-10 bg-slate-950/80 mix-blend-multiply" />
                <img src={saudiAbstract} className="h-full w-full object-cover opacity-20" alt="Backdrop" />
            </div>

            {/* Navigation Navigation */}
            <div className="absolute top-10 left-10 right-10 z-20 flex items-center justify-between">
                <Link to="/" className="group flex items-center gap-3 text-[11px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-[0.4em]">
                    {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {isAr ? "عودة" : "INDEX"}
                </Link>
                <div className="flex items-center gap-8">
                    <button onClick={toggleLang} className="text-[11px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-[0.4em]">
                        {isAr ? "ENGLISH" : "العربية"}
                    </button>
                    <Globe className="h-4 w-4 text-white/10" />
                </div>
            </div>

            {/* Admin Command Core Card */}
            <div className="relative z-10 w-full max-w-[500px] p-6 animate-in fade-in duration-500">
                <div className="bg-white border border-slate-200/60 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.6)] p-12 md:p-16 rounded-[2px]">
                    <div className="mb-14 flex flex-col items-center">
                        <div className="mb-10 flex h-16 w-16 items-center justify-center bg-primary rounded-[1px] shadow-2xl shadow-primary/20">
                            <Lock className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-primary uppercase mb-1">
                           {isAr ? "النفاذ الإداري" : "ADMIN COMMAND"}
                        </h1>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">
                           {isAr ? "مركز الأمان المركزي" : "IDENTITY PROTOCOL"}
                        </span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>{isAr ? "معرف المسؤول" : "ADMIN IDENTIFIER"}</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="ADMIN@CIDOMA.COM" />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>{isAr ? "رمز النفاذ" : "SYSTEM AUTHENTICATOR"}</label>
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
                            className="h-18 w-full flex items-center justify-center gap-3 transition-all duration-300 font-black text-[13px] uppercase tracking-[0.3em] bg-primary text-white shadow-2xl shadow-primary/10 rounded-[2px]"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                              <>
                                {isAr ? "دخول النظام" : "INITIALIZE ENTRY"}
                                <ShieldCheck className="h-4 w-4" />
                              </>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-12 flex items-center justify-center gap-4 text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] border-t border-slate-50 pt-10">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {isAr ? "نظام الأمان مفعل" : "NODE ACTIVE"}
                    </div>
                </div>
                
                <p className="mt-14 text-center text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                   KSA RIYADH HQ / CIDOMA.COM
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
