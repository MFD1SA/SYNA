import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ShieldCheck } from "lucide-react";
import headerPrivacyImg from "@/assets/header-privacy.jpg";

const PrivacyPage: React.FC = () => {
  const { lang } = useLanguage();
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
    <div className="min-h-screen bg-primary flex flex-col relative overflow-hidden">
      <div className="luxury-grid absolute inset-0 opacity-20 pointer-events-none" />
      <Navbar />
      <PageHeader 
        icon={ShieldCheck} 
        title={isAr ? "سيادة وحماية البيانات" : "Data Sovereignty"} 
        description={isAr ? "بروتوكولات حماية المعلومات والخصوصية التي نعتمدها لضمان سرية أصولكم وبياناتكم الاستثمارية." : "Information protection and privacy protocols we adopt to ensure the confidentiality of your investment assets and data."} 
        backgroundImage={headerPrivacyImg} 
      />

      <main className="container flex-1 py-32 md:py-48 relative z-10">
        <div className="max-w-4xl mx-auto space-y-px border border-white/5 bg-white/[0.02]">
          {sections.map((s, i) => (
            <section key={i} className="bg-primary p-16 transition-colors hover:bg-white/[0.03] border-b border-white/5 last:border-b-0">
              <span className="block text-[9px] font-bold text-accent uppercase tracking-[0.4em] mb-6">PROTOCOL 0{i+1}</span>
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

export default PrivacyPage;
