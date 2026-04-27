import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScanEye, ShieldCheck, LockKeyhole, Bolt } from "lucide-react";

const WhySinaSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const cards = [
    { icon: ScanEye, title: t.whySina.card1Title, desc: t.whySina.card1Desc, accent: "from-[#2B2B2B]/10 to-[#2B2B2B]/0" },
    { icon: ShieldCheck, title: t.whySina.card2Title, desc: t.whySina.card2Desc, accent: "from-[#C45A41]/15 to-[#C45A41]/0" },
    { icon: LockKeyhole, title: t.whySina.card3Title, desc: t.whySina.card3Desc, accent: "from-emerald-500/10 to-emerald-500/0" },
    { icon: Bolt, title: t.whySina.card4Title, desc: t.whySina.card4Desc, accent: "from-[#2B2B2B]/10 to-[#2B2B2B]/0" },
  ];

  return (
    <section
      className="relative py-14 md:py-20 lg:py-24 bg-gradient-to-b from-white via-[#FAFBFC] to-white overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, #2B2B2B 1px, transparent 1px), linear-gradient(to bottom, #2B2B2B 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="text-center mb-10 md:mb-16 max-w-3xl mx-auto">
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-bold text-[#020202] mb-4 md:mb-5 tracking-tight leading-[1.15] md:leading-[1.1]">
            {t.whySina.title}
          </h2>
          <p className="text-[14px] md:text-[16px] text-gray-600 leading-[1.8] max-w-2xl mx-auto mt-4 md:mt-5">
            {t.whySina.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {cards.map((card, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-5 md:p-7 border border-gray-100 hover:border-[#2B2B2B]/20 hover:shadow-[0_20px_40px_-20px_rgba(43,76,102,0.15)] hover:-translate-y-1 transition-all duration-500 overflow-hidden"
            >
              {/* Hover gradient glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              {/* Icon */}
              <card.icon className="relative mb-4 md:mb-5 w-7 h-7 text-[#2B2B2B] group-hover:text-[#A24832] transition-colors duration-500" strokeWidth={1.7} />

              <h3 className="relative text-[15px] md:text-[17px] font-bold text-[#020202] mb-2 md:mb-3 tracking-tight">
                {card.title}
              </h3>
              <p className="relative text-[13px] md:text-[13.5px] text-gray-600 leading-[1.8] md:leading-[1.85]">
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
