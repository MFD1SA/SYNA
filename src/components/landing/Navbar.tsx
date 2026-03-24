import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import logoImg from "@/assets/logo.png";

const Navbar: React.FC = () => {
  const { t, lang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerStyle: React.CSSProperties = {
    position: "fixed",
    top: "40px", /* height of TopStrip */
    left: 0,
    right: 0,
    zIndex: 50,
    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    background: scrolled
      ? "hsl(var(--header-bg) / 0.98)"
      : "hsl(var(--header-bg))",
    borderBottom: scrolled
      ? "1px solid hsl(var(--strip-accent) / 0.15)"
      : "1px solid hsl(var(--strip-accent) / 0.08)",
    backdropFilter: scrolled ? "blur(20px)" : "none",
    padding: scrolled ? "14px 0" : "20px 0",
  };

  return (
    <nav style={headerStyle} dir={isAr ? "rtl" : "ltr"}>
      <div className="container flex items-center justify-between">

        {/* ── Brand ── */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            textDecoration: "none",
          }}
        >
          <img
            src={logoImg}
            alt="SYNA"
            style={{
              height: "36px",
              width: "36px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 0.9,
              transition: "opacity 0.2s",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1,
              borderInlineStart: "1px solid hsl(var(--strip-accent) / 0.2)",
              paddingInlineStart: "16px",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.22em",
                color: "hsl(var(--header-fg))",
                lineHeight: 1,
              }}
            >
              SYNA
            </span>
            <span
              style={{
                fontSize: "9px",
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                fontWeight: 500,
                letterSpacing: isAr ? "0.05em" : "0.3em",
                color: "hsl(var(--strip-accent))",
                textTransform: isAr ? "none" : "uppercase",
                lineHeight: 1,
                opacity: 0.85,
              }}
            >
              {isAr ? "للاستثمارات العقارية" : "Real Estate Investments"}
            </span>
          </div>
        </Link>

        {/* ── Nav Links (desktop) ── */}
        <div
          className="hidden md:flex items-center"
          style={{ gap: "40px" }}
        >
          {[
            { to: "/about", label: isAr ? "من نحن" : "About" },
            { to: "/contact", label: isAr ? "تواصل معنا" : "Contact" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="hover-underline"
              style={{
                fontSize: isAr ? "13px" : "10px",
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                fontWeight: isAr ? 500 : 700,
                letterSpacing: isAr ? "0.02em" : "0.22em",
                color: "hsl(var(--header-fg) / 0.5)",
                textTransform: isAr ? "none" : "uppercase",
                textDecoration: "none",
                transition: "color 0.25s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "hsl(var(--strip-accent))")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "hsl(var(--header-fg) / 0.5)")
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Partners Portal CTA ── */}
        <Link
          to="/auth/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: isAr ? "0 24px" : "0 28px",
            height: "42px",
            border: "1px solid hsl(var(--strip-accent) / 0.4)",
            fontSize: isAr ? "12px" : "9px",
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
            fontWeight: isAr ? 600 : 700,
            letterSpacing: isAr ? "0.03em" : "0.25em",
            color: "hsl(var(--header-fg) / 0.85)",
            textTransform: isAr ? "none" : "uppercase",
            textDecoration: "none",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "hsl(var(--strip-accent))";
            el.style.borderColor = "hsl(var(--strip-accent))";
            el.style.color = "hsl(var(--header-bg))";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "transparent";
            el.style.borderColor = "hsl(var(--strip-accent) / 0.4)";
            el.style.color = "hsl(var(--header-fg) / 0.85)";
          }}
        >
          {isAr ? "بوابة الشركاء" : "Partners Portal"}
          <LogIn size={13} style={{ opacity: 0.7 }} />
        </Link>

      </div>
    </nav>
  );
};

export default Navbar;
