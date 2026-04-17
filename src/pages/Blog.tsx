import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import { Clock, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, TrendingUp, Handshake, Building2, CircleDollarSign, ShieldCheck, Users, BookOpen, Landmark } from "lucide-react";
import headerAboutImg from "@/assets/header-about.jpg";

interface BlogArticle {
  id: string;
  icon: React.FC<any>;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  readTimeAr: string;
  readTimeEn: string;
  contentAr: string[];
  contentEn: string[];
  tag: { ar: string; en: string };
  featured?: boolean;
}

const articles: BlogArticle[] = [
  {
    id: "partnership-basics",
    icon: Handshake,
    titleAr: "أساسيات الشراكة التطويرية العقارية: دليلك الشامل",
    titleEn: "Real Estate Development Partnership Basics: Your Complete Guide",
    summaryAr: "تعرّف على مفهوم الشراكة التطويرية وكيف تختلف عن البيع التقليدي وما هي الأنواع المختلفة للشراكات العقارية وكيف تختار النموذج الأنسب لأرضك",
    summaryEn: "Learn about the concept of development partnerships, how they differ from traditional sales, the different types of real estate partnerships, and how to choose the best model for your land",
    readTimeAr: "8 دقائق قراءة",
    readTimeEn: "8 min read",
    tag: { ar: "أساسيات", en: "Fundamentals" },
    featured: true,
    contentAr: [
      "الشراكة التطويرية العقارية هي نموذج استثماري يجمع بين مالك الأرض والمطور العقاري لتطوير مشروع مشترك حيث يساهم المالك بالأرض ويساهم المطور بالخبرة والتمويل والتنفيذ وهذا النموذج يختلف جذرياً عن البيع التقليدي لأن المالك يبقى شريكاً في المشروع ويستفيد من القيمة المضافة بعد التطوير",
      "قطاع التطوير العقاري يشهد نمواً متسارعاً مع تسارع وتيرة التطوير ضمن رؤية المملكة 2030 حيث تحتاج المملكة لمشاريع سكنية وتجارية ضخمة والشراكة التطويرية توفر الحل الأمثل بالجمع بين الأراضي المتاحة وخبرات المطورين المؤهلين",
      "أنواع الشراكات التطويرية تتنوع بين المشاركة بالنسبة حيث يحصل المالك على نسبة محددة من أرباح المشروع والمشاركة بالوحدات حيث يحصل المالك على عدد محدد من الوحدات المطورة والنموذج المختلط الذي يجمع بين النسبة والوحدات وكل نموذج له مميزاته ويناسب أنواع مختلفة من المشاريع والأراضي",
      "المفتاح لنجاح أي شراكة تطويرية هو الشفافية والحوكمة لذلك وُجدت منصات مثل سينا التي توفر بيئة منظمة تحمي حقوق الطرفين وتضمن سير العملية بشكل سلس من أول تواصل وحتى إتمام المشروع وتوزيع العوائد",
    ],
    contentEn: [
      "A real estate development partnership is an investment model that brings together a landowner and a real estate developer to develop a joint project where the owner contributes the land and the developer contributes expertise, financing, and execution This model fundamentally differs from traditional sales because the owner remains a partner in the project and benefits from post-development added value",
      "The real estate development sector is witnessing accelerated growth with the pace of development under the Kingdoms Vision 2030 The Kingdom needs massive residential and commercial projects and development partnerships provide the optimal solution by combining available land with qualified developers expertise",
      "Types of development partnerships vary between percentage participation where the owner receives a specific percentage of project profits, unit participation where the owner receives a specific number of developed units, and a hybrid model combining both Each model has its advantages and suits different types of projects and lands",
      "The key to any successful development partnership is transparency and governance This is why platforms like SINA exist providing an organized environment that protects both parties rights and ensures the process runs smoothly from first contact to project completion and returns distribution",
    ],
  },
  {
    id: "owner-benefits",
    icon: TrendingUp,
    titleAr: "لماذا الشراكة أفضل من بيع الأرض: 7 أسباب يجب أن تعرفها",
    titleEn: "Why Partnership is Better Than Selling Land: 7 Reasons You Should Know",
    summaryAr: "اكتشف لماذا يتجه أذكى ملاك الأراضي نحو الشراكة التطويرية بدلاً من البيع المباشر وكيف يحققون عوائد أعلى بكثير مع الاحتفاظ بحقوقهم",
    summaryEn: "Discover why the smartest landowners are turning to development partnerships instead of direct sales, and how they achieve much higher returns while retaining their rights",
    readTimeAr: "10 دقائق قراءة",
    readTimeEn: "10 min read",
    tag: { ar: "للملاك", en: "For Owners" },
    contentAr: [
      "السبب الأول والأهم هو العوائد المضاعفة: عندما تبيع أرضك تحصل على سعر السوق الحالي فقط لكن عندما تدخل في شراكة تطويرية تحصل على نسبة من قيمة المشروع المطوّر وهي قيمة تتجاوز سعر الأرض الخام بأضعاف مضاعفة فمثلاً أرض قيمتها السوقية مليون ريال قد تصبح جزءاً من مشروع تتجاوز قيمته 10 ملايين ريال",
      "السبب الثاني هو الاحتفاظ بالملكية: في الشراكة التطويرية لا تفقد ملكيتك بالكامل فأنت شريك في المشروع وتحتفظ بنسبة من الملكية حتى بعد التطوير وهذا يعني أنك تستفيد من ارتفاع قيمة العقار المطوّر على المدى الطويل",
      "السبب الثالث هو الحماية من التقلبات: سعر الأرض الخام يتأثر بعوامل السوق والمضاربات لكن المشروع المطوّر له قيمة ثابتة ومستقرة أكثر لأنه ينتج دخلاً فعلياً من إيجارات ومبيعات وحدات والشراكة التطويرية تحوّل أرضك من أصل خامل إلى أصل منتج",
      "السبب الرابع هو عدم الحاجة لرأس مال إضافي: المطور العقاري يتحمل تكاليف التطوير والبناء والتسويق وأنت كمالك تساهم بالأرض فقط وتحصل على عوائد المشروع دون أن تدفع ريالاً واحداً إضافياً",
      "السبب الخامس هو الاستفادة من خبرة المطور: المطور العقاري المحترف يعرف كيف يحقق أعلى قيمة من الأرض من حيث التصميم والتخطيط والتسعير وشراكتك معه تضمن أن أرضك تُستغل بأفضل طريقة ممكنة",
      "السبب السادس هو المساهمة في التنمية: بدلاً من بيع أرض فارغة لمشترٍ قد يتركها سنوات الشراكة التطويرية تضمن تطوير الأرض فعلياً وتحويلها إلى مشروع حقيقي يخدم المجتمع",
      "السبب السابع هو الأمان القانوني: من خلال منصة سينا جميع الشراكات موثقة بعقود واضحة تحمي حقوقك بالكامل وكل مرحلة مسجلة ومتابعة إلكترونياً مما يوفر لك طمأنينة كاملة",
    ],
    contentEn: [
      "The first and most important reason is multiplied returns: When you sell your land you get only the current market price But when you enter a development partnership you get a percentage of the developed projects value, a value that exceeds the raw land price by multiples For example land worth 1 million SAR could become part of a project exceeding 10 million SAR in value",
      "The second reason is retaining ownership: In a development partnership you dont lose your ownership entirely You are a partner in the project and retain a percentage of ownership even after development This means you benefit from the developed propertys value appreciation in the long term",
      "The third reason is protection from fluctuations: Raw land prices are affected by market factors and speculation But a developed project has a more stable value because it produces actual income from rentals and unit sales Development partnership transforms your land from an idle asset to a productive one",
      "The fourth reason is no additional capital needed: The real estate developer bears development, construction, and marketing costs As an owner you contribute only the land and receive project returns without paying a single additional riyal",
      "The fifth reason is benefiting from developer expertise: A professional real estate developer knows how to achieve the highest value from land in terms of design, planning, and pricing Your partnership ensures your land is utilized in the best possible way",
      "The sixth reason is contributing to development: Instead of selling empty land to a buyer who might leave it vacant for years development partnership ensures your land is actually developed and transformed into a real project that serves the community",
      "The seventh reason is legal security: Through SINA platform all partnerships are documented with clear contracts that fully protect your rights Every stage is recorded and tracked digitally providing you complete peace of mind",
    ],
  },
  {
    id: "developer-partnerships",
    icon: Building2,
    titleAr: "المطور العقاري والشراكة: كيف تقلل التكاليف وتضاعف المشاريع",
    titleEn: "Real Estate Developer & Partnership: How to Reduce Costs and Multiply Projects",
    summaryAr: "اكتشف كيف تساعد الشراكات التطويرية المطورين على تنفيذ مشاريع أكثر بتكلفة أقل وتوسيع محفظتهم الاستثمارية بشكل كبير",
    summaryEn: "Discover how development partnerships help developers execute more projects at lower cost and significantly expand their investment portfolio",
    readTimeAr: "7 دقائق قراءة",
    readTimeEn: "7 min read",
    tag: { ar: "للمطورين", en: "For Developers" },
    contentAr: [
      "أكبر تحدٍ يواجه المطور العقاري هو تكلفة الاستحواذ على الأراضي ففي الأسواق النشطة مثل الرياض وجدة قد تستهلك تكلفة شراء الأرض ما يصل إلى 40-60% من إجمالي ميزانية المشروع والشراكة التطويرية تلغي هذه التكلفة تماماً وتحرر رأس المال للتركيز على جودة التطوير",
      "بدلاً من شراء أرض واحدة بكامل الميزانية يمكن للمطور الدخول في شراكات متعددة في نفس الوقت وهذا يعني تنويع المحفظة العقارية وتقليل المخاطر وزيادة عدد المشاريع المنفذة سنوياً فمطور كان ينفذ مشروعاً واحداً يمكنه تنفيذ ثلاثة مشاريع بنفس رأس المال",
      "الشراكة التطويرية أيضاً تسرّع دورة المشروع فبدلاً من قضاء أشهر في البحث عن أرض مناسبة والتفاوض على سعرها منصة سينا توفر فرصاً جاهزة ومؤهلة مع ملاك مستعدين للشراكة وهذا يختصر مرحلة ما قبل التطوير بشكل كبير",
      "من الناحية المالية الشراكة التطويرية تحسّن مؤشرات الأداء المالي للمطور بشكل ملحوظ فمعدل العائد على رأس المال المستثمر يرتفع لأن حجم الاستثمار المبدئي أقل ونسبة الربح من المشروع المطور تبقى مجزية للطرفين",
    ],
    contentEn: [
      "The biggest challenge facing a real estate developer is land acquisition cost In active markets like Riyadh and Jeddah land purchase costs can consume up to 40-60% of the total project budget Development partnerships completely eliminate this cost and free up capital to focus on development quality",
      "Instead of buying one land plot with the entire budget developers can enter multiple partnerships simultaneously This means diversifying the real estate portfolio, reducing risks, and increasing the number of projects executed annually A developer who executed one project can now execute three with the same capital",
      "Development partnerships also accelerate the project cycle Instead of spending months searching for suitable land and negotiating prices SINA platform provides ready qualified opportunities with owners prepared for partnership This significantly shortens the pre-development phase",
      "Financially development partnerships noticeably improve the developers financial performance metrics Return on invested capital increases because the initial investment is lower and the profit margin from the developed project remains rewarding for both parties",
    ],
  },
  {
    id: "roi-advantages",
    icon: CircleDollarSign,
    titleAr: "العوائد المالية للشراكة التطويرية: أرقام وحقائق",
    titleEn: "Financial Returns of Development Partnerships: Numbers and Facts",
    summaryAr: "تحليل مفصّل للعوائد المالية المتوقعة من الشراكات التطويرية مقارنة بالبيع التقليدي مع أمثلة عملية من السوق",
    summaryEn: "Detailed analysis of expected financial returns from development partnerships compared to traditional selling with practical market examples",
    readTimeAr: "9 دقائق قراءة",
    readTimeEn: "9 min read",
    tag: { ar: "تحليل مالي", en: "Financial Analysis" },
    contentAr: [
      "لنأخذ مثالاً عملياً: أرض مساحتها 5,000 متر مربع في شمال الرياض سعر البيع المباشر في السوق الحالي حوالي 3 ملايين ريال لكن إذا دخل المالك في شراكة تطويرية لبناء مجمع سكني فإن قيمة المشروع المطوّر قد تصل إلى 15-20 مليون ريال وحتى لو كانت حصة المالك 30% فقط فإنه سيحصل على 4.5-6 ملايين ريال أي ضعف إلى ضعفي سعر البيع المباشر",
      "العامل الآخر المهم هو الدخل المستمر ففي حالة المشاريع التجارية أو متعددة الاستخدام يحصل المالك على دخل إيجاري مستمر من حصته في المشروع المطوّر وهذا الدخل المتكرر قد يتجاوز قيمة البيع الأصلية خلال سنوات قليلة",
      "من المهم أيضاً مراعاة عامل الوقت فالبيع المباشر يمنحك المال فوراً لكن بقيمة محدودة والشراكة التطويرية تحتاج وقتاً أطول عادة 2-4 سنوات حسب حجم المشروع لكن العائد النهائي أعلى بكثير والملاك الذين يستطيعون الانتظار يحققون عوائد استثنائية",
      "النقطة الجوهرية هي أن الأرض بحد ذاتها لها قيمة محدودة لكن المشروع المطوّر عليها له قيمة أعلى بكثير والشراكة التطويرية تتيح للمالك الاستفادة من هذا الفرق الكبير في القيمة دون أن يتحمل أي تكاليف تطوير وهذا هو جوهر الفكرة",
    ],
    contentEn: [
      "Lets take a practical example: a 5,000 sqm land plot in north Riyadh Direct sale price in the current market is about 3 million SAR But if the owner enters a development partnership to build a residential complex the developed project value could reach 15-20 million SAR Even if the owners share is only 30% they would receive 4.5-6 million SAR, double to triple the direct sale price",
      "Another important factor is continuous income In commercial or mixed-use projects the owner receives ongoing rental income from their share of the developed project This recurring income may exceed the original sale value within a few years",
      "Its also important to consider the time factor Direct sale gives you money immediately but at limited value Development partnership takes longer usually 2-4 years depending on project size but the final return is much higher Owners who can wait achieve exceptional returns",
      "The fundamental point is that land itself has limited value but the project developed on it has much higher value Development partnership allows the owner to benefit from this significant value difference without bearing any development costs and this is the essence of the concept",
    ],
  },
  {
    id: "platform-governance",
    icon: ShieldCheck,
    titleAr: "الحوكمة والشفافية: كيف تحمي سينا حقوق الأطراف",
    titleEn: "Governance & Transparency: How SINA Protects All Parties Rights",
    summaryAr: "تعرّف على آليات الحماية والحوكمة التي توفرها منصة سينا لضمان نجاح الشراكات وحماية حقوق الملاك والمطورين بشكل كامل",
    summaryEn: "Learn about the protection and governance mechanisms SINA provides to ensure partnership success and fully protect owners and developers rights",
    readTimeAr: "6 دقائق قراءة",
    readTimeEn: "6 min read",
    tag: { ar: "حوكمة", en: "Governance" },
    contentAr: [
      "أحد أكبر المخاوف التي تمنع ملاك الأراضي من الدخول في شراكات تطويرية هو الخوف من فقدان حقوقهم أو التعرض للاحتيال وسينا صُممت تحديداً لمعالجة هذا القلق من خلال نظام حوكمة متكامل يحمي جميع الأطراف",
      "أولاً التحقق من الهوية والمؤهلات: كل مطور عقاري يسجل في المنصة يمر بعملية تحقق شاملة تتضمن السجل التجاري والتراخيص المطلوبة وسجل المشاريع السابقة وهذا يضمن أن المالك يتعامل فقط مع مطورين مؤهلين وموثوقين",
      "ثانياً حماية البيانات: بيانات الأرض والمالك لا تُكشف لأي طرف إلا بموافقة صريحة من المالك وحتى المطورون لا يرون تفاصيل المالك الشخصية إلا بعد قبول طلب الشراكة وهذا النهج يحمي خصوصية المالك ويمنع أي تواصل غير مرغوب",
      "ثالثاً التوثيق الكامل: كل خطوة في عملية الشراكة من أول طلب حتى إغلاق الصفقة موثقة إلكترونياً داخل المنصة وهذا يوفر سجلاً كاملاً يمكن الرجوع إليه في أي وقت ويحمي حقوق الطرفين قانونياً",
      "رابعاً المتابعة المستمرة: المنصة توفر لوحة تحكم متكاملة لمتابعة جميع مراحل المشروع من مرحلة التفاوض والاتفاق وحتى التنفيذ والتسليم وأي تأخير أو تغيير في الجدول يُسجل ويُبلغ عنه تلقائياً",
    ],
    contentEn: [
      "One of the biggest concerns preventing landowners from entering development partnerships is the fear of losing rights or being defrauded SINA was specifically designed to address this concern through a comprehensive governance system that protects all parties",
      "First identity and qualification verification: Every real estate developer registering on the platform undergoes a comprehensive verification process including commercial registration, required licenses, and previous project records This ensures owners only deal with qualified reliable developers",
      "Second data protection: Land and owner data are not disclosed to any party without the owners explicit consent Even developers dont see the owners personal details until a partnership request is accepted This approach protects owner privacy and prevents unwanted contact",
      "Third complete documentation: Every step in the partnership process from the first request to deal closing is electronically documented within the platform This provides a complete record that can be referenced at any time and legally protects both parties rights",
      "Fourth continuous monitoring: The platform provides an integrated dashboard for tracking all project stages from negotiation and agreement to execution and delivery Any delay or schedule change is automatically recorded and reported",
    ],
  },
  {
    id: "vision-2030",
    icon: Users,
    titleAr: "شراكات التطوير العقاري ورؤية 2030: مستقبل القطاع",
    titleEn: "Real Estate Development Partnerships & Vision 2030: The Sectors Future",
    summaryAr: "كيف تساهم الشراكات التطويرية في تحقيق أهداف رؤية المملكة 2030 وتسريع وتيرة التطوير العقاري المستدام في المملكة",
    summaryEn: "How development partnerships contribute to achieving the Kingdoms Vision 2030 goals and accelerating sustainable real estate development across the Kingdom",
    readTimeAr: "7 دقائق قراءة",
    readTimeEn: "7 min read",
    tag: { ar: "رؤية 2030", en: "Vision 2030" },
    contentAr: [
      "رؤية المملكة 2030 تستهدف تحولاً جذرياً في القطاع العقاري بما في ذلك رفع نسبة تملك المواطنين للمساكن وتطوير مدن ومشاريع عملاقة وتنويع الاقتصاد والشراكات التطويرية هي إحدى الأدوات الرئيسية لتحقيق هذه الأهداف الطموحة",
      "المملكة تمتلك مساحات شاسعة من الأراضي غير المطورة داخل المدن وحولها وكثير من هذه الأراضي يملكها أفراد ليس لديهم القدرة أو الرغبة في تطويرها بأنفسهم والشراكة التطويرية تحوّل هذه الأراضي من أصول خاملة إلى مشاريع حقيقية تسهم في تنمية المجتمع وتوفير السكن",
      "من الناحية الاقتصادية الشراكات التطويرية تخلق دورة اقتصادية إيجابية: المالك يحقق عوائد أعلى والمطور ينفذ مشاريع أكثر والسوق يحصل على معروض عقاري أكبر والمواطن يجد خيارات سكنية أفضل وبأسعار تنافسية فالجميع يستفيد",
      "سينا تؤمن بأن تنظيم سوق الشراكات التطويرية هو خطوة أساسية نحو قطاع عقاري أكثر نضجاً وشفافية ومن خلال توفير منصة رقمية تجمع الملاك والمطورين وتنظم العلاقة بينهم نساهم في بناء منظومة عقارية تتوافق مع تطلعات المملكة ورؤيتها المستقبلية",
    ],
    contentEn: [
      "The Kingdoms Vision 2030 targets a fundamental transformation in the real estate sector including increasing citizen homeownership rates, developing cities and mega-projects, and diversifying the economy Development partnerships are one of the key tools to achieve these ambitious goals",
      "The Kingdom has vast areas of undeveloped land within and around cities Many of these lands are owned by individuals who lack the ability or desire to develop them on their own Development partnerships transform these lands from idle assets into real projects that contribute to community development and housing provision",
      "Economically development partnerships create a positive economic cycle: owners achieve higher returns, developers execute more projects, the market gets larger real estate supply, and citizens find better housing options at competitive prices Everyone benefits",
      "SINA believes that organizing the development partnerships market is a fundamental step toward a more mature and transparent real estate sector By providing a digital platform that brings together owners and developers and organizes the relationship between them we contribute to building a real estate ecosystem aligned with the Kingdoms aspirations and future vision",
    ],
  },
];

const Blog: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  usePageTitle(isAr ? "المدونة" : "Blog");

  const [expanded, setExpanded] = useState<string | null>(null);

  const featuredArticle = articles[0];
  const restArticles = articles.slice(1);

  return (
    <PageShell>
      <InnerHero
        pageSlug="blog"
        title={isAr ? "مدونة سينا" : "SINA Blog"}
        subtitle={isAr
          ? "مقالات متخصصة عن الشراكات التطويرية العقارية: أساسياتها وفوائدها وأهميتها في تطوير القطاع العقاري"
          : "Specialized articles on real estate development partnerships: fundamentals, benefits, and importance in developing the real estate sector"}
        isAr={isAr}
        image={headerAboutImg}
      />

      {/* Stats bar */}
      <section className="py-6 bg-[#F8FAFB] border-b border-gray-100" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-2xl font-bold text-[#2B4C66]">6</p>
              <p className="text-[12px] text-gray-500">{isAr ? "مقالات متخصصة" : "Specialized Articles"}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-[#2B4C66]">47+</p>
              <p className="text-[12px] text-gray-500">{isAr ? "دقيقة محتوى غني" : "Minutes of Rich Content"}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-[#2B4C66]">
                <BookOpen className="w-6 h-6 inline-block" strokeWidth={1.5} />
              </p>
              <p className="text-[12px] text-gray-500">{isAr ? "دليل شامل" : "Complete Guide"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16 lg:py-20 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Featured card */}
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-[#C2A86B]/10 text-[#C2A86B] text-[11px] font-bold rounded-full mb-6 tracking-wider">
                {isAr ? "مقال مميز" : "FEATURED"}
              </span>
            </div>
            <article className="bg-white rounded-2xl border-2 border-[#2B4C66]/10 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
              <button
                onClick={() => setExpanded(expanded === featuredArticle.id ? null : featuredArticle.id)}
                className="w-full text-start p-8 md:p-10"
              >
                <div className="flex items-start gap-5">
                  <div className="shrink-0 mt-1">
                    <featuredArticle.icon className="w-8 h-8 text-[#2B4C66]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-0.5 bg-[#2B4C66]/[0.06] text-[#2B4C66] text-[11px] font-medium rounded-md">
                        {isAr ? featuredArticle.tag.ar : featuredArticle.tag.en}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        {isAr ? featuredArticle.readTimeAr : featuredArticle.readTimeEn}
                      </span>
                    </div>
                    <h2 className="text-[18px] md:text-[22px] font-bold text-[#1E374B] mb-3 leading-snug">
                      {isAr ? featuredArticle.titleAr : featuredArticle.titleEn}
                    </h2>
                    <p className="text-[14px] text-gray-500 leading-relaxed">
                      {isAr ? featuredArticle.summaryAr : featuredArticle.summaryEn}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    {expanded === featuredArticle.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
              {expanded === featuredArticle.id && (
                <div className="px-8 md:px-10 pb-10 ps-[4.5rem] md:ps-[5rem]">
                  <div className="border-t border-gray-100 pt-6 space-y-5">
                    {(isAr ? featuredArticle.contentAr : featuredArticle.contentEn).map((paragraph, i) => (
                      <p key={i} className="text-[14px] text-gray-600 leading-[2.1]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Rest of articles */}
            <div className="mt-12 space-y-5">
              <h3 className="text-xl font-bold text-[#1E374B] mb-6">
                {isAr ? "جميع المقالات" : "All Articles"}
              </h3>
              {restArticles.map((article) => {
                const isOpen = expanded === article.id;
                const Icon = article.icon;
                return (
                  <article
                    key={article.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : article.id)}
                      className="w-full text-start p-6 md:p-8"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-1">
                          <Icon className="w-6 h-6 text-[#2B4C66]" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2.5 py-0.5 bg-[#2B4C66]/[0.06] text-[#2B4C66] text-[11px] font-medium rounded-md">
                              {isAr ? article.tag.ar : article.tag.en}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock className="w-3 h-3" strokeWidth={1.5} />
                              {isAr ? article.readTimeAr : article.readTimeEn}
                            </span>
                          </div>
                          <h2 className="text-[16px] md:text-[18px] font-bold text-[#1E374B] mb-2 leading-snug">
                            {isAr ? article.titleAr : article.titleEn}
                          </h2>
                          <p className="text-[14px] text-gray-500 leading-relaxed">
                            {isAr ? article.summaryAr : article.summaryEn}
                          </p>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 md:px-8 pb-8 ps-[3.5rem] md:ps-[4rem]">
                        <div className="border-t border-gray-100 pt-6 space-y-5">
                          {(isAr ? article.contentAr : article.contentEn).map((paragraph, i) => (
                            <p key={i} className="text-[14px] text-gray-600 leading-[2.1]">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-[#1E374B]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isAr ? "مستعد لبدء شراكتك التطويرية" : "Ready to Start Your Development Partnership"}
          </h2>
          <p className="text-[15px] text-white/50 mb-10 max-w-xl mx-auto">
            {isAr
              ? "انضم لمنصة سينا وابدأ رحلتك نحو شراكات تطويرية ناجحة ومربحة لجميع الأطراف"
              : "Join SINA platform and start your journey toward successful and profitable development partnerships for all parties"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth/login?type=owner"
              className="inline-flex items-center gap-2.5 h-14 px-10 bg-white text-[#1E374B] text-[15px] font-semibold rounded-xl hover:bg-gray-100 shadow-lg transition-all duration-300"
            >
              <Landmark className="w-5 h-5" strokeWidth={1.5} />
              {isAr ? "دخول الملاك" : "Owner Login"}
            </a>
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2.5 h-14 px-10 bg-white/20 border border-white/30 text-white text-[15px] font-semibold rounded-xl hover:bg-white/30 transition-all duration-300"
            >
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
              {isAr ? "دخول المطورين" : "Developer Login"}
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default Blog;
