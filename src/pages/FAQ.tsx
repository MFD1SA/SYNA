import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import headerFaqImg from "@/assets/header-faq.jpg";

const FAQ: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الأسئلة الشائعة" : "FAQ");

  const categories = t.faqPage.categories;
  const items = t.faqPage.items as unknown as { q: string; a: string; cat: string }[];
  const catKeys = Object.keys(categories) as (keyof typeof categories)[];
  const [activeCat, setActiveCat] = useState<string>("general");
  const [openCard, setOpenCard] = useState<number | null>(null);

  const filtered = items.filter((item) => item.cat === activeCat);

  return (
    <PageShell>
      <InnerHero
        pageSlug="faq"
        title={isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
        subtitle={isAr
          ? "إجابات واضحة ومفصلة على أكثر الأسئلة شيوعاً حول سينا للاستثمارات العقارية وشراكات التطوير العقاري"
          : "Clear and detailed answers to the most frequently asked questions about SINA platform and real estate development partnerships"}
        isAr={isAr}
        image={headerFaqImg}
      />

      {/* Stats bar */}
      <section className="py-6 bg-[#F8FAFB] border-b border-gray-100" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-2xl font-bold text-[#2B4C66]">{items.length}+</p>
              <p className="text-[12px] text-gray-500">{isAr ? "سؤال وجواب" : "Questions & Answers"}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-[#2B4C66]">{catKeys.length}</p>
              <p className="text-[12px] text-gray-500">{isAr ? "تصنيفات" : "Categories"}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <HelpCircle className="w-6 h-6 text-[#2B4C66] mx-auto" strokeWidth={1.5} />
              <p className="text-[12px] text-gray-500">{isAr ? "إجابات مفصلة" : "Detailed Answers"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-4xl">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {catKeys.map((key) => (
              <button
                key={key}
                onClick={() => { setActiveCat(key); setOpenCard(null); }}
                className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                  activeCat === key
                    ? "bg-[#2B4C66] text-white shadow-lg shadow-[#2B4C66]/20"
                    : "bg-white text-gray-500 hover:text-[#2B4C66] hover:bg-[#2B4C66]/5 border border-gray-200"
                }`}
              >
                {categories[key]}
              </button>
            ))}
          </div>

          {/* Question count */}
          <div className="mb-6">
            <p className="text-[13px] text-gray-400">
              {isAr ? `${filtered.length} أسئلة في هذا التصنيف` : `${filtered.length} questions in this category`}
            </p>
          </div>

          {/* FAQ items */}
          <div className="space-y-3">
            {filtered.map((faq, i) => {
              const isOpen = openCard === i;
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isOpen
                      ? "border-[#2B4C66]/20 shadow-lg shadow-[#2B4C66]/5"
                      : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                  onClick={() => setOpenCard(isOpen ? null : i)}
                >
                  <div className="p-6 md:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[12px] font-bold shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                          isOpen ? "bg-[#2B4C66] text-white" : "bg-[#2B4C66]/[0.06] text-[#2B4C66]"
                        } transition-all duration-300`}>
                          {i + 1}
                        </span>
                        <h3 className="text-[14px] font-semibold text-[#1E374B] leading-snug">{faq.q}</h3>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                          isOpen ? "rotate-180 text-[#2B4C66]" : "text-gray-400"
                        }`}
                        strokeWidth={2}
                      />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-[13px] text-gray-500 leading-[2] border-t border-gray-100 pt-4 ps-10">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-14 bg-[#F8FAFB] border-t border-gray-100" dir={isAr ? "rtl" : "ltr"}>
        <div className="container text-center">
          <h3 className="text-xl font-bold text-[#1E374B] mb-3">
            {isAr ? "لم تجد إجابة لسؤالك" : "Didnt Find Your Answer"}
          </h3>
          <p className="text-[14px] text-gray-500 mb-6 max-w-md mx-auto">
            {isAr
              ? "تواصل معنا مباشرة وسيرد عليك فريقنا في أسرع وقت ممكن"
              : "Contact us directly and our team will respond as soon as possible"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/966504566777"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 h-12 px-8 bg-[#25D366] hover:bg-[#1fba59] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#25D366]/20 transition-all duration-300"
            >
              <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {isAr ? "تواصل عبر الواتساب" : "Chat on WhatsApp"}
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2.5 h-12 px-8 bg-[#2B4C66] hover:bg-[#1E374B] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#2B4C66]/20 transition-all duration-300"
            >
              {isAr ? "صفحة تواصل معنا" : "Contact Us Page"}
            </a>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default FAQ;
