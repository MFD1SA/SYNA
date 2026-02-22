import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Building2, ShoppingBag, Wifi, GraduationCap, Heart, Cpu, Landmark, Home } from "lucide-react";

const sectorIcons = [Building2, ShoppingBag, Wifi, GraduationCap, Heart, Cpu, Landmark, Home];

const LogosSection: React.FC = () => {
  const { t, lang } = useLanguage();

  const sectors = lang === "ar"
    ? ["التجزئة", "المطاعم", "الاتصالات", "التعليم", "الصحة", "التقنية", "البنوك", "العقارات"]
    : ["Retail", "Restaurants", "Telecom", "Education", "Healthcare", "Technology", "Banking", "Real Estate"];

  return (
    <section className="py-4 md:py-6">
      <div className="container">
        <div className="mx-auto mb-4 max-w-xl text-center">
          <h2 className="text-xl font-medium text-foreground">
            {t.logos.title}
          </h2>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <div
                key={sector}
                className="group flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-card p-3 transition-all duration-200 hover:border-primary/20 hover:doma-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.2} />
                </div>
                <span className="text-xs font-light text-foreground">{sector}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs font-light text-muted-foreground">
          {t.logos.disclaimer}
        </p>
      </div>
    </section>
  );
};

export default LogosSection;
