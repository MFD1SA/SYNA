import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const quickLinks = [
    { to: "/about", label: t.nav.about },
    { to: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ" },
    { to: "/subscriptions", label: isAr ? "الشراكات" : "Partnerships" },
    { to: "/contact", label: isAr ? "تواصل معنا" : "Contact Us" },
  ];

  const legalLinks = [
    { to: "/terms", label: t.nav.terms },
    { to: "/privacy", label: t.nav.privacy },
    { to: "/usage-policy", label: t.nav.usage },
  ];

  return (
    <footer className="relative bg-card border-t border-border/40 overflow-hidden">
      <div className="container relative py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <img src={logoImg} alt="SYNA" className="h-16 w-16 object-contain" />
              <span className="text-2xl font-semibold tracking-tight text-foreground">SYNA</span>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-muted-foreground mb-8">
              {t.footer.desc}
            </p>
            <div className="flex flex-col gap-4">
              <a href="mailto:info@syna.sa" className="group flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary">
                <Mail className="h-4 w-4" />
                <span>info@syna.sa</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{isAr ? "المملكة العربية السعودية" : "Saudi Arabia"}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-foreground">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h4>
            <div className="flex flex-col gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex w-fit items-center gap-2 text-sm font-light text-muted-foreground transition-colors hover:text-primary"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:opacity-100 rtl:group-hover:-translate-x-1 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-foreground">
              {isAr ? "قانوني" : "Legal"}
            </h4>
            <div className="flex flex-col gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="w-fit text-sm font-light text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA column */}
          <div className="md:col-span-3">
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-foreground">
              {isAr ? "ابدأ الآن" : "Get Started"}
            </h4>
            <p className="mb-6 text-sm font-light leading-relaxed text-muted-foreground">
              {isAr
                ? "انضم إلى منظومة الشراكات التطويرية والمساهمات العقارية وحوّل أرضك إلى مشروع منتج"
                : "Join the development partnerships & contributions ecosystem and turn your land into a productive project"}
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5"
            >
              {isAr ? "بوابة النظام" : "Platform Access"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 md:flex-row">
          <p className="text-xs font-light text-muted-foreground" dir="ltr">
            {isAr
              ? `© ${new Date().getFullYear()} SYNA. جميع الحقوق محفوظة.`
              : `© ${new Date().getFullYear()} SYNA. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
