import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Globe, LogIn, UserPlus, Sun, Moon } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import type { BrandVariant } from "./BrandToggle";

interface NavbarProps {
  variant?: BrandVariant;
  onToggleVariant?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ variant = "portfolio", onToggleVariant }) => {
  const { t, lang, toggleLang } = useLanguage();
  const isDark = variant === "portfolio";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 doma-glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="DOMA" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-xl font-medium tracking-tight text-foreground">DOMA</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <a href="#how-it-works" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:block">
            {t.nav.howItWorks}
          </a>
          <Link to="/about" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:block">
            {t.nav.about}
          </Link>

          <div className="mx-1 hidden h-5 w-px bg-border md:block" />

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t.nav.language}</span>
          </Button>

          {onToggleVariant && (
            <Button variant="ghost" size="icon" onClick={onToggleVariant} className="h-9 w-9 text-muted-foreground" title={isDark ? (lang === "ar" ? "الوضع النهاري" : "Light mode") : (lang === "ar" ? "الوضع الليلي" : "Dark mode")}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

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
