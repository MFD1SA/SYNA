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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <PageHeader icon={Scale} title={isAr ? "سياسة الاستخدام" : "Usage Policy"} description={isAr ? "القواعد والضوابط التي تحكم استخدام منصة سينا لضمان بيئة آمنة واحترافية" : "The rules and guidelines governing the use of the SYNA platform to ensure a safe and professional environment"} backgroundImage={headerUsagePolicyImg} />
      <main className="container flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((s, i) => (
            <section key={i} className="rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
              <h2 className="mb-3 text-xl font-medium text-foreground">{s.title}</h2>
              <p className="text-base font-light leading-relaxed text-muted-foreground">{s.text}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UsagePolicyPage;
