import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Hammer, Landmark, CheckCircle2 } from "lucide-react";

const CategoriesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const categories = [
    {
      icon: Landmark,
      title: t.categories.owners.title,
      desc: t.categories.owners.desc,
      cta: t.categories.owners.cta,
      to: "/for-owners",
      accent: "gold",
      features: isAr
        ? ["خصوصية تامة", "عوائد مضاعفة", "تحكم كامل"]
        : ["Total privacy", "Multiplied returns", "Full control"],
    },
    {
      icon: Building2,
      title: t.categories.developers.title,
      desc: t.categories.developers.desc,
      cta: t.categories.developers.cta,
      to: "/for-developers",
      accent: "blue",
      features: isAr
        ? ["فرص مؤهلة", "شراكات شفافة", "دورة مسرَّعة"]
        : ["Qualified deals", "Transparent partnerships", "Accelerated cycle"],
    },
  ];

  return (
    <section
      className="relative py-20 lg:py-24 bg-gradient-to-b from-[#F7F9FB] via-white to-[#F7F9FB] overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Decorative orbs */}
      <div className="absolute top-20 start-20 w-72 h-72 rounded-full bg-[#C2A86B]/[0.08] blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 end-20 w-72 h-72 rounded-full bg-[#2B4C66]/[0.08] blur-3xl pointer-events-none" />

      <div className="container relative">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full border border-[#2B4C66]/15 bg-white">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C2A86B]" />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#2B4C66]">
              {isAr ? "منصة للجميع" : "For Everyone"}
            </span>
          </div>
          <h2 className="text-[34px] md:text-[44px] font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
            {t.categories.title}
          </h2>
          <div className="mx-auto mb-6 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-[#C2A86B] to-transparent" />
          <p className="text-[16px] text-gray-600 leading-[1.8] max-w-2xl mx-auto">
            {t.categories.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-7 max-w-5xl mx-auto">
          {categories.map((cat, i) => {
            const isGold = cat.accent === "gold";
            return (
              <Link
                key={i}
                to={cat.to}
                className="group relative bg-white rounded-3xl p-8 lg:p-10 border border-gray-100 hover:border-gray-200 hover:shadow-[0_24px_60px_-24px_rgba(15,31,46,0.22)] hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                {/* Top gradient bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    isGold
                      ? "bg-gradient-to-r from-[#C2A86B] via-[#D7C084] to-transparent"
                      : "bg-gradient-to-r from-[#2B4C66] via-[#3A6088] to-transparent"
                  }`}
                />

                {/* Corner glow */}
                <div
                  className={`absolute -top-20 -end-20 w-60 h-60 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    isGold ? "bg-[#C2A86B]/20" : "bg-[#2B4C66]/15"
                  }`}
                />

                {/* Icon */}
                <div className="relative mb-8 flex items-center justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(15,31,46,0.3)] ${
                      isGold
                        ? "bg-gradient-to-br from-[#C2A86B] to-[#A88A4A]"
                        : "bg-gradient-to-br from-[#2B4C66] to-[#1E374B]"
                    }`}
                  >
                    <cat.icon className="w-6 h-6 text-white" strokeWidth={1.7} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-[0.14em] uppercase ${isGold ? "text-[#A88A4A]" : "text-[#2B4C66]"}`}>
                    {i === 0 ? (isAr ? "للملاك" : "FOR OWNERS") : (isAr ? "للمطورين" : "FOR DEVELOPERS")}
                  </span>
                </div>

                <h3 className="relative text-[22px] lg:text-[26px] font-bold text-[#1E374B] mb-4 tracking-tight">
                  {cat.title}
                </h3>
                <p className="relative text-[14px] text-gray-600 leading-[1.85] mb-7">
                  {cat.desc}
                </p>

                {/* Features */}
                <div className="relative flex flex-wrap gap-x-4 gap-y-2 mb-8">
                  {cat.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isGold ? "text-[#C2A86B]" : "text-[#2B4C66]"}`} strokeWidth={2} />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="relative inline-flex items-center gap-2 text-[13px] font-bold text-[#1E374B] group-hover:gap-3.5 transition-all duration-300">
                  <span className={isGold ? "group-hover:text-[#A88A4A]" : "group-hover:text-[#2B4C66]"}>
                    {cat.cta}
                  </span>
                  <Arrow className={`w-4 h-4 ${isGold ? "text-[#C2A86B]" : "text-[#2B4C66]"}`} strokeWidth={2} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
