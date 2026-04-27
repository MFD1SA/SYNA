import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
// 4K photo hero (served from /public/heroes/, replaces the abstract emblem SVG).
const heroImg = "/heroes/how-it-works.jpg";
import CTASection from "@/components/landing/CTASection";
import {
  Users, ShieldCheck, Eye, ClipboardList, Handshake,
  FileCheck2, BarChart3, MapPin, MessageSquare, CheckCircle2,
  Lock, Layers, Rocket, Target,
  // Role icons (shared with Navbar / HeroSection / Login):
  //   Owner     → LandPlot (parcel of land — modern, literal)
  //   Developer → HardHat  (construction industry — modern, literal)
  LandPlot, HardHat,
} from "lucide-react";

const HowItWorksPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "كيف تعمل سينا" : "How SINA Works");

  useMetaTags({
    title: isAr
      ? "سينا | كيف تعمل المنصة — رحلة الشراكة خطوة بخطوة"
      : "How SINA Works | The Real-Estate Partnership Journey Explained",
    description: isAr
      ? "اكتشف كيف تسهّل سينا شراكات التطوير العقاري في السعودية: من تسجيل الأرض أو تأهيل المطور إلى التفاوض، توثيق العقود، وإغلاق الصفقة."
      : "See how SINA powers Saudi real-estate partnerships end-to-end — from land listing and developer verification to negotiation, contract documentation, and deal closing.",
    canonical: isAr ? "https://cidoma.com/how-it-works" : "https://cidoma.com/en/how-it-works",
    ogTitle: isAr ? "سينا | كيف تعمل المنصة" : "How SINA Works",
    ogDescription: isAr
      ? "رحلة شراكة واضحة وموثّقة من الطلب حتى الإغلاق."
      : "A clear, documented partnership journey from request to closing.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/how-it-works" : "https://cidoma.com/how-it-works" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "كيف تعمل سينا" : "How It Works", item: isAr ? "https://cidoma.com/how-it-works" : "https://cidoma.com/en/how-it-works" },
        ],
      },
    ],
  });

  const ownerSteps = isAr
    ? [
        { icon: LandPlot, num: "01", title: "أنشئ حسابك كمالك", desc: "سجّل حسابك في دقائق معدودة وأضف بيانات أرضك الأساسية مثل الموقع والمساحة ونوع التطوير المرغوب بخصوصية تامة" },
        { icon: Lock, num: "02", title: "بياناتك محمية بالكامل", desc: "بيانات أرضك الحساسة مثل رقم الصك والموقع الدقيق وهويتك الشخصية لا تُكشف لأي طرف إلا بموافقتك الصريحة والمسجلة" },
        { icon: ClipboardList, num: "03", title: "استقبل طلبات الشراكة", desc: "يصلك طلبات شراكة من مطورين عقاريين مؤهلين ومتحقق منهم مع ملفاتهم التعريفية الكاملة لتتمكن من التقييم واتخاذ القرار" },
        { icon: Eye, num: "04", title: "راجع وقرر بحرية كاملة", desc: "اطلع على تفاصيل كل مطور وسجل مشاريعه السابقة وقدراته التنفيذية وقرر من تريد قبول طلبه أو رفضه بكل حرية" },
        { icon: MessageSquare, num: "05", title: "تفاوض وتواصل بشفافية", desc: "بعد قبول الطلب يتم فتح قنوات التواصل المنظمة بينك وبين المطور مع جدولة الاجتماعات وتبادل المستندات داخل سينا" },
        { icon: Handshake, num: "06", title: "أغلق شراكتك بنجاح", desc: "عند اكتمال الاتفاق يتم توثيق الشراكة وإغلاقها رسمياً عبر سينا بضمان حقوق جميع الأطراف وتوثيق كل التفاصيل" },
      ]
    : [
        { icon: LandPlot, num: "01", title: "Create Your Owner Account", desc: "Register your account in minutes and add your lands basic information such as location, area, and desired development type with complete privacy" },
        { icon: Lock, num: "02", title: "Your Data is Fully Protected", desc: "Your sensitive land data such as deed number, exact location, and personal identity is never revealed to any party without your explicit and recorded consent" },
        { icon: ClipboardList, num: "03", title: "Receive Partnership Requests", desc: "Get partnership requests from qualified and verified real estate developers with their complete profiles to evaluate and make informed decisions" },
        { icon: Eye, num: "04", title: "Review and Decide Freely", desc: "Review each developers details, previous project history, and executive capabilities and decide to accept or reject requests with complete freedom" },
        { icon: MessageSquare, num: "05", title: "Negotiate and Communicate Transparently", desc: "After accepting a request organized communication channels open between you and the developer with meeting scheduling and document exchange within the platform" },
        { icon: Handshake, num: "06", title: "Close Your Partnership Successfully", desc: "When the agreement is complete the partnership is documented and officially closed through the platform with all parties rights guaranteed and all details documented" },
      ];

  const devSteps = isAr
    ? [
        { icon: HardHat, num: "01", title: "سجّل كمطور وتأهّل", desc: "أنشئ حسابك كمطور عقاري وارفع السجل التجاري والتراخيص المطلوبة ويتم التحقق والتأهيل تلقائياً خلال وقت قصير" },
        { icon: MapPin, num: "02", title: "اكتشف الفرص المتاحة", desc: "تصفّح الأراضي المدرجة للشراكة مع بيانات كافية عن الموقع والمساحة ونوع التطوير المرغوب لاتخاذ قرار استثماري مدروس" },
        { icon: FileCheck2, num: "03", title: "قدّم طلب شراكة رسمي", desc: "اختر الفرصة المناسبة وقدّم طلب شراكة رسمي واضح يتضمن نوع التعاون المقترح ورؤيتك التطويرية للمشروع" },
        { icon: Eye, num: "04", title: "انتظر موافقة المالك", desc: "بعد تقديم طلبك يراجعه المالك ويقرر القبول أو الرفض وعند القبول تُفتح لك تفاصيل الأرض الكاملة وقنوات التواصل" },
        { icon: BarChart3, num: "05", title: "تابع مراحل الصفقة", desc: "تابع كل مرحلة من مراحل الشراكة عبر لوحة تحكم متكاملة تشمل الاجتماعات والمستندات والتفاوض والمتابعة المستمرة" },
        { icon: Rocket, num: "06", title: "أتمم الشراكة وابدأ التنفيذ", desc: "عند اكتمال الاتفاق بين الطرفين يتم توثيق الشراكة رسمياً وتبدأ مرحلة التنفيذ مع متابعة مستمرة لضمان نجاح المشروع" },
      ]
    : [
        { icon: HardHat, num: "01", title: "Register as Developer & Qualify", desc: "Create your developer account and upload commercial registration and required licenses with automatic verification and qualification in a short time" },
        { icon: MapPin, num: "02", title: "Discover Available Opportunities", desc: "Browse listed lands for partnership with sufficient data about location, area, and desired development type to make informed investment decisions" },
        { icon: FileCheck2, num: "03", title: "Submit Formal Partnership Request", desc: "Choose the right opportunity and submit a clear formal partnership request including the proposed collaboration type and your development vision for the project" },
        { icon: Eye, num: "04", title: "Await Owner Approval", desc: "After submitting your request the owner reviews it and decides to accept or reject Upon acceptance full land details and communication channels are opened for you" },
        { icon: BarChart3, num: "05", title: "Track Deal Stages", desc: "Follow every partnership stage through an integrated dashboard including meetings, documents, negotiation, and continuous monitoring" },
        { icon: Rocket, num: "06", title: "Complete Partnership & Begin Execution", desc: "When both parties reach agreement the partnership is officially documented and the execution phase begins with continuous monitoring to ensure project success" },
      ];

  const platformFeatures = isAr
    ? [
        { icon: Lock, title: "خصوصية لا تُخترق", desc: "نظام إفصاح متدرج يحمي بيانات الملاك بطبقات أمان متعددة" },
        { icon: ShieldCheck, title: "تحقق شامل من المطورين", desc: "كل مطور يمر بعملية تأهيل وتحقق قبل أن يتمكن من التقدم بأي طلب" },
        { icon: Layers, title: "توثيق رقمي لكل خطوة", desc: "كل تفاعل وقرار واتفاق موثق إلكترونياً في سجل آمن يمكن الرجوع إليه" },
        { icon: Target, title: "متابعة لحظية ذكية", desc: "لوحات تحكم متقدمة تعرض حالة كل صفقة مع تنبيهات آلية فورية" },
      ]
    : [
        { icon: Lock, title: "Unbreakable Privacy", desc: "Tiered disclosure system protecting owner data with multiple security layers" },
        { icon: ShieldCheck, title: "Comprehensive Developer Verification", desc: "Every developer undergoes qualification and verification before submitting any request" },
        { icon: Layers, title: "Digital Documentation of Every Step", desc: "Every interaction, decision, and agreement is electronically documented in a secure reviewable record" },
        { icon: Target, title: "Smart Real-Time Tracking", desc: "Advanced dashboards displaying every deal status with instant automated alerts" },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="how-it-works"
        title={isAr ? "كيف تعمل سينا" : "How SINA Works"}
        subtitle={isAr
          ? "رحلة واضحة ومنظمة لكل طرف من التسجيل والتحقق وحتى إتمام الشراكة التطويرية بنجاح وتوثيقها رسمياً"
          : "A clear organized journey for each party from registration and verification to successful development partnership completion and official documentation"}
        isAr={isAr}
        image={heroImg}
       
      />

      {/* SINA Highlights */}
      <section className="py-10 bg-[#F8FAFB] border-b border-gray-100" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {platformFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <f.icon className="w-6 h-6 text-[#2B2B2B] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <h3 className="text-[13px] font-semibold text-[#020202] mb-1">{f.title}</h3>
                  <p className="text-[12px] text-gray-500 leading-[1.7]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Journey */}
      <section className="py-16 lg:py-20 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border border-[#2B2B2B]/10">
              <Users className="w-4 h-4 text-[#2B2B2B]" strokeWidth={1.5} />
              <span className="text-[12px] font-semibold text-[#2B2B2B] uppercase tracking-wider">
                {isAr ? "رحلة المالك" : "OWNERS JOURNEY"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#020202] mb-4">
              {isAr ? "كيف يبدأ مالك الأرض شراكته التطويرية" : "How a Landowner Starts Their Development Partnership"}
            </h2>
            <p className="text-[15px] text-gray-500 max-w-2xl mx-auto">
              {isAr
                ? "ست خطوات واضحة ومنظمة من تسجيل الأرض بخصوصية تامة وحتى إغلاق الشراكة بنجاح مع حماية كاملة لحقوقك في كل مرحلة"
                : "Six clear organized steps from registering your land with complete privacy to successfully closing the partnership with full protection of your rights at every stage"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {ownerSteps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <step.icon className="w-6 h-6 text-[#2B2B2B]" strokeWidth={1.5} />
                  <span className="text-[24px] font-bold text-[#2B2B2B]/10">{step.num}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#020202] mb-3">{step.title}</h3>
                <p className="text-[13px] text-gray-500 leading-[1.9]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Journey */}
      <section className="py-16 lg:py-20 bg-[#F8FAFB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border border-emerald-200">
              <HardHat className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
              <span className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">
                {isAr ? "رحلة المطور" : "DEVELOPERS JOURNEY"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#020202] mb-4">
              {isAr ? "كيف يبدأ المطور العقاري رحلته في سينا" : "How a Developer Starts Their Journey on SINA"}
            </h2>
            <p className="text-[15px] text-gray-500 max-w-2xl mx-auto">
              {isAr
                ? "ست خطوات واضحة من التسجيل والتأهيل وحتى إتمام الشراكة والبدء في تنفيذ المشروع مع وصول مباشر لفرص تطويرية حقيقية"
                : "Six clear steps from registration and qualification to partnership completion and project execution with direct access to real development opportunities"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {devSteps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <step.icon className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
                  <span className="text-[24px] font-bold text-emerald-600/10">{step.num}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#020202] mb-3">{step.title}</h3>
                <p className="text-[13px] text-gray-500 leading-[1.9]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="py-16 lg:py-20 bg-[#020202]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            {isAr ? "منظومة متكاملة تحمي الجميع" : "A Complete Ecosystem That Protects Everyone"}
          </h2>
          <p className="text-[15px] text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            {isAr
              ? "سينا ليست مجرد شركة للتواصل بل منظومة حوكمة رقمية متكاملة تنظم كل مرحلة من مراحل الشراكة التطويرية وتحمي حقوق جميع الأطراف وتوثق كل خطوة بشفافية كاملة"
              : "SINA is not just a communication platform but a comprehensive digital governance ecosystem that organizes every stage of the development partnership, protects all parties rights, and documents every step with complete transparency"}
          </p>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-[#C45A41] mb-2">100%</div>
              <p className="text-[13px] text-white/50">{isAr ? "حماية للبيانات الحساسة" : "Sensitive Data Protection"}</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#C45A41] mb-2">6</div>
              <p className="text-[13px] text-white/50">{isAr ? "خطوات واضحة لكل طرف" : "Clear Steps for Each Party"}</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#C45A41] mb-2">24/7</div>
              <p className="text-[13px] text-white/50">{isAr ? "متابعة رقمية مستمرة" : "Continuous Digital Tracking"}</p>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </PageShell>
  );
};

export default HowItWorksPage;
