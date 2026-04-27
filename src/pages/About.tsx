import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import CTASection from "@/components/landing/CTASection";
import {
  ScanEye, ShieldCheck, Trophy, Lightbulb, Target, Scale, Cpu, Lock,
} from "lucide-react";
// Hero photo (4K, served from /public/heroes/) — DOMA-toned curved
// architectural detail. Replaces the abstract emblem SVG so the
// header reads as a real-estate brand at first glance.
const aboutHero = "/heroes/about.jpg";

const About: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "من نحن" : "About SINA");

  useMetaTags({
    title: isAr
      ? "سينا | من نحن — منصة شراكات التطوير العقاري في السعودية"
      : "About SINA | Real-Estate Partnership Platform in Saudi Arabia",
    description: isAr
      ? "تعرّف على سينا: منصة متخصصة تربط ملاك الأراضي بالمطورين العقاريين في المملكة بشراكات موثّقة، حوكمة رقمية، وخصوصية متدرجة تحمي جميع الأطراف."
      : "Meet SINA — the specialized platform connecting Saudi landowners with verified developers through governed partnerships, tiered privacy, and end-to-end digital workflows.",
    canonical: isAr ? "https://cidoma.com/about" : "https://cidoma.com/en/about",
    ogTitle: isAr ? "سينا | من نحن" : "About SINA",
    ogDescription: isAr
      ? "رؤيتنا ورسالتنا وقيمنا في تنظيم شراكات التطوير العقاري."
      : "Our vision, mission, and values in organizing real-estate development partnerships.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/about" : "https://cidoma.com/about" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "من نحن" : "About", item: isAr ? "https://cidoma.com/about" : "https://cidoma.com/en/about" },
        ],
      },
    ],
  });

  const pillars = isAr
    ? [
        { icon: Target, title: "التخصص العميق", desc: "نركز حصرياً على تنظيم الشراكات التطويرية العقارية بأعلى معايير الجودة والاحترافية في القطاع" },
        { icon: Lock, title: "الحماية المتقدمة", desc: "كل مطور يمر بعملية تحقق شاملة قبل التسجيل وكل مالك محمي بطبقات متعددة من الخصوصية والأمان الرقمي" },
        { icon: Scale, title: "العدالة للجميع", desc: "كل أداة وكل عملية مصممة لتكون عادلة ومتوازنة لجميع الأطراف بدون أي تحيّز أو تفضيل" },
        { icon: Cpu, title: "التقنية المتقدمة", desc: "نوظف أحدث التقنيات الرقمية لتبسيط عمليات معقدة تقليدياً وتحويلها إلى تجربة سلسة بالكامل" },
      ]
    : [
        { icon: Target, title: "Deep Specialization", desc: "We focus exclusively on organizing real estate development partnerships with the highest quality and professionalism standards in the sector" },
        { icon: Lock, title: "Advanced Protection", desc: "Every developer undergoes comprehensive verification before registration and every owner is protected by multiple layers of digital privacy and security" },
        { icon: Scale, title: "Fairness for All", desc: "Every tool and process is designed to be fair and balanced for all parties without any bias or preference" },
        { icon: Cpu, title: "Advanced Technology", desc: "We leverage the latest digital technologies to simplify traditionally complex processes and transform them into a seamless experience" },
      ];

  const values = isAr
    ? [
        { icon: ScanEye, title: "الشفافية المطلقة", desc: "كل معلومة تُقدم في وقتها ومكانها الصحيح بوضوح تام" },
        { icon: ShieldCheck, title: "الثقة بالأفعال", desc: "نبني الثقة من خلال التحقق والحوكمة والنتائج الملموسة" },
        { icon: Trophy, title: "الاحترافية العالية", desc: "نلتزم بأعلى المعايير التشغيلية في كل تفصيل نقدمه" },
        { icon: Lightbulb, title: "الابتكار المستمر", desc: "نوظف التقنية لحل تحديات حقيقية في قطاع التطوير العقاري" },
      ]
    : [
        { icon: ScanEye, title: "Absolute Transparency", desc: "Every piece of information is delivered at the right time and place with complete clarity" },
        { icon: ShieldCheck, title: "Trust Through Action", desc: "We build trust through verification, governance, and tangible results" },
        { icon: Trophy, title: "High Professionalism", desc: "We maintain the highest operational standards in every detail we deliver" },
        { icon: Lightbulb, title: "Continuous Innovation", desc: "We leverage technology to solve real challenges in the real estate development sector" },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="about"
        title={isAr ? "من نحن" : "About SINA"}
        subtitle={isAr
          ? "شركة رقمية سعودية تعيد تعريف مستقبل الشراكات التطويرية العقارية بحوكمة متكاملة وتقنية متقدمة"
          : "A Saudi digital platform redefining the future of real estate development partnerships with integrated governance and advanced technology"}
        isAr={isAr}
        image={aboutHero}
      />

      {/* Who We Are */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-white via-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-24 end-[-120px] w-[480px] h-[480px] rounded-full bg-[#C45A41]/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-160px] start-[-120px] w-[520px] h-[520px] rounded-full bg-[#2B2B2B]/[0.05] blur-3xl pointer-events-none" />
        <div className="container max-w-4xl relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-8 tracking-tight leading-[1.1]">
            {isAr ? "من نحن" : "Who We Are"}
          </h2>
          <div className="space-y-6">
            <p className="text-[16px] text-slate-600 leading-[2.1]">
              {isAr
                ? "سينا شركة رقمية سعودية متخصصة في تنظيم شراكات التطوير العقاري بين ملاك الأراضي والمطورين العقاريين المؤهلين ضمن بيئة رقمية محكومة وآمنة تضمن حقوق جميع الأطراف وتحمي مصالحهم في كل مرحلة"
                : "SINA is a specialized Saudi digital platform for organizing real estate development partnerships between landowners and qualified developers within a governed and secure digital environment that guarantees all parties' rights and protects their interests at every stage"}
            </p>
            <p className="text-[16px] text-slate-600 leading-[2.1]">
              {isAr
                ? "قطاع التطوير العقاري يشهد نمواً غير مسبوق مع تسارع المشاريع الكبرى والتحول الحضري الذي تعيشه المملكة ومع هذا النمو تبرز الحاجة الحقيقية لمنظومة رقمية متكاملة تجمع بين ملاك الأراضي الذين يملكون الفرص والمطورين الذين يملكون الخبرة والقدرة على تحويل هذه الفرص إلى مشاريع ناجحة"
                : "The real estate development sector is witnessing unprecedented growth alongside the acceleration of mega-projects and the urban transformation across the Kingdom and with this growth comes a real need for an integrated digital ecosystem that brings together landowners who hold opportunities with developers who possess the expertise and capability to transform these opportunities into successful projects"}
            </p>
            <p className="text-[16px] text-slate-600 leading-[2.1]">
              {isAr
                ? "من هذا المنطلق أُسست سينا لتكون الشركة المرجعية الأولى في تنظيم الشراكات التطويرية العقارية حيث نوفر بيئة تقنية متقدمة تُحفظ فيها الحقوق وتُوثّق الاتفاقيات وتُتابع جميع المراحل بشفافية كاملة من لحظة التسجيل وحتى إتمام الشراكة بنجاح"
                : "From this premise SINA was founded to be the leading reference platform for organizing real estate development partnerships providing an advanced technological environment where rights are preserved, agreements are documented, and all stages are tracked with complete transparency from the moment of registration until successful partnership completion"}
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-1/2 -translate-y-1/2 start-[-140px] w-[420px] h-[420px] rounded-full bg-[#2B2B2B]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            <div className="group relative bg-white rounded-3xl p-10 ring-1 ring-slate-200/70 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.18)] hover:shadow-[0_30px_80px_-30px_rgba(15,31,46,0.28)] hover:ring-[#2B2B2B]/20 transition-all duration-500">
              <ScanEye className="w-7 h-7 text-[#2B2B2B] mb-6" strokeWidth={1.7} />
              <h3 className="text-2xl font-bold text-[#020202] mb-4 tracking-tight">
                {isAr ? "رؤيتنا" : "Our Vision"}
              </h3>
              <p className="text-[15px] text-slate-600 leading-[2.1]">
                {isAr
                  ? "أن نكون الشركة الأولى والمرجع الرئيسي في تنظيم الشراكات التطويرية العقارية الرقمية وتحويل الأراضي غير المستغلة إلى مشاريع منتجة تُسهم في التنمية الحضرية وتخدم رؤية المملكة 2030"
                  : "To be the leading platform and primary reference for organizing digital real estate development partnerships and transforming underutilized lands into productive projects that contribute to urban development and serve the Kingdom's Vision 2030"}
              </p>
            </div>
            <div className="group relative bg-white rounded-3xl p-10 ring-1 ring-slate-200/70 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.18)] hover:shadow-[0_30px_80px_-30px_rgba(15,31,46,0.28)] hover:ring-[#C45A41]/30 transition-all duration-500">
              <Trophy className="w-7 h-7 text-[#A24832] mb-6" strokeWidth={1.7} />
              <h3 className="text-2xl font-bold text-[#020202] mb-4 tracking-tight">
                {isAr ? "رسالتنا" : "Our Mission"}
              </h3>
              <p className="text-[15px] text-slate-600 leading-[2.1]">
                {isAr
                  ? "تمكين ملاك الأراضي والمطورين العقاريين من بناء شراكات تطويرية واضحة وآمنة ومربحة للجميع من خلال شركة رقمية متكاملة تعتمد على الشفافية والحوكمة والتقنية المتقدمة"
                  : "Empowering landowners and real estate developers to build clear, secure, and mutually profitable development partnerships through a comprehensive digital platform founded on transparency, governance, and advanced technology"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Core Pillars */}
      <section className="relative py-20 lg:py-24 bg-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "ركائزنا الأساسية" : "Our Core Pillars"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "أربع ركائز جوهرية بنينا عليها سينا لنضمن تقديم تجربة استثنائية لجميع الأطراف"
                : "Four fundamental pillars upon which we built SINA to ensure delivering an exceptional experience for all parties"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {pillars.map((p, i) => (
              <div key={i} className="group relative bg-gradient-to-b from-white to-[#FAFBFC] rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#2B2B2B]/25 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(15,31,46,0.25)] transition-all duration-500 hover:-translate-y-1">
                <p.icon className="w-6 h-6 text-[#2B2B2B] mb-5" strokeWidth={1.7} />
                <h3 className="text-[16px] font-bold text-[#020202] mb-2.5 tracking-tight">{p.title}</h3>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-0 end-0 w-[360px] h-[360px] rounded-full bg-[#C45A41]/[0.05] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "قيمنا" : "Our Values"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "القيم التي توجّه كل قرار نتخذه وكل ميزة نبنيها في سينا"
                : "The values that guide every decision we make and every feature we build on the platform"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {values.map((v, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#C45A41]/30 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(194,168,107,0.25)] transition-all duration-500 hover:-translate-y-1">
                <v.icon className="w-6 h-6 text-[#A24832] mb-5" strokeWidth={1.7} />
                <h3 className="text-[16px] font-bold text-[#020202] mb-2.5 tracking-tight">{v.title}</h3>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SINA */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute bottom-0 start-0 w-[400px] h-[400px] rounded-full bg-[#2B2B2B]/[0.05] blur-3xl pointer-events-none" />
        <div className="container max-w-4xl relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-8 tracking-tight leading-[1.1]">
            {isAr ? "لماذا سينا" : "Why SINA"}
          </h2>
          <div className="space-y-6">
            <p className="text-[16px] text-slate-600 leading-[2.1]">
              {isAr
                ? "قطاع التطوير العقاري يحتاج إلى منظومة متكاملة تربط الأطراف بكفاءة وتحمي حقوق الجميع وتضمن سير الشراكات بشفافية واحترافية عالية وسينا صُممت تحديداً لتلبية هذه الحاجة من خلال منصة مبنية على أسس الحوكمة الرقمية والتقنية المتقدمة والفهم العميق لاحتياجات السوق الفعلية"
                : "The real estate development sector needs an integrated ecosystem that connects stakeholders efficiently, protects everyone's rights, and ensures partnerships proceed with high transparency and professionalism and SINA was specifically designed to meet this need through a platform built on digital governance, advanced technology, and deep understanding of actual market needs"}
            </p>
            <p className="text-[16px] text-slate-600 leading-[2.1]">
              {isAr
                ? "نحن نؤمن بأن نجاح أي شراكة تطويرية يبدأ من التنظيم والحوكمة قبل أي شيء آخر ولهذا بنينا سينا كمنظومة متكاملة تحفظ حقوق المالك وتوفر للمطور فرصاً حقيقية ومؤهلة وتوثق كل خطوة رقمياً من أول تواصل وحتى إتمام الشراكة بنجاح"
                : "We believe that the success of any development partnership starts with organization and governance before anything else and that is why we built SINA as a comprehensive ecosystem that preserves owner rights, provides developers with real qualified opportunities, and digitally documents every step from first contact to successful partnership completion"}
            </p>
            <p className="text-[16px] text-slate-600 leading-[2.1]">
              {isAr
                ? "سينا تبني جسور الثقة بين ملاك الأراضي والمطورين من خلال منظومة حوكمة متكاملة تحمي الجميع حيث كل تفاعل موثق وكل مرحلة متابعة وكل حق محفوظ وكل طرف يحصل على الأدوات التي تمكّنه من اتخاذ قرارات مدروسة بثقة تامة"
                : "SINA builds trust bridges between landowners and developers through a comprehensive governance ecosystem that protects everyone where every interaction is documented, every stage is tracked, every right is preserved, and every party receives the tools that enable them to make informed decisions with complete confidence"}
            </p>
          </div>
        </div>
      </section>

      {/* Commitment to Vision 2030 */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-br from-[#020202] via-[#020202] to-[#020202] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-40 end-[-140px] w-[520px] h-[520px] rounded-full bg-[#C45A41]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 start-[-140px] w-[520px] h-[520px] rounded-full bg-[#2B2B2B]/25 blur-3xl pointer-events-none" />
        <div className="container max-w-4xl relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
            {isAr ? "التزامنا برؤية 2030" : "Our Commitment to Vision 2030"}
          </h2>
          <div className="space-y-6">
            <p className="text-[16px] text-white/75 leading-[2.1]">
              {isAr
                ? "نؤمن بأن تنظيم الشراكات التطويرية العقارية هو ركيزة أساسية في تحقيق أهداف رؤية المملكة 2030 من رفع نسبة التملك السكني إلى تطوير المدن وتنويع مصادر الدخل الاقتصادي"
                : "We believe that organizing real estate development partnerships is a fundamental pillar in achieving the Kingdom's Vision 2030 goals from increasing homeownership rates to urban development and economic income diversification"}
            </p>
            <p className="text-[16px] text-white/75 leading-[2.1]">
              {isAr
                ? "سينا تُسهم في تحويل الأراضي غير المستغلة إلى مشاريع تطويرية حقيقية تخدم المجتمع من خلال الجمع بين ملاك الأراضي الذين يملكون الفرصة والمطورين المؤهلين الذين يملكون القدرة على تحويلها إلى واقع ملموس يُسهم في رفع جودة الحياة وتسريع عجلة التنمية العمرانية"
                : "SINA contributes to transforming underutilized lands into real development projects that serve the community by bringing together landowners who hold the opportunity with qualified developers who have the capability to turn it into tangible reality that enhances quality of life and accelerates urban development"}
            </p>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default About;
