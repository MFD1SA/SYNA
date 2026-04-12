import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import { Eye, ShieldCheck, Award, Lightbulb } from "lucide-react";
import headerAboutImg from "@/assets/header-about.jpg";

const About: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "عن سينا" : "About SINA");

  const values = [
    { icon: Eye, title: t.about.value1, desc: t.about.value1Desc },
    { icon: ShieldCheck, title: t.about.value2, desc: t.about.value2Desc },
    { icon: Award, title: t.about.value3, desc: t.about.value3Desc },
    { icon: Lightbulb, title: t.about.value4, desc: t.about.value4Desc },
  ];

  return (
    <PageShell>
      <InnerHero title={t.about.title} subtitle={t.about.heroSubtitle} isAr={isAr} image={headerAboutImg} />

      {/* Who We Are */}
      <section className="py-20 lg:py-28 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-sina-charcoal mb-6">
            {t.about.whoWeAre}
          </h2>
          <p className="text-[15px] text-gray-600 leading-[1.9]">
            {t.about.whoWeAreDesc}
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 lg:py-28 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-sina-charcoal mb-4">{t.about.vision}</h3>
              <p className="text-[14px] text-gray-600 leading-[1.9]">{t.about.visionDesc}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-sina-charcoal mb-4">{t.about.mission}</h3>
              <p className="text-[14px] text-gray-600 leading-[1.9]">{t.about.missionDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-sina-charcoal mb-12 text-center">
            {t.about.values}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((v, i) => (
              <div key={i} className="bg-[#F7F9FB] rounded-xl p-7 border border-gray-100 text-center">
                <div className="w-11 h-11 rounded-lg bg-sina-blue/10 flex items-center justify-center mx-auto mb-5">
                  <v.icon className="w-5 h-5 text-sina-blue" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold text-sina-charcoal mb-2">{v.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SINA */}
      <section className="py-20 lg:py-28 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-sina-charcoal mb-6">
            {t.about.whySina}
          </h2>
          <p className="text-[15px] text-gray-600 leading-[1.9]">
            {t.about.whySinaDesc}
          </p>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default About;
