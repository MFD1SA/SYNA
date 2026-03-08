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
    aAr: "في شراكة التطوير يتفق المالك والمطور على تطوير الأرض معاً وفق نموذج ربحي متفق عليه. أما المساهمة العقارية فتتم عبر مطور مرخص من الجهات الرسمية لإدارة مساهمات عقارية، حيث يساهم المالك بالأرض ويتم التخارج بنسبة محددة بعد التطوير والبيع.",
    aEn: "In a development partnership, the owner and developer agree to develop the land together under an agreed profit model. In a real estate contribution, a licensed developer manages contributions where the owner contributes land and exits at a predetermined percentage after development and sale.",
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
    <section className="relative bg-[hsl(210,28%,6%)] py-14 md:py-18">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.1)] to-transparent" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <h2 className="text-3xl font-medium text-white md:text-4xl">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
        </motion.div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="space-y-3">
            {topFaq.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <AccordionItem value={`faq-${idx}`} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] px-5 transition-colors hover:border-[hsl(200,80%,45%,0.15)]">
                  <AccordionTrigger className="text-sm font-medium text-white hover:no-underline py-5">
                    {isAr ? item.qAr : item.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-light leading-relaxed text-[hsl(210,15%,50%)] pb-5">
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
            className="mt-8 text-center"
          >
            <Link to="/faq" className="inline-flex items-center gap-1.5 text-sm font-light text-[hsl(200,80%,55%)] transition-colors hover:text-[hsl(200,80%,70%)]">
              {isAr ? "عرض جميع الأسئلة الشائعة ←" : "View all FAQ →"}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
