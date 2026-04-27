import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Crown, Building2, ShieldCheck } from "lucide-react";
// Hero image — modern real-estate development at twilight (3840×2560,
// native 4K). The previous KAFD asset was 640×640 and pixelated on retina
// / 4K screens; this professional architectural shot conveys the
// platform's whole concept (real-estate development partnerships) without
// crop or post-processing, per the brief: "بدون أي تعديل نهائياً وقطيعاً"
// (use as-is, do not modify).
//
// Served from /public/ (not import-bundled) so the URL stays stable and
// can be preloaded from index.html, making the image the actual LCP
// element instead of fighting the JS bundle for paint priority.
const heroHomeImg = "/hero-doma-4k.jpg";

/**
 * Homepage hero — attached image is used as the FULL BACKGROUND of the hero.
 *   • Image covers the entire hero section (width + height).
 *   • No crop beyond object-cover, no zoom, no filter, no color tint.
 *   • A soft readability scrim is applied ONLY on the copy side so text stays legible
 *     without altering the image itself.
 */
const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section
      data-nav-theme="dark"
      className="relative bg-[#020202] overflow-hidden isolate"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Full-bleed background image — covers the entire hero */}
      <img
        src={heroHomeImg}
        alt="سينا للاستثمارات العقارية"
        className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
        loading="eager"
        fetchPriority="high"
        draggable={false}
      />

      {/* Readability scrim — soft, side-anchored so the image is not darkened uniformly */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isAr
            ? "bg-gradient-to-l from-[#020202]/85 via-[#020202]/55 to-transparent"
            : "bg-gradient-to-r from-[#020202]/85 via-[#020202]/55 to-transparent"
        }`}
      />
      {/* Gentle bottom fade for section edge */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020202]/70 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="container relative z-10 pt-28 md:pt-36 lg:pt-44 pb-20 md:pb-28 lg:pb-36 min-h-[calc(100vh-72px)] flex items-center">
        <div className="max-w-2xl">
          <h1 className={`text-[34px] sm:text-[44px] md:text-[56px] lg:text-[66px] font-bold text-white leading-[1.1] tracking-tight mb-5 md:mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${isAr ? "" : "font-display"}`}>
            {t.hero.title}
          </h1>

          {/* Subtitle — opt-in Thmanyah Sans (the only place in the
              entire app that uses this typeface, per the brief). */}
          <p className="font-thmanyah text-[15px] sm:text-[16.5px] md:text-[18px] text-white/85 leading-[1.8] max-w-xl mt-5 md:mt-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
            {t.hero.subtitle}
          </p>

          {/* CTAs.
              Each role gets a colour-coded icon BADGE — a pill with an
              orange (Owner) or charcoal (Developer) gradient surface,
              a halo glow, and a slightly bolder stroke. Reads as a
              visual signal long before the user parses the label. */}
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="group inline-flex items-center justify-center gap-3 h-[58px] px-7 bg-white text-[#020202] text-[14px] font-bold rounded-xl shadow-[0_10px_30px_-10px_rgba(255,255,255,0.35)] hover:bg-white/95 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#C45A41] to-[#A24832] shadow-[0_6px_18px_-6px_rgba(196,90,65,0.65)] ring-1 ring-[#C45A41]/30">
                <Crown className="w-[18px] h-[18px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
                {/* Subtle halo for depth */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/15 to-white/0 pointer-events-none" />
              </span>
              {isAr ? "دخول الملاك" : "Owner Login"}
              <Arrow className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => navigate("/auth/login")}
              className="group inline-flex items-center justify-center gap-3 h-[58px] px-7 bg-white/[0.08] border border-white/25 text-white text-[14px] font-bold rounded-xl backdrop-blur-md hover:bg-white/[0.14] hover:border-white/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-white/25 to-white/10 ring-1 ring-white/30 shadow-[0_6px_18px_-6px_rgba(255,255,255,0.25)]">
                <Building2 className="w-[18px] h-[18px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
                <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
              </span>
              {isAr ? "دخول المطورين" : "Developer Login"}
              <Arrow className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2.2} />
            </button>
          </div>

          {/* Trust */}
          <div className="mt-8 md:mt-10 flex items-start gap-2 text-[11.5px] md:text-[12.5px] text-white/70 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-white/70 shrink-0 mt-0.5" strokeWidth={1.8} />
            <span>
              {isAr
                ? "شراكات موثّقة • حوكمة متكاملة • حماية بيانات وفق أنظمة المملكة"
                : "Documented Partnerships · Integrated Governance · Saudi Data Protection Compliant"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
