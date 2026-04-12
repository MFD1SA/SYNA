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
    <section id="how-it-works" className="relative bg-primary py-32 md:py-48 px-4 md:px-0 overflow-hidden">
      <div className="luxury-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="mb-32 text-center"
        >
          <span className="mb-6 inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
            {isAr ? "إطار العمل المؤسسي" : "Sovereign Workflow"}
          </span>
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white uppercase leading-tight max-w-5xl mx-auto">
            {isAr ? "مسار احترافي محدد من الأصول حتى الإغلاق الصفقة" : "A Distinct Institutional Path from Asset to Mandate Closure"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="group relative flex flex-col bg-primary p-16 transition-all hover:bg-white/[0.03]"
            >
              <div className="mb-12 flex h-20 w-20 items-center justify-center border border-white/10 bg-white/5 text-accent transition-all duration-700 group-hover:border-accent group-hover:bg-accent group-hover:text-primary rounded-none">
                <step.icon className="h-8 w-8" strokeWidth={1} />
              </div>

              <h3 className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-colors">
                {isAr ? step.titleAr : step.titleEn}
              </h3>

              <p className="text-sm font-light leading-[1.8] text-white/40 transition-colors">
                {isAr ? step.descAr : step.descEn}
              </p>

              <div className="absolute top-16 right-16 text-[10px] font-bold text-accent/10 tracking-[0.5em] group-hover:text-accent/30 transition-colors">
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
