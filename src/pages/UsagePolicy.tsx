import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Scale } from "lucide-react";
import headerUsagePolicyImg from "@/assets/header-usage-policy.jpg";

const UsagePolicyPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سياسة الاستخدام" : "Usage Policy");

  const sections = isAr ? [
    { title: "1. الاستخدام المقبول", text: "يجب استخدام SYNA فقط لأغراض تسهيل شراكات التطوير العقاري بين ملاك الأراضي والمطورين. يلتزم المستخدم بعدم استخدام المنصة لأي نشاط مخالف للأنظمة المعمول بها في المملكة العربية السعودية." },
    { title: "2. الأنشطة المحظورة", text: "يُحظر: محاولة الوصول لبيانات المالك دون موافقته، تقديم سجلات تجارية مزورة، نشر معلومات مضللة عن الأراضي، انتحال هوية مستخدم آخر، أو استخدام المنصة للاحتيال." },
    { title: "3. دقة البيانات", text: "يلتزم مالك الأرض بإدخال بيانات صحيحة عن أرضه. يلتزم المطور بتقديم سجل تجاري ساري ودقيق. البيانات المعروضة إرشادية ولا تغني عن التحقق المستقل." },
    { title: "4. أمن الحساب", text: "يلتزم المستخدم بكلمة مرور قوية وعدم مشاركتها. يجب إبلاغ المنصة فوراً عند الاشتباه بوصول غير مصرح به." },
    { title: "5. الإجراءات التأديبية", text: "في حالة المخالفة: تحذير، تعليق مؤقت، إنهاء نهائي للحساب، أو اتخاذ إجراءات قانونية حسب خطورة المخالفة." },
    { title: "6. الإبلاغ", text: 'نشجع على الإبلاغ عن أي سلوك مخالف عبر مركز الدعم. جميع البلاغات تُعامل بسرية. للتواصل يرجى استخدام نموذج "اتصل بنا".' },
  ] : [
    { title: "1. Acceptable Use", text: "SYNA must only be used for facilitating real estate development partnerships between landowners and developers. Users must not use the platform for any activity violating Saudi Arabian regulations." },
    { title: "2. Prohibited Activities", text: "Prohibited: attempting to access owner data without consent, submitting forged commercial registers, publishing misleading land information, impersonating users, or using the platform for fraud." },
    { title: "3. Data Accuracy", text: "Landowners must enter accurate land data. Developers must provide a valid and accurate commercial register. Displayed data is for guidance and does not substitute independent verification." },
    { title: "4. Account Security", text: "Users must use strong passwords and not share them. The platform must be notified immediately of suspected unauthorized access." },
    { title: "5. Disciplinary Actions", text: "For violations: warning, temporary suspension, permanent termination, or legal action depending on severity." },
    { title: "6. Reporting", text: 'We encourage reporting any violating behavior through the Support Center. All reports are handled confidentially. Please use our "Contact Us" form.' },
  ];

  return (
    <div className="min-h-screen bg-primary flex flex-col relative overflow-hidden">
      <div className="luxury-grid absolute inset-0 opacity-20 pointer-events-none" />
      <Navbar />
      <PageHeader 
        icon={Scale} 
        title={isAr ? "ميثاق الامتثال" : "Compliance Mandate"} 
        description={isAr ? "المعايير والضوابط الأخلاقية والنظامية التي تحكم جودة التفاعل والتعاقد في بيئة سينا للاستثمارات العقارية." : "The ethical and sovereign regulatory standards governing the quality of interaction in the SYNA environment."} 
        backgroundImage={headerUsagePolicyImg} 
      />

      <main className="container flex-1 py-32 md:py-48 relative z-10">
        <div className="max-w-4xl mx-auto space-y-px border border-white/5 bg-white/[0.02]">
          {sections.map((s, i) => (
            <section key={i} className="bg-primary p-16 transition-colors hover:bg-white/[0.03] border-b border-white/5 last:border-b-0">
              <span className="block text-[9px] font-bold text-accent uppercase tracking-[0.4em] mb-6">MANDATE 0{i+1}</span>
              <h2 className="mb-8 text-2xl font-medium text-white uppercase tracking-tight">{s.title}</h2>
              <p className="text-base font-light leading-[1.8] text-white/40">{s.text}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UsagePolicyPage;
