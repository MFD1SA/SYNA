import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Map, FileText, BarChart3, MessageCircle } from "lucide-react";

const features = [
  { key: "map" as const, icon: Map },
  { key: "contracts" as const, icon: FileText },
  { key: "analytics" as const, icon: BarChart3 },
  { key: "communication" as const, icon: MessageCircle },
];

const FeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-transparent" />
      <div className="container relative">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-medium text-foreground">
            {t.features.title}
          </h2>
          <div className="mx-auto h-1 w-12 rounded-full doma-gradient" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon }, idx) => (
            <div
              key={key}
              className="group doma-card p-6"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 transition-colors group-hover:bg-primary/10">
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                {t.features[key]}
              </h3>
              <p className="text-sm font-light leading-relaxed text-muted-foreground">
                {t.features[`${key}Desc`]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
