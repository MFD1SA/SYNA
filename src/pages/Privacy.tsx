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
      <main className="container py-16">
        <h1 className="mb-8 text-3xl font-medium text-foreground">{t.privacy.title}</h1>
        <div className="max-w-3xl space-y-8 font-light leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">1. جمع البيانات</h2>
                <p>نجمع البيانات الشخصية التي تقدمها عند التسجيل مثل الاسم والبريد الإلكتروني ورقم الهاتف. كما نجمع بيانات الاستخدام تلقائياً مثل عنوان IP ونوع المتصفح وأوقات الوصول.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">2. استخدام البيانات</h2>
                <p>نستخدم بياناتك لتقديم الخدمات وتحسينها، ومعالجة المعاملات والاشتراكات، وإرسال إشعارات مهمة حول حسابك، وتحليل أنماط الاستخدام لتطوير المنصة. لا نبيع أو نشارك بياناتك الشخصية مع أطراف ثالثة لأغراض تسويقية.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">3. حماية البيانات</h2>
                <p>نستخدم تقنيات تشفير متقدمة لحماية بياناتك أثناء النقل والتخزين. نطبق إجراءات أمنية صارمة تشمل المصادقة الثنائية والتحكم في الوصول ومراقبة الأنظمة على مدار الساعة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">4. ملفات تعريف الارتباط</h2>
                <p>نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة وتحسين تجربة المستخدم. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">5. حقوق المستخدم</h2>
                <p>يحق لك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها. يمكنك طلب نسخة من بياناتك المخزنة لدينا. يحق لك الاعتراض على معالجة بياناتك لأغراض معينة.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">6. الاحتفاظ بالبيانات</h2>
                <p>نحتفظ ببياناتك الشخصية طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات. بعد إغلاق الحساب، نحتفظ بالبيانات للمدة المطلوبة قانونياً ثم نحذفها بشكل آمن.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">7. مشاركة البيانات</h2>
                <p>قد نشارك بياناتك مع مزودي خدمات موثوقين يساعدوننا في تشغيل المنصة، أو عند الطلب من جهات قانونية مختصة وفقاً للأنظمة المعمول بها في المملكة العربية السعودية.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">8. التحديثات</h2>
                <p>قد نحدث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة. للتواصل: مركز الدعم أو الرقم 0504566777.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">1. Data Collection</h2>
                <p>We collect personal data you provide during registration such as name, email, and phone number. We also automatically collect usage data such as IP address, browser type, and access times.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">2. Data Usage</h2>
                <p>We use your data to provide and improve services, process transactions and subscriptions, send important notifications about your account, and analyze usage patterns to develop the platform. We do not sell or share your personal data with third parties for marketing purposes.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">3. Data Protection</h2>
                <p>We use advanced encryption technologies to protect your data during transmission and storage. We implement strict security measures including two-factor authentication, access control, and 24/7 system monitoring.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">4. Cookies</h2>
                <p>We use essential cookies to operate the platform and improve user experience. You can control cookie settings through your browser.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">5. User Rights</h2>
                <p>You have the right to request access to, correction of, or deletion of your personal data. You may request a copy of your stored data. You have the right to object to the processing of your data for specific purposes.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">6. Data Retention</h2>
                <p>We retain your personal data as long as your account is active or as needed to provide services. After account closure, we retain data for the legally required period and then securely delete it.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">7. Data Sharing</h2>
                <p>We may share your data with trusted service providers who help us operate the platform, or when requested by competent legal authorities in accordance with Saudi Arabian regulations.</p>
              </section>
              <section>
                <h2 className="mb-3 text-lg font-medium text-foreground">8. Updates</h2>
                <p>We may update this privacy policy from time to time. We will notify you of any material changes via email or in-platform notification. Contact: Support Center or call 0504566777.</p>
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
