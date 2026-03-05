import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Globe, Handshake } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 syna-glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="SYNA" className="h-8 w-8 object-contain" />
          <span className="text-xl font-medium tracking-tight text-foreground">SYNA</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/about" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:block">
            {t.nav.about}
          </Link>
          <Link to="/contact" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:block">
            {lang === "ar" ? "اتصل بنا" : "Contact Us"}
          </Link>

          <div className="mx-1 hidden h-5 w-px bg-border md:block" />

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t.nav.language}</span>
          </Button>

          <Button size="sm" asChild className="gap-1.5 syna-gradient">
            <Link to="/auth/login">
              <Handshake className="h-4 w-4" />
              {lang === "ar" ? "بوابة الشركاء" : "Partners Portal"}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
