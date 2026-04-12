import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const CTASection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16 lg:py-20 bg-sina-blue" dir={isAr ? "rtl" : "ltr"}>
      <div className="container text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t.ctaFinal.title}
        </h2>
        <p className="text-[15px] text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
          {t.ctaFinal.subtitle}
        </p>
        <button
          onClick={() => navigate("/auth/register")}
          className="inline-flex items-center gap-2.5 h-12 px-10 bg-white text-sina-blue text-[14px] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          {t.ctaFinal.cta}
          <Arrow className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default CTASection;
