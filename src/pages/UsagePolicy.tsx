import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Scale } from "lucide-react";

const UsagePolicyPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سياسة الاستخدام" : "Usage Policy");

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHeader
        icon={Scale}
        title={isAr ? "سياسة الاستخدام" : "Usage Policy"}
        description={isAr
          ? "القواعد والضوابط التي تحكم استخدام منصة سينا لضمان بيئة آمنة واحترافية"
          : "The rules and guidelines governing the use of the SYNA platform to ensure a safe and professional environment"}
      />
      <main className="container py-10">
        <div className="max-w-3xl mx-auto space-y-6 font-light leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">1. الاستخدام المقبول</h2>
                <p>يجب استخدام SYNA فقط لأغراض تسهيل شراكات التطوير العقاري بين ملاك الأراضي والمطورين. يلتزم المستخدم بعدم استخدام المنصة لأي نشاط مخالف للأنظمة المعمول بها في المملكة العربية السعودية.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">2. الأنشطة المحظورة</h2>
                <p>يُحظر: محاولة الوصول لبيانات المالك دون موافقته، تقديم سجلات تجارية مزورة، نشر معلومات مضللة عن الأراضي، انتحال هوية مستخدم آخر، أو استخدام المنصة للاحتيال.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">3. دقة البيانات</h2>
                <p>يلتزم مالك الأرض بإدخال بيانات صحيحة عن أرضه. يلتزم المطور بتقديم سجل تجاري ساري ودقيق. البيانات المعروضة إرشادية ولا تغني عن التحقق المستقل.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">4. أمن الحساب</h2>
                <p>يلتزم المستخدم بكلمة مرور قوية وعدم مشاركتها. يجب إبلاغ المنصة فوراً عند الاشتباه بوصول غير مصرح به.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">5. الإجراءات التأديبية</h2>
                <p>في حالة المخالفة: تحذير، تعليق مؤقت، إنهاء نهائي للحساب، أو اتخاذ إجراءات قانونية حسب خطورة المخالفة.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">6. الإبلاغ</h2>
                <p>نشجع على الإبلاغ عن أي سلوك مخالف عبر مركز الدعم. جميع البلاغات تُعامل بسرية. للتواصل يرجى استخدام نموذج "اتصل بنا".</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">1. Acceptable Use</h2>
                <p>DOMA must only be used for facilitating real estate development partnerships between landowners and developers. Users must not use the platform for any activity violating Saudi Arabian regulations.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">2. Prohibited Activities</h2>
                <p>Prohibited: attempting to access owner data without consent, submitting forged commercial registers, publishing misleading land information, impersonating users, or using the platform for fraud.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">3. Data Accuracy</h2>
                <p>Landowners must enter accurate land data. Developers must provide a valid and accurate commercial register. Displayed data is for guidance and does not substitute independent verification.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">4. Account Security</h2>
                <p>Users must use strong passwords and not share them. The platform must be notified immediately of suspected unauthorized access.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">5. Disciplinary Actions</h2>
                <p>For violations: warning, temporary suspension, permanent termination, or legal action depending on severity.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">6. Reporting</h2>
                <p>We encourage reporting any violating behavior through the Support Center. All reports are handled confidentially. Please use our "Contact Us" form.</p>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UsagePolicyPage;
