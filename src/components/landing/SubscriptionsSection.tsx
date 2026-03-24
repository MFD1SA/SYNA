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
    <section id="how-it-works" className="relative bg-background py-20 px-4 md:px-0">
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-muted/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? "آلية العمل" : "How It Works"}
          </span>
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg font-light leading-relaxed text-muted-foreground">
            {t.howItWorks.subtitle}
          </p>
        </motion.div>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ num, icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/50 bg-card p-8 shadow-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:-translate-y-1"
              >
                {/* Number watermark */}
                <div className="pointer-events-none absolute -bottom-6 -right-4 text-9xl font-bold text-muted/30 transition-colors duration-500 group-hover:text-primary/10">
                  {num}
                </div>

                <div>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="mb-3 text-lg font-medium text-foreground">
                    {t.howItWorks[titleKey]}
                  </h3>
                  
                  <p className="relative z-10 text-sm font-light leading-relaxed text-muted-foreground">
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
