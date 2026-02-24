import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX, LogOut, Home } from "lucide-react";
import logoImg from "@/assets/logo.png";

const NoAccess: React.FC = () => {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-sm text-center space-y-6 p-6">
        <img src={logoImg} alt="DOMA" className="mx-auto h-16 w-16 rounded-xl object-contain" />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-medium text-foreground">
            {isAr ? "لا توجد صلاحيات" : "No Access"}
          </h1>
          <p className="text-sm font-light text-muted-foreground">
            {isAr
              ? "حسابك غير مرتبط بأي دور في المنصة. تواصل مع مدير النظام للحصول على الصلاحيات المناسبة."
              : "Your account is not linked to any role on the platform. Contact the administrator for appropriate access."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            {isAr ? "الصفحة الرئيسية" : "Home Page"}
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-destructive hover:bg-destructive/5"
            onClick={async () => { await signOut(); navigate("/"); }}
          >
            <LogOut className="h-4 w-4" />
            {isAr ? "تسجيل الخروج" : "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
