import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { UserCheck, Compass, Send, Trophy } from "lucide-react";

const HowItWorksSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const steps = [
    { icon: UserCheck, title: t.howItWorks.step1, desc: t.howItWorks.step1Desc },
    { icon: Compass, title: t.howItWorks.step2, desc: t.howItWorks.step2Desc },
    { icon: Send, title: t.howItWorks.step3, desc: t.howItWorks.step3Desc },
    { icon: Trophy, title: t.howItWorks.step4, desc: t.howItWorks.step4Desc },
  ];

  return (
    <section
      className="relative py-14 md:py-20 lg:py-28 bg-[#020202] overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#C45A41]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 start-1/3 w-[500px] h-[500px] bg-[#2B2B2B]/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative">
        <div className="text-center mb-10 md:mb-16 max-w-3xl mx-auto">
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-bold text-white mb-4 md:mb-5 tracking-tight leading-[1.15] md:leading-[1.1]">
            {t.howItWorks.title}
          </h2>
          <p className="text-[14px] md:text-[16px] text-white/65 leading-[1.8] max-w-2xl mx-auto mt-4 md:mt-5">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-5 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-[54px] inset-x-0 z-0 px-20">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C45A41]/30 to-transparent" />
          </div>

          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative z-10 rounded-2xl p-5 md:p-6 lg:p-7 border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.07] hover:border-[#C45A41]/25 transition-all duration-500"
            >
              <step.icon className="mb-5 md:mb-6 w-8 h-8 text-[#D7C084] group-hover:scale-105 transition-transform duration-500" strokeWidth={1.7} />

              <h3 className="text-[16px] md:text-[17px] font-bold text-white mb-2 md:mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-[13px] md:text-[13.5px] text-white/65 leading-[1.85]">
                {step.desc}
              </p>

              {/* Hover accent line */}
              <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C45A41]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
