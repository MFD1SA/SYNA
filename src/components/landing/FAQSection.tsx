import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const topFaq = [
  {
    qAr: "ما هي سينا؟",
    qEn: "What is SYNA?",
    aAr: "سينا بيئة رقمية تجمع ملاك الأراضي بالمطورين العقاريين بهدف خلق فرص تطوير منظمة تقوم على وضوح البيانات وترتيب مراحل الشراكة، وتدعم مسارين رئيسيين: شراكات التطوير العقاري والمساهمات العقارية المرخصة.",
    aEn: "SYNA is a digital environment connecting landowners with real estate developers to create organized development opportunities. It supports two main paths: development partnerships and licensed real estate contributions.",
  },
  {
    qAr: "ما الفرق بين شراكة التطوير والمساهمة العقارية؟",
    qEn: "What's the difference between a development partnership and a real estate contribution?",
    aAr: "شراكة التطوير: يتفق المالك والمطور على تطوير الأرض معاً وفق نموذج ربحي متفق عليه، ويتشاركان في العوائد. أما المساهمة العقارية: فتتم عبر مطور مرخص رسمياً من الجهات المعنية لإدارة المساهمات العقارية، حيث يساهم المالك بأرضه ويختار من عدة خيارات: التخارج بنسبة محددة، أو بيع الأرض ضمن المساهمة، أو الدخول العيني الكامل بالأرض كشريك في المشروع.",
    aEn: "Development Partnership: The owner and developer agree to develop land together under an agreed profit model, sharing returns. Real Estate Contribution: Managed by a developer officially licensed for real estate contributions, where the owner contributes their land and chooses from several options: exiting at a predetermined percentage, selling the land within the contribution, or full in-kind entry as a project partner.",
  },
  {
    qAr: "هل توجد عمولة على العمليات؟",
    qEn: "Is there a commission on transactions?",
    aAr: "تعتمد سينا نموذج عمولة مرتبط بعمليات البيع، ويتم توضيح النسبة داخل النظام عند إتمام الاتفاق.",
    aEn: "SYNA uses a commission model linked to sales transactions. The rate is clearly displayed within the system upon agreement completion.",
  },
  {
    qAr: "ما فائدة الشراكة التطويرية لمالك الأرض؟",
    qEn: "What is the benefit for a landowner?",
    aAr: "تمنح الشراكة فرصة لتحويل الأرض إلى مشروع منتج بدلاً من بقائها غير مستغلة، سواء عبر شراكة تطوير مباشرة أو مساهمة عقارية مع مطور مرخص، مما يساعد على تقليل أعباء رسوم الأراضي البيضاء.",
    aEn: "The partnership transforms idle land into a productive project — whether through a direct development partnership or a real estate contribution with a licensed developer — helping reduce white land fee burdens.",
  },
];

const FAQSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="relative bg-background py-20 px-4 md:px-0">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-muted/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? "مركز المعرفة" : "Knowledge Base"}
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
        </motion.div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {topFaq.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <AccordionItem value={`faq-${idx}`} className="rounded-xl border border-border/50 bg-card px-6 transition-colors hover:border-border">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-6">
                    {isAr ? item.qAr : item.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-light leading-relaxed text-muted-foreground pb-6">
                    {isAr ? item.aAr : item.aEn}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-center"
          >
            <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80">
              {isAr ? "عرض جميع الأسئلة الشائعة" : "View all FAQ"}
              <span className="rtl:-scale-x-100">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
