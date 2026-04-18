import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldX, LogOut, Home } from "lucide-react";
import logoImg from "@/assets/logo.png";

const NoAccess: React.FC = () => {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F7F9FB] via-white to-[#EEF4F8]" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-sm text-center space-y-8 p-6">
        <img src={logoImg} alt="SINA" className="mx-auto h-12 w-auto object-contain" />
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-100">
            <ShieldX className="h-7 w-7 text-red-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-sina-charcoal">
            {isAr ? "لا توجد صلاحيات" : "No Access"}
          </h1>
          <p className="text-[14px] text-gray-400 leading-relaxed max-w-xs">
            {isAr
              ? "حسابك غير مرتبط بأي دور في سينا. تواصل مع مدير النظام للحصول على الصلاحيات المناسبة."
              : "Your account is not linked to any role on SINA. Contact the administrator for appropriate access."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-full h-[48px] flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-600 hover:border-sina-blue/30 transition-colors"
          >
            <Home className="h-4 w-4" strokeWidth={1.5} />
            {isAr ? "الصفحة الرئيسية" : "Home Page"}
          </button>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full h-[48px] flex items-center justify-center gap-2 text-[14px] font-medium text-red-400 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {isAr ? "تسجيل الخروج" : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
