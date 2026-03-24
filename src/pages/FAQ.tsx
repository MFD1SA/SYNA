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
  { qAr: "ما هي سينا؟", qEn: "What is SYNA?", aAr: "سينا بيئة رقمية تجمع ملاك الأراضي بالمطورين العقاريين بهدف خلق فرص تطوير منظمة، وتدعم مسارين: شراكات التطوير العقاري والمساهمات العقارية المرخصة.", aEn: "SYNA is a digital environment connecting landowners with developers to create organized development opportunities, supporting two paths: development partnerships and licensed real estate contributions." },
  { qAr: "ما الفرق بين شراكة التطوير والمساهمة العقارية؟", qEn: "What's the difference between a development partnership and a real estate contribution?", aAr: "شراكة التطوير: يتفق المالك والمطور على تطوير الأرض معاً وفق نموذج ربحي متفق عليه، ويتشاركان في العوائد. أما المساهمة العقارية: فتتم عبر مطور مرخص رسمياً من الجهات المعنية لإدارة المساهمات العقارية، حيث يساهم المالك بأرضه ويختار من عدة خيارات: التخارج بنسبة محددة، أو بيع الأرض ضمن المساهمة، أو الدخول العيني الكامل بالأرض كشريك في المشروع.", aEn: "Development Partnership: The owner and developer agree to develop land together under an agreed profit model, sharing returns. Real Estate Contribution: Managed by a developer officially licensed for real estate contributions, where the owner contributes their land and chooses from several options: exiting at a predetermined percentage, selling the land within the contribution, or full in-kind entry as a project partner." },
  { qAr: "ما الدور الذي تقدمه بين الطرفين؟", qEn: "What role does SYNA play between both parties?", aAr: "تعمل سينا كحلقة وصل احترافية تساعد على عرض الأراضي، تحليل فرص التطوير والمساهمة، وتنظيم التواصل حتى الوصول إلى اتفاق واضح بين المالك والمطور.", aEn: "SYNA acts as a professional bridge that helps display lands, analyze development and contribution opportunities, and organize communication until a clear agreement is reached." },
  { qAr: "هل تعتبر سينا وسيط بيع تقليدي؟", qEn: "Is SYNA a traditional sales broker?", aAr: "لا، دور سينا يتجاوز الوساطة المعتادة، إذ تركز على بناء نماذج تطوير وشراكات ومساهمات عقارية طويلة المدى بدلاً من مجرد عرض عقار للبيع.", aEn: "No, SYNA focuses on building development models, partnerships, and real estate contributions rather than simply listing properties for sale." },
  { qAr: "كيف يقوم مالك الأرض بعرض أرضه؟", qEn: "How does a landowner list their land?", aAr: "يمكن للمالك إنشاء ملف خاص بالأرض واختيار المسار المناسب: شراكة تطوير أو مساهمة عقارية، وكتابة هدف الشراكة ونوع التطوير المطلوب.", aEn: "The owner creates a land profile and selects the suitable path: development partnership or real estate contribution, specifying the partnership goal and development type." },
  { qAr: "ما هي المساهمة العقارية؟", qEn: "What is a Real Estate Contribution?", aAr: "المساهمة العقارية هي نموذج يقوم فيه مالك الأرض بالمساهمة بأرضه مع مطور عقاري مرخص رسمياً من الجهات المعنية لإدارة المساهمات العقارية. يتم تطوير الأرض، ويختار المالك من عدة خيارات: التخارج بنسبة متفق عليها مسبقاً، أو بيع أرضه ضمن المساهمة، أو الدخول العيني الكامل بالأرض كشريك في المشروع.", aEn: "A real estate contribution is a model where the landowner contributes their land with a developer officially licensed for managing real estate contributions. The land is developed, and the owner chooses from several options: exiting at a pre-agreed percentage, selling their land within the contribution, or full in-kind entry as a project partner." },
  { qAr: "من يمكنه تقديم المساهمات العقارية؟", qEn: "Who can offer real estate contributions?", aAr: "فقط المطورون الحاصلون على ترخيص رسمي من الجهات المعنية بالمساهمات العقارية يمكنهم تقديم هذا النوع من الشراكة عبر سينا.", aEn: "Only developers with an official license for real estate contributions from relevant authorities can offer this type of partnership through SYNA." },
  { qAr: "ماذا يرى المطور قبل الموافقة؟", qEn: "What does the developer see before approval?", aAr: "تظهر للمطور معلومات عامة مثل المساحة والأبعاد والواجهة ونوع المسار (شراكة أو مساهمة)، بينما تبقى البيانات الحساسة غير متاحة إلا بعد المرور بمراحل الموافقة.", aEn: "The developer sees general info like area, dimensions, frontage, and path type (partnership or contribution), while sensitive data remains unavailable until approval stages." },
  { qAr: "كيف يتم التحقق من الشركات المطورة؟", qEn: "How are developer companies verified?", aAr: "تطلب سينا إدخال بيانات السجل التجاري ورفع الوثائق الرسمية، ويتم التحقق من صحة اسم المنشأة وترخيصها.", aEn: "SYNA requires entering commercial register data and uploading official documents, verifying the entity's name and licensing." },
  { qAr: "هل توجد مراحل قبل الوصول للتفاصيل الكاملة؟", qEn: "Are there stages before accessing full details?", aAr: "نعم، تمر الطلبات بمراحل تقييم تدريجية، وعند قبول الطرفين يتم الانتقال إلى مستوى أعمق من المعلومات والتواصل المباشر.", aEn: "Yes, requests go through progressive evaluation stages. When both parties agree, they move to a deeper level of information and direct communication." },
  { qAr: "ما فائدة الشراكة التطويرية لمالك الأرض؟", qEn: "What is the benefit of a development partnership for a landowner?", aAr: "تمنح الشراكة — سواء تطويرية أو مساهمة عقارية — فرصة لتحويل الأرض إلى مشروع منتج بدلاً من بقائها غير مستغلة، مما يساعد على تقليل أعباء رسوم الأراضي البيضاء.", aEn: "The partnership — whether development or contribution — offers an opportunity to transform land into a productive project, helping reduce white land fee burdens." },
  { qAr: "كيف تساعد سينا المطورين؟", qEn: "How does SYNA help developers?", aAr: "توفر سينا فرص تطوير ومساهمة عقارية تم فرزها مسبقاً مع وضوح أهداف الملاك، مما يقلل الوقت المستهلك في البحث التقليدي.", aEn: "SYNA provides pre-screened development and contribution opportunities with clear owner objectives, reducing time spent on traditional searching." },
  { qAr: "هل توجد عمولة على العمليات؟", qEn: "Is there a commission on transactions?", aAr: "تعتمد سينا نموذج عمولة مرتبط بعمليات البيع، ويتم توضيح النسبة داخل النظام عند إتمام الاتفاق.", aEn: "SYNA uses a commission model linked to sales transactions. The rate is clearly displayed within the system upon agreement completion." },
  { qAr: "كيف تتم متابعة مراحل المشروع؟", qEn: "How are project stages tracked?", aAr: "توفر سينا لوحة متابعة تعتمد على مؤشرات أداء توضح تقدم كل مرحلة لضمان سير العملية بشكل منظم بين الأطراف.", aEn: "SYNA provides a tracking dashboard with performance indicators showing the progress of each stage." },
  { qAr: "هل يمكن ربط الاجتماعات عبر سينا؟", qEn: "Can meetings be linked through SYNA?", aAr: "نعم، تدعم سينا جدولة الاجتماعات وربطها بخدمات Google وMeta API لتسهيل التنسيق بين الأطراف.", aEn: "Yes, SYNA supports scheduling meetings and linking them with Google and Meta API services." },
  { qAr: "هل المعلومات داخل سينا آمنة؟", qEn: "Is information within SYNA secure?", aAr: "تعتمد سينا نظام صلاحيات متدرج يضمن عدم ظهور التفاصيل الحساسة إلا بعد تحقق مراحل التوافق.", aEn: "SYNA uses a tiered permissions system ensuring sensitive details are only revealed after compatibility stages are verified." },
  { qAr: "هل سينا مناسبة فقط للأراضي الكبيرة؟", qEn: "Is SYNA only suitable for large lands?", aAr: "يمكن استخدام سينا لمختلف أنواع الأراضي طالما يوجد هدف تطوير أو مساهمة عقارية واضح وقابل للدراسة.", aEn: "SYNA can be used for various land types as long as there is a clear and feasible development or contribution goal." },
];

const FAQPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الحوكمة والعمليات | الأسئلة الشائعة" : "Governance & Operations | FAQ");

  return (
    <div className="min-h-screen bg-primary flex flex-col relative overflow-hidden">
      <div className="luxury-grid absolute inset-0 opacity-20 pointer-events-none" />
      <Navbar />
      <PageHeader 
        icon={HelpCircle} 
        title={isAr ? "دليل الحوكمة والعمليات" : "Governance & Desk"} 
        description={isAr ? "دليل إجرائي ومعرفي لآلية عمل الشراكات الاستثمارية والمساهمات العقارية عبر سينا للاستثمارات العقارية." : "An executive knowledge desk for investment frameworks and real estate contribution mandates via SYNA."} 
        backgroundImage={headerFaqImg} 
      />

      <main className="container flex-1 py-32 md:py-48 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-24 text-center">
            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] block mb-6">RESOURCES</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white uppercase">{isAr ? "الأسئلة الأكثر تداولاً" : "Executive FAQ"}</h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                <AccordionItem value={`faq-${idx}`} className="border border-white/5 bg-white/[0.02] px-10 transition-all hover:bg-white/[0.04] rounded-none">
                  <AccordionTrigger className="text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:no-underline py-10 transition-all group">
                    <span className="text-start leading-relaxed ps-4 border-s-2 border-accent/0 group-data-[state=open]:border-accent transition-all">
                      {isAr ? item.qAr : item.qEn}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-light leading-[1.8] text-white/40 pb-12 ps-4">
                    <div className="max-w-3xl border-t border-white/5 pt-8">
                      {isAr ? item.aAr : item.aEn}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
