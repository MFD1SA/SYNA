import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Crown, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import heroHomeImg from "@/assets/hero-home.jpg";

/**
 * Homepage hero — image is shown AS-IS:
 *   • No crop, no zoom, no filter, no overlay, no tint.
 *   • No DB fallback / no useHeroImage override.
 * Layout: split — copy on one side, image on the other (both visible in full).
 */
const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const highlights = isAr
    ? ["حوكمة كاملة", "خصوصية محمية", "شفافية مطلقة"]
    : ["Full Governance", "Protected Privacy", "Absolute Transparency"];

  return (
    <section
      className="relative bg-[#0F1F2E] overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Split layout: content + image. Image is displayed natively (no transform). */}
      <div className="container relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-24 md:pt-28 lg:pt-32 pb-14 md:pb-20 lg:pb-24">
        {/* Copy column */}
        <div className="order-2 lg:order-1">
          <h1 className="text-[34px] sm:text-[42px] md:text-[54px] lg:text-[64px] font-bold text-white leading-[1.1] tracking-tight mb-5 md:mb-6">
            {t.hero.title}
          </h1>

          <p className="text-[15px] sm:text-[16.5px] md:text-[18px] text-white/75 leading-[1.8] max-w-xl mt-5 md:mt-6">
            {t.hero.subtitle}
          </p>

          {/* Highlights */}
          <div className="mt-7 md:mt-9 flex flex-wrap gap-x-5 gap-y-2.5">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-[12.5px] md:text-[13px] text-white/80">
                <CheckCircle2 className="w-4 h-4 text-[#D7C084] shrink-0" strokeWidth={2} />
                <span className="font-medium">{h}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="group inline-flex items-center justify-center gap-2.5 h-[54px] px-7 bg-gradient-to-r from-[#C2A86B] to-[#A88A4A] text-white text-[14px] font-bold rounded-xl shadow-[0_10px_30px_-10px_rgba(194,168,107,0.55)] hover:shadow-[0_14px_36px_-10px_rgba(194,168,107,0.75)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Crown className="w-4 h-4" strokeWidth={2} />
              {isAr ? "دخول الملاك" : "Owner Login"}
              <Arrow className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>

            <button
              onClick={() => navigate("/auth/login")}
              className="group inline-flex items-center justify-center gap-2.5 h-[54px] px-7 bg-white/[0.06] border border-white/20 text-white text-[14px] font-bold rounded-xl backdrop-blur-sm hover:bg-white/[0.12] hover:border-white/35 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Building2 className="w-4 h-4 text-[#D7C084]" strokeWidth={2} />
              {isAr ? "دخول المطورين" : "Developer Login"}
              <Arrow className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>
          </div>

          {/* Trust */}
          <div className="mt-8 md:mt-10 flex items-start gap-2 text-[11.5px] md:text-[12.5px] text-white/55 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#D7C084] shrink-0 mt-0.5" strokeWidth={1.8} />
            <span>
              {isAr
                ? "مرخّصة من الهيئة العامة للعقار (REGA) • حماية بيانات وفق أنظمة المملكة"
                : "Licensed by REGA • Compliant with Saudi data protection laws"}
            </span>
          </div>
        </div>

        {/* Image column — rendered exactly as delivered: no filter / crop / zoom / overlay. */}
        <div className="order-1 lg:order-2">
          <img
            src={heroHomeImg}
            alt="سينا للاستثمارات العقارية"
            className="block w-full h-auto rounded-2xl"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
