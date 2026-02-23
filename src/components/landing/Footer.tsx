import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const links = [
    { to: "/about", label: t.nav.about },
    { to: "/contact", label: isAr ? "اتصل بنا" : "Contact Us" },
    { to: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ" },
    { to: "/terms", label: t.nav.terms },
    { to: "/privacy", label: t.nav.privacy },
    { to: "/usage-policy", label: t.nav.usage },
  ];

  return (
    <footer className="border-t border-[hsl(210,20%,16%)] bg-[hsl(210,25%,8%)]">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="DOMA" className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-lg font-medium text-white">DOMA</span>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-[hsl(210,15%,55%)]">
              {t.footer.desc}
            </p>
            <p className="text-sm font-medium text-[hsl(187,55%,50%)]">
              {isAr ? "دوما معكم دوماً" : "DOMA — Always with you"}
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
              { to: "/subscriptions", label: isAr ? "الاشتراكات" : "Subscriptions" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="w-fit text-sm font-light text-[hsl(210,15%,55%)] transition-colors hover:text-[hsl(187,55%,50%)]"
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
                className="w-fit text-sm font-light text-[hsl(210,15%,55%)] transition-colors hover:text-[hsl(187,55%,50%)]"
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
            <p className="text-sm font-light text-[hsl(210,15%,55%)]">
              {isAr ? "البريد الإلكتروني" : "Email"}: info@doma.sa
            </p>
            <p className="text-sm font-light text-[hsl(210,15%,55%)]">
              {isAr ? "الدعم الفني" : "Support"}: support@doma.sa
            </p>
            <Link
              to="/contact"
              className="w-fit text-sm font-light text-[hsl(187,55%,50%)] transition-colors hover:text-[hsl(187,55%,65%)]"
            >
              {isAr ? "اتصل بنا" : "Contact Us"} →
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-[hsl(210,20%,16%)] pt-6 text-center">
          <p className="text-xs font-light text-[hsl(210,15%,45%)]">
            {isAr
              ? `جميع الحقوق محفوظة لـ شركة دوما © ${new Date().getFullYear()}`
              : `All rights reserved for DOMA © ${new Date().getFullYear()}`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
