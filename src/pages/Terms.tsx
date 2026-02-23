import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

const TermsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-10">
        <h1 className="mb-6 text-3xl font-medium text-foreground">{t.terms.title}</h1>
        <div className="max-w-3xl space-y-6 font-light leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">1. مقدمة</h2>
                <p>مرحباً بك في DOMA، المنصة المتخصصة في تسهيل شراكات التطوير العقاري بين ملاك الأراضي والمطورين في المملكة العربية السعودية، والمملوكة لشركة دوما للتقنية. باستخدامك لهذه المنصة فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">2. التعريفات</h2>
                <p>"المنصة" تشير إلى DOMA وجميع الخدمات المرتبطة بها. "مالك الأرض" يشير إلى من يسجل أرضه للبحث عن شريك تطوير. "المطور" يشير إلى الشركة المسجلة تجارياً والتي تبحث عن فرص تطوير. "الصفقة" تشمل دورة الشراكة من الطلب حتى الإغلاق.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">3. شروط الاستخدام</h2>
                <p>يجب أن يكون عمر المستخدم 18 عاماً على الأقل. يلتزم المطور بتقديم سجل تجاري ساري المفعول. يلتزم مالك الأرض بتقديم بيانات صحيحة عن أرضه. يتحمل كل طرف مسؤولية الحفاظ على سرية بيانات حسابه.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">4. العمولة والرسوم</h2>
                <p>تفرض المنصة عمولة بنسبة 2.50% تُدفع من المطور عند إتمام الصفقة بنجاح. لا توجد رسوم تسجيل أو اشتراك شهري. العمولة مستحقة فقط عند إغلاق الاتفاق بين الطرفين.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">5. الخصوصية والسرية</h2>
                <p>بيانات مالك الأرض الحساسة (رقم الصك، الموقع الدقيق، هوية المالك) لا تُعرض للمطور إلا بعد موافقة المالك صراحةً. أي محاولة للتحايل على نظام الخصوصية تعرض الحساب للإيقاف الفوري.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">6. الملكية الفكرية</h2>
                <p>جميع المحتويات والتصاميم والعلامات التجارية المتعلقة بالمنصة هي ملك لشركة دوما للتقنية. لا يجوز نسخ أو تعديل أو توزيع أي محتوى من المنصة دون إذن كتابي مسبق.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">7. حدود المسؤولية</h2>
                <p>المنصة وسيط تقني فقط ولا تتحمل مسؤولية نتائج الشراكات أو الاتفاقات بين الأطراف. لا تضمن الشركة دقة البيانات المقدمة من المستخدمين.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">8. إنهاء الحساب</h2>
                <p>يحق للشركة تعليق أو إنهاء حساب المستخدم في حالة مخالفة هذه الشروط. يمكن للمستخدم إلغاء حسابه في أي وقت.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">9. القانون الواجب التطبيق</h2>
                <p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية. للتواصل: support@doma.sa.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">1. Introduction</h2>
                <p>Welcome to DOMA, a platform specializing in facilitating real estate development partnerships between landowners and developers in Saudi Arabia, owned by Doma Technology Company. By using this platform, you agree to comply with these Terms and Conditions.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">2. Definitions</h2>
                <p>"Platform" refers to DOMA and all associated services. "Landowner" refers to those who list their land seeking a development partner. "Developer" refers to a commercially registered company seeking development opportunities. "Deal" encompasses the partnership cycle from request to closure.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">3. Terms of Use</h2>
                <p>Users must be at least 18 years old. Developers must provide a valid commercial register. Landowners must provide accurate land data. Each party is responsible for maintaining account confidentiality.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">4. Commission & Fees</h2>
                <p>The platform charges a 2.50% commission paid by the developer upon successful deal closure. There are no registration or monthly subscription fees. Commission is due only upon agreement closure between both parties.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">5. Privacy & Confidentiality</h2>
                <p>Sensitive landowner data (deed number, exact location, owner identity) is not shown to developers until explicit owner approval. Any attempt to circumvent the privacy system results in immediate account suspension.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">6. Intellectual Property</h2>
                <p>All content, designs, and trademarks related to the platform are the property of Doma Technology Company.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">7. Limitation of Liability</h2>
                <p>The platform is a technical intermediary only and bears no responsibility for partnership outcomes or agreements between parties.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">8. Account Termination</h2>
                <p>The company reserves the right to suspend or terminate accounts for violations. Users can cancel their account at any time.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">9. Governing Law</h2>
                <p>These terms are governed by the laws of the Kingdom of Saudi Arabia. Contact: support@doma.sa.</p>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
