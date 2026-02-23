import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const topFaq = [
  {
    qAr: "ما هي دوما؟",
    qEn: "What is DOMA?",
    aAr: "دوما بيئة رقمية تجمع ملاك الأراضي بالمطورين العقاريين بهدف خلق فرص تطوير منظمة تقوم على وضوح البيانات وترتيب مراحل الشراكة.",
    aEn: "DOMA is a digital environment that connects landowners with real estate developers to create organized development opportunities based on data clarity and structured partnership stages.",
  },
  {
    qAr: "هل تعتبر دوما وسيط بيع تقليدي؟",
    qEn: "Is DOMA a traditional sales broker?",
    aAr: "لا، دور دوما يتجاوز الوساطة المعتادة، إذ تركز على بناء نماذج تطوير وشراكات طويلة المدى بدلاً من مجرد عرض عقار للبيع.",
    aEn: "No, DOMA's role goes beyond traditional brokerage. It focuses on building development models and long-term partnerships rather than simply listing properties for sale.",
  },
  {
    qAr: "ما فائدة الشراكة التطويرية لمالك الأرض؟",
    qEn: "What is the benefit for a landowner?",
    aAr: "تمنح الشراكة فرصة لتحويل الأرض إلى مشروع منتج بدلاً من بقائها غير مستغلة، مما يساعد على تقليل الأعباء مثل رسوم الأراضي البيضاء وتحقيق قيمة مضافة.",
    aEn: "The partnership offers an opportunity to transform land into a productive project instead of leaving it idle, helping reduce burdens like white land fees and creating added value.",
  },
  {
    qAr: "هل توجد عمولة على العمليات؟",
    qEn: "Is there a commission on transactions?",
    aAr: "تعتمد دوما نموذج عمولة مرتبط بعمليات البيع، ويتم توضيح النسبة داخل النظام عند إتمام الاتفاق.",
    aEn: "DOMA uses a commission model linked to sales transactions. The rate is clearly displayed within the system upon agreement completion.",
  },
];

const FAQSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-6 md:py-8">
      <div className="container">
        <div className="mx-auto mb-6 max-w-xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
            <span className="text-xs font-light text-primary">{isAr ? "أسئلة شائعة" : "FAQ"}</span>
          </div>
          <h2 className="mb-1.5 text-3xl font-medium text-foreground md:text-4xl">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="space-y-2">
            {topFaq.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-xl border border-border/60 bg-card px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {isAr ? item.qAr : item.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-sm font-light leading-relaxed text-muted-foreground">
                  {isAr ? item.aAr : item.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 text-center">
            <Link to="/faq" className="text-sm font-light text-primary hover:underline">
              {isAr ? "عرض جميع الأسئلة الشائعة ←" : "View all FAQ →"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
