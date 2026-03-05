import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <footer className="border-t border-[hsl(210,22%,14%)] bg-[hsl(210,30%,7%)]">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="SYNA" className="h-8 w-8 object-contain" />
              <span className="text-lg font-medium text-white">SYNA</span>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-[hsl(210,15%,55%)]">
              {t.footer.desc}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2">
            <h4 className="mb-1 text-sm font-medium text-white">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h4>
            {[
              { to: "/about", label: t.nav.about },
              { to: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ" },
              { to: "/subscriptions", label: isAr ? "الشراكات" : "Partnerships" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="w-fit text-sm font-light text-[hsl(210,15%,55%)] transition-colors hover:text-[hsl(200,80%,50%)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2">
            <h4 className="mb-1 text-sm font-medium text-white">
              {isAr ? "قانوني" : "Legal"}
            </h4>
            {[
              { to: "/terms", label: t.nav.terms },
              { to: "/privacy", label: t.nav.privacy },
              { to: "/usage-policy", label: t.nav.usage },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="w-fit text-sm font-light text-[hsl(210,15%,55%)] transition-colors hover:text-[hsl(200,80%,50%)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <h4 className="mb-1 text-sm font-medium text-white">
              {isAr ? "تواصل معنا" : "Contact Us"}
            </h4>
            <Link
              to="/contact"
              className="w-fit text-sm font-light text-[hsl(210,15%,55%)] transition-colors hover:text-[hsl(200,80%,50%)]"
            >
              {isAr ? "نموذج التواصل" : "Contact Form"}
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-[hsl(210,22%,14%)] pt-6 text-center">
          <p className="text-xs font-light text-[hsl(210,15%,45%)]">
            {isAr
              ? `جميع الحقوق محفوظة لـ شركة سينا © ${new Date().getFullYear()}`
              : `All rights reserved for SYNA © ${new Date().getFullYear()}`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
