import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Crown, Shield, Gem, Sparkles, Star, Award } from "lucide-react";
import { motion } from "framer-motion";

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
    <section className="relative bg-muted/20 py-20 border-y border-border/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-sm">
            {lang === "ar" ? "القطاعات المستهدفة" : "Target Sectors"}
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t.logos.title}
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-3">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <motion.div
                key={sector.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span className="text-base font-medium text-foreground">{sector.name}</span>
                <span className="text-xs font-light leading-relaxed text-muted-foreground">{sector.desc}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
