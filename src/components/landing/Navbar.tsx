import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Globe, Handshake } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-[hsl(210,22%,14%)] bg-[hsl(210,30%,4%,0.85)] backdrop-blur-xl shadow-[0_4px_30px_-5px_hsl(210,30%,4%,0.5)]" : "bg-transparent"}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 group">
          <img src={logoImg} alt="SYNA" className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xl font-medium tracking-tight text-white/90 transition-colors group-hover:text-white">SYNA</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/about" className="hidden rounded-lg px-3 py-1.5 text-sm text-[hsl(210,15%,60%)] transition-colors hover:bg-[hsl(210,22%,12%)] hover:text-white md:block">
            {t.nav.about}
          </Link>
          <Link to="/contact" className="hidden rounded-lg px-3 py-1.5 text-sm text-[hsl(210,15%,60%)] transition-colors hover:bg-[hsl(210,22%,12%)] hover:text-white md:block">
            {lang === "ar" ? "اتصل بنا" : "Contact Us"}
          </Link>

          <div className="mx-1 hidden h-5 w-px bg-[hsl(210,22%,18%)] md:block" />

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-[hsl(210,15%,60%)] hover:bg-[hsl(210,22%,12%)] hover:text-white">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{t.nav.language}</span>
          </Button>

          <Button size="sm" asChild className="gap-1.5 syna-gradient rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_20px_-5px_hsl(200,80%,50%,0.3)]">
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
