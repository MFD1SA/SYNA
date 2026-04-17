import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScanEye, ShieldCheck, LockKeyhole, Bolt } from "lucide-react";

const WhySinaSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const cards = [
    { icon: ScanEye, title: t.whySina.card1Title, desc: t.whySina.card1Desc },
    { icon: ShieldCheck, title: t.whySina.card2Title, desc: t.whySina.card2Desc },
    { icon: LockKeyhole, title: t.whySina.card3Title, desc: t.whySina.card3Desc },
    { icon: Bolt, title: t.whySina.card4Title, desc: t.whySina.card4Desc },
  ];

  return (
    <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E374B] mb-4 tracking-tight">
            {t.whySina.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.whySina.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-7 border border-gray-100 hover:shadow-lg hover:shadow-gray-100/80 hover:border-gray-200 transition-all duration-300 group"
            >
              <card.icon className="w-6 h-6 text-[#2B4C66] mb-5" strokeWidth={1.5} />
              <h3 className="text-[16px] font-semibold text-[#1E374B] mb-3">
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
