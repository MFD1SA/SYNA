import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

const UsagePolicyPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-16">
        <h1 className="mb-8 text-3xl font-medium text-foreground">{t.usagePolicy.title}</h1>
        <div className="max-w-3xl space-y-8 font-light leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">1. الاستخدام المقبول</h2>
                <p>يجب استخدام DOMA فقط للأغراض المشروعة المتعلقة بإدارة العقارات والعقود. يلتزم المستخدم بعدم استخدام المنصة لأي نشاط مخالف للأنظمة المعمول بها في المملكة العربية السعودية.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">2. الأنشطة المحظورة</h2>
                <p>يُحظر على المستخدمين: محاولة اختراق أو تعطيل أنظمة المنصة، استخدام برامج آلية لجمع البيانات، انتحال هوية مستخدم آخر، نشر معلومات مضللة أو كاذبة عن العقارات، استخدام المنصة للاحتيال أو غسل الأموال.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">3. المحتوى المنشور</h2>
                <p>يتحمل المستخدم المسؤولية الكاملة عن أي محتوى يقوم بنشره على المنصة. يجب أن يكون المحتوى دقيقاً ولا ينتهك حقوق الملكية الفكرية للآخرين. تحتفظ الشركة بحق إزالة أي محتوى مخالف.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">4. أمن الحساب</h2>
                <p>يلتزم المستخدم باستخدام كلمة مرور قوية وعدم مشاركتها مع أي شخص. يجب إبلاغ الشركة فوراً في حالة الاشتباه بأي وصول غير مصرح به إلى الحساب. لا تتحمل الشركة مسؤولية الأضرار الناتجة عن إهمال المستخدم في حماية بيانات حسابه.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">5. البيانات العقارية</h2>
                <p>يلتزم المستخدم بإدخال بيانات عقارية صحيحة ومحدثة. البيانات المتاحة على المنصة هي لأغراض إرشادية ولا تغني عن التحقق المستقل. لا تتحمل الشركة مسؤولية القرارات المبنية على البيانات المعروضة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">6. الإجراءات التأديبية</h2>
                <p>في حالة مخالفة سياسة الاستخدام، تحتفظ الشركة بحق: إرسال تحذير للمستخدم، تعليق الحساب مؤقتاً، إنهاء الحساب نهائياً، اتخاذ الإجراءات القانونية اللازمة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">7. الإبلاغ عن المخالفات</h2>
                <p>نشجع المستخدمين على الإبلاغ عن أي سلوك مخالف أو محتوى غير لائق عبر مركز الدعم. سيتم التعامل مع جميع البلاغات بسرية تامة. للتواصل: 0504566777.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">1. Acceptable Use</h2>
                <p>DOMA must only be used for legitimate purposes related to real estate and contract management. Users must not use the platform for any activity that violates applicable laws in the Kingdom of Saudi Arabia.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">2. Prohibited Activities</h2>
                <p>Users are prohibited from: attempting to hack or disrupt platform systems, using automated software to collect data, impersonating another user, publishing misleading or false information about properties, using the platform for fraud or money laundering.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">3. Published Content</h2>
                <p>Users bear full responsibility for any content they publish on the platform. Content must be accurate and must not violate the intellectual property rights of others. The company reserves the right to remove any violating content.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">4. Account Security</h2>
                <p>Users must use a strong password and not share it with anyone. The company must be notified immediately if unauthorized access to the account is suspected. The company is not responsible for damages resulting from user negligence in protecting account credentials.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">5. Real Estate Data</h2>
                <p>Users must enter accurate and up-to-date real estate data. Data available on the platform is for guidance purposes and does not substitute independent verification. The company is not responsible for decisions based on displayed data.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">6. Disciplinary Actions</h2>
                <p>In case of policy violation, the company reserves the right to: issue a warning, temporarily suspend the account, permanently terminate the account, take necessary legal action.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">7. Reporting Violations</h2>
                <p>We encourage users to report any violating behavior or inappropriate content through the Support Center. All reports will be handled with complete confidentiality. Contact: 0504566777.</p>
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
