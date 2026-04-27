import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, Globe, ArrowUpRight,
  Home, Info, Handshake, Newspaper, MessageSquare,
  // Role icons:
  //   Owner     → LandPlot (parcel of land, modern + literal)
  //   Developer → HardHat (construction industry, modern + literal)
  // Replaces the dated Crown (royal) + generic Building2.
  LandPlot, HardHat,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

const Navbar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // True whenever a section marked with `data-nav-theme="dark"` is sitting
  // behind the top edge of the navbar. Lets the logo + links auto-invert
  // (white over dark hero / footer, black over light content body).
  const [overDark, setOverDark] = useState(true);
  const isAr = lang === "ar";
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Section-aware logo theme ─────────────────────────────────────────
  // Watch every `[data-nav-theme="dark"]` section. A section counts as
  // "behind the navbar" when its top edge has scrolled above the navbar
  // band AND its bottom edge is still below it — i.e., the navbar is
  // physically inside that section. We track the set of such sections
  // and flip `overDark` whenever it transitions empty ↔ non-empty.
  useEffect(() => {
    const NAV_HEIGHT = 80; // matches md:h-[72px] + a small buffer
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-nav-theme="dark"]'),
    );
    if (sections.length === 0) {
      setOverDark(false);
      return;
    }

    const intersecting = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) intersecting.add(e.target as HTMLElement);
          else intersecting.delete(e.target as HTMLElement);
        }
        setOverDark(intersecting.size > 0);
      },
      {
        // Sentinel band: the top NAV_HEIGHT pixels of the viewport.
        // A section is "intersecting" only while it overlaps that band.
        rootMargin: `0px 0px -${Math.max(0, window.innerHeight - NAV_HEIGHT)}px 0px`,
        threshold: 0,
      },
    );
    sections.forEach((el) => observer.observe(el));

    // Seed initial state — the observer fires after layout, but on quick
    // route changes we want the first render to be correct too.
    const navTopBand = NAV_HEIGHT;
    const initiallyOverDark = sections.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= navTopBand && r.bottom > 0;
    });
    setOverDark(initiallyOverDark);

    return () => observer.disconnect();
  }, [location.pathname]);

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
          overDark
            ? scrolled
              ? "bg-[#020202]/55 backdrop-blur-xl border-b border-white/10"
              : "bg-gradient-to-b from-black/30 via-black/10 to-transparent backdrop-blur-[2px]"
            : scrolled
              ? "bg-white/95 backdrop-blur-xl shadow-[0_2px_10px_-2px_rgba(15,31,46,0.06)] border-b border-gray-100/80"
              : "bg-white/0"
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
                    ? overDark ? "text-white" : "text-[#020202]"
                    : overDark
                      ? "text-white/85 hover:text-white hover:bg-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                      : "text-gray-500 hover:text-[#020202] hover:bg-gray-50"
                }`}
              >
                {label}
                {location.pathname === to && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#C45A41] to-transparent" />
                )}
              </Link>
            ))}
          </div>

          {/* Logo — auto-inverts to white when sitting over a dark
              section, returns to its native black artwork over light
              content. `brightness-0 invert` paints the logo pure white
              regardless of its original colors, so a single asset
              covers both states without an inverted-twin file. */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logoImg}
              alt="SINA"
              className={`h-8 md:h-10 w-auto object-contain transition-[filter] duration-300 ${
                overDark
                  ? "[filter:brightness(0)_invert(1)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
                  : ""
              }`}
            />
          </Link>

          {/* Desktop — Right side */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={toggleLang}
              className={`inline-flex items-center gap-1.5 text-[12px] font-bold h-9 px-3 rounded-lg transition-all ${
                overDark
                  ? "text-white/90 hover:text-white hover:bg-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  : "text-gray-500 hover:text-[#2B2B2B] hover:bg-gray-50"
              }`}
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={2} />
              {isAr ? "EN" : "ع"}
            </button>

            <div className={`w-px h-5 ${overDark ? "bg-white/20" : "bg-gray-200"}`} />

            <Link
              to="/auth/login?type=owner"
              className={`group inline-flex items-center gap-1.5 text-[13px] font-semibold h-9 px-3.5 rounded-xl transition-all ${
                overDark
                  ? "text-white hover:bg-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  : "text-gray-600 hover:text-[#A24832] hover:bg-[#C45A41]/5"
              }`}
            >
              {/* Owner badge — DOMA Orange gradient pill so the icon
                  reads as a premium ownership signal in either theme. */}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-[#C45A41] to-[#A24832] shadow-[0_2px_6px_-2px_rgba(196,90,65,0.5)]">
                <LandPlot className="w-3 h-3 text-white" strokeWidth={2.2} />
              </span>
              {isAr ? "دخول الملاك" : "Owner Login"}
            </Link>

            <Link
              to="/auth/login"
              className={`group inline-flex items-center gap-2 h-10 px-5 text-[13px] font-bold rounded-xl hover:-translate-y-0.5 transition-all duration-300 ${
                overDark
                  ? "bg-white/10 text-white border border-white/25 backdrop-blur-md hover:bg-white/15 hover:border-white/40"
                  : "bg-gradient-to-r from-[#2B2B2B] to-[#020202] text-white hover:shadow-[0_8px_24px_-8px_rgba(43,76,102,0.55)]"
              }`}
            >
              {/* Developer badge — neutral on dark surface, lifts as a
                  white pill on the dark CTA when over light content. */}
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-md shadow-sm transition-colors ${
                  overDark ? "bg-white/15" : "bg-white/15"
                }`}
              >
                <HardHat className="w-3 h-3 text-white" strokeWidth={2.2} />
              </span>
              {isAr ? "دخول المطورين" : "Developer Login"}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
            </Link>
          </div>

          {/* Mobile — quick actions (lang + menu) */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={toggleLang}
              className={`inline-flex items-center gap-1 text-[11px] font-bold h-9 w-9 rounded-xl transition-all justify-center ${
                overDark
                  ? "text-white/80 bg-white/10 hover:bg-white/20"
                  : "text-gray-500 hover:text-[#2B2B2B] hover:bg-gray-100"
              }`}
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`inline-flex items-center justify-center h-9 w-9 rounded-xl transition-colors ${
                overDark
                  ? "bg-white/10 hover:bg-white/20 text-white/80"
                  : "bg-[#2B2B2B]/5 hover:bg-[#2B2B2B]/10 text-[#020202]"
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
                        ? "bg-gradient-to-r from-[#2B2B2B]/10 to-[#C45A41]/5 text-[#020202] font-bold"
                        : "text-gray-700 font-semibold hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-xl ${
                        isActive
                          ? "bg-gradient-to-br from-[#2B2B2B] to-[#020202] text-white"
                          : "bg-gray-100 text-[#2B2B2B]"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <span className="text-[14.5px] flex-1">{label}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C45A41]" />
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
                className="flex items-center gap-3 w-full h-[60px] px-4 rounded-2xl border border-[#C45A41]/25 bg-gradient-to-br from-[#C45A41]/[0.06] to-[#C45A41]/[0.02] hover:from-[#C45A41]/10 hover:to-[#C45A41]/5 transition-all"
              >
                <span className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#C45A41] to-[#A24832] shadow-[0_6px_16px_-6px_rgba(196,90,65,0.55)] ring-1 ring-[#C45A41]/30 shrink-0">
                  <LandPlot className="w-5 h-5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/15 to-white/0 pointer-events-none" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#A24832]">
                    {isAr ? "للملاك" : "FOR OWNERS"}
                  </p>
                  <p className="text-[14px] font-bold text-[#020202] truncate">
                    {isAr ? "دخول الملاك" : "Owner Login"}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#A24832]" strokeWidth={2.2} />
              </Link>

              <Link
                to="/auth/login"
                className="flex items-center gap-3 w-full h-[60px] px-4 rounded-2xl bg-gradient-to-r from-[#2B2B2B] to-[#020202] text-white shadow-[0_8px_24px_-8px_rgba(43,76,102,0.55)]"
              >
                <span className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/25 shadow-inner shrink-0">
                  <HardHat className="w-5 h-5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/70">
                    {isAr ? "للمطورين" : "FOR DEVELOPERS"}
                  </p>
                  <p className="text-[14px] font-bold truncate">
                    {isAr ? "دخول المطورين" : "Developer Login"}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/80" strokeWidth={2.2} />
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[11px] text-gray-400">
              {isAr
                ? "سينا للاستثمارات العقارية — شراكات موثّقة"
                : "SINA — Documented Partnerships"}
            </p>
          </div>
        </div>
      </div>

      {/* No spacer: public heroes (HeroSection/InnerHero/PageHeader) already reserve
          enough top padding so content clears the fixed navbar without a white strip. */}
    </>
  );
};

export default Navbar;
