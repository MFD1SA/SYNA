import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import {
  LockKeyhole, Settings2, TrendingUp, ShieldCheck,
  Eye, Target, ArrowLeft, ArrowRight, BadgeCheck,
  Landmark, LandPlot, Gem, Fingerprint, Scale,
} from "lucide-react";

const PartnershipsOwners: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "شراكات الملاك" : "Partnerships for Landowners");

  useMetaTags({
    title: isAr
      ? "سينا | شراكات لملاك الأراضي — عوائد أعلى وخصوصية كاملة"
      : "SINA | Partnerships for Landowners — Higher Returns, Full Privacy",
    description: isAr
      ? "لملاك الأراضي في السعودية: ادخل شراكة تطويرية بدلاً من البيع المباشر، مع نظام إفصاح متدرج، مطورين متحقق منهم، وحماية قانونية شاملة."
      : "Saudi landowners: enter a development partnership instead of a direct sale — tiered disclosure, verified developers, and comprehensive legal protection.",
    canonical: isAr ? "https://cidoma.com/partnerships/owners" : "https://cidoma.com/en/partnerships/owners",
    ogTitle: isAr ? "سينا | شراكات لملاك الأراضي" : "SINA | Partnerships for Landowners",
    ogDescription: isAr
      ? "عوائد تفوق البيع المباشر مع تحكم كامل بقراراتك."
      : "Returns that exceed direct sale — with full control over your decisions.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/partnerships/owners" : "https://cidoma.com/partnerships/owners" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "الشراكات" : "Partnerships", item: isAr ? "https://cidoma.com/partnerships" : "https://cidoma.com/en/partnerships" },
          { "@type": "ListItem", position: 3, name: isAr ? "للملاك" : "For Landowners", item: isAr ? "https://cidoma.com/partnerships/owners" : "https://cidoma.com/en/partnerships/owners" },
        ],
      },
    ],
  });

  const ownerFeatures = isAr
    ? [
        { icon: LockKeyhole, title: "خصوصية لا تُخترق", desc: "بيانات أرضك محمية بنظام إفصاح متدرج حيث لا يطلع على أي معلومة أي طرف إلا بعد موافقتك الشخصية الصريحة في كل مرحلة من مراحل التفاوض" },
        { icon: TrendingUp, title: "عوائد أعلى بكثير من البيع", desc: "الشراكة التطويرية تمنحك نسبة من القيمة الكاملة للمشروع بعد التطوير وليس فقط سعر الأرض الخام مما يعني عوائد قد تصل إلى ثلاثة أضعاف البيع المباشر أو أكثر" },
        { icon: ShieldCheck, title: "حماية قانونية شاملة", desc: "جميع الاتفاقيات توثّق رسمياً عبر سينا بعقود واضحة ومحكمة تحفظ حقوقك من بداية التفاوض حتى إتمام المشروع وتسليم الأرباح" },
        { icon: Settings2, title: "تحكم كامل بقراراتك", desc: "أنت صاحب القرار في كل خطوة فأنت من يقبل أو يرفض أي طلب وأنت من يحدد الشروط وسينا تسهّل لك العملية دون فرض أي شيء عليك" },
        { icon: Eye, title: "متابعة شفافة لكل خطوة", desc: "لوحة تحكم متكاملة تعرض لك حالة شراكتك ومراحلها وكل التحديثات بشكل فوري من الاجتماعات والمستندات والتفاوض حتى إتمام الشراكة" },
        { icon: Target, title: "مطورون مؤهلون ومتحقق منهم", desc: "كل مطور يتقدم لأرضك مرّ بعملية تحقق شاملة تشمل السجل التجاري والتراخيص وسجل المشاريع السابقة والتقييمات لضمان جدية وكفاءة الشريك" },
      ]
    : [
        { icon: LockKeyhole, title: "Unbreakable Privacy", desc: "Your land data is protected by a tiered disclosure system where no party can access any information without your explicit personal approval at each stage of negotiation" },
        { icon: TrendingUp, title: "Much Higher Returns Than Selling", desc: "Development partnerships give you a share of the full project value after development, not just raw land price, meaning returns that can reach triple or more of direct sale" },
        { icon: ShieldCheck, title: "Comprehensive Legal Protection", desc: "All agreements are officially documented through the platform with clear and rigorous contracts that preserve your rights from the start of negotiations to project completion and profit delivery" },
        { icon: Settings2, title: "Full Control Over Your Decisions", desc: "You are the decision maker at every step, you accept or reject any request and set the terms while the platform facilitates the process without imposing anything on you" },
        { icon: Eye, title: "Transparent Tracking of Every Step", desc: "An integrated dashboard shows your partnership status and stages with real-time updates on meetings, documents, and negotiations until partnership completion" },
        { icon: Target, title: "Qualified Verified Developers", desc: "Every developer applying to your land has undergone comprehensive verification including commercial registration, licenses, project history, and ratings to ensure partner reliability" },
      ];

  const ownerSteps = isAr
    ? [
        { num: "01", title: "سجّل أرضك بخصوصية تامة", desc: "أدخل بيانات أرضك الأساسية مثل الموقع والمساحة ونوع التطوير المرغوب بسرية كاملة ولن يطلع عليها أي طرف إلا بعد موافقتك الشخصية الصريحة" },
        { num: "02", title: "استقبل طلبات من مطورين مؤهلين", desc: "يصلك طلبات شراكة من مطورين عقاريين تم التحقق من سجلاتهم التجارية وتراخيصهم وسجل مشاريعهم السابقة مع ملفاتهم التعريفية الكاملة" },
        { num: "03", title: "تابع كل مرحلة بشفافية كاملة", desc: "تابع الاجتماعات والمستندات والتفاوض والعروض داخل لوحة تحكم واحدة مع إشعارات فورية لكل تحديث جديد في شراكتك" },
        { num: "04", title: "أغلق شراكتك وابدأ جني الأرباح", desc: "عند اكتمال الاتفاق يتم توثيق الشراكة وإغلاقها رسمياً بعقود محكمة تضمن حقوق جميع الأطراف وتبدأ رحلة تحقيق العوائد المضاعفة" },
      ]
    : [
        { num: "01", title: "Register Your Land Privately", desc: "Enter your lands basic information such as location, area, and desired development type with complete confidentiality, no party sees any details without your explicit approval" },
        { num: "02", title: "Receive Qualified Developer Requests", desc: "Get partnership requests from real estate developers whose commercial registrations, licenses, and project histories have been fully verified, along with their complete profiles" },
        { num: "03", title: "Track Every Stage Transparently", desc: "Follow meetings, documents, negotiations, and offers inside a single dashboard with instant notifications for every new update in your partnership" },
        { num: "04", title: "Close Your Partnership and Start Earning", desc: "When the agreement is complete the partnership is documented and officially closed with rigorous contracts ensuring all parties rights and your journey to multiplied returns begins" },
      ];

  const ownerAdvantages = isAr
    ? [
        { icon: LandPlot, title: "احتفظ بملكيتك", desc: "لا تبيع أرضك بل شارك في تطويرها واحتفظ بنسبة من المشروع النهائي مع عوائد تفوق البيع المباشر بأضعاف" },
        { icon: Gem, title: "قيمة مضاعفة لأرضك", desc: "الأرض الخام قيمتها محدودة لكن بعد التطوير تتضاعف قيمتها وأنت شريك في هذه القيمة المضافة بالكامل" },
        { icon: Fingerprint, title: "إفصاح متدرج وآمن", desc: "بياناتك تُكشف على مراحل حسب تقدم المفاوضات ولا يرى المطور أي تفاصيل حساسة إلا بعد موافقتك" },
        { icon: Scale, title: "عقود عادلة وموثقة", desc: "كل اتفاقية شراكة تُبنى على أسس عادلة ومتوازنة مع توثيق رقمي شامل يحفظ حقوقك طوال مدة المشروع" },
      ]
    : [
        { icon: LandPlot, title: "Retain Your Ownership", desc: "Dont sell your land but participate in developing it and keep a share of the final project with returns far exceeding direct sale" },
        { icon: Gem, title: "Multiplied Land Value", desc: "Raw land has limited value but after development its value multiplies and you are a full partner in this added value" },
        { icon: Fingerprint, title: "Gradual Safe Disclosure", desc: "Your data is revealed in stages as negotiations progress and developers see no sensitive details without your prior approval" },
        { icon: Scale, title: "Fair Documented Contracts", desc: "Every partnership agreement is built on fair balanced foundations with comprehensive digital documentation preserving your rights throughout the project" },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="partnerships-owners"
        title={isAr ? "شراكات ملاك الأراضي" : "Partnerships for Landowners"}
        subtitle={isAr
          ? "حوّل أرضك إلى مشروع استثماري مربح بعوائد مضاعفة مع حماية كاملة لحقوقك وخصوصيتك عبر سينا للاستثمارات العقارية الرقمية المحكومة"
          : "Transform your land into a profitable investment project with multiplied returns and complete protection of your rights and privacy through SINAs governed digital platform"}
        isAr={isAr}
        image="/heroes/partnerships-owners.jpg"
      />

      {/* Why Partner as Owner */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-20 end-[-120px] w-[460px] h-[460px] rounded-full bg-[#C45A41]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "لماذا الشراكة أفضل من البيع لمالك الأرض" : "Why Partnership is Better Than Selling for Landowners"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "بدلاً من بيع أرضك بسعر السوق ادخل في شراكة تطويرية تمنحك عوائد مضاعفة مع حماية كاملة لحقوقك وخصوصيتك"
                : "Instead of selling your land at market price enter a development partnership that gives you multiplied returns with complete protection of your rights and privacy"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {ownerAdvantages.map((item, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#C45A41]/30 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(194,168,107,0.3)] transition-all duration-500 hover:-translate-y-0.5">
                <div className="flex items-start gap-5">
                  <item.icon className="w-6 h-6 text-[#A24832] shrink-0 mt-0.5" strokeWidth={1.7} />
                  <div>
                    <h3 className="text-[16px] font-bold text-[#020202] mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-[1.9]">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Features */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-1/3 start-[-140px] w-[440px] h-[440px] rounded-full bg-[#C45A41]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "مميزات سينا للاستثمارات العقارية لملاك الأراضي" : "SINA Features for Landowners"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "أدوات رقمية متقدمة صُممت خصيصاً لحماية حقوقك وتسهيل رحلتك نحو شراكة تطويرية ناجحة ومربحة"
                : "Advanced digital tools designed specifically to protect your rights and facilitate your journey toward a successful profitable development partnership"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {ownerFeatures.map((v, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#C45A41]/30 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(194,168,107,0.25)] transition-all duration-500 hover:-translate-y-1">
                <v.icon className="w-6 h-6 text-[#A24832] mb-5" strokeWidth={1.7} />
                <h3 className="text-[16px] font-bold text-[#020202] mb-2.5 tracking-tight">{v.title}</h3>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Journey */}
      <section className="relative py-20 lg:py-24 bg-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "رحلة المالك في سينا" : "The Owners Journey on SINA"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "أربع خطوات بسيطة وواضحة من تسجيل أرضك حتى إتمام شراكتك التطويرية بنجاح"
                : "Four simple clear steps from registering your land to successfully completing your development partnership"}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {ownerSteps.map((step, i) => (
              <div key={i} className="relative bg-gradient-to-b from-white to-[#FAFBFC] rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#C45A41]/30 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(194,168,107,0.22)] transition-all duration-500">
                <span className="block text-[40px] font-bold bg-gradient-to-br from-[#C45A41]/30 to-[#A24832]/10 bg-clip-text text-transparent mb-3 tracking-tight leading-none">{step.num}</span>
                <h4 className="text-[15px] font-bold text-[#020202] mb-2 tracking-tight">{step.title}</h4>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White Land Fees */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-br from-[#020202] via-[#020202] to-[#020202] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-40 end-[-140px] w-[520px] h-[520px] rounded-full bg-[#C45A41]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 start-[-140px] w-[520px] h-[520px] rounded-full bg-[#2B2B2B]/30 blur-3xl pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
                {isAr ? "استثمر أرضك قبل أن تتجاوزك الفرصة" : "Invest Your Land Before the Opportunity Passes"}
              </h2>
              <p className="text-[15px] md:text-[16px] text-white/70 max-w-2xl mx-auto leading-relaxed">
                {isAr
                  ? "المملكة تشهد نهضة عقارية غير مسبوقة ضمن رؤية 2030 ونظام رسوم الأراضي البيضاء جاء لتحفيز التطوير العمراني وتعزيز المعروض السكني وهذه فرصتك للمشاركة في هذه النهضة"
                  : "The Kingdom is witnessing an unprecedented real estate boom under Vision 2030 and the white land fees system was introduced to stimulate urban development and boost housing supply and this is your opportunity to participate in this growth"}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-10">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-3 tracking-tight">2.5% - 10%</div>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">
                  {isAr ? "رسوم تحفيزية للتطوير" : "Development Incentive Fees"}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.9]">
                  {isAr
                    ? "نظام الرسوم يبدأ من 2.5% ويصل إلى 10% من القيمة التقديرية للأرض وهو مصمم لتشجيع ملاك الأراضي على المساهمة في التنمية العمرانية"
                    : "The fee system starts at 2.5% and reaches up to 10% of the estimated land value designed to encourage landowners to contribute to urban development"}
                </p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-3 tracking-tight">
                  {isAr ? "توسّع مستمر" : "Expanding"}
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">
                  {isAr ? "النظام يشمل مدناً أكثر" : "Covering More Cities"}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.9]">
                  {isAr
                    ? "البرنامج يتوسع بمراحل ليشمل مناطق جديدة تماشياً مع خطط التنمية والملاك المبادرون بالتطوير مبكراً يحققون أفضل العوائد"
                    : "The program expands in phases to cover new regions in line with development plans and owners who take early initiative achieve the best returns"}
                </p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-3 tracking-tight">
                  {isAr ? "صفر تكلفة" : "Zero Cost"}
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">
                  {isAr ? "طوّر بدون رأس مال" : "Develop Without Capital"}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.9]">
                  {isAr
                    ? "الشراكة التطويرية تتيح لك تطوير أرضك وتحويلها إلى مشروع مربح دون تحمّل أي تكاليف والمطور يتكفل بكل شيء"
                    : "Development partnerships allow you to develop your land into a profitable project without bearing any costs while the developer handles everything"}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#C45A41]/20 via-[#C45A41]/10 to-[#C45A41]/5 rounded-2xl p-8 md:p-10 ring-1 ring-[#C45A41]/25">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight leading-[1.2]">
                {isAr ? "حوّل أرضك من أصل خامل إلى مشروع يدرّ عليك أرباحاً" : "Transform your land from an idle asset into a profit-generating project"}
              </h3>
              <p className="text-[14px] text-white/70 leading-[1.9]">
                {isAr
                  ? "التوجه الوطني واضح نحو تحفيز التطوير العقاري ورفع كفاءة استخدام الأراضي والملاك الذين يستثمرون أراضيهم اليوم من خلال شراكات تطويرية يساهمون في تحقيق أهداف رؤية 2030 ويحققون عوائد مضاعفة مقارنة بترك الأرض شاغرة"
                  : "The national direction clearly aims to stimulate real estate development and improve land utilization and owners who invest their lands today through development partnerships contribute to Vision 2030 goals while achieving multiplied returns compared to leaving the land vacant"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-12 text-center tracking-tight leading-[1.1]">
            {isAr ? "البيع المباشر مقابل الشراكة التطويرية" : "Direct Sale vs Development Partnership"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl p-8 ring-1 ring-slate-200">
              <h3 className="text-lg font-bold text-slate-400 mb-6 tracking-tight">{isAr ? "البيع المباشر" : "Direct Sale"}</h3>
              <ul className="space-y-4">
                {(isAr
                  ? ["عائد محدود بسعر السوق الحالي فقط", "خسارة كامل الملكية فوراً", "لا تستفيد من ارتفاع القيمة بعد التطوير", "مخاطر البيع بسعر أقل من القيمة الحقيقية", "لا علاقة لك بالمشروع بعد البيع"]
                  : ["Return limited to current market price only", "Lose complete ownership immediately", "No benefit from post-development value increase", "Risk of selling below real value", "No connection to the project after sale"]
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 ring-2 ring-[#C45A41]/50 shadow-[0_20px_60px_-25px_rgba(194,168,107,0.35)]">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold text-[#020202] tracking-tight">{isAr ? "الشراكة التطويرية" : "Development Partnership"}</h3>
                <BadgeCheck className="w-5 h-5 text-[#C45A41]" strokeWidth={1.75} />
              </div>
              <ul className="space-y-4">
                {(isAr
                  ? ["عوائد مضاعفة من أرباح المشروع المطوّر", "احتفاظ بجزء من الملكية والمشاركة في الأرباح", "استفادة كاملة من القيمة المضافة بعد التطوير", "توزيع عادل للمخاطر بين المالك والمطور", "شراكة حقيقية ومتابعة مستمرة لنجاح المشروع"]
                  : ["Multiplied returns from developed project profits", "Retain partial ownership and profit sharing", "Full benefit from post-development added value", "Fair risk distribution between owner and developer", "Real partnership and continuous tracking for project success"]
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-[#020202]">
                    <BadgeCheck className="w-4 h-4 text-[#C45A41] mt-0.5 shrink-0" strokeWidth={1.75} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white border-t border-slate-100 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-20 start-1/2 -translate-x-1/2 w-[520px] h-[420px] rounded-full bg-[#C45A41]/[0.08] blur-3xl pointer-events-none" />
        <div className="container relative text-center">
          <Landmark className="w-8 h-8 text-[#A24832] mb-6 mx-auto" strokeWidth={1.7} />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-4 tracking-tight leading-[1.1]">
            {isAr ? "ابدأ رحلتك كمالك أرض الآن" : "Start Your Journey as a Landowner Now"}
          </h2>
          <p className="text-[15px] md:text-[16px] text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? "سجّل أرضك واستقبل طلبات شراكة من مطورين مؤهلين ومتحقق منهم عبر سينا للاستثمارات العقارية"
              : "Register your land and receive partnership requests from qualified verified developers through SINA"}
          </p>
          <button
            onClick={() => navigate("/auth/login?type=owner")}
            className="inline-flex items-center gap-3 h-14 px-10 bg-gradient-to-br from-[#D7C084] to-[#A24832] hover:from-[#A24832] hover:to-[#8A6F3A] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-[#C45A41]/35 hover:shadow-xl hover:shadow-[#C45A41]/45 transition-all duration-300 tracking-tight"
          >
            {isAr ? "دخول الملاك" : "Owner Login"}
            <Arrow className="w-4 h-4" />
          </button>
        </div>
      </section>
    </PageShell>
  );
};

export default PartnershipsOwners;
