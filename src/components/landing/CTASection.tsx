import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Crown, Building2, ShieldCheck,
} from "lucide-react";

const CTASection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section
      className="relative py-14 md:py-20 lg:py-28 overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F1F2E] via-[#1E374B] to-[#0F1F2E]" />

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute -top-32 start-1/3 w-[600px] h-[400px] bg-[#C2A86B]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 end-1/4 w-[500px] h-[400px] bg-[#2B4C66]/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[36px] md:text-[52px] lg:text-[60px] font-bold text-white mb-4 md:mb-6 tracking-tight leading-[1.1] md:leading-[1.05]">
            {t.ctaFinal.title}
          </h2>

          <p className="text-[14.5px] sm:text-[17px] md:text-[19px] text-white/70 max-w-2xl mx-auto mt-5 md:mt-6 mb-8 md:mb-12 leading-[1.75] md:leading-[1.7]">
            {t.ctaFinal.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="group inline-flex items-center justify-center gap-3 h-[54px] md:h-[58px] px-7 md:px-9 bg-white text-[#1E374B] text-[13.5px] md:text-[14px] font-bold rounded-2xl shadow-[0_10px_40px_-12px_rgba(255,255,255,0.3)] hover:shadow-[0_14px_44px_-10px_rgba(255,255,255,0.45)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Crown className="w-5 h-5 text-[#2B4C66] group-hover:text-[#A88A4A] transition-colors" strokeWidth={1.6} />
              {isAr ? "دخول الملاك" : "Owner Login"}
              <Arrow className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>
            <button
              onClick={() => navigate("/auth/login")}
              className="group inline-flex items-center justify-center gap-3 h-[54px] md:h-[58px] px-7 md:px-9 bg-gradient-to-r from-[#C2A86B] to-[#A88A4A] text-white text-[13.5px] md:text-[14px] font-bold rounded-2xl shadow-[0_10px_40px_-12px_rgba(194,168,107,0.5)] hover:shadow-[0_14px_44px_-10px_rgba(194,168,107,0.65)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Building2 className="w-5 h-5" strokeWidth={1.6} />
              {isAr ? "دخول المطورين" : "Developer Login"}
              <Arrow className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>
          </div>

          {/* Trust indicator */}
          <div className="mt-10 flex items-center justify-center gap-2 text-[12px] text-white/55">
            <ShieldCheck className="w-4 h-4 text-[#D7C084]" strokeWidth={1.5} />
            <span>
              {isAr
                ? "تفعيل فوري • بدون رسوم اشتراك • بياناتك محمية ومشفرة"
                : "Instant activation • No subscription fees • Your data is protected"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
