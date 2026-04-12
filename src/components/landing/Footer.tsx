import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const aboutLinks = [
    { to: "/about", label: isAr ? "عن سينا" : "About SINA" },
    { to: "/how-it-works", label: isAr ? "كيف تعمل سينا" : "How It Works" },
    { to: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ" },
    { to: "/contact", label: isAr ? "تواصل معنا" : "Contact" },
  ];

  const stakeholderLinks = [
    { to: "/for-owners", label: isAr ? "للملاك" : "For Owners" },
    { to: "/for-developers", label: isAr ? "للمطورين" : "For Developers" },
    { to: "/opportunities", label: isAr ? "الفرص" : "Opportunities" },
  ];

  const legalLinks = [
    { to: "/terms", label: t.nav.terms },
    { to: "/privacy", label: t.nav.privacy },
    { to: "/usage-policy", label: t.nav.usage },
  ];

  return (
    <footer className="bg-[#F7F9FB] border-t border-gray-200" dir={isAr ? "rtl" : "ltr"}>
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-6">
              <img
                src={logoImg}
                alt="SINA"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-[14px] leading-relaxed text-gray-500 max-w-sm">
              {t.footer.desc}
            </p>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-10">
            {/* About */}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-sina-charcoal mb-5">
                {t.footer.aboutSina}
              </h4>
              <div className="flex flex-col gap-3">
                {aboutLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[13px] text-gray-500 hover:text-sina-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Stakeholders */}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-sina-charcoal mb-5">
                {isAr ? "الأطراف" : "Stakeholders"}
              </h4>
              <div className="flex flex-col gap-3">
                {stakeholderLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[13px] text-gray-500 hover:text-sina-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-sina-charcoal mb-5">
                {t.footer.legal}
              </h4>
              <div className="flex flex-col gap-3">
                {legalLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[13px] text-gray-500 hover:text-sina-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <p className="text-[12px] text-gray-400">
            &copy; {new Date().getFullYear()} SINA. {t.footer.rights}.
          </p>
          <p className="text-[12px] text-gray-400">
            {isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
