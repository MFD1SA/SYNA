import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
// 4K photo hero (served from /public/heroes/, replaces the abstract emblem SVG).
const heroImg = "/heroes/faq.jpg";
import CTASection from "@/components/landing/CTASection";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

const FAQ: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الأسئلة الشائعة" : "FAQ");

  useMetaTags({
    title: isAr
      ? "سينا | الأسئلة الشائعة حول شراكات التطوير العقاري"
      : "SINA FAQ | Real-Estate Development Partnership Questions",
    description: isAr
      ? "إجابات واضحة حول عمل منصة سينا: تسجيل الأراضي، تأهيل المطورين، خصوصية البيانات، إدارة الصفقات، والعوائد في شراكات التطوير العقاري بالسعودية."
      : "Clear answers about how SINA works — land registration, developer verification, data privacy, deal management, and returns in Saudi real-estate partnerships.",
    canonical: isAr ? "https://cidoma.com/faq" : "https://cidoma.com/en/faq",
    ogTitle: isAr ? "سينا | الأسئلة الشائعة" : "SINA FAQ",
    ogDescription: isAr
      ? "كل ما تحتاج معرفته عن شراكات التطوير العقاري عبر سينا."
      : "Everything you need to know about development partnerships on SINA.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/faq" : "https://cidoma.com/faq" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "الأسئلة الشائعة" : "FAQ", item: isAr ? "https://cidoma.com/faq" : "https://cidoma.com/en/faq" },
        ],
      },
    ],
  });

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
        image={heroImg}
       
      />

      {/* Stats bar */}
      <section className="relative py-8 bg-gradient-to-b from-white to-[#FAFBFC] border-b border-slate-100 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <div className="flex items-center justify-center gap-10 md:gap-20 text-center">
            <div>
              <p className="text-3xl font-bold text-[#2B2B2B] tracking-tight">{items.length}+</p>
              <p className="text-[12px] text-slate-500 mt-1">{isAr ? "سؤال وجواب" : "Questions & Answers"}</p>
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
            <div>
              <p className="text-3xl font-bold text-[#2B2B2B] tracking-tight">{catKeys.length}</p>
              <p className="text-[12px] text-slate-500 mt-1">{isAr ? "تصنيفات" : "Categories"}</p>
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
            <div>
              <HelpCircle className="w-6 h-6 text-[#2B2B2B] mx-auto" strokeWidth={1.7} />
              <p className="text-[12px] text-slate-500 mt-1">{isAr ? "إجابات مفصلة" : "Detailed Answers"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 lg:py-24 bg-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-40 end-[-140px] w-[440px] h-[440px] rounded-full bg-[#2B2B2B]/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 start-[-140px] w-[440px] h-[440px] rounded-full bg-[#C45A41]/[0.05] blur-3xl pointer-events-none" />
        <div className="container max-w-4xl relative">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2.5 mb-12 justify-center">
            {catKeys.map((key) => (
              <button
                key={key}
                onClick={() => { setActiveCat(key); setOpenCard(null); }}
                className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                  activeCat === key
                    ? "bg-gradient-to-br from-[#2B2B2B] to-[#020202] text-white shadow-lg shadow-[#2B2B2B]/25"
                    : "bg-white text-slate-500 hover:text-[#2B2B2B] hover:bg-[#2B2B2B]/[0.04] ring-1 ring-slate-200"
                }`}
              >
                {categories[key]}
              </button>
            ))}
          </div>

          {/* Question count */}
          <div className="mb-6">
            <p className="text-[13px] text-slate-400">
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
                  className={`bg-white rounded-2xl transition-all duration-300 cursor-pointer ${
                    isOpen
                      ? "ring-1 ring-[#2B2B2B]/20 shadow-[0_20px_50px_-25px_rgba(43,76,102,0.25)]"
                      : "ring-1 ring-slate-200/70 hover:ring-slate-300 hover:shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)]"
                  }`}
                  onClick={() => setOpenCard(isOpen ? null : i)}
                >
                  <div className="p-6 md:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <span className={`text-[12px] font-bold shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isOpen
                            ? "bg-gradient-to-br from-[#2B2B2B] to-[#020202] text-white shadow-md shadow-[#2B2B2B]/25"
                            : "bg-[#2B2B2B]/[0.06] text-[#2B2B2B]"
                        }`}>
                          {i + 1}
                        </span>
                        <h3 className="text-[14px] md:text-[15px] font-semibold text-[#020202] leading-snug tracking-tight">{faq.q}</h3>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                          isOpen ? "rotate-180 text-[#2B2B2B]" : "text-slate-400"
                        }`}
                        strokeWidth={2}
                      />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-[13px] text-slate-600 leading-[2] border-t border-slate-100 pt-4 ps-11">
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
      <section className="relative py-16 bg-gradient-to-b from-[#FAFBFC] to-white border-t border-slate-100 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent pointer-events-none" />
        <div className="container relative text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-[#020202] mb-3 tracking-tight leading-[1.1]">
            {isAr ? "لم تجد إجابة لسؤالك" : "Didnt Find Your Answer"}
          </h3>
          <p className="text-[14px] md:text-[15px] text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
            {isAr
              ? "تواصل معنا مباشرة وسيرد عليك فريقنا في أسرع وقت ممكن"
              : "Contact us directly and our team will respond as soon as possible"}
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <a
              href="https://wa.me/966504566777"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 h-12 px-7 bg-gradient-to-br from-[#25D366] to-[#1fba59] hover:from-[#1fba59] hover:to-[#17964a] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#25D366]/25 transition-all duration-300"
            >
              <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.75} />
              {isAr ? "تواصل عبر الواتساب" : "Chat on WhatsApp"}
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2.5 h-12 px-7 bg-gradient-to-br from-[#2B2B2B] to-[#020202] hover:from-[#020202] hover:to-[#020202] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#2B2B2B]/25 transition-all duration-300"
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
