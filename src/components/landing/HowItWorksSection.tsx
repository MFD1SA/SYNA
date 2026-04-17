import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { UserCheck, Search, Send, CheckCircle2, Route } from "lucide-react";

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
    <section
      className="relative py-20 lg:py-28 bg-[#0F1F2E] overflow-hidden"
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
      <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#C2A86B]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 start-1/3 w-[500px] h-[500px] bg-[#2B4C66]/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md">
            <Route className="w-3 h-3 text-[#D7C084]" strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/80">
              {isAr ? "العملية" : "The Journey"}
            </span>
          </div>
          <h2 className="text-[34px] md:text-[44px] font-bold text-white mb-5 tracking-tight leading-[1.1]">
            {t.howItWorks.title}
          </h2>
          <div className="mx-auto mb-6 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-[#C2A86B] to-transparent" />
          <p className="text-[16px] text-white/65 leading-[1.8] max-w-2xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-10 inset-x-0 z-0 px-20">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C2A86B]/40 to-transparent" />
          </div>

          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative z-10 rounded-2xl p-6 lg:p-7 border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500"
            >
              {/* Number badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C2A86B] to-[#A88A4A] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(194,168,107,0.45)]">
                    <step.icon className="w-5 h-5 text-white" strokeWidth={1.7} />
                  </div>
                  <div className="absolute -top-1.5 -end-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-white flex items-center justify-center shadow-md">
                    <span className="text-[10px] font-bold text-[#1E374B]" dir="ltr">{step.num}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-[17px] font-bold text-white mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-[13.5px] text-white/60 leading-[1.85]">
                {step.desc}
              </p>

              {/* Hover accent line */}
              <div className="absolute inset-x-6 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#C2A86B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
