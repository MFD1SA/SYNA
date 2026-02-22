import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Building2, Landmark, Home, HardHat, MapPin, Briefcase } from "lucide-react";

const sectorIcons = [Building2, HardHat, Home, MapPin, Landmark, Briefcase];

const LogosSection: React.FC = () => {
  const { t, lang } = useLanguage();

  const sectors = lang === "ar"
    ? ["المطورون العقاريون", "شركات المقاولات", "ملاك الأراضي", "المخططات السكنية", "جهات التمويل", "الاستشاريون"]
    : ["Real Estate Developers", "Construction Firms", "Landowners", "Residential Plans", "Financing Entities", "Consultants"];

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mx-auto mb-6 max-w-xl text-center">
          <h2 className="mb-2 text-2xl font-medium text-foreground">
            {t.logos.title}
          </h2>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <div
                key={sector}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:doma-shadow"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.2} />
                </div>
                <span className="text-xs font-light text-foreground text-center">{sector}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
