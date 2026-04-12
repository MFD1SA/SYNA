import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Landmark, HardHat } from "lucide-react";

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
      accent: "bg-blue-50 text-blue-600",
    },
    {
      icon: HardHat,
      title: t.categories.developers.title,
      desc: t.categories.developers.desc,
      cta: t.categories.developers.cta,
      to: "/for-developers",
      accent: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-4">
            {t.categories.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.categories.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-8 border border-gray-100 hover:border-sina-blue/20 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className={`w-12 h-12 rounded-lg ${cat.accent} flex items-center justify-center mb-6`}>
                <cat.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-sina-charcoal mb-3">
                {cat.title}
              </h3>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-8 flex-1">
                {cat.desc}
              </p>
              <Link
                to={cat.to}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-sina-blue hover:gap-3 transition-all"
              >
                {cat.cta}
                <Arrow className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
