import React from "react";
import { useParams, Navigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, Layers, Handshake, Video, CheckCircle2, type LucideIcon } from "lucide-react";

interface FeatureContent {
  icon: LucideIcon;
  ar: { title: string; intro: string; sections: { heading: string; text: string }[]; points: string[] };
  en: { title: string; intro: string; sections: { heading: string; text: string }[]; points: string[] };
}

const featureData: Record<string, FeatureContent> = {
  privacy: {
    icon: Eye,
    ar: {
      title: "خصوصية كاملة",
      intro: "تضع دوما خصوصية مالك الأرض في صدارة أولوياتها. نظام الحماية المتدرج يضمن أن بياناتك الحساسة لا تُكشف إلا وفق إرادتك الكاملة.",
      sections: [
        { heading: "ما البيانات المحمية؟", text: "رقم الصك، الموقع الدقيق على الخريطة، هوية المالك الشخصية، ومعلومات الاتصال المباشرة — جميعها تبقى مخفية تماماً عن المطورين حتى تقرر أنت مشاركتها." },
        { heading: "ماذا يرى المطور؟", text: "يظهر للمطور فقط المعلومات العامة مثل المدينة، المساحة التقريبية، نوع الاستخدام، وهدف الشراكة المطلوب — وهي كافية لتقييم الفرصة دون كشف أي بيانات حساسة." },
        { heading: "متى تُكشف التفاصيل؟", text: "فقط بعد مراجعتك لطلب المطور والموافقة عليه صراحةً. لا يوجد أي مسار آخر للوصول إلى بياناتك الكاملة." },
      ],
      points: [
        "إخفاء تلقائي لجميع البيانات الحساسة عند إدراج الأرض",
        "نظام موافقة صريح — لا كشف تلقائي أبداً",
        "تسجيل كل عملية وصول في سجل آمن للمراجعة والمساءلة",
        "حماية متعددة الطبقات تمنع أي محاولة تجاوز",
        "التحكم الكامل يبقى بيد مالك الأرض في جميع المراحل",
      ],
    },
    en: {
      title: "Full Privacy",
      intro: "DOMA places landowner privacy at the forefront. Our tiered protection system ensures your sensitive data is only revealed according to your explicit consent.",
      sections: [
        { heading: "What data is protected?", text: "Deed number, exact map location, owner's personal identity, and direct contact information — all remain completely hidden from developers until you decide to share them." },
        { heading: "What does the developer see?", text: "Developers only see general information such as city, approximate area, usage type, and desired partnership goal — enough to evaluate the opportunity without exposing any sensitive data." },
        { heading: "When are details revealed?", text: "Only after you review the developer's request and explicitly approve it. There is no other pathway to access your complete data." },
      ],
      points: [
        "Automatic concealment of all sensitive data when listing land",
        "Explicit consent system — never automatic disclosure",
        "Every access operation logged in a secure record for review and accountability",
        "Multi-layered protection prevents any bypass attempts",
        "Full control remains with the landowner at all stages",
      ],
    },
  },
  "structured-access": {
    icon: Layers,
    ar: {
      title: "وصول منظم",
      intro: "تعتمد دوما نظام وصول متدرج يتيح للمطور الاطلاع على معلومات الأرض بشكل تدريجي ومنظم، مما يحافظ على حقوق جميع الأطراف ويضمن جدية التعامل.",
      sections: [
        { heading: "كيف يعمل النظام؟", text: "يبدأ المطور بالاطلاع على المعلومات الأساسية للأرض فقط. مع كل مرحلة موافقة يتم فتح مستوى أعمق من التفاصيل، مما يخلق بيئة ثقة تدريجية بين الطرفين." },
        { heading: "مراحل الوصول", text: "المرحلة الأولى: بيانات عامة (المدينة، المساحة، نوع التطوير). المرحلة الثانية: تفاصيل إضافية بعد تقديم الطلب. المرحلة الثالثة: البيانات الكاملة بعد موافقة المالك." },
        { heading: "لماذا هذا النظام؟", text: "يحمي المالك من كشف بياناته لجهات غير جادة، ويمنح المطور فرصة لتقييم الأرض تدريجياً قبل الالتزام. هذا يرفع جودة الطلبات ويقلل من التواصل غير المثمر." },
      ],
      points: [
        "وصول تدريجي يحمي خصوصية المالك ويضمن جدية المطور",
        "ثلاث مراحل واضحة لكشف المعلومات",
        "كل مرحلة تتطلب موافقة صريحة قبل الانتقال للتالية",
        "تقليل التواصل غير المثمر ورفع جودة الطلبات",
        "بيئة ثقة متبادلة مبنية على الشفافية والتدرج",
      ],
    },
    en: {
      title: "Structured Access",
      intro: "DOMA employs a tiered access system that allows developers to view land information progressively and systematically, preserving all parties' rights and ensuring serious engagement.",
      sections: [
        { heading: "How does it work?", text: "Developers start by viewing only basic land information. With each approval stage, a deeper level of details is unlocked, creating a gradual trust environment between both parties." },
        { heading: "Access stages", text: "Stage 1: General data (city, area, development type). Stage 2: Additional details after request submission. Stage 3: Complete data after owner approval." },
        { heading: "Why this system?", text: "It protects landowners from exposing data to non-serious parties, while giving developers the chance to evaluate land progressively before committing. This raises request quality and reduces unproductive communication." },
      ],
      points: [
        "Progressive access protects owner privacy and ensures developer seriousness",
        "Three clear stages for information disclosure",
        "Each stage requires explicit consent before advancing",
        "Reduces unproductive communication and raises request quality",
        "Mutual trust environment built on transparency and progression",
      ],
    },
  },
  "deal-tracking": {
    icon: Handshake,
    ar: {
      title: "متابعة الصفقات",
      intro: "تمنحك دوما لوحة متابعة شاملة تغطي كل مرحلة من مراحل الشراكة التطويرية، من لحظة تقديم الطلب حتى إغلاق الاتفاق بين الطرفين.",
      sections: [
        { heading: "مراحل الصفقة", text: "تمر كل صفقة بمراحل واضحة: تقديم الطلب، مراجعة المالك، الموافقة، جدولة الاجتماعات، تحديد الاستراتيجية، تبادل المستندات، إعداد الاتفاقيات، وأخيراً إغلاق الصفقة." },
        { heading: "مؤشرات الأداء", text: "لوحة بصرية توضح حالة كل صفقة بألوان واضحة: أخضر (نشطة وسليمة)، أصفر (تحتاج متابعة)، أحمر (متأخرة). تساعدك على التركيز على ما يحتاج اهتمامك." },
        { heading: "المهام والملاحظات", text: "أضف مهام لكل صفقة وتابع تنفيذها. سجّل ملاحظاتك وقراراتك في كل مرحلة لضمان وضوح الرؤية بين جميع الأطراف المعنية." },
      ],
      points: [
        "تتبع مراحل الصفقة من البداية حتى الإغلاق",
        "مؤشرات أداء مرئية بألوان توضح الحالة الفعلية",
        "تنبيهات آلية عند تأخر أي مرحلة",
        "إمكانية إضافة مهام وملاحظات لكل صفقة",
        "سجل تاريخي كامل لجميع التحديثات والقرارات",
      ],
    },
    en: {
      title: "Deal Tracking",
      intro: "DOMA provides a comprehensive tracking dashboard covering every stage of the development partnership, from request submission to agreement closure.",
      sections: [
        { heading: "Deal Stages", text: "Each deal passes through clear stages: request submission, owner review, approval, meeting scheduling, strategy definition, document exchange, agreement preparation, and finally deal closure." },
        { heading: "Performance Indicators", text: "A visual dashboard shows each deal's status with clear colors: green (active and healthy), yellow (needs attention), red (delayed). Helps you focus on what requires your attention." },
        { heading: "Tasks & Notes", text: "Add tasks to each deal and track their completion. Record your notes and decisions at every stage to ensure clarity among all parties involved." },
      ],
      points: [
        "Track deal stages from start to closure",
        "Visual performance indicators with color-coded status",
        "Automated alerts when any stage is delayed",
        "Ability to add tasks and notes to each deal",
        "Complete historical log of all updates and decisions",
      ],
    },
  },
  meetings: {
    icon: Video,
    ar: {
      title: "اجتماعات مدمجة",
      intro: "تسهّل دوما التنسيق بين المالك والمطور من خلال نظام اجتماعات متكامل مرتبط بمراحل الصفقة، لضمان تواصل فعّال ومنظم.",
      sections: [
        { heading: "جدولة تلقائية", text: "فور موافقة المالك على طلب الشراكة، يمكن جدولة اجتماع Google Meet تلقائياً مع إرسال دعوات لكلا الطرفين تتضمن رابط الاجتماع والتفاصيل." },
        { heading: "اجتماعات حضورية", text: "تدعم دوما أيضاً تنظيم الاجتماعات الحضورية مع إمكانية تحديد الموقع وإضافة ملاحظات وتعليمات خاصة بكل اجتماع." },
        { heading: "ربط بالصفقة", text: "كل اجتماع مرتبط مباشرةً بسجل الصفقة، مما يسهل الرجوع إلى تاريخ المواعيد والقرارات المتخذة في كل لقاء." },
      ],
      points: [
        "جدولة Google Meet تلقائياً فور الموافقة",
        "إرسال دعوات تلقائية لكلا الطرفين مع التفاصيل",
        "دعم الاجتماعات الحضورية مع تحديد الموقع",
        "ربط كل اجتماع بسجل الصفقة للمتابعة",
        "حفظ سجل كامل بالمواعيد والروابط والملاحظات",
      ],
    },
    en: {
      title: "Integrated Meetings",
      intro: "DOMA facilitates coordination between owners and developers through an integrated meeting system linked to deal stages, ensuring effective and organized communication.",
      sections: [
        { heading: "Automatic Scheduling", text: "Upon the owner's approval of a partnership request, a Google Meet meeting can be automatically scheduled with invitations sent to both parties including the meeting link and details." },
        { heading: "In-Person Meetings", text: "DOMA also supports organizing in-person meetings with the ability to specify location and add notes and special instructions for each meeting." },
        { heading: "Deal Integration", text: "Every meeting is directly linked to the deal record, making it easy to reference the history of appointments and decisions made in each meeting." },
      ],
      points: [
        "Automatic Google Meet scheduling upon approval",
        "Automatic invitations sent to both parties with details",
        "Support for in-person meetings with location specification",
        "Each meeting linked to the deal record for tracking",
        "Complete log of appointments, links, and notes",
      ],
    },
  },
};

const FeatureDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const feature = slug ? featureData[slug] : null;
  if (!feature) return <Navigate to="/" replace />;

  const content = isAr ? feature.ar : feature.en;
  const Icon = feature.icon;

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHeader
        icon={Icon}
        title={content.title}
        description={content.intro}
      />
      <main className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl space-y-8">
            {content.sections.map((section, i) => (
              <section key={i}>
                <h2 className="mb-2 text-lg font-medium text-foreground">{section.heading}</h2>
                <p className="text-sm font-light leading-relaxed text-muted-foreground">{section.text}</p>
              </section>
            ))}

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-4 text-base font-medium text-foreground">
                {isAr ? "أبرز المزايا" : "Key Benefits"}
              </h3>
              <div className="space-y-3">
                {content.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                    <p className="text-sm font-light leading-relaxed text-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FeatureDetailPage;
