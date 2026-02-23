import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

const PrivacyPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-10">
        <h1 className="mb-6 text-3xl font-medium text-foreground">{t.privacy.title}</h1>
        <div className="max-w-3xl space-y-6 font-light leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">1. جمع البيانات</h2>
                <p>نجمع البيانات التي تقدمها عند التسجيل: الاسم، البريد الإلكتروني، رقم الجوال. للمطورين نجمع أيضاً بيانات السجل التجاري. كما نجمع بيانات الاستخدام تلقائياً مثل عنوان IP وأوقات الوصول.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">2. استخدام البيانات</h2>
                <p>نستخدم بياناتك لتقديم خدمات الربط بين ملاك الأراضي والمطورين، والتحقق من السجلات التجارية، ومتابعة مراحل الصفقات. لا نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">3. خصوصية بيانات الأراضي</h2>
                <p>بيانات الأرض الحساسة (رقم الصك، هوية المالك، الموقع الدقيق) محمية بنظام "البوابة" ولا تُكشف للمطور إلا بعد موافقة المالك صراحةً على طلب الشراكة.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">4. حماية البيانات</h2>
                <p>نستخدم تقنيات تشفير متقدمة لحماية بياناتك. نطبق إجراءات أمنية صارمة تشمل التحكم في الوصول ومراقبة الأنظمة.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">5. حقوق المستخدم</h2>
                <p>يحق لك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها. يمكنك طلب نسخة من بياناتك المخزنة لدينا.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">6. الاحتفاظ بالبيانات</h2>
                <p>نحتفظ ببياناتك طالما كان حسابك نشطاً. بعد إغلاق الحساب، نحتفظ بالبيانات للمدة المطلوبة قانونياً ثم نحذفها.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">7. التحديثات</h2>
                <p>قد نحدث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية. للتواصل: مركز الدعم أو الرقم 0504566777.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">1. Data Collection</h2>
                <p>We collect data you provide during registration: name, email, phone number. For developers, we also collect commercial register data. We automatically collect usage data such as IP address and access times.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">2. Data Usage</h2>
                <p>We use your data to provide matching services between landowners and developers, verify commercial registers, and track deal stages. We do not sell or share your data with third parties for marketing purposes.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">3. Land Data Privacy</h2>
                <p>Sensitive land data (deed number, owner identity, exact location) is protected by a "Gate" system and is not revealed to developers until the owner explicitly approves the partnership request.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">4. Data Protection</h2>
                <p>We use advanced encryption technologies to protect your data. We implement strict security measures including access control and system monitoring.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">5. User Rights</h2>
                <p>You have the right to request access to, correction of, or deletion of your personal data. You may request a copy of your stored data.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">6. Data Retention</h2>
                <p>We retain your data as long as your account is active. After account closure, we retain data for the legally required period and then delete it.</p>
              </section>
              <section>
                <h2 className="mb-2 text-lg font-medium text-foreground">7. Updates</h2>
                <p>We may update this privacy policy from time to time. We will notify you of any material changes. Contact: Support Center or call 0504566777.</p>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
