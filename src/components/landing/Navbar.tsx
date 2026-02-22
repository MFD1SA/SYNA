import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Globe, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-medium tracking-tight text-primary">
          DOMA
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/subscriptions" className="hidden text-sm text-muted-foreground hover:text-foreground md:block">
            {t.nav.subscriptions}
          </Link>
          <Link to="/about" className="hidden text-sm text-muted-foreground hover:text-foreground md:block">
            {t.nav.about}
          </Link>

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t.nav.language}</span>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link to="/login" className="gap-1.5">
              <LogIn className="h-4 w-4" />
              {t.nav.login}
            </Link>
          </Button>

          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/register" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              {t.nav.register}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
