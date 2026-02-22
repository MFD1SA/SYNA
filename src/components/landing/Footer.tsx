import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const links = [
    { to: "/terms", label: t.nav.terms },
    { to: "/privacy", label: t.nav.privacy },
    { to: "/usage-policy", label: t.nav.usage },
    { to: "/about", label: t.nav.about },
    { to: "/subscriptions", label: t.nav.subscriptions },
  ];

  return (
    <footer className="border-t border-border/60 bg-card/80">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="DOMA" className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-lg font-medium text-foreground">DOMA</span>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-muted-foreground">
              {isAr
                ? "منصة متكاملة لإدارة العقود والمشاريع العقارية في المملكة العربية السعودية"
                : "An integrated platform for real estate contract & project management in Saudi Arabia"}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <h4 className="mb-1 text-sm font-medium text-foreground">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h4>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="w-fit text-sm font-light text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <h4 className="mb-1 text-sm font-medium text-foreground">
              {isAr ? "تواصل معنا" : "Contact Us"}
            </h4>
            <p className="text-sm font-light text-muted-foreground">
              {isAr ? "البريد الإلكتروني" : "Email"}: info@doma.sa
            </p>
            <p className="text-sm font-light text-muted-foreground">
              {isAr ? "الدعم الفني" : "Support"}: support@doma.sa
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/40 pt-6 md:flex-row md:justify-between">
          <p className="text-xs font-light text-muted-foreground">
            © {new Date().getFullYear()} {t.footer.company}. {t.footer.rights}.
          </p>
          <p className="text-xs font-light text-muted-foreground">
            {t.footer.version}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
