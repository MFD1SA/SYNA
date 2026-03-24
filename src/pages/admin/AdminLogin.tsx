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
            toast({ variant: "destructive", title: isAr ? "فشل التحقق" : "Verification Failed", description: error.message });
            setLoading(false);
            return;
        }
        if (data.user) {
            const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
            if (!roleData) {
                await supabase.auth.signOut();
                toast({ variant: "destructive", title: isAr ? "دخول غير مصرح" : "Unauthorized Entry" });
                setLoading(false);
                return;
            }
            toast({ title: isAr ? "تم التحقق من الهوية" : "Identity Verified" });
            navigate("/admincp/overview");
        }
        setLoading(false);
    };

    const inputClasses = "h-14 w-full px-5 transition-all border border-slate-200 outline-none focus:border-primary/60 text-sm font-medium bg-white rounded-[4px] shadow-sm";
    const labelClasses = "text-[12px] font-bold text-slate-600 mb-2.5 block ps-0.5 uppercase tracking-wider text-start";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A263D]">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 z-10 bg-[#0B2F4A]/90 mix-blend-multiply" />
                <img src={saudiAbstract} className="h-full w-full object-cover opacity-30" alt="Engineered Backdrop" />
            </div>

            {/* Navigation Navigation */}
            <div className="absolute top-10 left-10 right-10 z-20 flex items-center justify-between">
                <Link to="/" className="group flex items-center gap-3 text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-[0.4em]">
                    {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {isAr ? "الرجوع" : "Index"}
                </Link>
                <div className="flex items-center gap-8">
                    <button onClick={toggleLang} className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-[0.4em]">
                        {isAr ? "ENGLISH" : "العربية"}
                    </button>
                    <Globe className="h-4 w-4 text-white/10" />
                </div>
            </div>

            {/* Admin Central Command Card */}
            <div className="relative z-10 w-full max-w-[480px] p-6 animate-in fade-in duration-700">
                <div className="bg-white border border-slate-200/50 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] p-12 md:p-14 rounded-[4px]">
                    <div className="mb-12 flex flex-col items-center">
                        <div className="mb-8 flex h-16 w-16 items-center justify-center bg-primary rounded-[4px] shadow-lg shadow-primary/10">
                            <Lock className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary uppercase mb-1.5">
                           {isAr ? "النفاذ الإداري" : "Admin Login"}
                        </h1>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
                           {isAr ? "بوابة الأمان المركزي" : "Control Protocol"}
                        </span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "Admin Identification"}</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={inputClasses} placeholder="admin@cidoma.com" />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>{isAr ? "كلمة المرور" : "System Password"}</label>
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
                            className="h-16 w-full flex items-center justify-center gap-3 transition-all duration-300 font-bold text-[13px] uppercase tracking-[0.2em] bg-primary text-white shadow-xl shadow-primary/5 rounded-[4px]"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                              <>
                                {isAr ? "دخول النظام" : "Initiate Entry"}
                                <ShieldCheck className="h-4 w-4" />
                              </>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-10 flex items-center justify-center gap-4 text-[9px] font-bold text-slate-200 uppercase tracking-[0.3em] border-t border-slate-50 pt-10">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {isAr ? "نظام الأمان مفعل" : "Control Node Active"}
                    </div>
                </div>
                
                <p className="mt-12 text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">
                   {isAr ? "المملكة العربية السعودية" : "Kingdom Of Saudi Arabia / CIDOMA"}
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
