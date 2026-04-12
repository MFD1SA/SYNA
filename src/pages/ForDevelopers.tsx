import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import { MapPin, LayoutList, MessageSquare, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import headerFeaturesImg from "@/assets/header-features.jpg";

const ForDevelopers: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "للمطورين" : "For Developers");

  const values = [
    { icon: MapPin, title: t.forDevelopers.value1, desc: t.forDevelopers.value1Desc },
    { icon: LayoutList, title: t.forDevelopers.value2, desc: t.forDevelopers.value2Desc },
    { icon: MessageSquare, title: t.forDevelopers.value3, desc: t.forDevelopers.value3Desc },
    { icon: Zap, title: t.forDevelopers.value4, desc: t.forDevelopers.value4Desc },
  ];

  return (
    <PageShell>
      <InnerHero title={t.forDevelopers.title} subtitle={t.forDevelopers.heroSubtitle} isAr={isAr} image={headerFeaturesImg} />

      <section className="py-20 lg:py-28 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-[#F7F9FB] rounded-xl p-7 border border-gray-100">
                <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center mb-5">
                  <v.icon className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold text-sina-charcoal mb-2">{v.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button
              onClick={() => navigate("/auth/register?role=developer")}
              className="inline-flex items-center gap-2.5 h-12 px-10 bg-sina-blue text-white text-[14px] font-semibold rounded-lg hover:bg-sina-dark-blue transition-colors"
            >
              {t.forDevelopers.cta}
              <Arrow className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default ForDevelopers;
