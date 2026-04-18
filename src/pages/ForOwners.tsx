import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import { LockKeyhole, UserCheck, Settings2, BarChart3, ArrowLeft, ArrowRight } from "lucide-react";
import headerPartnershipsImg from "@/assets/header-partnerships.jpg";

const ForOwners: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "للملاك" : "For Landowners");

  const values = [
    { icon: LockKeyhole, title: t.forOwners.value1, desc: t.forOwners.value1Desc },
    { icon: UserCheck, title: t.forOwners.value2, desc: t.forOwners.value2Desc },
    { icon: Settings2, title: t.forOwners.value3, desc: t.forOwners.value3Desc },
    { icon: BarChart3, title: t.forOwners.value4, desc: t.forOwners.value4Desc },
  ];

  const steps = isAr
    ? [
        { num: "01", title: "سجّل أرضك", desc: "أدخل بيانات أرضك الأساسية بخصوصية تامة — لن يطلع عليها أحد إلا بعد موافقتك الصريحة." },
        { num: "02", title: "استقبل طلبات الشراكة", desc: "يتصفح المطورون المؤهّلون الفرص ويقدّمون طلبات رسمية — وأنت تختار من تقبل." },
        { num: "03", title: "تابع المراحل", desc: "تابع كل مرحلة من الاجتماعات والمستندات والتفاوض داخل سينا بشفافية كاملة." },
        { num: "04", title: "أغلق الشراكة", desc: "عند اكتمال الاتفاق، يتم توثيق الشراكة وإغلاقها رسمياً عبر سينا." },
      ]
    : [
        { num: "01", title: "Register Your Land", desc: "Enter your land's basic information privately — no one sees it without your explicit approval." },
        { num: "02", title: "Receive Partnership Requests", desc: "Qualified developers browse opportunities and submit formal requests — you choose whom to accept." },
        { num: "03", title: "Track Progress", desc: "Follow every stage from meetings and documents to negotiation inside SINA with full transparency." },
        { num: "04", title: "Close the Partnership", desc: "When the agreement is complete, the partnership is documented and officially closed via SINA." },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="partnerships-owners"
        title={isAr ? "لملاك الأراضي" : "For Landowners"}
        subtitle={isAr ? "حوّل أرضك إلى فرصة استثمارية حقيقية — بخصوصية تامة وتحكم كامل في كل خطوة" : "Transform your land into a real investment opportunity — with complete privacy and control at every step"}
        isAr={isAr}
        image={headerPartnershipsImg}
      />

      <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E374B] mb-10 text-center">
            {isAr ? "لماذا تسجّل أرضك في سينا؟" : "Why Register Your Land on SINA?"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-xl p-7 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <v.icon className="w-6 h-6 text-[#2B4C66] mb-5" strokeWidth={1.5} />
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
            {isAr ? "رحلة المالك في سينا" : "The Owner's Journey on SINA"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-7 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <span className="text-[13px] font-bold text-[#2B4C66] mb-4 block">{step.num}</span>
                <h4 className="text-[15px] font-semibold text-[#1E374B] mb-3">{step.title}</h4>
                <p className="text-[13px] text-gray-500 leading-[1.8]">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <button onClick={() => navigate("/auth/login?type=owner")} className="inline-flex items-center gap-3 h-14 px-12 bg-[#2B4C66] text-white text-[15px] font-semibold rounded-xl hover:bg-[#1E374B] shadow-lg shadow-[#2B4C66]/20 transition-all duration-300">
              {t.forOwners.cta}
              <Arrow className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default ForOwners;
