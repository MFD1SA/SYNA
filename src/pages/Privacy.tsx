import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";

const PrivacyPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سياسة الخصوصية" : "Privacy Policy");

  const sections = isAr ? [
    { title: "1. جمع البيانات", text: "نقوم بجمع البيانات الشخصية التي تقدمها عند التسجيل مثل الاسم والبريد الإلكتروني ورقم الجوال، بالإضافة إلى بيانات الأرض أو السجل التجاري بحسب نوع الحساب." },
    { title: "2. استخدام البيانات", text: "تُستخدم بياناتك لتشغيل خدمات سينا وتقديم الخدمات المطلوبة، مثل مطابقة الملاك بالمطورين وإدارة الصفقات وإرسال التنبيهات ذات الصلة." },
    { title: "3. حماية البيانات", text: "نستخدم تشفيرًا متقدمًا ونظام صلاحيات متعدد المستويات لحماية بياناتك. بيانات الأرض الحساسة لا تُكشف لأي طرف إلا بموافقة صريحة من المالك." },
    { title: "4. مشاركة البيانات", text: "لا نشارك بياناتك الشخصية مع أطراف خارجية إلا في حال وجود التزام قانوني أو بموافقتك الصريحة، أو لتقديم الخدمات الضرورية عبر مزودي خدمة موثوقين." },
    { title: "5. حقوق المستخدم", text: "يحق لك طلب الاطلاع على بياناتك أو تعديلها أو حذفها في أي وقت عبر الإعدادات أو التواصل معنا." },
    { title: "6. التحديثات", text: "قد نحدّث هذه السياسة من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعارات سينا." },
  ] : [
    { title: "1. Data Collection", text: "We collect personal data you provide during registration such as name, email, and phone number, in addition to land data or commercial register based on your account type." },
    { title: "2. Data Usage", text: "Your data is used to operate the platform and deliver requested services, such as matching owners with developers, managing deals, and sending relevant notifications." },
    { title: "3. Data Protection", text: "We use advanced encryption and multi-level permission systems to protect your data. Sensitive land data is not disclosed to any party without explicit owner consent." },
    { title: "4. Data Sharing", text: "We do not share your personal data with third parties except where legally required, with your explicit consent, or to provide essential services through trusted service providers." },
    { title: "5. User Rights", text: "You have the right to access, modify, or delete your data at any time through settings or by contacting us." },
    { title: "6. Updates", text: "We may update this policy from time to time. You will be notified of any material changes via email or platform notifications." },
  ];

  return (
    <PageShell>
      <InnerHero pageSlug="privacy" title={isAr ? "سياسة الخصوصية" : "Privacy Policy"} subtitle={isAr ? "كيف نحمي بياناتك ونستخدمها" : "How we protect and use your data"} isAr={isAr} image="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=85&auto=format&fit=crop" />
      <section className="py-20 lg:py-28 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-3xl space-y-10">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold text-sina-charcoal mb-3">{s.title}</h2>
              <p className="text-[14px] text-gray-600 leading-[1.9]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
};

export default PrivacyPage;
