import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { UserCheck, Search, Send, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorksSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const steps = [
    { num: "01", icon: UserCheck, titleAr: "تأهيل الشريك", titleEn: "Partner Qualification", descAr: "مراجعة السجلات والقدرات لضمان مواءمة الأهداف بين الأطراف.", descEn: "Reviewing records and capabilities to ensure alignment of goals between parties." },
    { num: "02", icon: Search, titleAr: "تحليل الفرص", titleEn: "Opportunity Analysis", descAr: "دراسة معمقة للأصل العقاري وتحديد مسار التطوير المثالي.", descEn: "In-depth study of the real estate asset and determining the ideal development path." },
    { num: "03", icon: Send, titleAr: "حوكمة الربط", titleEn: "Governance Matching", descAr: "تنسيق الاتصال بين المالك والمطور في بيئة آمنة ومحكمة.", descEn: "Coordinating communication between owner and developer in a secure environment." },
    { num: "04", icon: TrendingUp, titleAr: "إغلاق الشراكة", titleEn: "Partnership Closure", descAr: "إتمام الاتفاق النهائي والبدء في مرحلة التنفيذ العقاري.", descEn: "Completing the final agreement and starting the real estate execution phase." },
  ];

  return (
    <section id="how-it-works" className="relative bg-background py-32 px-4 md:px-0 overflow-hidden">
      <div className="container relative py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-24 border-s-2 border-accent ps-8"
        >
          <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            {isAr ? "إطار العمل المشترك" : "The Engagement Framework"}
          </span>
          <h2 className="text-4xl font-medium tracking-tight text-primary md:text-5xl uppercase leading-tight">
            {isAr ? "مسار مؤسسي واضح من الفرصة حتى التنفيذ" : "A Clear Institutional Path from Asset to Execution"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-px bg-border/40 border border-border/40 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="group relative flex flex-col bg-background p-12 transition-colors hover:bg-muted/30"
            >
              <div className="mb-10 flex h-16 w-16 items-center justify-center border border-border bg-muted/20 text-primary transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-primary">
                <step.icon className="h-6 w-6" strokeWidth={1} />
              </div>

              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors">
                {isAr ? step.titleAr : step.titleEn}
              </h3>

              <p className="text-sm font-light leading-relaxed text-muted-foreground transition-colors max-w-[240px]">
                {isAr ? step.descAr : step.descEn}
              </p>

              <div className="absolute top-12 right-12 text-sm font-bold text-accent/20 tracking-widest">
                {step.num}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
