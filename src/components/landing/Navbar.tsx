import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, Globe, ArrowUpRight,
  Home, Info, Handshake, Newspaper, MessageSquare, Crown, HardHat,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

const Navbar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
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

  // Lock body scroll when mobile open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { to: "/", label: isAr ? "الرئيسية" : "Home", icon: Home },
    { to: "/about", label: isAr ? "من نحن" : "About", icon: Info },
    { to: "/partnerships", label: isAr ? "شراكات التطوير" : "Partnerships", icon: Handshake },
    { to: "/blog", label: isAr ? "المدونة" : "Blog", icon: Newspaper },
    { to: "/contact", label: isAr ? "تواصل" : "Contact", icon: MessageSquare },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 start-0 end-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-[0_2px_10px_-2px_rgba(15,31,46,0.06)] border-b border-gray-100/80"
            : "bg-[#0F1F2E]/20 backdrop-blur-md border-b border-white/10"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="container flex items-center justify-between h-[64px] md:h-[72px]">
          {/* Desktop Nav - Start side */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === to
                    ? scrolled ? "text-[#1E374B]" : "text-white"
                    : scrolled
                      ? "text-gray-500 hover:text-[#1E374B] hover:bg-gray-50"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
                {location.pathname === to && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#C2A86B] to-transparent" />
                )}
              </Link>
            ))}
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logoImg}
              alt="SINA"
              className={`h-8 md:h-10 w-auto object-contain ${
                scrolled ? "" : "drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
              }`}
            />
          </Link>

          {/* Desktop — Right side */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={toggleLang}
              className={`inline-flex items-center gap-1.5 text-[12px] font-bold h-9 px-3 rounded-lg transition-all ${
                scrolled
                  ? "text-gray-500 hover:text-[#2B4C66] hover:bg-gray-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={2} />
              {isAr ? "EN" : "ع"}
            </button>

            <div className={`w-px h-5 ${scrolled ? "bg-gray-200" : "bg-white/20"}`} />

            <Link
              to="/auth/login?type=owner"
              className={`group inline-flex items-center gap-1.5 text-[13px] font-semibold h-9 px-3.5 rounded-xl transition-all ${
                scrolled
                  ? "text-gray-600 hover:text-[#A88A4A] hover:bg-[#C2A86B]/5"
                  : "text-white hover:bg-[#C2A86B]/15"
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${scrolled ? "text-[#C2A86B]" : "text-[#D7C084]"}`} strokeWidth={1.8} />
              {isAr ? "دخول الملاك" : "Owner Login"}
            </Link>

            <Link
              to="/auth/login"
              className={`group inline-flex items-center gap-2 h-10 px-5 bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold rounded-xl hover:shadow-[0_8px_24px_-8px_rgba(43,76,102,0.55)] hover:-translate-y-0.5 transition-all duration-300 ${
                scrolled ? "" : "ring-1 ring-white/20"
              }`}
            >
              <HardHat className="w-3.5 h-3.5" strokeWidth={1.8} />
              {isAr ? "دخول المطورين" : "Developer Login"}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
            </Link>
          </div>

          {/* Mobile — quick actions (lang + menu) */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={toggleLang}
              className={`inline-flex items-center gap-1 text-[11px] font-bold h-9 w-9 rounded-xl transition-all justify-center ${
                scrolled
                  ? "text-gray-500 hover:text-[#2B4C66] hover:bg-gray-100"
                  : "text-white/80 bg-white/10 hover:bg-white/20"
              }`}
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`inline-flex items-center justify-center h-9 w-9 rounded-xl transition-colors ${
                scrolled
                  ? "bg-[#2B4C66]/5 hover:bg-[#2B4C66]/10 text-[#1E374B]"
                  : "bg-white/10 hover:bg-white/20 text-white/80"
              }`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" strokeWidth={2} /> : <Menu className="w-5 h-5" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu — full-screen overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute top-[64px] inset-x-0 bg-white rounded-b-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 ${
            mobileOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="px-5 pt-5 pb-7 max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Nav links — card style */}
            <div className="space-y-1.5">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#2B4C66]/10 to-[#C2A86B]/5 text-[#1E374B] font-bold"
                        : "text-gray-700 font-semibold hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-xl ${
                        isActive
                          ? "bg-gradient-to-br from-[#2B4C66] to-[#1E374B] text-white"
                          : "bg-gray-100 text-[#2B4C66]"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <span className="text-[14.5px] flex-1">{label}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C2A86B]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Auth CTAs */}
            <div className="space-y-2.5">
              <Link
                to="/auth/login?type=owner"
                className="flex items-center gap-3 w-full h-[52px] px-4 rounded-2xl border border-[#C2A86B]/25 bg-gradient-to-br from-[#C2A86B]/[0.06] to-[#C2A86B]/[0.02] hover:from-[#C2A86B]/10 hover:to-[#C2A86B]/5 transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2A86B] to-[#A88A4A] shadow-[0_4px_12px_-4px_rgba(194,168,107,0.5)]">
                  <Crown className="w-4 h-4 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#A88A4A]">
                    {isAr ? "للملاك" : "FOR OWNERS"}
                  </p>
                  <p className="text-[14px] font-bold text-[#1E374B] truncate">
                    {isAr ? "دخول الملاك" : "Owner Login"}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#A88A4A]" strokeWidth={2} />
              </Link>

              <Link
                to="/auth/login"
                className="flex items-center gap-3 w-full h-[52px] px-4 rounded-2xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white shadow-[0_8px_24px_-8px_rgba(43,76,102,0.55)]"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm">
                  <HardHat className="w-4 h-4 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/70">
                    {isAr ? "للمطورين" : "FOR DEVELOPERS"}
                  </p>
                  <p className="text-[14px] font-bold truncate">
                    {isAr ? "دخول المطورين" : "Developer Login"}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/80" strokeWidth={2} />
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[11px] text-gray-400">
              {isAr
                ? "سينا للاستثمارات العقارية — مرخّصة من REGA"
                : "SINA Platform — Licensed by REGA"}
            </p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-[64px] md:h-[72px]" />
    </>
  );
};

export default Navbar;
