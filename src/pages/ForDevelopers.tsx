import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import { MapPin, ClipboardList, MessageSquare, Bolt, ArrowLeft, ArrowRight } from "lucide-react";
import headerFeaturesImg from "@/assets/header-features.jpg";

const ForDevelopers: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "للمطورين" : "For Developers");

  const values = [
    { icon: MapPin, title: t.forDevelopers.value1, desc: t.forDevelopers.value1Desc },
    { icon: ClipboardList, title: t.forDevelopers.value2, desc: t.forDevelopers.value2Desc },
    { icon: MessageSquare, title: t.forDevelopers.value3, desc: t.forDevelopers.value3Desc },
    { icon: Bolt, title: t.forDevelopers.value4, desc: t.forDevelopers.value4Desc },
  ];

  const steps = isAr
    ? [
        { num: "01", title: "سجّل كمطور", desc: "أنشئ حسابك وأكمل ملف شركتك — يشمل السجل التجاري والتراخيص المطلوبة." },
        { num: "02", title: "تصفّح الفرص", desc: "استعرض الأراضي المتاحة مع بيانات كافية لاتخاذ قرار مبدئي دون الكشف عن هوية المالك." },
        { num: "03", title: "قدّم طلب شراكة", desc: "اختر الفرصة المناسبة وقدّم طلباً رسمياً بنوع التعاون المطلوب للمالك." },
        { num: "04", title: "تابع حتى الإغلاق", desc: "بعد قبول طلبك، تابع مراحل التفاوض والاجتماعات والمستندات حتى إتمام الشراكة." },
      ]
    : [
        { num: "01", title: "Register as Developer", desc: "Create your account and complete your company profile — including commercial registration and required licenses." },
        { num: "02", title: "Browse Opportunities", desc: "Explore available lands with sufficient data to make an initial decision without revealing the owner's identity." },
        { num: "03", title: "Submit Partnership Request", desc: "Choose the right opportunity and submit a formal request specifying the type of collaboration to the owner." },
        { num: "04", title: "Track Until Closing", desc: "After your request is accepted, follow negotiation stages, meetings, and documents until the partnership is completed." },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="partnerships-developers"
        title={isAr ? "للمطورين العقاريين" : "For Real Estate Developers"}
        subtitle={isAr ? "اكتشف فرصاً عقارية حقيقية وقدّم طلبات شراكة رسمية — في بيئة منظمة بالكامل" : "Discover real estate opportunities and submit formal partnership requests — in a fully organized environment"}
        isAr={isAr}
        image={headerFeaturesImg}
      />

      <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E374B] mb-10 text-center">
            {isAr ? "لماذا تنضم كمطور في سينا؟" : "Why Join SINA as a Developer?"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-xl p-7 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <v.icon className="w-6 h-6 text-emerald-600 mb-5" strokeWidth={1.5} />
                <h3 className="text-[16px] font-semibold text-[#1E374B] mb-3">{v.title}</h3>
                <p className="text-[14px] text-gray-500 leading-[1.8]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-16 bg-white border-t border-gray-100" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E374B] mb-10 text-center">
            {isAr ? "رحلة المطور في سينا" : "The Developer's Journey on SINA"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-7 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <span className="text-[13px] font-bold text-emerald-600 mb-4 block">{step.num}</span>
                <h4 className="text-[15px] font-semibold text-[#1E374B] mb-3">{step.title}</h4>
                <p className="text-[13px] text-gray-500 leading-[1.8]">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <button onClick={() => navigate("/auth/register?role=developer")} className="inline-flex items-center gap-3 h-14 px-12 bg-emerald-600 text-white text-[15px] font-semibold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all duration-300">
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
