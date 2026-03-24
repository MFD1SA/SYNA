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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-border/20 bg-background/90 backdrop-blur-2xl py-3" : "bg-transparent py-6"}`}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative">
            <img src={logoImg} alt="SYNA" className="h-10 w-10 object-contain brightness-110" />
            {!scrolled && <div className="absolute -inset-2 bg-primary/5 blur-xl rounded-full" />}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-semibold tracking-[0.1em] text-primary">SYNA</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium">
              {isAr ? "للاستثمارات العقارية" : "Real Estate Investments"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-8 md:flex">
            <Link to="/about" className="text-xs font-semibold uppercase tracking-widest text-primary/70 transition-colors hover:text-accent">
              {t.nav.about}
            </Link>
            <Link to="/contact" className="text-xs font-semibold uppercase tracking-widest text-primary/70 transition-colors hover:text-accent">
              {isAr ? "تواصل معنا" : "Contact"}
            </Link>
          </div>

          <div className="h-4 w-px bg-border/40" />

          <button onClick={toggleLang} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80 transition-colors hover:text-accent">
            <Globe className="h-3.5 w-3.5" />
            {lang === "ar" ? "EN" : "AR"}
          </button>

          <Link to="/auth/login" className="group relative flex items-center gap-2 bg-primary px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary-foreground transition-all hover:bg-primary/90">
            {isAr ? "دخول المستثمرين" : "Investor Login"}
            <LogIn className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
