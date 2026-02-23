import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqData = [
  {
    qAr: "ما هي دوما؟",
    qEn: "What is DOMA?",
    aAr: "دوما بيئة رقمية تجمع ملاك الأراضي بالمطورين العقاريين بهدف خلق فرص تطوير منظمة تقوم على وضوح البيانات وترتيب مراحل الشراكة.",
    aEn: "DOMA is a digital environment that connects landowners with real estate developers to create organized development opportunities based on data clarity and structured partnership stages.",
  },
  {
    qAr: "ما الدور الذي تقدمه بين الطرفين؟",
    qEn: "What role does DOMA play between both parties?",
    aAr: "تعمل دوما كحلقة وصل احترافية تساعد على عرض الأراضي، تحليل فرص التطوير، وتنظيم التواصل حتى الوصول إلى اتفاق واضح بين المالك والمطور.",
    aEn: "DOMA acts as a professional bridge that helps display lands, analyze development opportunities, and organize communication until a clear agreement is reached between the owner and developer.",
  },
  {
    qAr: "هل تعتبر دوما وسيط بيع تقليدي؟",
    qEn: "Is DOMA a traditional sales broker?",
    aAr: "لا، دور دوما يتجاوز الوساطة المعتادة، إذ تركز على بناء نماذج تطوير وشراكات طويلة المدى بدلاً من مجرد عرض عقار للبيع.",
    aEn: "No, DOMA's role goes beyond traditional brokerage. It focuses on building development models and long-term partnerships rather than simply listing properties for sale.",
  },
  {
    qAr: "كيف يقوم مالك الأرض بعرض أرضه؟",
    qEn: "How does a landowner list their land?",
    aAr: "يمكن للمالك إنشاء ملف خاص بالأرض وكتابة هدف الشراكة ونوع التطوير المطلوب مثل المعارض التجارية أو المكاتب أو المشاريع متعددة الاستخدام.",
    aEn: "The owner can create a land profile and specify the partnership goal and the type of development required, such as commercial showrooms, offices, or mixed-use projects.",
  },
  {
    qAr: "ماذا يرى المطور قبل الموافقة؟",
    qEn: "What does the developer see before approval?",
    aAr: "تظهر للمطور معلومات عامة مثل المساحة والأبعاد والواجهة، بينما تبقى البيانات الحساسة غير متاحة إلا بعد المرور بمراحل الموافقة.",
    aEn: "The developer sees general information such as area, dimensions, and frontage, while sensitive data remains unavailable until passing through approval stages.",
  },
  {
    qAr: "كيف يتم التحقق من الشركات المطورة؟",
    qEn: "How are developer companies verified?",
    aAr: "تطلب دوما إدخال بيانات السجل التجاري ورفع الوثائق الرسمية، ويتم قراءة المعلومات آلياً للتأكد من صحة اسم المنشأة وهويتها التجارية.",
    aEn: "DOMA requires entering commercial register data and uploading official documents. Information is read automatically to verify the entity's name and commercial identity.",
  },
  {
    qAr: "هل توجد مراحل قبل الوصول للتفاصيل الكاملة؟",
    qEn: "Are there stages before accessing full details?",
    aAr: "نعم، تمر الطلبات بمراحل تقييم تدريجية، وعند قبول الطرفين يتم الانتقال إلى مستوى أعمق من المعلومات والتواصل المباشر.",
    aEn: "Yes, requests go through progressive evaluation stages. When both parties agree, they move to a deeper level of information and direct communication.",
  },
  {
    qAr: "ما فائدة الشراكة التطويرية لمالك الأرض؟",
    qEn: "What is the benefit of a development partnership for a landowner?",
    aAr: "تمنح الشراكة فرصة لتحويل الأرض إلى مشروع منتج بدلاً من بقائها غير مستغلة، مما يساعد على تقليل الأعباء مثل رسوم الأراضي البيضاء وتحقيق قيمة مضافة.",
    aEn: "The partnership offers an opportunity to transform land into a productive project instead of leaving it idle, helping reduce burdens like white land fees and creating added value.",
  },
  {
    qAr: "كيف تساعد دوما المطورين؟",
    qEn: "How does DOMA help developers?",
    aAr: "توفر دوما فرص تطوير تم فرزها مسبقاً مع وضوح أهداف الملاك، مما يقلل الوقت المستهلك في البحث التقليدي.",
    aEn: "DOMA provides pre-screened development opportunities with clear owner objectives, reducing the time spent on traditional searching.",
  },
  {
    qAr: "هل توجد عمولة على العمليات؟",
    qEn: "Is there a commission on transactions?",
    aAr: "تعتمد دوما نموذج عمولة مرتبط بعمليات البيع، ويتم توضيح النسبة داخل النظام عند إتمام الاتفاق.",
    aEn: "DOMA uses a commission model linked to sales transactions. The rate is clearly displayed within the system upon agreement completion.",
  },
  {
    qAr: "كيف تتم متابعة مراحل المشروع؟",
    qEn: "How are project stages tracked?",
    aAr: "توفر دوما لوحة متابعة تعتمد على مؤشرات أداء توضح تقدم كل مرحلة لضمان سير العملية بشكل منظم بين الأطراف.",
    aEn: "DOMA provides a tracking dashboard with performance indicators showing the progress of each stage to ensure an organized process between parties.",
  },
  {
    qAr: "هل يمكن ربط الاجتماعات عبر دوما؟",
    qEn: "Can meetings be linked through DOMA?",
    aAr: "نعم، تدعم دوما جدولة الاجتماعات وربطها بخدمات Google وMeta API لتسهيل التنسيق بين الأطراف.",
    aEn: "Yes, DOMA supports scheduling meetings and linking them with Google and Meta API services to facilitate coordination between parties.",
  },
  {
    qAr: "هل المعلومات داخل دوما آمنة؟",
    qEn: "Is information within DOMA secure?",
    aAr: "تعتمد دوما نظام صلاحيات متدرج يضمن عدم ظهور التفاصيل الحساسة إلا بعد تحقق مراحل التوافق.",
    aEn: "DOMA uses a tiered permissions system that ensures sensitive details are only revealed after compatibility stages are verified.",
  },
  {
    qAr: "هل دوما مناسبة فقط للأراضي الكبيرة؟",
    qEn: "Is DOMA only suitable for large lands?",
    aAr: "يمكن استخدام دوما لمختلف أنواع الأراضي طالما يوجد هدف تطوير واضح وقابل للدراسة.",
    aEn: "DOMA can be used for various types of land as long as there is a clear and feasible development goal.",
  },
];

const FAQPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHeader
        icon={HelpCircle}
        title={isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
        description={isAr
          ? "إجابات واضحة على أبرز الاستفسارات حول منصة دوما وآلية عملها"
          : "Clear answers to the most common questions about the DOMA platform and how it works"}
      />
      <main className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-xl border border-border/60 bg-card px-4">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                    {isAr ? item.qAr : item.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-light leading-relaxed text-muted-foreground">
                    {isAr ? item.aAr : item.aEn}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
