import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Crown, Building2, ShieldCheck } from "lucide-react";
// Iconic Saudi architecture — King Abdullah Financial District (KAFD), Riyadh.
// Night skyline with motion-blurred traffic, unmistakably Saudi.
import heroHomeImg from "@/assets/riyadh-kafd.png";

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
      className="relative bg-[#0F1F2E] overflow-hidden isolate"
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
            ? "bg-gradient-to-l from-[#0F1F2E]/85 via-[#0F1F2E]/55 to-transparent"
            : "bg-gradient-to-r from-[#0F1F2E]/85 via-[#0F1F2E]/55 to-transparent"
        }`}
      />
      {/* Gentle bottom fade for section edge */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0F1F2E]/70 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="container relative z-10 pt-28 md:pt-36 lg:pt-44 pb-20 md:pb-28 lg:pb-36 min-h-[calc(100vh-72px)] flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-[34px] sm:text-[44px] md:text-[56px] lg:text-[66px] font-bold text-white leading-[1.1] tracking-tight mb-5 md:mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {t.hero.title}
          </h1>

          <p className="text-[15px] sm:text-[16.5px] md:text-[18px] text-white/85 leading-[1.8] max-w-xl mt-5 md:mt-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
            {t.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="group inline-flex items-center justify-center gap-2.5 h-[54px] px-7 bg-white text-[#1E374B] text-[14px] font-bold rounded-xl shadow-[0_10px_30px_-10px_rgba(255,255,255,0.35)] hover:bg-white/95 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Crown className="w-4 h-4 text-[#A88A4A]" strokeWidth={2} />
              {isAr ? "دخول الملاك" : "Owner Login"}
              <Arrow className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>

            <button
              onClick={() => navigate("/auth/login")}
              className="group inline-flex items-center justify-center gap-2.5 h-[54px] px-7 bg-white/[0.08] border border-white/25 text-white text-[14px] font-bold rounded-xl backdrop-blur-md hover:bg-white/[0.14] hover:border-white/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Building2 className="w-4 h-4 text-white/90" strokeWidth={2} />
              {isAr ? "دخول المطورين" : "Developer Login"}
              <Arrow className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
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
