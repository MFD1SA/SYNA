import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LayoutGrid, Eye, Gem, Bell, ShieldCheck, Building2 } from "lucide-react";

const AdvantagesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const items = [
    { icon: LayoutGrid, title: t.advantages.adv1, desc: t.advantages.adv1Desc },
    { icon: Eye, title: t.advantages.adv2, desc: t.advantages.adv2Desc },
    { icon: Gem, title: t.advantages.adv3, desc: t.advantages.adv3Desc },
    { icon: Bell, title: t.advantages.adv4, desc: t.advantages.adv4Desc },
    { icon: ShieldCheck, title: t.advantages.adv5, desc: t.advantages.adv5Desc },
    { icon: Building2, title: t.advantages.adv6, desc: t.advantages.adv6Desc },
  ];

  return (
    <section className="py-16 lg:py-20 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-4">
            {t.advantages.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.advantages.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-7 border border-gray-100 hover:border-sina-blue/15 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-sina-blue/8 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-sina-blue" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-semibold text-sina-charcoal mb-2">
                {item.title}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
