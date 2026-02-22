import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="container">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="text-center md:text-start">
            <p className="text-lg font-medium text-primary">DOMA</p>
            <p className="text-sm font-light text-muted-foreground">
              {t.footer.version} — {t.footer.company}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-light text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">{t.nav.terms}</Link>
            <Link to="/privacy" className="hover:text-foreground">{t.nav.privacy}</Link>
            <Link to="/usage-policy" className="hover:text-foreground">{t.nav.usage}</Link>
            <Link to="/about" className="hover:text-foreground">{t.nav.about}</Link>
          </div>

          <div className="flex items-center gap-2 text-sm font-light text-muted-foreground">
            <Phone className="h-4 w-4" strokeWidth={1.5} />
            <span dir="ltr">{t.footer.phone}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-light text-muted-foreground">
          © {new Date().getFullYear()} {t.footer.company}. {t.footer.rights}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
