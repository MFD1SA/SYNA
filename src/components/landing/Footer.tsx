import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const aboutLinks = [
    { to: "/about", label: isAr ? "من نحن" : "About SINA" },
    { to: "/partnerships", label: isAr ? "شراكات التطوير" : "Partnerships" },
    { to: "/blog", label: isAr ? "المدونة" : "Blog" },
  ];

  const stakeholderLinks = [
    { to: "/how-it-works", label: isAr ? "كيف تعمل سينا" : "How It Works" },
    { to: "/offers", label: isAr ? "العروض العقارية" : "Real Estate Offers" },
    { to: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ" },
  ];

  const legalLinks = [
    { to: "/terms", label: t.nav.terms },
    { to: "/privacy", label: t.nav.privacy },
    { to: "/usage-policy", label: t.nav.usage },
  ];

  return (
    <footer data-nav-theme="dark" className="bg-[#020202] text-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container py-10 sm:py-12 lg:py-16">
        <div className="grid gap-10 lg:gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-5 sm:mb-6">
              <img
                src={logoImg}
                alt="SINA"
                className="h-9 sm:h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-[13px] sm:text-[14px] leading-[1.9] text-white/60 max-w-sm">
              {t.footer.desc}
            </p>

            {/* Social media */}
            <div className="flex items-center gap-3 mt-6 sm:mt-8">
              {/* X (Twitter) */}
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
                <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              {/* TikTok */}
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
                <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z" /></svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
                <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-8 grid grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            {/* About */}
            <div className="min-w-0">
              <h4 className="text-[13px] sm:text-[14px] font-bold text-white mb-4 sm:mb-6">
                {t.footer.aboutSina}
              </h4>
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {aboutLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[12px] sm:text-[13px] text-white/50 hover:text-white transition-colors duration-200 break-words"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Stakeholders */}
            <div className="min-w-0">
              <h4 className="text-[13px] sm:text-[14px] font-bold text-white mb-4 sm:mb-6">
                {isAr ? "روابط مفيدة" : "Useful Links"}
              </h4>
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {stakeholderLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[12px] sm:text-[13px] text-white/50 hover:text-white transition-colors duration-200 break-words"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div className="min-w-0">
              <h4 className="text-[13px] sm:text-[14px] font-bold text-white mb-4 sm:mb-6">
                {t.footer.legal}
              </h4>
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {legalLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-[12px] sm:text-[13px] text-white/50 hover:text-white transition-colors duration-200 break-words"
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
      <div className="border-t border-white/10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 py-5 sm:py-6 text-center md:text-start">
          <p className="text-[11px] sm:text-[12px] text-white/40">
            &copy; {new Date().getFullYear()} SINA. {t.footer.rights}.
          </p>
          <p className="text-[11px] sm:text-[12px] text-white/40">
            {isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
