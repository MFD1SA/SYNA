import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الصفحة غير موجودة" : "Page Not Found");
  const Arrow = lang === "ar" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
          <span className="text-4xl font-medium text-primary">404</span>
        </div>
        <h1 className="mb-2 text-2xl font-medium text-foreground">
          {lang === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
        </h1>
        <p className="mb-6 text-sm font-light text-muted-foreground">
          {lang === "ar" ? "الصفحة التي تبحث عنها غير موجودة" : "The page you're looking for doesn't exist"}
        </p>
        <Button asChild variant="outline" className="gap-2 rounded-xl">
          <Link to="/">
            <Arrow className="h-4 w-4" />
            {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
