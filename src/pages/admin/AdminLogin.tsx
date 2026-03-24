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

    const inputClasses = "h-16 w-full px-6 transition-all border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm font-medium bg-white rounded-md";
    const labelClasses = "text-sm font-bold text-slate-700 mb-3 block ps-1 text-start";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B2F4A]">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 z-10 bg-secondary/80 mix-blend-multiply" />
                <img src={saudiAbstract} className="h-full w-full object-cover opacity-60" alt="Institutional Texture" />
            </div>

            {/* Navigation Overlay */}
            <div className="absolute top-12 left-12 right-12 z-20 flex items-center justify-between">
                <Link to="/" className="group flex items-center gap-4 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                    {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {isAr ? "العودة للرئيسية" : "Index"}
                </Link>
                <div className="flex items-center gap-8">
                    <button onClick={toggleLang} className="text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                        {isAr ? "ENGLISH" : "العربية"}
                    </button>
                    <Globe className="h-4 w-4 text-white/10" />
                </div>
            </div>

            {/* Admin Command Card */}
            <div className="relative z-10 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-1000">
                <div className="bg-white border border-slate-100 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.5)] p-12 md:p-16 rounded-lg">
                    <div className="mb-14 flex flex-col items-center">
                        <div className="mb-10 flex h-20 w-20 items-center justify-center bg-primary rounded-xl shadow-2xl shadow-primary/20">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-primary uppercase mb-2">
                           {isAr ? "النفاذ الإداري" : "Admin Access"}
                        </h1>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.4em]">
                           {isAr ? "بوابة الأمان المركزي" : "Central Oversight Portal"}
                        </span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-10">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className={labelClasses}>{isAr ? "البريد الإلكتروني" : "Admin Email"}</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    dir="ltr" 
                                    className={inputClasses} 
                                    placeholder="admin@cidoma.com"
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
                    </form>
                    
                    <div className="mt-12 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-200 uppercase tracking-widest border-t border-slate-50 pt-10">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {isAr ? "نظام الأمان نشط" : "Global Security Active"}
                    </div>
                </div>
                
                <p className="mt-16 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">
                   {isAr ? "المملكة العربية السعودية" : "Kingdom Of Saudi Arabia"}
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
