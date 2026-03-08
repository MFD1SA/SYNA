import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ShieldCheck } from "lucide-react";

const PrivacyPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سياسة الخصوصية" : "Privacy Policy");

  const sections = isAr ? [
    { title: "1. جمع البيانات", text: "نجمع البيانات التي تقدمها عند التسجيل: الاسم، البريد الإلكتروني. للمطورين نجمع أيضاً بيانات السجل التجاري. كما نجمع بيانات الاستخدام تلقائياً مثل عنوان IP وأوقات الوصول." },
    { title: "2. استخدام البيانات", text: "نستخدم بياناتك لتقديم خدمات الربط بين ملاك الأراضي والمطورين، والتحقق من السجلات التجارية، ومتابعة مراحل الصفقات. لا نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية." },
    { title: "3. خصوصية بيانات الأراضي", text: 'بيانات الأرض الحساسة (رقم الصك، هوية المالك، الموقع الدقيق) محمية بنظام "البوابة" ولا تُكشف للمطور إلا بعد موافقة المالك صراحةً على طلب الشراكة.' },
    { title: "4. حماية البيانات", text: "نستخدم تقنيات تشفير متقدمة لحماية بياناتك. نطبق إجراءات أمنية صارمة تشمل التحكم في الوصول ومراقبة الأنظمة." },
    { title: "5. حقوق المستخدم", text: "يحق لك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها. يمكنك طلب نسخة من بياناتك المخزنة لدينا." },
    { title: "6. الاحتفاظ بالبيانات", text: "نحتفظ ببياناتك طالما كان حسابك نشطاً. بعد إغلاق الحساب، نحتفظ بالبيانات للمدة المطلوبة قانونياً ثم نحذفها." },
    { title: "7. التحديثات", text: 'قد نحدث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية. للتواصل يرجى استخدام نموذج "اتصل بنا".' },
  ] : [
    { title: "1. Data Collection", text: "We collect data you provide during registration: name, email. For developers, we also collect commercial register data. We automatically collect usage data such as IP address and access times." },
    { title: "2. Data Usage", text: "We use your data to provide matching services between landowners and developers, verify commercial registers, and track deal stages. We do not sell or share your data with third parties for marketing purposes." },
    { title: "3. Land Data Privacy", text: 'Sensitive land data (deed number, owner identity, exact location) is protected by a "Gate" system and is not revealed to developers until the owner explicitly approves the partnership request.' },
    { title: "4. Data Protection", text: "We use advanced encryption technologies to protect your data. We implement strict security measures including access control and system monitoring." },
    { title: "5. User Rights", text: "You have the right to request access to, correction of, or deletion of your personal data. You may request a copy of your stored data." },
    { title: "6. Data Retention", text: "We retain your data as long as your account is active. After account closure, we retain data for the legally required period and then delete it." },
    { title: "7. Updates", text: 'We may update this privacy policy from time to time. We will notify you of any material changes. Please use our "Contact Us" form.' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <PageHeader icon={ShieldCheck} title={isAr ? "سياسة الخصوصية" : "Privacy Policy"} description={isAr ? "كيف نحمي بياناتك ونحافظ على خصوصيتك أثناء استخدام منصة سينا" : "How we protect your data and maintain your privacy while using the SYNA platform"} />
      <main className="container py-10">
        <div className="max-w-3xl mx-auto space-y-5">
          {sections.map((s, i) => (
            <section key={i} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
              <h2 className="mb-2 text-lg font-medium text-white">{s.title}</h2>
              <p className="text-sm font-light leading-relaxed text-[hsl(210,15%,50%)]">{s.text}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
