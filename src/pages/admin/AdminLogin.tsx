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
                toast({ variant: "destructive", title: isAr ? "دخول غير مصرح" : "Unauthorized Entry", description: isAr ? "عذراً، هذا الحساب لا يملك صلاحيات إدارية." : "Sorry, this account lacks administrative privileges." });
                setLoading(false);
                return;
            }
            toast({ title: isAr ? "تم إثبات الهوية الإدارية" : "Admin Identity Verified" });
            navigate("/admincp/overview");
        }
        setLoading(false);
    };

    const inputClasses = "h-16 w-full px-6 transition-all border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-accent/20 text-sm font-medium bg-slate-50";
    const labelClasses = "text-[11px] font-bold uppercase tracking-[0.25em] ps-1 mb-3 block text-slate-400";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B2F4A]">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-secondary/95 via-secondary/80 to-secondary/95" />
                <img src={saudiAbstract} className="h-full w-full object-cover opacity-50 zoom-in-110 animate-pulse-slow" alt="Background Texture" />
            </div>

            {/* Navigation Overlay */}
            <div className="absolute top-12 left-12 right-12 z-20 flex items-center justify-between">
                <Link to="/" className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 transition-colors hover:text-white">
                    {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {isAr ? "العودة للرئيسية" : "BACK TO INDEX"}
                </Link>
                <div className="flex items-center gap-10">
                    <button onClick={toggleLang} className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 transition-colors hover:text-white">
                        {isAr ? "ENGLISH" : "العربية"}
                    </button>
                    <Globe className="h-4 w-4 text-white/10" />
                </div>
            </div>

            {/* Admin Command Card */}
            <div className="relative z-10 w-full max-w-md p-6">
                <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center bg-white shadow-2xl shadow-primary/20" style={{ borderRadius: '12px' }}>
                        <Lock className="h-10 w-10 text-primary" />
                    </div>
                    <span className="inline-block px-4 py-1.5 border border-accent/20 bg-accent/5 backdrop-blur-md text-[9px] font-bold uppercase tracking-[0.6em] text-accent mb-6">
                        {isAr ? "بوابة الأمان الإدارية" : "ADMINISTRATIVE COMMAND ARCHWAY"}
                    </span>
                    <h1 className="text-4xl font-bold tracking-tight text-white uppercase mb-4">
                        {isAr ? "النفاذ الإداري" : "ADMIN ACCESS"}
                    </h1>
                    <div className="mx-auto h-[1px] w-20 bg-white/10" />
                </div>

                <div className="bg-white border border-slate-100 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.4)] p-12 md:p-14 animate-in fade-in zoom-in-95 duration-700" style={{ borderRadius: '8px' }}>
                    <form onSubmit={handleLogin} className="space-y-10">
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
                                    placeholder="admin@syna.sa"
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
                                        className="absolute end-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="group relative h-20 w-full flex items-center justify-center gap-5 transition-all duration-500 font-bold text-[13px] uppercase tracking-[0.4em] overflow-hidden bg-primary text-white shadow-xl shadow-primary/20"
                            style={{ borderRadius: '4px' }}
                        >
                            <div className="absolute inset-0 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20" />
                            {loading ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            ) : (
                                <>
                                    {isAr ? "دخول النظام" : "ENTER SYSTEM"}
                                    <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-10 border-t border-slate-50 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {isAr ? "نظام الأمان نشط" : "SECURITY SYSTEM ACTIVE"}
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center animate-in fade-in duration-1000 delay-500">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">
                        {isAr ? "سينا لحلول الاستثمار - المملكة العربية السعودية" : "SYNA SOLUTIONS - KINGDOM OF SAUDI ARABIA"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
