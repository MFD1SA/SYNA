import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Map, FileText, BarChart3, MessageCircle, ArrowLeft, ArrowRight } from "lucide-react";

const features = [
  { key: "map" as const, icon: Map },
  { key: "contracts" as const, icon: FileText },
  { key: "analytics" as const, icon: BarChart3 },
  { key: "communication" as const, icon: MessageCircle },
];

const FeaturesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section id="features" className="relative py-12 md:py-16">
      <div className="container relative">
        {/* Section header */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-medium text-foreground md:text-4xl">
            {t.features.title}
          </h2>
          <p className="text-base font-light text-muted-foreground">
            {isAr
              ? "أدوات متكاملة صُممت خصيصاً لقطاع العقارات في المملكة"
              : "Integrated tools purpose-built for Saudi Arabia's real estate sector"}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon }, idx) => (
            <div
              key={key}
              className="group relative overflow-hidden doma-card p-7"
            >
              {/* Decorative corner accent */}
              <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.04] transition-all duration-300 group-hover:scale-150 group-hover:bg-primary/[0.06]" />

              <div className="relative">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all duration-200 group-hover:from-primary/15 group-hover:to-primary/8">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-lg font-medium text-foreground">
                  {t.features[key]}
                </h3>
                <p className="mb-4 text-sm font-light leading-relaxed text-muted-foreground">
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
