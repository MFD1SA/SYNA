import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShieldCheck, Eye, Handshake, Video, Zap, ArrowLeft, ArrowRight } from "lucide-react";

const features = [
  { key: "verification" as const, icon: ShieldCheck },
  { key: "privacy" as const, icon: Eye },
  { key: "dealCrm" as const, icon: Handshake },
  { key: "meetings" as const, icon: Video },
];

const FeaturesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section id="features" className="relative py-6 md:py-8">
      <div className="container relative">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="mb-2 text-3xl font-medium text-foreground md:text-4xl">
            {t.features.title}
          </h2>
          <p className="text-base font-light text-muted-foreground">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon }) => (
            <div key={key} className="group relative overflow-hidden doma-card p-5">
              <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.04] transition-all duration-300 group-hover:scale-150 group-hover:bg-primary/[0.06]" />
              <div className="relative">
                <Icon className="mb-3 h-6 w-6 text-primary" strokeWidth={1.5} />
                <h3 className="mb-1.5 text-base font-medium text-foreground">
                  {t.features[key]}
                </h3>
                <p className="mb-2 text-sm font-light leading-relaxed text-muted-foreground">
                  {t.features[`${key}Desc`]}
                </p>
                <div className="flex items-center gap-1 text-xs font-light text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span>{isAr ? "اكتشف المزيد" : "Learn more"}</span>
                  <Arrow className="h-3 w-3" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
