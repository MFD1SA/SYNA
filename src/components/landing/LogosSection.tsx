import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const LogosSection: React.FC = () => {
  const { t } = useLanguage();

  const sectors = [
    "التجزئة", "المطاعم", "الاتصالات", "التعليم", "الصحة",
    "التقنية", "البنوك", "العقارات",
  ];

  const sectorsEn = [
    "Retail", "Restaurants", "Telecom", "Education", "Healthcare",
    "Technology", "Banking", "Real Estate",
  ];

  const labels = t === undefined ? sectorsEn : (t.nav.home === "الرئيسية" ? sectors : sectorsEn);

  return (
    <section className="border-t border-border py-16">
      <div className="container">
        <h2 className="mb-3 text-center text-2xl font-medium text-foreground">
          {t.logos.title}
        </h2>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
          {labels.map((sector) => (
            <div
              key={sector}
              className="flex h-16 items-center justify-center rounded-lg border border-border bg-muted/50 px-6 text-sm font-light text-muted-foreground"
            >
              {sector}
            </div>
          ))}
        </div>

        <p className="text-center text-xs font-light text-muted-foreground">
          {t.logos.disclaimer}
        </p>
      </div>
    </section>
  );
};

export default LogosSection;
