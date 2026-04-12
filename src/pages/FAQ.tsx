import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import { ChevronDown } from "lucide-react";
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
      <InnerHero title={t.faqPage.title} subtitle={t.faqPage.subtitle} isAr={isAr} image={headerFaqImg} />

      <section className="py-16 lg:py-24 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-4xl">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {catKeys.map((key) => (
              <button
                key={key}
                onClick={() => { setActiveCat(key); setOpenCard(null); }}
                className={`px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  activeCat === key
                    ? "bg-sina-blue text-white shadow-sm"
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                }`}
              >
                {categories[key]}
              </button>
            ))}
          </div>

          {/* Card grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((faq, i) => {
              const isOpen = openCard === i;
              return (
                <div
                  key={i}
                  className={`bg-white rounded-xl border transition-all duration-300 cursor-pointer ${
                    isOpen ? "border-sina-blue/30 shadow-md" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                  onClick={() => setOpenCard(isOpen ? null : i)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isOpen ? "bg-sina-blue text-white" : "bg-sina-blue/10 text-sina-blue"
                        }`}>
                          <span className="text-[12px] font-bold">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <h3 className="text-[14px] font-semibold text-sina-charcoal leading-snug pt-1">
                          {faq.q}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 mt-1.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[300px] mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="ps-11 text-[13px] text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default FAQ;
