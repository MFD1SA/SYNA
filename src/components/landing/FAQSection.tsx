import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const faqs = [
    { q: t.faqHome.q1, a: t.faqHome.a1 },
    { q: t.faqHome.q2, a: t.faqHome.a2 },
    { q: t.faqHome.q3, a: t.faqHome.a3 },
    { q: t.faqHome.q4, a: t.faqHome.a4 },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-4">
              {t.faqHome.title}
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-[#F7F9FB] rounded-xl border border-gray-100 px-6"
              >
                <AccordionTrigger className="text-[15px] font-semibold text-sina-charcoal py-5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14px] text-gray-500 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-sina-blue hover:gap-3 transition-all"
            >
              {isAr ? "عرض جميع الأسئلة" : "View All Questions"}
              <Arrow className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
