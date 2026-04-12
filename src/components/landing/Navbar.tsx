import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import logoImg from "@/assets/logo.png";

const Navbar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAr = lang === "ar";
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/how-it-works", label: isAr ? "كيف تعمل سينا" : "How It Works" },
    { to: "/for-owners", label: isAr ? "للملاك" : "For Owners" },
    { to: "/for-developers", label: isAr ? "للمطورين" : "For Developers" },
    { to: "/opportunities", label: isAr ? "الفرص" : "Opportunities" },
    { to: "/about", label: isAr ? "عن سينا" : "About" },
    { to: "/contact", label: isAr ? "تواصل معنا" : "Contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-white border-b border-gray-50"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="container flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logoImg}
              alt="SINA"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-[13px] font-medium transition-colors hover:text-sina-blue ${
                  location.pathname === to
                    ? "text-sina-blue"
                    : "text-gray-500"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-sina-blue transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {isAr ? "EN" : "ع"}
            </button>

            <Link
              to="/auth/login"
              className="text-[13px] font-medium text-gray-600 hover:text-sina-blue transition-colors"
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>

            <Link
              to="/auth/register"
              className="inline-flex items-center h-10 px-6 bg-sina-blue text-white text-[13px] font-semibold rounded-lg hover:bg-sina-dark-blue transition-colors"
            >
              {isAr ? "ابدأ الآن" : "Get Started"}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-600"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 pb-6">
            <div className="container flex flex-col gap-1 pt-4">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`py-3 px-4 text-[14px] font-medium rounded-lg transition-colors ${
                    location.pathname === to
                      ? "text-sina-blue bg-sina-soft-blue"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}

              <div className="border-t border-gray-100 mt-3 pt-4 flex flex-col gap-2 px-4">
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-2 text-[13px] text-gray-400 py-2"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {isAr ? "English" : "العربية"}
                </button>

                <Link
                  to="/auth/login"
                  className="text-[14px] font-medium text-gray-600 py-2"
                >
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </Link>

                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center h-11 bg-sina-blue text-white text-[14px] font-semibold rounded-lg mt-2"
                >
                  {isAr ? "ابدأ الآن" : "Get Started"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer */}
      <div className="h-[72px]" />
    </>
  );
};

export default Navbar;
