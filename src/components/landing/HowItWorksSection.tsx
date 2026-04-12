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
    <section className="py-16 lg:py-20 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 start-full w-full h-px bg-gray-200 -z-0" style={{ width: "calc(100% - 44px)", marginInlineStart: "22px" }} />
              )}
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-sina-blue/10 flex items-center justify-center mb-6">
                  <span className="text-[14px] font-bold text-sina-blue">{step.num}</span>
                </div>
                <h3 className="text-[16px] font-semibold text-sina-charcoal mb-3">
                  {step.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
