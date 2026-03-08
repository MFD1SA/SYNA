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
    <footer className="relative overflow-hidden border-t border-[hsl(210,22%,12%)] bg-[hsl(210,30%,3%)]">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.2)] to-transparent" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[hsl(200,80%,40%,0.03)] blur-[100px]" />

      <div className="container relative py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="relative">
                <div className="absolute inset-0 scale-150 rounded-full bg-[hsl(200,80%,45%,0.1)] blur-[20px]" />
                <img src={logoImg} alt="SYNA" className="relative h-20 w-20 object-contain" />
              </div>
              <span className="text-3xl font-medium tracking-tight text-white">SYNA</span>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-[hsl(210,15%,45%)] mb-6">
              {t.footer.desc}
            </p>
            <div className="flex flex-col gap-3">
              <a href="mailto:info@syna.sa" className="group flex items-center gap-2.5 text-sm text-[hsl(210,15%,45%)] transition-colors hover:text-[hsl(200,80%,60%)]">
                <Mail className="h-4 w-4" />
                <span>info@syna.sa</span>
              </a>
              <div className="flex items-center gap-2.5 text-sm text-[hsl(210,15%,45%)]">
                <MapPin className="h-4 w-4" />
                <span>{isAr ? "المملكة العربية السعودية" : "Saudi Arabia"}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="mb-5 text-sm font-medium uppercase tracking-wider text-[hsl(210,15%,55%)]">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h4>
            <div className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex w-fit items-center gap-1.5 text-sm font-light text-[hsl(210,15%,45%)] transition-all duration-300 hover:text-white"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="mb-5 text-sm font-medium uppercase tracking-wider text-[hsl(210,15%,55%)]">
              {isAr ? "قانوني" : "Legal"}
            </h4>
            <div className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="w-fit text-sm font-light text-[hsl(210,15%,45%)] transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA column */}
          <div className="md:col-span-3">
            <h4 className="mb-5 text-sm font-medium uppercase tracking-wider text-[hsl(210,15%,55%)]">
              {isAr ? "ابدأ الآن" : "Get Started"}
            </h4>
            <p className="mb-5 text-sm font-light leading-relaxed text-[hsl(210,15%,45%)]">
              {isAr
                ? "انضم إلى منظومة الشراكات التطويرية وحوّل أرضك إلى مشروع منتج"
                : "Join the development partnerships ecosystem and turn your land into a productive project"}
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white syna-gradient transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(200,80%,50%,0.3)] hover:scale-[1.02]"
            >
              {isAr ? "بوابة الشركاء" : "Partners Portal"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[hsl(210,22%,10%)] pt-8 md:flex-row">
          <p className="text-xs font-light text-[hsl(210,15%,35%)]">
            {isAr
              ? `جميع الحقوق محفوظة لـ شركة سينا © ${new Date().getFullYear()}`
              : `© ${new Date().getFullYear()} SYNA. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
