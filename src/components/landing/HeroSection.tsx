import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import cityRiyadhImg from "@/assets/city-riyadh.jpg";
import { getHeroImage } from "@/services/siteSettings.service";

const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [bgImage, setBgImage] = useState<string>(cityRiyadhImg);

  useEffect(() => {
    getHeroImage().then((img) => {
      if (img?.url) setBgImage(img.url);
    });
  }, []);

  return (
    <div className="relative min-h-[85vh] flex items-center overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-sina-charcoal/80 via-sina-charcoal/70 to-sina-charcoal/90" />
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.6) saturate(0.8)" }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-20 py-32 lg:py-40">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {t.hero.title}
          </h1>
          <p className="text-base md:text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/auth/register")}
              className="inline-flex items-center gap-2.5 h-12 px-8 bg-white text-sina-charcoal text-[14px] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.hero.cta}
              <Arrow className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/how-it-works")}
              className="inline-flex items-center gap-2.5 h-12 px-8 border border-white/30 text-white text-[14px] font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              {t.hero.secondary}
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-16 pt-10 border-t border-white/10">
            {[
              { value: "120+", label: t.hero.stat1 },
              { value: "350+", label: t.hero.stat2 },
              { value: "85+", label: t.hero.stat3 },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-[12px] text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
