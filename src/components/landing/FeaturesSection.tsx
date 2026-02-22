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
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        <h2 className="mb-14 text-center text-3xl font-medium text-foreground">
          {t.features.title}
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <Icon className="mb-4 h-6 w-6 text-primary" strokeWidth={1.5} />
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
