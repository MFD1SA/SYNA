import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import {
  ArrowLeft, ArrowRight, TrendingUp,
  Building2, Landmark, Handshake, FileCheck2,
  BadgeCheck, LockKeyhole, ShieldCheck, Eye,
  MapPin, CircleDollarSign, Rocket, Bolt,
  Crown, Layers, BarChart3, Cpu, Target,
  Gem, Briefcase, Network,
} from "lucide-react";

const Partnerships: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "شراكات التطوير" : "Development Partnerships");

  const ownerHighlights = isAr
    ? [
        { icon: LockKeyhole, text: "خصوصية كاملة وإفصاح متدرج" },
        { icon: TrendingUp, text: "عوائد مضاعفة تفوق البيع المباشر" },
        { icon: ShieldCheck, text: "حماية قانونية شاملة لحقوقك" },
        { icon: Eye, text: "متابعة شفافة لكل مرحلة" },
        { icon: Crown, text: "تحكم كامل بقراراتك وشروطك" },
      ]
    : [
        { icon: LockKeyhole, text: "Complete privacy with gradual disclosure" },
        { icon: TrendingUp, text: "Multiplied returns exceeding direct sale" },
        { icon: ShieldCheck, text: "Comprehensive legal protection for your rights" },
        { icon: Eye, text: "Transparent tracking of every stage" },
        { icon: Crown, text: "Full control over your decisions and terms" },
      ];

  const devHighlights = isAr
    ? [
        { icon: MapPin, text: "فرص تطويرية حقيقية ومتجددة" },
        { icon: CircleDollarSign, text: "وفّر تكاليف الاستحواذ بالكامل" },
        { icon: Rocket, text: "نفّذ مشاريع أكثر بنفس الميزانية" },
        { icon: Bolt, text: "متابعة شاملة حتى إتمام الشراكة" },
        { icon: BadgeCheck, text: "بناء سمعة مهنية قوية على سينا" },
      ]
    : [
        { icon: MapPin, text: "Real renewed development opportunities" },
        { icon: CircleDollarSign, text: "Save acquisition costs entirely" },
        { icon: Rocket, text: "Execute more projects with the same budget" },
        { icon: Bolt, text: "Comprehensive tracking until partnership completion" },
        { icon: BadgeCheck, text: "Build a strong professional reputation" },
      ];

  const ownerBenefits = isAr
    ? [
        { icon: Gem, title: "تعظيم قيمة الأرض", desc: "الأرض الخام لها سقف سعري محدود أما المشروع المطوّر فقيمته أعلى بمراحل والمالك شريك في كل هذه القيمة المضافة دون أن يدفع ريالاً واحداً من جيبه" },
        { icon: Crown, title: "شراكة بلا مخاطرة مالية", desc: "المالك يساهم بالأرض فقط بينما يتحمل المطور كامل تكاليف التصميم والبناء والتسويق مما يجعل الشراكة استثماراً بلا مخاطرة مالية مباشرة على المالك" },
        { icon: ShieldCheck, title: "حقوق محفوظة بالكامل", desc: "من لحظة التسجيل وحتى اكتمال المشروع كل حق من حقوق المالك موثق ومحفوظ رقمياً مع عقود واضحة تحمي مصالحه في جميع الظروف" },
      ]
    : [
        { icon: Gem, title: "Maximize Land Value", desc: "Raw land has a limited price ceiling while a developed project is worth far more and the owner is a partner in all this added value without paying a single riyal from their pocket" },
        { icon: Crown, title: "Partnership Without Financial Risk", desc: "The owner contributes only the land while the developer bears all design construction and marketing costs making partnership an investment with no direct financial risk to the owner" },
        { icon: ShieldCheck, title: "Fully Preserved Rights", desc: "From the moment of registration to project completion every owner right is documented and digitally preserved with clear contracts protecting their interests in all circumstances" },
      ];

  const devBenefits = isAr
    ? [
        { icon: Briefcase, title: "تحرير رأس المال", desc: "بدلاً من تجميد ملايين في شراء الأرض يستثمر المطور كامل ميزانيته في التصميم والبناء والتسويق لتحقيق أعلى جودة ممكنة وأفضل عائد" },
        { icon: Network, title: "توسيع المحفظة العقارية", desc: "الشراكة تتيح للمطور تنفيذ عدة مشاريع بالتوازي بدلاً من مشروع واحد مما يعني تنويعاً أكبر وتقليلاً للمخاطر ونمواً أسرع لأعماله" },
        { icon: Target, title: "فرص جاهزة ومؤهلة", desc: "بدلاً من أشهر من البحث التقليدي عن أراضي مناسبة يجد المطور فرصاً حقيقية متاحة من ملاك جادين يبحثون عن شريك تطوير موثوق" },
      ]
    : [
        { icon: Briefcase, title: "Free Up Capital", desc: "Instead of freezing millions in land purchase the developer invests their full budget in design construction and marketing to achieve the highest quality and best returns" },
        { icon: Network, title: "Expand Real Estate Portfolio", desc: "Partnerships enable developers to execute multiple projects simultaneously instead of one meaning greater diversification reduced risks and faster business growth" },
        { icon: Target, title: "Ready Qualified Opportunities", desc: "Instead of months of traditional searching for suitable land developers find real available opportunities from serious owners seeking reliable development partners" },
      ];

  const modelPillars = isAr
    ? [
        { icon: Layers, title: "حوكمة من أول خطوة", desc: "كل شراكة تمر بمراحل منظمة ومحكومة رقمياً من التسجيل والتحقق وعرض الفرص وتقديم الطلبات وحتى التوقيع النهائي" },
        { icon: LockKeyhole, title: "إفصاح متدرج ومحمي", desc: "البيانات الحساسة لا تُكشف دفعة واحدة بل تُفتح تدريجياً مع تقدم المفاوضات وبموافقة صريحة من كل طرف في كل مرحلة" },
        { icon: BarChart3, title: "لوحات تحكم ذكية", desc: "كل طرف يتابع شراكته من لوحة تحكم خاصة تعرض حالة الطلبات والاجتماعات والمستندات والمراحل بشكل فوري ومحدث" },
        { icon: FileCheck2, title: "توثيق رقمي شامل", desc: "كل قرار وكل اتفاق وكل محادثة موثقة رقمياً في سجل آمن يمكن الرجوع إليه في أي وقت ويُستخدم كمرجع قانوني معتمد" },
        { icon: Cpu, title: "تحقق تلقائي من المطورين", desc: "كل مطور يتقدم بطلب شراكة مرّ بعملية تأهيل شاملة تشمل السجل التجاري والتراخيص وسجل المشاريع مما يوفر طمأنينة كاملة للمالك" },
        { icon: Handshake, title: "إغلاق منظم وموثق", desc: "عند اكتمال الاتفاق تُغلق الشراكة رسمياً بعقود واضحة تحفظ حقوق الطرفين مع توثيق كامل لكل التفاصيل والشروط المتفق عليها" },
      ]
    : [
        { icon: Layers, title: "Governance From Step One", desc: "Every partnership goes through organized digitally governed stages from registration and verification to opportunity listing request submission and final signing" },
        { icon: LockKeyhole, title: "Gradual Protected Disclosure", desc: "Sensitive data is not revealed all at once but opened gradually as negotiations progress with explicit consent from each party at every stage" },
        { icon: BarChart3, title: "Smart Dashboards", desc: "Each party tracks their partnership from a dedicated dashboard showing request status meetings documents and stages instantly and up-to-date" },
        { icon: FileCheck2, title: "Comprehensive Digital Documentation", desc: "Every decision agreement and conversation is digitally documented in a secure record accessible at any time and serves as an approved legal reference" },
        { icon: Cpu, title: "Automatic Developer Verification", desc: "Every developer submitting a partnership request has undergone comprehensive qualification including commercial registration licenses and project history giving owners complete peace of mind" },
        { icon: Handshake, title: "Organized Documented Closing", desc: "When the agreement is complete the partnership is officially closed with clear contracts preserving both parties rights with full documentation of all agreed details and terms" },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="partnerships"
        title={isAr ? "شراكات التطوير العقاري" : "Real Estate Development Partnerships"}
        subtitle={isAr
          ? "سينا تجمع ملاك الأراضي والمطورين العقاريين في منظومة رقمية محكومة لبناء شراكات تطويرية ناجحة بعوائد مضاعفة وحوكمة شاملة"
          : "SINA brings together landowners and real estate developers in a governed digital ecosystem to build successful development partnerships with multiplied returns and comprehensive governance"}
        isAr={isAr}
        image="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1920&q=85&auto=format&fit=crop"
      />

      {/* Two Blocks - Owner & Developer */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-40 end-[-140px] w-[520px] h-[520px] rounded-full bg-[#C2A86B]/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 start-[-140px] w-[520px] h-[520px] rounded-full bg-[#2B4C66]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "اختر مسارك في الشراكة التطويرية" : "Choose Your Partnership Path"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "سواء كنت مالك أرض تبحث عن شريك تطوير موثوق أو مطوراً عقارياً يبحث عن فرص حقيقية اكتشف كيف يمكن لسينا مساعدتك"
                : "Whether youre a landowner seeking a reliable development partner or a real estate developer looking for real opportunities, discover how SINA can help you"}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Landowner Block */}
            <div
              onClick={() => navigate("/partnerships/owners")}
              className="group relative bg-white rounded-3xl ring-1 ring-slate-200/70 hover:ring-[#C2A86B]/40 p-10 md:p-12 cursor-pointer transition-all duration-500 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.18)] hover:shadow-[0_40px_100px_-35px_rgba(194,168,107,0.35)] hover:-translate-y-1"
            >
              <div className="absolute top-6 end-6">
                <Arrow className="w-5 h-5 text-slate-300 group-hover:text-[#C2A86B] transition-all duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>

              <Landmark className="w-7 h-7 text-[#A88A4A] mb-6" strokeWidth={1.7} />

              <h3 className="text-2xl md:text-[28px] font-bold text-[#1E374B] mb-3 tracking-tight leading-[1.15]">
                {isAr ? "لملاك الأراضي" : "For Landowners"}
              </h3>
              <p className="text-[14px] md:text-[15px] text-slate-600 leading-relaxed mb-8">
                {isAr
                  ? "حوّل أرضك إلى مشروع استثماري مربح بعوائد مضاعفة مع حماية كاملة لحقوقك وخصوصيتك وتحكم تام بكل قراراتك"
                  : "Transform your land into a profitable investment with multiplied returns, complete protection of your rights and privacy, and full control over every decision"}
              </p>

              <div className="space-y-3.5 mb-10">
                {ownerHighlights.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#A88A4A] shrink-0" strokeWidth={1.7} />
                    <span className="text-[13px] text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-2.5 h-12 px-8 bg-gradient-to-br from-[#D7C084] to-[#A88A4A] group-hover:from-[#A88A4A] group-hover:to-[#8A6F3A] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#C2A86B]/25 transition-all duration-300">
                {isAr ? "اكتشف شراكات الملاك" : "Explore Owner Partnerships"}
                <Arrow className="w-4 h-4" />
              </div>
            </div>

            {/* Developer Block */}
            <div
              onClick={() => navigate("/partnerships/developers")}
              className="group relative bg-white rounded-3xl ring-1 ring-slate-200/70 hover:ring-[#2B4C66]/30 p-10 md:p-12 cursor-pointer transition-all duration-500 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.18)] hover:shadow-[0_40px_100px_-35px_rgba(43,76,102,0.3)] hover:-translate-y-1"
            >
              <div className="absolute top-6 end-6">
                <Arrow className="w-5 h-5 text-slate-300 group-hover:text-[#2B4C66] transition-all duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>

              <Building2 className="w-7 h-7 text-[#2B4C66] mb-6" strokeWidth={1.7} />

              <h3 className="text-2xl md:text-[28px] font-bold text-[#1E374B] mb-3 tracking-tight leading-[1.15]">
                {isAr ? "للمطورين العقاريين" : "For Real Estate Developers"}
              </h3>
              <p className="text-[14px] md:text-[15px] text-slate-600 leading-relaxed mb-8">
                {isAr
                  ? "نفّذ مشاريع أكثر بتكلفة أقل مع وصول مباشر لأراضي مؤهلة وملاك يبحثون عن مطورين موثوقين وأدوات رقمية متقدمة"
                  : "Execute more projects at lower cost with direct access to qualified lands, owners seeking reliable developers, and advanced digital tools"}
              </p>

              <div className="space-y-3.5 mb-10">
                {devHighlights.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#2B4C66] shrink-0" strokeWidth={1.7} />
                    <span className="text-[13px] text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-2.5 h-12 px-8 bg-gradient-to-br from-[#2B4C66] to-[#1E374B] group-hover:from-[#1E374B] group-hover:to-[#0F1F2E] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#2B4C66]/25 transition-all duration-300">
                {isAr ? "اكتشف شراكات المطورين" : "Explore Developer Partnerships"}
                <Arrow className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Each Party Gains */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "ماذا يكسب كل طرف من الشراكة التطويرية" : "What Each Party Gains From Development Partnerships"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "الشراكة التطويرية ليست مجرد اتفاق بل نموذج يحقق مصلحة حقيقية لكل من المالك والمطور في آن واحد"
                : "Development partnerships arent just agreements but a model that achieves real benefit for both landowner and developer simultaneously"}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Owner Side */}
            <div className="bg-white rounded-3xl p-8 md:p-10 ring-1 ring-slate-200/70 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.15)]">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                <Landmark className="w-7 h-7 text-[#A88A4A]" strokeWidth={1.7} />
                <h3 className="text-xl font-bold text-[#1E374B] tracking-tight">{isAr ? "المالك يحصل على" : "The Owner Gets"}</h3>
              </div>
              <div className="space-y-6">
                {ownerBenefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <item.icon className="w-6 h-6 text-[#A88A4A] shrink-0 mt-0.5" strokeWidth={1.7} />
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1E374B] mb-1.5 tracking-tight">{item.title}</h4>
                      <p className="text-[13px] text-slate-500 leading-[1.9]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Developer Side */}
            <div className="bg-white rounded-3xl p-8 md:p-10 ring-1 ring-slate-200/70 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.15)]">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                <Building2 className="w-7 h-7 text-[#2B4C66]" strokeWidth={1.7} />
                <h3 className="text-xl font-bold text-[#1E374B] tracking-tight">{isAr ? "المطور يحصل على" : "The Developer Gets"}</h3>
              </div>
              <div className="space-y-6">
                {devBenefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <item.icon className="w-6 h-6 text-[#2B4C66] shrink-0 mt-0.5" strokeWidth={1.7} />
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1E374B] mb-1.5 tracking-tight">{item.title}</h4>
                      <p className="text-[13px] text-slate-500 leading-[1.9]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How SINA Organizes Partnerships */}
      <section className="relative py-20 lg:py-24 bg-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-1/4 end-[-140px] w-[440px] h-[440px] rounded-full bg-[#2B4C66]/[0.05] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "كيف تنظّم سينا الشراكة بين الطرفين" : "How SINA Organizes Partnerships Between Both Parties"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "منظومة حوكمة رقمية متكاملة تحمي المالك والمطور وتنظم كل مرحلة من مراحل الشراكة بشفافية كاملة"
                : "A comprehensive digital governance ecosystem that protects both owner and developer and organizes every partnership stage with complete transparency"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {modelPillars.map((item, i) => (
              <div key={i} className="group relative bg-gradient-to-b from-white to-[#FAFBFC] rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#2B4C66]/25 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(43,76,102,0.25)] transition-all duration-500 hover:-translate-y-1">
                <item.icon className="w-6 h-6 text-[#2B4C66] mb-5" strokeWidth={1.7} />
                <h3 className="text-[16px] font-bold text-[#1E374B] mb-2.5 tracking-tight">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "لماذا الشراكة وليس البيع" : "Why Partnership Not Selling"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "مقارنة واضحة توضح لماذا يتجه أصحاب الأراضي الأذكياء نحو الشراكة التطويرية بدلاً من البيع التقليدي"
                : "A clear comparison showing why smart landowners are choosing development partnerships over traditional selling"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl p-8 ring-1 ring-slate-200">
              <h3 className="text-lg font-bold text-slate-400 mb-6 tracking-tight">{isAr ? "البيع المباشر" : "Direct Sale"}</h3>
              <ul className="space-y-4">
                {(isAr
                  ? ["تحصل على سعر الأرض الخام فقط ولا تستفيد من أي قيمة مضافة", "تفقد الملكية بالكامل ولا يمكنك الاستفادة من ارتفاع الأسعار مستقبلاً", "قد تبيع بأقل من القيمة الفعلية بسبب ضغوط السوق أو التفاوض", "لا تشارك في قرارات التطوير ولا تعرف ماذا سيحدث بأرضك بعد البيع", "المشتري قد يتركها شاغرة لسنوات دون تطوير فعلي"]
                  : ["You receive only the raw land price with no benefit from added value", "You lose ownership entirely and cannot benefit from future price increases", "You may sell below actual value due to market pressure or negotiation", "You have no participation in development decisions and no knowledge of what happens to your land", "The buyer may leave it vacant for years without actual development"]
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 ring-2 ring-[#C2A86B]/50 shadow-[0_20px_60px_-25px_rgba(194,168,107,0.35)]">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold text-[#1E374B] tracking-tight">{isAr ? "الشراكة التطويرية" : "Development Partnership"}</h3>
                <BadgeCheck className="w-5 h-5 text-[#C2A86B]" strokeWidth={1.75} />
              </div>
              <ul className="space-y-4">
                {(isAr
                  ? ["تحصل على نسبة من المشروع المطوّر بقيمة تتجاوز سعر الأرض بأضعاف", "تحتفظ بجزء من ملكيتك وتشارك في أرباح المشروع طوال مدته", "سينا تنظم العملية وتحمي حقوقك بعقود واضحة وتوثيق رقمي شامل", "تتابع كل مرحلة من مراحل المشروع بشفافية كاملة عبر لوحة تحكمك", "أرضك تتحول فعلياً إلى مشروع حقيقي يخدم المجتمع ويحقق لك دخلاً مستمراً"]
                  : ["You receive a share of the developed project worth multiples of the land price", "You retain partial ownership and share in project profits throughout its duration", "SINA organizes the process and protects your rights with clear contracts and comprehensive documentation", "You track every project stage with complete transparency through your dashboard", "Your land actually transforms into a real project serving the community and generating ongoing income"]
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-[#1E374B]">
                    <BadgeCheck className="w-4 h-4 text-[#C2A86B] mt-0.5 shrink-0" strokeWidth={1.75} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* White Land Fees Section */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-br from-[#1E374B] via-[#1E374B] to-[#0F1F2E] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-40 end-[-140px] w-[520px] h-[520px] rounded-full bg-[#C2A86B]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 start-[-140px] w-[520px] h-[520px] rounded-full bg-[#2B4C66]/30 blur-3xl pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
                {isAr ? "رسوم الأراضي البيضاء تدفع نحو التطوير الآن" : "White Land Fees Are Driving Development Now"}
              </h2>
              <p className="text-[15px] md:text-[16px] text-white/70 max-w-2xl mx-auto leading-relaxed">
                {isAr
                  ? "نظام الرسوم على الأراضي البيضاء يهدف لتحفيز الملاك على تطوير أراضيهم والشراكة التطويرية هي الطريقة الأذكى للاستجابة لهذا التوجه وتحقيق عوائد مضاعفة بدلاً من تحمّل الرسوم"
                  : "The white land fee system aims to encourage owners to develop their lands and development partnership is the smartest way to respond to this direction and achieve multiplied returns instead of bearing the fees"}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-10">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-3 tracking-tight">2.5% - 10%</div>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">
                  {isAr ? "رسوم سنوية على الأرض الشاغرة" : "Annual Fees on Vacant Land"}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.9]">
                  {isAr
                    ? "الرسوم تُفرض سنوياً على الأراضي غير المطورة داخل النطاق العمراني وتتصاعد مع الوقت مما يجعل التطوير أولوية اقتصادية للمالك"
                    : "Fees are imposed annually on undeveloped lands within urban boundaries and escalate over time making development an economic priority for the owner"}
                </p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-3 tracking-tight">
                  {isAr ? "توسّع مستمر" : "Expanding"}
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">
                  {isAr ? "مدن ومناطق جديدة تُضاف باستمرار" : "New Cities and Regions Added Continuously"}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.9]">
                  {isAr
                    ? "البرنامج يتوسع على مراحل ليشمل مناطق جديدة والملاك الذين يبادرون بالتطوير قبل فرض الرسوم يتجنبون التكاليف ويحققون أعلى العوائد"
                    : "The program expands in phases to cover new regions and owners who take development initiative before fees are imposed avoid costs and achieve the highest returns"}
                </p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-3 tracking-tight">
                  {isAr ? "صفر تكلفة عليك" : "Zero Cost to You"}
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight">
                  {isAr ? "المطور يتحمل كل تكاليف التطوير" : "Developer Bears All Development Costs"}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.9]">
                  {isAr
                    ? "في الشراكة التطويرية المطور يتكفل بالتصميم والبناء والتسويق وأنت كمالك تساهم بالأرض فقط وتحصل على نسبتك من المشروع المطوّر"
                    : "In development partnerships the developer handles design construction and marketing while you as owner contribute only the land and receive your share of the developed project"}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#C2A86B]/20 via-[#C2A86B]/10 to-[#C2A86B]/5 rounded-2xl p-8 md:p-10 ring-1 ring-[#C2A86B]/25">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight leading-[1.2]">
                {isAr ? "المالك والمطور يربحان معاً" : "Owner and Developer Win Together"}
              </h3>
              <p className="text-[14px] text-white/70 leading-[1.9]">
                {isAr
                  ? "المالك يتحول من دافع رسوم إلى شريك في مشروع مربح والمطور يحصل على أراضي جاهزة دون تكلفة استحواذ والمجتمع يستفيد من مشاريع تنموية حقيقية تسهم في تحقيق رؤية المملكة 2030"
                  : "The owner transforms from a fee payer to a partner in a profitable project the developer gets ready lands without acquisition costs and the community benefits from real development projects contributing to the Kingdoms Vision 2030"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white border-t border-slate-100 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-20 start-1/2 -translate-x-1/2 w-[620px] h-[420px] rounded-full bg-[#2B4C66]/[0.05] blur-3xl pointer-events-none" />
        <div className="container relative text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-4 tracking-tight leading-[1.1]">
            {isAr ? "ابدأ شراكتك التطويرية الآن" : "Start Your Development Partnership Now"}
          </h2>
          <p className="text-[15px] md:text-[16px] text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? "سواء كنت مالك أرض أو مطور عقاري سينا المكان المناسب لبناء شراكات ناجحة ومربحة"
              : "Whether youre a landowner or a real estate developer SINA is the right place to build successful profitable partnerships"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="inline-flex items-center gap-3 h-14 px-10 bg-gradient-to-br from-[#D7C084] to-[#A88A4A] hover:from-[#A88A4A] hover:to-[#8A6F3A] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-[#C2A86B]/30 hover:shadow-xl hover:shadow-[#C2A86B]/40 transition-all duration-300 tracking-tight"
            >
              <Landmark className="w-5 h-5" strokeWidth={1.75} />
              {isAr ? "دخول الملاك" : "Owner Login"}
            </button>
            <button
              onClick={() => navigate("/auth/login")}
              className="inline-flex items-center gap-3 h-14 px-10 bg-gradient-to-br from-[#2B4C66] to-[#1E374B] hover:from-[#1E374B] hover:to-[#0F1F2E] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-[#2B4C66]/30 hover:shadow-xl hover:shadow-[#2B4C66]/40 transition-all duration-300 tracking-tight"
            >
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
              {isAr ? "دخول المطورين" : "Developer Login"}
            </button>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default Partnerships;
