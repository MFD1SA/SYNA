import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Layers, ScanEye, Sparkles, BellRing, BadgeCheck, Building } from "lucide-react";

const AdvantagesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const items = [
    { icon: Layers, title: t.advantages.adv1, desc: t.advantages.adv1Desc },
    { icon: ScanEye, title: t.advantages.adv2, desc: t.advantages.adv2Desc },
    { icon: Sparkles, title: t.advantages.adv3, desc: t.advantages.adv3Desc },
    { icon: BellRing, title: t.advantages.adv4, desc: t.advantages.adv4Desc },
    { icon: BadgeCheck, title: t.advantages.adv5, desc: t.advantages.adv5Desc },
    { icon: Building, title: t.advantages.adv6, desc: t.advantages.adv6Desc },
  ];

  return (
    <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E374B] mb-4 tracking-tight">
            {t.advantages.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.advantages.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-7 border border-gray-100 border-s-2 border-s-[#2B4C66]/80 hover:shadow-lg hover:shadow-gray-100/60 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <item.icon className="w-5 h-5 text-[#2B4C66] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#1E374B] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
