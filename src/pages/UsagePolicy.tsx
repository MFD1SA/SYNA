import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import headerUsageImg from "@/assets/header-usage-policy.jpg";

const UsagePolicyPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سياسة الاستخدام" : "Usage Policy");

  const sections = isAr ? [
    { title: "1. الاستخدام المقبول", text: "يجب استخدام المنصة فقط للأغراض المشروعة المتعلقة بشراكات التطوير العقاري. يُحظر أي استخدام ينتهك الأنظمة أو يضر بأطراف أخرى." },
    { title: "2. حساب المستخدم", text: "أنت مسؤول عن جميع الأنشطة التي تتم تحت حسابك. يجب الحفاظ على سرية بيانات الدخول وإبلاغنا فورًا عن أي استخدام غير مصرح به." },
    { title: "3. المحتوى", text: "يجب أن تكون جميع البيانات المقدمة صحيحة ودقيقة. يُحظر نشر محتوى مضلل أو غير لائق أو ينتهك حقوق الملكية الفكرية للآخرين." },
    { title: "4. السلوك", text: "يُتوقع من جميع المستخدمين التعامل بمهنية واحترام. أي سلوك مسيء أو احتيالي أو تحايلي على أنظمة المنصة سيؤدي إلى تعليق أو إيقاف الحساب." },
    { title: "5. التعديلات", text: "تحتفظ SINA بالحق في تعديل سياسة الاستخدام في أي وقت. استمرارك في استخدام المنصة يعني موافقتك على التعديلات." },
  ] : [
    { title: "1. Acceptable Use", text: "The platform must only be used for legitimate purposes related to real estate development partnerships. Any use that violates regulations or harms other parties is prohibited." },
    { title: "2. User Account", text: "You are responsible for all activities under your account. Login credentials must be kept confidential and any unauthorized use must be reported immediately." },
    { title: "3. Content", text: "All submitted data must be accurate and truthful. Publishing misleading, inappropriate content, or content that infringes on others' intellectual property rights is prohibited." },
    { title: "4. Conduct", text: "All users are expected to interact professionally and respectfully. Any abusive, fraudulent, or platform-circumventing behavior will result in account suspension or termination." },
    { title: "5. Modifications", text: "SINA reserves the right to modify the usage policy at any time. Continued use of the platform constitutes acceptance of modifications." },
  ];

  return (
    <PageShell>
      <InnerHero title={isAr ? "سياسة الاستخدام" : "Usage Policy"} subtitle={isAr ? "قواعد ومعايير استخدام المنصة" : "Platform usage rules and standards"} isAr={isAr} image={headerUsageImg} />
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

export default UsagePolicyPage;
