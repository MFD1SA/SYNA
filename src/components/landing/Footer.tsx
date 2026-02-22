import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/60 bg-card py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="text-center md:text-start">
            <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg doma-gradient">
                <span className="text-xs font-medium text-primary-foreground">D</span>
              </div>
              <span className="text-lg font-medium text-foreground">DOMA</span>
            </div>
            <p className="text-sm font-light text-muted-foreground">
              {t.footer.version} — {t.footer.company}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-light text-muted-foreground">
            <Link to="/terms" className="rounded-lg px-2 py-1 transition-colors hover:bg-surface hover:text-foreground">{t.nav.terms}</Link>
            <Link to="/privacy" className="rounded-lg px-2 py-1 transition-colors hover:bg-surface hover:text-foreground">{t.nav.privacy}</Link>
            <Link to="/usage-policy" className="rounded-lg px-2 py-1 transition-colors hover:bg-surface hover:text-foreground">{t.nav.usage}</Link>
            <Link to="/about" className="rounded-lg px-2 py-1 transition-colors hover:bg-surface hover:text-foreground">{t.nav.about}</Link>
          </div>

          <div className="flex items-center gap-2 text-sm font-light text-muted-foreground">
            <Phone className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <span dir="ltr">{t.footer.phone}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6">
          <p className="text-center text-xs font-light text-muted-foreground">
            © {new Date().getFullYear()} {t.footer.company}. {t.footer.rights}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
