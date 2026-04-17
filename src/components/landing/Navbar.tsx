import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, Landmark, Building2 } from "lucide-react";
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
    { to: "/", label: isAr ? "الرئيسية" : "Home" },
    { to: "/about", label: isAr ? "من نحن" : "About" },
    { to: "/partnerships", label: isAr ? "شراكات التطوير" : "Partnerships" },
    { to: "/blog", label: isAr ? "المدونة" : "Blog" },
    { to: "/contact", label: isAr ? "تواصل معنا" : "Contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 start-0 end-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/98 backdrop-blur-lg shadow-md shadow-black/[0.04] border-b border-gray-100"
            : "bg-white border-b border-gray-50"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="container flex items-center justify-between h-[72px]">
          {/* Desktop Nav - Start side */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-[13px] font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === to
                    ? "text-[#2B4C66]"
                    : "text-gray-500 hover:text-[#1E374B]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Logo - Center */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logoImg}
              alt="SINA"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-[#2B4C66] px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <Globe className="w-3.5 h-3.5" />
              {isAr ? "EN" : "ع"}
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <Link
              to="/auth/login?type=owner"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-[#2B4C66] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <Landmark className="w-3.5 h-3.5" strokeWidth={1.5} />
              {isAr ? "دخول الملاك" : "Owner Login"}
            </Link>

            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 h-10 px-7 bg-[#2B4C66] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1E374B] shadow-sm shadow-[#2B4C66]/20 hover:shadow-md hover:shadow-[#2B4C66]/25 transition-all duration-300"
            >
              <Building2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              {isAr ? "دخول المطورين" : "Developer Login"}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 pb-6 shadow-lg">
            <div className="container flex flex-col gap-1 pt-4">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`py-3 px-4 text-[14px] font-medium rounded-lg transition-colors ${
                    location.pathname === to
                      ? "text-[#2B4C66]"
                      : "text-gray-600"
                  }`}
                >
                  {label}
                </Link>
              ))}

              <div className="border-t border-gray-100 mt-3 pt-4 flex flex-col gap-2 px-4">
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-2 text-[13px] text-gray-400 py-2 hover:text-[#2B4C66] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {isAr ? "English" : "العربية"}
                </button>

                <Link
                  to="/auth/login?type=owner"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-gray-600 py-2"
                >
                  <Landmark className="w-4 h-4" strokeWidth={1.5} />
                  {isAr ? "دخول الملاك" : "Owner Login"}
                </Link>

                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center gap-2 h-11 bg-[#2B4C66] text-white text-[14px] font-semibold rounded-lg mt-2 shadow-sm hover:bg-[#1E374B] transition-colors"
                >
                  <Building2 className="w-4 h-4" strokeWidth={1.5} />
                  {isAr ? "دخول المطورين" : "Developer Login"}
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
