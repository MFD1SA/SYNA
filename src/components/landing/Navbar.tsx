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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? "border-b border-white/5 bg-primary/95 backdrop-blur-2xl py-4" : "bg-transparent py-8"}`}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-5 group">
          <div className="relative">
            <img src={logoImg} alt="SYNA" className="h-10 w-10 object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" />
            {!scrolled && <div className="absolute -inset-4 bg-accent/10 blur-2xl rounded-full opacity-50" />}
          </div>
          <div className="flex flex-col leading-tight border-s border-white/10 ps-5">
            <span className="text-xl font-medium tracking-[0.2em] text-white">SYNA</span>
            <span className="text-[9px] uppercase tracking-[0.4em] text-accent font-bold">
              {isAr ? "للاستثمارات العقارية" : "Real Estate Investments"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-10">
          <div className="hidden items-center gap-10 md:flex">
            <Link to="/about" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 transition-all hover:text-accent hover:tracking-[0.4em]">
              {t.nav.about}
            </Link>
            <Link to="/contact" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 transition-all hover:text-accent hover:tracking-[0.4em]">
              {isAr ? "التواصل" : "Contact"}
            </Link>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <button onClick={toggleLang} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 transition-colors hover:text-white">
            <Globe className="h-3.5 w-3.5 text-accent/60" />
            {lang === "ar" ? "English" : "العربية"}
          </button>

          <Link to="/auth/login" className="luxury-button h-11 px-8 text-white border-white/10 hover:border-accent hover:bg-accent hover:text-primary">
            {isAr ? "بوابة الشركاء" : "Partners Portal"}
            <LogIn className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
