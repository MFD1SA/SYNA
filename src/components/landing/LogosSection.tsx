import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Crown, Shield, Gem, Sparkles, Star, Award } from "lucide-react";

const sectorIcons = [Crown, Shield, Gem, Sparkles, Star, Award];

const LogosSection: React.FC = () => {
  const { t, lang } = useLanguage();

  const sectors = lang === "ar"
    ? [
        { name: "المطورون العقاريون", desc: "شركات تطوير مؤهلة وموثقة تجارياً" },
        { name: "شركات المقاولات", desc: "جهات تنفيذ معتمدة ذات خبرة" },
        { name: "ملاك الأراضي", desc: "أصحاب الاراضي يبحثون عن شراكات تطوير" },
        { name: "شركات التصميم والإشراف", desc: "مكاتب هندسية واستشارية متخصصة" },
        { name: "جهات التمويل", desc: "مؤسسات مالية داعمة للتطوير" },
        { name: "الاستشاريون", desc: "خبراء في التقييم والدراسات العقارية" },
      ]
    : [
        { name: "Real Estate Developers", desc: "Qualified and commercially verified firms" },
        { name: "Construction Firms", desc: "Accredited execution entities with experience" },
        { name: "Landowners", desc: "Land owners seeking development partnerships" },
        { name: "Design & Supervision", desc: "Specialized engineering and consulting offices" },
        { name: "Financing Entities", desc: "Financial institutions supporting development" },
        { name: "Consultants", desc: "Experts in valuation and real estate studies" },
      ];

  return (
    <section className="py-4 md:py-6">
      <div className="container">
        <div className="mx-auto mb-5 max-w-xl text-center">
          <h2 className="mb-1.5 text-2xl font-medium text-foreground">
            {t.logos.title}
          </h2>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <div
                key={sector.name}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:doma-shadow"
              >
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.2} />
                <span className="text-sm font-medium text-foreground text-center">{sector.name}</span>
                <span className="text-[11px] font-light text-muted-foreground text-center leading-snug">{sector.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
