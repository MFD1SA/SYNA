import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import headerPartnershipsImg from "@/assets/header-partnerships.jpg";

const JourneySection: React.FC<{
  title: string;
  steps: { title: string; desc: string }[];
  isAr: boolean;
  accent: string;
}> = ({ title, steps, isAr, accent }) => (
  <div className="mb-16 last:mb-0">
    <h3 className={`text-xl font-bold text-sina-charcoal mb-8 pb-3 border-b-2 ${accent} inline-block`}>
      {title}
    </h3>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((step, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="w-8 h-8 rounded-full bg-sina-blue/10 flex items-center justify-center mb-4">
            <span className="text-[12px] font-bold text-sina-blue">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <h4 className="text-[15px] font-semibold text-sina-charcoal mb-2">{step.title}</h4>
          <p className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const HowItWorksPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "كيف تعمل سينا" : "How SINA Works");

  return (
    <PageShell>
      <InnerHero title={t.howItWorksPage.title} subtitle={t.howItWorksPage.heroSubtitle} isAr={isAr} image={headerPartnershipsImg} />

      <section className="py-20 lg:py-28 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <JourneySection
            title={t.howItWorksPage.forOwnersTitle}
            steps={t.howItWorksPage.forOwnersSteps as unknown as { title: string; desc: string }[]}
            isAr={isAr}
            accent="border-blue-500"
          />
          <JourneySection
            title={t.howItWorksPage.forDevsTitle}
            steps={t.howItWorksPage.forDevsSteps as unknown as { title: string; desc: string }[]}
            isAr={isAr}
            accent="border-emerald-500"
          />
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default HowItWorksPage;
