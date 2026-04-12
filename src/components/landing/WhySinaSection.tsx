import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, ShieldCheck, Lock, Zap } from "lucide-react";

const WhySinaSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const cards = [
    { icon: Eye, title: t.whySina.card1Title, desc: t.whySina.card1Desc },
    { icon: ShieldCheck, title: t.whySina.card2Title, desc: t.whySina.card2Desc },
    { icon: Lock, title: t.whySina.card3Title, desc: t.whySina.card3Desc },
    { icon: Zap, title: t.whySina.card4Title, desc: t.whySina.card4Desc },
  ];

  return (
    <section className="py-16 lg:py-20 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-4">
            {t.whySina.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.whySina.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-[#F7F9FB] rounded-xl p-7 border border-gray-100 hover:border-sina-blue/20 hover:shadow-md transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-lg bg-sina-blue/10 flex items-center justify-center mb-5">
                <card.icon className="w-5 h-5 text-sina-blue" strokeWidth={1.5} />
              </div>
              <h3 className="text-[16px] font-semibold text-sina-charcoal mb-3">
                {card.title}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySinaSection;
