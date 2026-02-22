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
    <section className="border-t border-border/60 py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="mb-3 text-2xl font-medium text-foreground">
            {t.logos.title}
          </h2>
          <div className="mx-auto h-1 w-12 rounded-full doma-gradient" />
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <div
                key={sector}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:doma-shadow"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 transition-colors group-hover:bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.2} />
                </div>
                <span className="text-sm font-light text-foreground">{sector}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs font-light text-muted-foreground">
          {t.logos.disclaimer}
        </p>
      </div>
    </section>
  );
};

export default LogosSection;
