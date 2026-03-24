import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import cityRiyadhImg from "@/assets/city-riyadh.jpg";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  variant?: "portfolio" | "default";
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();

  return (
    /* Use a div instead of section to avoid global section { py-32 } */
    <div
      style={{
        position: "relative",
        height: "100dvh",
        minHeight: "800px",
        width: "100%",
        overflow: "hidden",
        marginTop: 0,
        marginBottom: 0,
        padding: 0,
        /* Dark fallback — prevents white flash if image is loading */
        background: "hsl(214 52% 8%)",
        display: "block",
      }}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── Cinematic Background ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background:
              "linear-gradient(to bottom, hsl(214 52% 6% / 0.70) 0%, hsl(214 52% 8% / 0.88) 100%)",
          }}
        />
        {/* Side vignette for reading comfort */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            background: isAr
              ? "linear-gradient(to left, hsl(214 52% 6% / 0.5) 0%, transparent 65%)"
              : "linear-gradient(to right, hsl(214 52% 6% / 0.5) 0%, transparent 65%)",
          }}
        />
        <img
          src={cityRiyadhImg}
          alt="Riyadh Skyline"
          style={{
            height: "100%",
            width: "100%",
            objectFit: "cover",
            filter: "grayscale(0.2) brightness(0.72)",
          }}
        />
      </div>

      {/* ── Hero Content ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          /* push content down below TopStrip(40px) + Navbar(~77px) = 117px, then center remainder */
          paddingTop: "60px",
          paddingInline: "clamp(20px, 4vw, 80px)",
        }}
      >
        <div style={{ maxWidth: "700px", width: "100%" }}>

          {/* Eyebrow label */}
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "block",
              marginBottom: "32px",
              fontSize: "10px",
              fontFamily: "'Cairo', 'Inter', sans-serif",
              fontWeight: 600,
              letterSpacing: isAr ? "0.08em" : "0.5em",
              color: "hsl(var(--strip-accent))",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {isAr ? "سينا للاستثمارات العقارية" : "SYNA Real Estate Investments"}
          </motion.span>

          {/* ── Main Headline ── */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              fontSize: isAr
                ? "clamp(40px, 5.5vw, 72px)"
                : "clamp(36px, 5vw, 68px)",
              fontWeight: 700,
              lineHeight: isAr ? 1.3 : 1.05,
              letterSpacing: isAr ? "-0.01em" : "-0.03em",
              color: "#ffffff",
              marginBottom: "40px",
              textWrap: "balance",
              margin: "0 0 40px 0",
            }}
          >
            {isAr ? "استثمارات تُـبنى على الثقة" : "Investments Built on Trust"}
          </motion.h1>

          {/* ── Single CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={() => navigate("/auth?role=owner")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: isAr ? "0 40px" : "0 44px",
                height: "56px",
                background: "hsl(var(--strip-accent))",
                border: "1px solid hsl(var(--strip-accent))",
                fontSize: isAr ? "14px" : "10px",
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: isAr ? "0.04em" : "0.28em",
                color: "hsl(var(--header-bg))",
                textTransform: isAr ? "none" : "uppercase",
                cursor: "pointer",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "transparent";
                el.style.color = "hsl(var(--strip-accent))";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "hsl(var(--strip-accent))";
                el.style.color = "hsl(var(--header-bg))";
              }}
            >
              {isAr ? "استكشف الفرص" : "Explore Opportunities"}
              {isAr
                ? <ArrowLeft size={16} style={{ flexShrink: 0 }} />
                : <ArrowRight size={16} style={{ flexShrink: 0 }} />
              }
            </button>
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "48px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          opacity: 0.3,
        }}
      >
        <div
          style={{
            width: "1px",
            height: "64px",
            background: "linear-gradient(to bottom, hsl(var(--strip-accent)), transparent)",
          }}
        />
      </div>
    </div>
  );
};

export default HeroSection;
