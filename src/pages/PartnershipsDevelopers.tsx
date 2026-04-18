import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import {
  MapPin, ClipboardList, Bolt, ArrowLeft, ArrowRight,
  BadgeCheck, CircleDollarSign, Rocket, Building2,
  BarChart3, Briefcase, Network, Trophy, Cpu,
} from "lucide-react";

const PartnershipsDevelopers: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "شراكات المطورين" : "Partnerships for Developers");

  const devFeatures = isAr
    ? [
        { icon: MapPin, title: "فرص تطويرية حقيقية ومتجددة", desc: "أراضي حقيقية من ملاك تم التحقق منهم متاحة للشراكة مع بيانات تفصيلية كافية لاتخاذ قرار استثماري مدروس دون الحاجة للبحث التقليدي المكلف والمستهلك للوقت" },
        { icon: CircleDollarSign, title: "وفّر تكاليف الاستحواذ بالكامل", desc: "بدلاً من شراء الأرض بالكامل وتجميد رأس مالك ادخل في شراكة تطويرية واستثمر ميزانيتك كاملة في جودة التطوير والبناء والتسويق لتحقيق أفضل النتائج" },
        { icon: ClipboardList, title: "طلبات منظمة وموثقة رقمياً", desc: "قدّم طلبات شراكة رسمية واضحة مع تحديد نوع التعاون المطلوب وكل طلب يُوثّق ويُتابع داخل المنصة بشكل منظم مع إشعارات فورية لكل تحديث" },
        { icon: Bolt, title: "متابعة شاملة حتى إتمام الصفقة", desc: "تابع جميع مراحل الصفقة من التفاوض والاجتماعات والمستندات والعقود حتى إتمام الشراكة بنجاح عبر لوحة تحكم واحدة متكاملة وسهلة الاستخدام" },
        { icon: Rocket, title: "تنفيذ مشاريع أكثر بنفس الميزانية", desc: "بدلاً من مشروع واحد يمكنك الدخول في عدة شراكات تطويرية وتنويع محفظتك العقارية وزيادة عدد مشاريعك سنوياً وتقليل المخاطر عبر التوزيع" },
        { icon: BadgeCheck, title: "بناء سمعة مهنية قوية ومتنامية", desc: "كل مشروع ناجح تنفذه يُسجّل في ملفك على المنصة ويرفع تصنيفك المهني ويجذب لك فرص شراكة أفضل مع ملاك أراضي أكثر وأراضي أكبر" },
      ]
    : [
        { icon: MapPin, title: "Real Renewed Development Opportunities", desc: "Real lands from verified owners available for partnership with detailed sufficient data to make informed investment decisions without costly and time-consuming traditional searching" },
        { icon: CircleDollarSign, title: "Save Acquisition Costs Entirely", desc: "Instead of purchasing land outright and freezing your capital, enter a development partnership and invest your full budget in development quality, construction, and marketing for best results" },
        { icon: ClipboardList, title: "Organized Digitally Documented Requests", desc: "Submit clear formal partnership requests specifying the type of collaboration needed, every request is documented and tracked within the platform with instant notifications for every update" },
        { icon: Bolt, title: "Comprehensive Tracking Until Deal Completion", desc: "Follow all deal stages from negotiation, meetings, documents, and contracts until successful partnership completion through a single integrated and easy-to-use dashboard" },
        { icon: Rocket, title: "Execute More Projects With Same Budget", desc: "Instead of one project you can enter multiple development partnerships, diversify your real estate portfolio, increase your annual project count, and reduce risks through distribution" },
        { icon: BadgeCheck, title: "Build a Strong Growing Professional Reputation", desc: "Every successful project you complete is recorded in your platform profile, raising your professional rating and attracting better partnership opportunities with more landowners and larger lands" },
      ];

  const devSteps = isAr
    ? [
        { num: "01", title: "أنشئ حسابك وتأهّل تلقائياً", desc: "سجّل كمطور عقاري وارفع السجل التجاري والتراخيص المطلوبة ويتم التحقق منك وتأهيلك تلقائياً خلال وقت قصير لتبدأ استكشاف الفرص" },
        { num: "02", title: "اكتشف فرصاً تطويرية حقيقية", desc: "تصفّح الأراضي المتاحة للشراكة مع بيانات تفصيلية عن الموقع والمساحة ونوع التطوير المطلوب لاتخاذ قرار استثماري مبني على معلومات حقيقية" },
        { num: "03", title: "قدّم طلب شراكة رسمي ومنظم", desc: "اختر الفرصة المناسبة وقدّم طلب شراكة واضحاً يحدد نوع التعاون المطلوب ورؤيتك للمشروع ويصل مباشرة إلى المالك عبر المنصة" },
        { num: "04", title: "تابع الصفقة حتى إتمامها بنجاح", desc: "بعد قبول طلبك تابع كل مراحل التفاوض والاجتماعات والمستندات والعقود عبر لوحة تحكم واحدة حتى إتمام الشراكة وبدء التنفيذ" },
      ]
    : [
        { num: "01", title: "Create Your Account & Auto-Qualify", desc: "Register as a real estate developer, upload commercial registration and required licenses, verification and qualification happen automatically in a short time so you can start exploring opportunities" },
        { num: "02", title: "Discover Real Development Opportunities", desc: "Browse lands available for partnership with detailed information about location, area, and desired development type to make investment decisions based on real data" },
        { num: "03", title: "Submit a Formal Organized Partnership Request", desc: "Choose the right opportunity and submit a clear partnership request specifying the type of collaboration and your project vision, reaching the owner directly through the platform" },
        { num: "04", title: "Track the Deal Until Successful Completion", desc: "After your request is accepted, follow all negotiation, meeting, document, and contract stages through a single dashboard until partnership completion and project execution begins" },
      ];

  const devAdvantages = isAr
    ? [
        { icon: Briefcase, title: "وفّر رأس المال", desc: "بدلاً من شراء الأرض وتجميد رأس مالك ادخل في شراكة واستثمر ميزانيتك في جودة التطوير والبناء والتسويق" },
        { icon: Network, title: "وصول مباشر للفرص", desc: "لا تضيع وقتك في البحث التقليدي عن أراضي مناسبة بل تصفّح فرصاً حقيقية متاحة من ملاك يبحثون عن مطورين" },
        { icon: Trophy, title: "سمعة تنمو مع كل مشروع", desc: "كل مشروع ناجح يُسجّل في ملفك على المنصة ويرفع تصنيفك ويجذب لك فرص شراكة أفضل مع ملاك أكثر" },
        { icon: Cpu, title: "أدوات رقمية متقدمة", desc: "لوحة تحكم شاملة لإدارة طلباتك ومتابعة صفقاتك وتوثيق كل مرحلة من مراحل الشراكة بكفاءة واحترافية" },
      ]
    : [
        { icon: Briefcase, title: "Save Your Capital", desc: "Instead of buying land and freezing your capital enter a partnership and invest your budget in development quality, construction, and marketing" },
        { icon: Network, title: "Direct Access to Opportunities", desc: "Dont waste time on traditional land searching, browse real available opportunities from owners actively seeking developers" },
        { icon: Trophy, title: "Reputation Grows With Every Project", desc: "Every successful project is recorded in your platform profile, raising your rating and attracting better partnership opportunities with more owners" },
        { icon: Cpu, title: "Advanced Digital Tools", desc: "A comprehensive dashboard to manage your requests, track your deals, and document every stage of the partnership efficiently and professionally" },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="partnerships-developers"
        title={isAr ? "شراكات المطورين العقاريين" : "Partnerships for Real Estate Developers"}
        subtitle={isAr
          ? "نفّذ مشاريع أكثر بتكلفة أقل مع وصول مباشر لأراضي مؤهلة وملاك يبحثون عن مطورين موثوقين عبر سينا للاستثمارات العقارية"
          : "Execute more projects at lower cost with direct access to qualified lands and owners seeking reliable developers through SINA platform"}
        isAr={isAr}
        image="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=85&auto=format&fit=crop"
      />

      {/* Why Partnership for Developers */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-20 end-[-120px] w-[460px] h-[460px] rounded-full bg-[#2B4C66]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "لماذا الشراكة التطويرية أفضل للمطور" : "Why Development Partnerships Are Better for Developers"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "وفّر تكاليف الاستحواذ وركّز ميزانيتك على التطوير والبناء مع فرص حقيقية ومتجددة"
                : "Save acquisition costs and focus your budget on development and construction with real renewed opportunities"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {devAdvantages.map((item, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#2B4C66]/25 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(43,76,102,0.25)] transition-all duration-500 hover:-translate-y-0.5">
                <div className="flex gap-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B4C66] to-[#1E374B] shadow-md shadow-[#2B4C66]/25 shrink-0">
                    <item.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1E374B] mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-[1.9]">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Features */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-1/3 start-[-140px] w-[440px] h-[440px] rounded-full bg-[#2B4C66]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "مميزات سينا للاستثمارات العقارية للمطورين" : "SINA Platform Features for Developers"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "أدوات رقمية متقدمة صُممت لتسهيل وصولك للفرص التطويرية وإدارة شراكاتك باحترافية"
                : "Advanced digital tools designed to facilitate your access to development opportunities and manage your partnerships professionally"}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {devFeatures.map((v, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#2B4C66]/25 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(43,76,102,0.25)] transition-all duration-500 hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B4C66] to-[#1E374B] shadow-md shadow-[#2B4C66]/25 mb-5">
                  <v.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <h3 className="text-[16px] font-bold text-[#1E374B] mb-2.5 tracking-tight">{v.title}</h3>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Journey */}
      <section className="relative py-20 lg:py-24 bg-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="container relative">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-5 tracking-tight leading-[1.1]">
              {isAr ? "رحلة المطور في سينا" : "The Developers Journey on SINA"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">
              {isAr
                ? "أربع خطوات بسيطة من إنشاء حسابك حتى إتمام شراكتك التطويرية بنجاح"
                : "Four simple steps from creating your account to successfully completing your development partnership"}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {devSteps.map((step, i) => (
              <div key={i} className="relative bg-gradient-to-b from-white to-[#FAFBFC] rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#2B4C66]/25 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(43,76,102,0.22)] transition-all duration-500">
                <span className="block text-[40px] font-bold bg-gradient-to-br from-[#2B4C66]/20 to-[#2B4C66]/5 bg-clip-text text-transparent mb-3 tracking-tight leading-none">{step.num}</span>
                <h4 className="text-[15px] font-bold text-[#1E374B] mb-2 tracking-tight">{step.title}</h4>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Section */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-br from-[#1E374B] via-[#1E374B] to-[#0F1F2E] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-40 end-[-140px] w-[520px] h-[520px] rounded-full bg-[#C2A86B]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 start-[-140px] w-[520px] h-[520px] rounded-full bg-[#2B4C66]/30 blur-3xl pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm mb-6">
              <BarChart3 className="w-6 h-6 text-[#C2A86B]" strokeWidth={1.75} />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
              {isAr ? "ضاعف عدد مشاريعك سنوياً" : "Multiply Your Annual Projects"}
            </h2>
            <p className="text-[15px] md:text-[16px] text-white/70 max-w-2xl mx-auto leading-relaxed mb-12">
              {isAr
                ? "بدلاً من استثمار كل ميزانيتك في شراء أرض واحدة يمكنك الدخول في عدة شراكات تطويرية وتنويع محفظتك العقارية وتحقيق عوائد من مشاريع متعددة في وقت واحد"
                : "Instead of investing your entire budget in purchasing one land you can enter multiple development partnerships, diversify your real estate portfolio, and generate returns from multiple projects simultaneously"}
            </p>
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-2 tracking-tight">{isAr ? "مشاريع أكثر" : "More Projects"}</div>
                <p className="text-[13px] text-white/60 leading-relaxed">{isAr ? "نفّذ عدة مشاريع بنفس الميزانية" : "Execute multiple projects with the same budget"}</p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-2 tracking-tight">{isAr ? "تنويع أكبر" : "Greater Diversity"}</div>
                <p className="text-[13px] text-white/60 leading-relaxed">{isAr ? "نوّع محفظتك العقارية وقلل المخاطر" : "Diversify your portfolio and reduce risks"}</p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 ring-1 ring-white/10">
                <div className="text-[#D7C084] text-2xl font-bold mb-2 tracking-tight">{isAr ? "نمو أسرع" : "Faster Growth"}</div>
                <p className="text-[13px] text-white/60 leading-relaxed">{isAr ? "حقق نمواً متسارعاً لشركتك" : "Achieve accelerated growth for your company"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white border-t border-slate-100 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-20 start-1/2 -translate-x-1/2 w-[520px] h-[420px] rounded-full bg-[#2B4C66]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2B4C66] to-[#1E374B] shadow-lg shadow-[#2B4C66]/25 mb-6 mx-auto">
            <Building2 className="w-6 h-6 text-white" strokeWidth={1.75} />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E374B] mb-4 tracking-tight leading-[1.1]">
            {isAr ? "ابدأ رحلتك كمطور عقاري الآن" : "Start Your Journey as a Developer Now"}
          </h2>
          <p className="text-[15px] md:text-[16px] text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? "سجّل كمطور واكتشف فرص الشراكة التطويرية المتاحة عبر سينا للاستثمارات العقارية"
              : "Register as a developer and discover available development partnership opportunities through SINA"}
          </p>
          <button
            onClick={() => navigate("/auth/login")}
            className="inline-flex items-center gap-3 h-14 px-10 bg-gradient-to-br from-[#2B4C66] to-[#1E374B] hover:from-[#1E374B] hover:to-[#0F1F2E] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-[#2B4C66]/30 hover:shadow-xl hover:shadow-[#2B4C66]/40 transition-all duration-300 tracking-tight"
          >
            {isAr ? "دخول المطورين" : "Developer Login"}
            <Arrow className="w-4 h-4" />
          </button>
        </div>
      </section>
    </PageShell>
  );
};

export default PartnershipsDevelopers;
