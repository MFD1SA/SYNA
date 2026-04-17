import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { UserCheck, Search, Send, CheckCircle2 } from "lucide-react";

const HowItWorksSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const steps = [
    { num: "01", icon: UserCheck, title: t.howItWorks.step1, desc: t.howItWorks.step1Desc },
    { num: "02", icon: Search, title: t.howItWorks.step2, desc: t.howItWorks.step2Desc },
    { num: "03", icon: Send, title: t.howItWorks.step3, desc: t.howItWorks.step3Desc },
    { num: "04", icon: CheckCircle2, title: t.howItWorks.step4, desc: t.howItWorks.step4Desc },
  ];

  return (
    <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E374B] mb-4 tracking-tight">
            {t.howItWorks.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line across all steps */}
          <div className="hidden lg:block absolute top-7 inset-x-0 z-0 px-16">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#2B4C66]/20 via-[#2B4C66]/10 to-[#2B4C66]/20 rounded-full" />
          </div>

          {steps.map((step, i) => (
            <div key={i} className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-[#2B4C66] flex items-center justify-center mb-6 shadow-lg shadow-[#2B4C66]/20">
                <span className="text-[14px] font-bold text-white">{step.num}</span>
              </div>
              <h3 className="text-[16px] font-semibold text-[#1E374B] mb-3">
                {step.title}
              </h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
