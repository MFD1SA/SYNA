import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import headerFaqImg from "@/assets/header-faq.jpg";

const faqData = [
  { qAr: "ما هي سينا؟", qEn: "What is SYNA?", aAr: "سينا بيئة رقمية تجمع ملاك الأراضي بالمطورين العقاريين بهدف خلق فرص تطوير منظمة تقوم على وضوح البيانات وترتيب مراحل الشراكة.", aEn: "SYNA is a digital environment that connects landowners with real estate developers to create organized development opportunities based on data clarity and structured partnership stages." },
  { qAr: "ما الدور الذي تقدمه بين الطرفين؟", qEn: "What role does SYNA play between both parties?", aAr: "تعمل سينا كحلقة وصل احترافية تساعد على عرض الأراضي، تحليل فرص التطوير، وتنظيم التواصل حتى الوصول إلى اتفاق واضح بين المالك والمطور.", aEn: "SYNA acts as a professional bridge that helps display lands, analyze development opportunities, and organize communication until a clear agreement is reached between the owner and developer." },
  { qAr: "هل تعتبر سينا وسيط بيع تقليدي؟", qEn: "Is SYNA a traditional sales broker?", aAr: "لا، دور سينا يتجاوز الوساطة المعتادة، إذ تركز على بناء نماذج تطوير وشراكات طويلة المدى بدلاً من مجرد عرض عقار للبيع.", aEn: "No, SYNA's role goes beyond traditional brokerage. It focuses on building development models and long-term partnerships rather than simply listing properties for sale." },
  { qAr: "كيف يقوم مالك الأرض بعرض أرضه؟", qEn: "How does a landowner list their land?", aAr: "يمكن للمالك إنشاء ملف خاص بالأرض وكتابة هدف الشراكة ونوع التطوير المطلوب مثل المعارض التجارية أو المكاتب أو المشاريع متعددة الاستخدام.", aEn: "The owner can create a land profile and specify the partnership goal and the type of development required, such as commercial showrooms, offices, or mixed-use projects." },
  { qAr: "ماذا يرى المطور قبل الموافقة؟", qEn: "What does the developer see before approval?", aAr: "تظهر للمطور معلومات عامة مثل المساحة والأبعاد والواجهة، بينما تبقى البيانات الحساسة غير متاحة إلا بعد المرور بمراحل الموافقة.", aEn: "The developer sees general information such as area, dimensions, and frontage, while sensitive data remains unavailable until passing through approval stages." },
  { qAr: "كيف يتم التحقق من الشركات المطورة؟", qEn: "How are developer companies verified?", aAr: "تطلب سينا إدخال بيانات السجل التجاري ورفع الوثائق الرسمية، ويتم قراءة المعلومات آلياً للتأكد من صحة اسم المنشأة وهويتها التجارية.", aEn: "SYNA requires entering commercial register data and uploading official documents. Information is read automatically to verify the entity's name and commercial identity." },
  { qAr: "هل توجد مراحل قبل الوصول للتفاصيل الكاملة؟", qEn: "Are there stages before accessing full details?", aAr: "نعم، تمر الطلبات بمراحل تقييم تدريجية، وعند قبول الطرفين يتم الانتقال إلى مستوى أعمق من المعلومات والتواصل المباشر.", aEn: "Yes, requests go through progressive evaluation stages. When both parties agree, they move to a deeper level of information and direct communication." },
  { qAr: "ما فائدة الشراكة التطويرية لمالك الأرض؟", qEn: "What is the benefit of a development partnership for a landowner?", aAr: "تمنح الشراكة فرصة لتحويل الأرض إلى مشروع منتج بدلاً من بقائها غير مستغلة، مما يساعد على تقليل الأعباء مثل رسوم الأراضي البيضاء وتحقيق قيمة مضافة.", aEn: "The partnership offers an opportunity to transform land into a productive project instead of leaving it idle, helping reduce burdens like white land fees and creating added value." },
  { qAr: "كيف تساعد سينا المطورين؟", qEn: "How does SYNA help developers?", aAr: "توفر سينا فرص تطوير تم فرزها مسبقاً مع وضوح أهداف الملاك، مما يقلل الوقت المستهلك في البحث التقليدي.", aEn: "SYNA provides pre-screened development opportunities with clear owner objectives, reducing the time spent on traditional searching." },
  { qAr: "هل توجد عمولة على العمليات؟", qEn: "Is there a commission on transactions?", aAr: "تعتمد سينا نموذج عمولة مرتبط بعمليات البيع، ويتم توضيح النسبة داخل النظام عند إتمام الاتفاق.", aEn: "SYNA uses a commission model linked to sales transactions. The rate is clearly displayed within the system upon agreement completion." },
  { qAr: "كيف تتم متابعة مراحل المشروع؟", qEn: "How are project stages tracked?", aAr: "توفر سينا لوحة متابعة تعتمد على مؤشرات أداء توضح تقدم كل مرحلة لضمان سير العملية بشكل منظم بين الأطراف.", aEn: "SYNA provides a tracking dashboard with performance indicators showing the progress of each stage to ensure an organized process between parties." },
  { qAr: "هل يمكن ربط الاجتماعات عبر سينا؟", qEn: "Can meetings be linked through SYNA?", aAr: "نعم، تدعم سينا جدولة الاجتماعات وربطها بخدمات Google وMeta API لتسهيل التنسيق بين الأطراف.", aEn: "Yes, SYNA supports scheduling meetings and linking them with Google and Meta API services to facilitate coordination between parties." },
  { qAr: "هل المعلومات داخل سينا آمنة؟", qEn: "Is information within SYNA secure?", aAr: "تعتمد سينا نظام صلاحيات متدرج يضمن عدم ظهور التفاصيل الحساسة إلا بعد تحقق مراحل التوافق.", aEn: "SYNA uses a tiered permissions system that ensures sensitive details are only revealed after compatibility stages are verified." },
  { qAr: "هل سينا مناسبة فقط للأراضي الكبيرة؟", qEn: "Is SYNA only suitable for large lands?", aAr: "يمكن استخدام سينا لمختلف أنواع الأراضي طالما يوجد هدف تطوير واضح وقابل للدراسة.", aEn: "SYNA can be used for various types of land as long as there is a clear and feasible development goal." },
];

const FAQPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الأسئلة الشائعة" : "FAQ");

  return (
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <PageHeader icon={HelpCircle} title={isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"} description={isAr ? "إجابات واضحة على أبرز الاستفسارات حول منصة سينا وآلية عملها" : "Clear answers to the most common questions about the SYNA platform and how it works"} />
      <main className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqData.map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                  <AccordionItem value={`faq-${idx}`} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] px-5 transition-colors hover:border-[hsl(200,80%,45%,0.15)]">
                    <AccordionTrigger className="text-sm font-medium text-white hover:no-underline py-5">{isAr ? item.qAr : item.qEn}</AccordionTrigger>
                    <AccordionContent className="text-sm font-light leading-relaxed text-[hsl(210,15%,50%)] pb-5">{isAr ? item.aAr : item.aEn}</AccordionContent>
                  </AccordionItem>
                </motion.div>
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
