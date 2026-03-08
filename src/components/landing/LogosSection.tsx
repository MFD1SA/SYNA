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
    <section className="relative bg-[hsl(210,30%,4%)] py-24 md:py-28">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.1)] to-transparent" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-14 max-w-xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-[hsl(200,80%,45%,0.2)] bg-[hsl(200,80%,45%,0.06)] px-4 py-1.5 text-xs font-light text-[hsl(200,80%,60%)]">
            {lang === "ar" ? "الشركاء" : "Partners"}
          </span>
          <h2 className="text-3xl font-medium text-white md:text-4xl">
            {t.logos.title}
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-3">
          {sectors.map((sector, idx) => {
            const Icon = sectorIcons[idx];
            return (
              <motion.div
                key={sector.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6 text-center transition-all duration-500 hover:border-[hsl(200,80%,45%,0.25)] hover:shadow-[0_12px_40px_-10px_hsl(200,80%,50%,0.08)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)] transition-all duration-300 group-hover:border-[hsl(200,80%,45%,0.25)] group-hover:bg-[hsl(200,80%,45%,0.1)]">
                  <Icon className="h-5 w-5 text-[hsl(200,80%,55%)]" strokeWidth={1.2} />
                </div>
                <span className="text-sm font-medium text-white">{sector.name}</span>
                <span className="text-xs font-light leading-snug text-[hsl(210,15%,45%)]">{sector.desc}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
