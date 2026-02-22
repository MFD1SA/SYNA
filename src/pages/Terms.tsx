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
      <main className="container py-16">
        <h1 className="mb-8 text-3xl font-medium text-foreground">{t.terms.title}</h1>
        <div className="max-w-3xl space-y-8 font-light leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">1. مقدمة</h2>
                <p>مرحباً بك في DOMA، المنصة المتكاملة لإدارة العقود والمشاريع العقارية في المملكة العربية السعودية، والمملوكة لشركة دوما للتقنية. باستخدامك لهذه المنصة فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">2. التعريفات</h2>
                <p>"المنصة" تشير إلى DOMA وجميع الخدمات المرتبطة بها. "المستخدم" يشير إلى أي شخص أو جهة تستخدم المنصة. "الخدمات" تشمل جميع الوظائف المتاحة عبر المنصة بما فيها الخريطة التفاعلية وإدارة العقود والتقارير.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">3. شروط الاستخدام</h2>
                <p>يجب أن يكون عمر المستخدم 18 عاماً على الأقل. يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عند التسجيل. يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات حسابه وكلمة المرور.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">4. الاشتراكات والدفع</h2>
                <p>تقدم المنصة خطط اشتراك متنوعة حسب نوع المستخدم. يتم تجديد الاشتراكات تلقائياً ما لم يتم الإلغاء قبل تاريخ التجديد. تحتفظ الشركة بحق تعديل أسعار الاشتراكات مع إشعار المستخدمين مسبقاً.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">5. الملكية الفكرية</h2>
                <p>جميع المحتويات والتصاميم والعلامات التجارية وبراءات الاختراع المتعلقة بالمنصة هي ملك لشركة دوما للتقنية. لا يجوز نسخ أو تعديل أو توزيع أي محتوى من المنصة دون إذن كتابي مسبق.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">6. حدود المسؤولية</h2>
                <p>تقدم المنصة خدماتها "كما هي" ولا تتحمل الشركة أي مسؤولية عن الأضرار المباشرة أو غير المباشرة الناتجة عن استخدام المنصة. لا تضمن الشركة دقة البيانات المقدمة من أطراف ثالثة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">7. إنهاء الحساب</h2>
                <p>يحق للشركة تعليق أو إنهاء حساب المستخدم في حالة مخالفة هذه الشروط. يمكن للمستخدم إلغاء حسابه في أي وقت من خلال إعدادات الحساب.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">8. القانون الواجب التطبيق</h2>
                <p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع ينشأ عن استخدام المنصة يتم حله وفقاً للأنظمة المعمول بها في المملكة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">9. التعديلات</h2>
                <p>تحتفظ الشركة بحق تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار داخل المنصة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">10. التواصل</h2>
                <p>للاستفسارات المتعلقة بهذه الشروط، يمكنكم التواصل معنا عبر مركز الدعم أو الاتصال على الرقم 0504566777.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">1. Introduction</h2>
                <p>Welcome to DOMA, an integrated platform for real estate contract and project management in Saudi Arabia, owned by Doma Technology Company. By using this platform, you agree to comply with these Terms and Conditions.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">2. Definitions</h2>
                <p>"Platform" refers to DOMA and all associated services. "User" refers to any person or entity using the platform. "Services" include all functionalities available through the platform, including interactive maps, contract management, and reports.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">3. Terms of Use</h2>
                <p>Users must be at least 18 years old. Users are required to provide accurate and truthful information during registration. Users are responsible for maintaining the confidentiality of their account credentials.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">4. Subscriptions & Payment</h2>
                <p>The platform offers various subscription plans based on user type. Subscriptions are automatically renewed unless canceled before the renewal date. The company reserves the right to modify subscription prices with prior notice to users.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">5. Intellectual Property</h2>
                <p>All content, designs, trademarks, and patents related to the platform are the property of Doma Technology Company. No content from the platform may be copied, modified, or distributed without prior written permission.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">6. Limitation of Liability</h2>
                <p>The platform provides its services "as is" and the company bears no responsibility for direct or indirect damages resulting from the use of the platform. The company does not guarantee the accuracy of data provided by third parties.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">7. Account Termination</h2>
                <p>The company reserves the right to suspend or terminate a user's account in case of violation of these terms. Users can cancel their account at any time through account settings.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">8. Governing Law</h2>
                <p>These terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes arising from the use of the platform shall be resolved in accordance with applicable Saudi regulations.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">9. Modifications</h2>
                <p>The company reserves the right to modify these terms at any time. Users will be notified of any material changes via email or through an in-platform notification.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">10. Contact</h2>
                <p>For inquiries regarding these terms, please contact us through our Support Center or call 0504566777.</p>
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
