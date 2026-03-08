import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { UserCheck, Search, Send, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorksSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const steps = [
    { num: "01", icon: UserCheck, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
    { num: "02", icon: Search, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
    { num: "03", icon: Send, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
    { num: "04", icon: TrendingUp, titleKey: "step4Title" as const, descKey: "step4Desc" as const },
  ];

  return (
    <section id="how-it-works" className="relative bg-[hsl(210,28%,6%)] py-14 md:py-18">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.1)] to-transparent" />
        <div className="absolute bottom-1/3 start-[5%] h-[350px] w-[350px] rounded-full bg-[hsl(200,80%,40%,0.03)] blur-[120px]" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-medium text-white md:text-4xl lg:text-5xl">
            {t.howItWorks.title}
          </h2>
          <p className="text-base font-light text-[hsl(210,15%,50%)] md:text-lg">
            {t.howItWorks.subtitle}
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 md:grid-cols-2">
            {steps.map(({ num, icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex gap-5 overflow-hidden rounded-2xl border border-[hsl(210,22%,12%)] bg-gradient-to-br from-[hsl(210,28%,8%)] to-[hsl(210,28%,6%)] p-6 transition-all duration-500 hover:border-[hsl(200,80%,45%,0.25)] hover:shadow-[0_12px_40px_-10px_hsl(200,80%,50%,0.08)]"
              >
                {/* Number watermark */}
                <div className="pointer-events-none absolute -end-4 -bottom-4 text-7xl font-bold text-[hsl(200,80%,45%,0.03)] transition-all duration-500 group-hover:text-[hsl(200,80%,45%,0.06)]">
                  {num}
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.15)] bg-[hsl(200,80%,45%,0.06)] text-sm font-medium text-[hsl(200,80%,60%)] transition-all duration-400 group-hover:border-[hsl(200,80%,45%,0.3)] group-hover:bg-[hsl(200,80%,45%,0.1)] group-hover:shadow-[0_0_20px_-5px_hsl(200,80%,50%,0.2)]">
                  {num}
                </div>
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
                    <h3 className="text-base font-medium text-white">
                      {t.howItWorks[titleKey]}
                    </h3>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-[hsl(210,15%,50%)]">
                    {t.howItWorks[descKey]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
