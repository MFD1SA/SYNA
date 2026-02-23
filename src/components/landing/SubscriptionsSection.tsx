import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { UserCheck, Search, Send, TrendingUp } from "lucide-react";

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
    <section id="how-it-works" className="relative py-10 md:py-12 bg-muted/30">
      <div className="container relative">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="mb-1.5 text-3xl font-medium text-foreground md:text-4xl">
            {t.howItWorks.title}
          </h2>
          <p className="text-base font-light text-muted-foreground">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map(({ num, icon: Icon, titleKey, descKey }) => (
              <div key={num} className="group relative flex gap-4 doma-card p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-primary border border-primary/20 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {num}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <h3 className="text-base font-medium text-foreground">
                      {t.howItWorks[titleKey]}
                    </h3>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">
                    {t.howItWorks[descKey]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
