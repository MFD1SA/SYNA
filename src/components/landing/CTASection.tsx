import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Landmark, Building2 } from "lucide-react";

const CTASection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();

  return (
    <section className="relative py-14 lg:py-20 overflow-hidden bg-white border-t border-gray-100" dir={isAr ? "rtl" : "ltr"}>
      <div className="container relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight">
          {t.ctaFinal.title}
        </h2>
        <p className="text-[16px] text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">
          {t.ctaFinal.subtitle}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate("/auth/login?type=owner")}
            className="inline-flex items-center gap-2.5 h-14 px-10 bg-[#1E374B] text-white text-[15px] font-semibold rounded-xl shadow-lg shadow-black/15 hover:shadow-xl hover:shadow-black/20 hover:bg-[#2B4C66] transition-all duration-300"
          >
            <Landmark className="w-5 h-5" strokeWidth={1.5} />
            {isAr ? "دخول الملاك" : "Owner Login"}
          </button>
          <button
            onClick={() => navigate("/auth/login")}
            className="inline-flex items-center gap-2.5 h-14 px-10 bg-emerald-600 text-white text-[15px] font-semibold rounded-xl shadow-lg shadow-emerald-600/15 hover:shadow-xl hover:bg-emerald-700 transition-all duration-300"
          >
            <Building2 className="w-5 h-5" strokeWidth={1.5} />
            {isAr ? "دخول المطورين" : "Developer Login"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
