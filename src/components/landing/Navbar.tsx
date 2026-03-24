import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Globe, Handshake, LogIn } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-sm" : "bg-transparent py-2"}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logoImg} alt="SYNA Enterprise" className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105" />
          <span className="text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">SYNA</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/about" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:block">
            {t.nav.about}
          </Link>
          <Link to="/contact" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:block">
            {isAr ? "اتصل بنا" : "Contact Us"}
          </Link>

          <div className="mx-2 hidden h-5 w-px bg-border md:block" />

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t.nav.language}</span>
          </Button>

          <Button size="sm" asChild className="gap-2 rounded-sm shadow-sm transition-all hover:-translate-y-0.5 ml-2 mr-2">
            <Link to="/auth/login">
              <LogIn className="h-4 w-4" />
              {isAr ? "دخول النظام" : "Login"}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
