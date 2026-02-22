import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Globe, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 doma-glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg doma-gradient">
            <span className="text-sm font-medium text-primary-foreground">D</span>
          </div>
          <span className="text-xl font-medium tracking-tight text-foreground">DOMA</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/subscriptions" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:block">
            {t.nav.subscriptions}
          </Link>
          <Link to="/about" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:block">
            {t.nav.about}
          </Link>

          <div className="mx-1 hidden h-5 w-px bg-border md:block" />

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t.nav.language}</span>
          </Button>

          <Button variant="outline" size="sm" asChild className="gap-1.5 border-border/60">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              {t.nav.login}
            </Link>
          </Button>

          <Button size="sm" asChild className="hidden gap-1.5 doma-gradient sm:inline-flex">
            <Link to="/register">
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
