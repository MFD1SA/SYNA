import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Hammer } from "lucide-react";

const CategoriesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const categories = [
    {
      icon: Building2,
      title: t.categories.owners.title,
      desc: t.categories.owners.desc,
      cta: t.categories.owners.cta,
      to: "/for-owners",
      borderColor: "border-t-[#2B4C66]",
    },
    {
      icon: Hammer,
      title: t.categories.developers.title,
      desc: t.categories.developers.desc,
      cta: t.categories.developers.cta,
      to: "/for-developers",
      borderColor: "border-t-emerald-500",
    },
  ];

  return (
    <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E374B] mb-4 tracking-tight">
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
              className={`bg-white rounded-xl p-10 border border-gray-100 border-t-2 ${cat.borderColor} hover:shadow-xl hover:shadow-gray-100/60 transition-all duration-300 flex flex-col h-full group`}
            >
              <cat.icon className="w-7 h-7 text-[#2B4C66] mb-7" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-[#1E374B] mb-3">
                {cat.title}
              </h3>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-10 flex-1">
                {cat.desc}
              </p>
              <Link
                to={cat.to}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#2B4C66] hover:gap-3.5 transition-all duration-300"
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
