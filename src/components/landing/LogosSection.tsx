import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Building2, Landmark, Home, HardHat, Ruler, Briefcase } from "lucide-react";

const sectorIcons = [Building2, HardHat, Home, Ruler, Landmark, Briefcase];

const LogosSection: React.FC = () => {
  const { t, lang } = useLanguage();

  const sectors = lang === "ar"
    ? ["المطورون العقاريون", "شركات المقاولات", "ملاك الأراضي", "شركات التصميم والإشراف", "جهات التمويل", "الاستشاريون"]
    : ["Real Estate Developers", "Construction Firms", "Landowners", "Design & Supervision", "Financing Entities", "Consultants"];

  return (
    <section className="py-8 md:py-10">
      <div className="container">
        <div className="mx-auto mb-5 max-w-xl text-center">
          <h2 className="mb-1.5 text-2xl font-medium text-foreground">
            {t.logos.title}
          </h2>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <div
                key={sector}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:doma-shadow"
              >
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.2} />
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
