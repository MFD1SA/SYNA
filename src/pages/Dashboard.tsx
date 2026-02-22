import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { LogOut, Globe, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-xl font-medium text-primary">DOMA</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5">
              <Globe className="h-4 w-4" />
              {t.nav.language}
            </Button>
            <span className="text-sm font-light text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              {lang === "ar" ? "خروج" : "Logout"}
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-16 text-center">
        <Map className="mx-auto mb-6 h-16 w-16 text-primary" strokeWidth={1} />
        <h1 className="mb-4 text-3xl font-medium text-foreground">
          {lang === "ar" ? "مرحباً بك في DOMA" : "Welcome to DOMA"}
        </h1>
        <p className="text-base font-light text-muted-foreground">
          {lang === "ar"
            ? "الخريطة التفاعلية ولوحة التحكم قيد التطوير — المرحلة القادمة"
            : "Interactive map and dashboard are under development — coming next"}
        </p>
      </main>
    </div>
  );
};

export default DashboardPage;
