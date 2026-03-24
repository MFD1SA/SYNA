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
    <section className="relative bg-background py-32 px-4 md:px-0">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-24 border-s-2 border-accent ps-8"
        >
          <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            {isAr ? "مستودع المعرفة الإجرائية" : "The Knowledge Vault"}
          </span>
          <h2 className="text-4xl font-medium tracking-tight text-primary md:text-5xl uppercase leading-tight">
            {isAr ? "تساؤلات حول حوكمة الشراكة وآليات الاستثمار" : "Inquiries on Partnership Governance & Investment"}
          </h2>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible className="space-y-px bg-border/40 border-y border-border/40">
            {topFaq.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <AccordionItem value={`faq-${idx}`} className="border-none bg-background px-8 transition-all hover:bg-muted/30">
                  <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.1em] text-primary hover:no-underline py-8 text-start leading-relaxed">
                    {isAr ? item.qAr : item.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-light leading-relaxed text-muted-foreground pb-10 ps-0">
                    <div className="max-w-3xl">
                        {isAr ? item.aAr : item.aEn}
                    </div>
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
            className="mt-16 text-center"
          >
            <Link to="/faq" className="inline-flex h-14 items-center px-10 border border-primary text-[10px] font-bold uppercase tracking-[0.3em] text-primary transition-all hover:bg-primary hover:text-white">
              {isAr ? "عرض كامل فهرس الحوكمة" : "View Full Governance Index"}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
