import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Landmark, Building2 } from "lucide-react";
import cityRiyadhImg from "@/assets/city-riyadh.jpg";
import { getHeroImage } from "@/services/siteSettings.service";
import { useHeroImage } from "@/hooks/useHeroImage";

const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [bgImage, setBgImage] = useState<string>(cityRiyadhImg);

  // New visual content system (takes priority)
  const { heroImage: dynamicHero } = useHeroImage("home");

  // Legacy hero image support (old system from AdminContent)
  const [legacyLoaded, setLegacyLoaded] = useState(false);

  useEffect(() => {
    getHeroImage().then((img) => {
      if (img?.url) setBgImage(img.url);
      setLegacyLoaded(true);
    });
  }, []);

  // Priority: new system → legacy system → static fallback
  const resolvedBg = dynamicHero?.desktop || bgImage;

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0F1F2E]/90 via-[#0F1F2E]/75 to-[#0F1F2E]/60" />
        <picture>
          {dynamicHero?.mobile && (
            <source media="(max-width: 768px)" srcSet={dynamicHero.mobile} />
          )}
          <img
            src={resolvedBg}
            alt={isAr ? (dynamicHero?.alt_ar || "") : (dynamicHero?.alt_en || "")}
            className="w-full h-full object-cover scale-105"
            style={{ filter: "brightness(0.55) saturate(0.85)" }}
          />
        </picture>
      </div>

      {/* Subtle decorative elements */}
      <div className="absolute inset-0 z-10 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "48px 48px" }} />

      {/* Content */}
      <div className="container relative z-20 py-28 lg:py-36">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.08] tracking-tight mb-7">
            {t.hero.title}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-12 max-w-xl">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="inline-flex items-center gap-3 h-14 px-10 bg-white text-[#1E374B] text-[15px] font-semibold rounded-xl hover:bg-gray-50 hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
            >
              <Landmark className="w-5 h-5" strokeWidth={1.5} />
              {isAr ? "دخول الملاك" : "Owner Login"}
            </button>
            <button
              onClick={() => navigate("/auth/login")}
              className="inline-flex items-center gap-3 h-14 px-10 border border-white/25 text-white text-[15px] font-semibold rounded-xl hover:bg-white/10 hover:border-white/40 transition-all duration-300"
            >
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
              {isAr ? "دخول المطورين" : "Developer Login"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;
