import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
// 4K photo hero (served from /public/heroes/, replaces the abstract emblem SVG).
const heroImg = "/heroes/legal.jpg";

const TermsPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الشروط والأحكام" : "Terms & Conditions");

  useMetaTags({
    title: isAr
      ? "سينا | الشروط والأحكام لاستخدام منصة الشراكات العقارية"
      : "SINA | Terms & Conditions for the Real-Estate Partnership Platform",
    description: isAr
      ? "الشروط والأحكام التي تحكم استخدام سينا من قِبل ملاك الأراضي والمطورين العقاريين في المملكة العربية السعودية، بما يشمل الحقوق والمسؤوليات."
      : "Terms governing SINA use by landowners and developers in Saudi Arabia — including rights, obligations, privacy, IP, liability limits, and account termination.",
    canonical: isAr ? "https://cidoma.com/terms" : "https://cidoma.com/en/terms",
    ogTitle: isAr ? "سينا | الشروط والأحكام" : "SINA Terms & Conditions",
    ogDescription: isAr
      ? "الإطار القانوني لاستخدام منصة سينا."
      : "The legal framework for using the SINA platform.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/terms" : "https://cidoma.com/terms" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "الشروط والأحكام" : "Terms & Conditions", item: isAr ? "https://cidoma.com/terms" : "https://cidoma.com/en/terms" },
        ],
      },
    ],
  });

  const sections = isAr ? [
    { title: "1. مقدمة", text: "مرحباً بك في سينا، الشركة المتخصصة في تسهيل شراكات التطوير العقاري بين ملاك الأراضي والمطورين في المملكة العربية السعودية. باستخدامك لخدماتنا فإنك توافق على الالتزام بهذه الشروط والأحكام." },
    { title: "2. التعريفات", text: "\"المنصة\" تشير إلى SINA وجميع الخدمات المرتبطة بها. \"مالك الأرض\" يشير إلى من يسجل أرضه للبحث عن شريك تطوير. \"المطور\" يشير إلى الشركة المسجلة تجارياً والتي تبحث عن فرص تطوير. \"الصفقة\" تشمل دورة الشراكة من الطلب حتى الإغلاق." },
    { title: "3. شروط الاستخدام", text: "يجب أن يكون عمر المستخدم 18 عاماً على الأقل. يلتزم المطور بتقديم سجل تجاري ساري المفعول. يلتزم مالك الأرض بتقديم بيانات صحيحة عن أرضه. يتحمل كل طرف مسؤولية الحفاظ على سرية بيانات حسابه." },
    { title: "4. الخصوصية والسرية", text: "بيانات مالك الأرض الحساسة (رقم الصك، الموقع الدقيق، هوية المالك) لا تُعرض للمطور إلا بعد موافقة المالك صراحةً. أي محاولة للتحايل على نظام الخصوصية تعرض الحساب للإيقاف الفوري." },
    { title: "5. الملكية الفكرية", text: "جميع المحتويات والتصاميم والعلامات التجارية المتعلقة بسينا هي ملك للشركة. لا يجوز نسخ أو تعديل أو توزيع أي محتوى دون إذن كتابي مسبق." },
    { title: "6. حدود المسؤولية", text: "سينا وسيط تقني فقط ولا تتحمل مسؤولية نتائج الشراكات أو الاتفاقات بين الأطراف. لا تضمن الشركة دقة البيانات المقدمة من المستخدمين." },
    { title: "7. إنهاء الحساب", text: "يحق للشركة تعليق أو إنهاء حساب المستخدم في حالة مخالفة هذه الشروط. يمكن للمستخدم إلغاء حسابه في أي وقت." },
    { title: "8. القانون الواجب التطبيق", text: "تخضع هذه الشروط لأنظمة المملكة العربية السعودية. للتواصل يرجى استخدام نموذج \"اتصل بنا\"." },
  ] : [
    { title: "1. Introduction", text: "Welcome to SINA, a platform specializing in facilitating real estate development partnerships between landowners and developers in Saudi Arabia. By using this platform, you agree to comply with these Terms and Conditions." },
    { title: "2. Definitions", text: "\"Platform\" refers to SINA and all associated services. \"Landowner\" refers to those who list their land seeking a development partner. \"Developer\" refers to a commercially registered company seeking development opportunities. \"Deal\" encompasses the partnership cycle from request to closure." },
    { title: "3. Terms of Use", text: "Users must be at least 18 years old. Developers must provide a valid commercial register. Landowners must provide accurate land data. Each party is responsible for maintaining account confidentiality." },
    { title: "4. Privacy & Confidentiality", text: "Sensitive landowner data (deed number, exact location, owner identity) is not shown to developers until explicit owner approval. Any attempt to circumvent the privacy system results in immediate account suspension." },
    { title: "5. Intellectual Property", text: "All content, designs, and trademarks related to the platform are the property of SINA." },
    { title: "6. Limitation of Liability", text: "The platform is a technical intermediary only and bears no responsibility for partnership outcomes or agreements between parties." },
    { title: "7. Account Termination", text: "The company reserves the right to suspend or terminate accounts for violations. Users can cancel their account at any time." },
    { title: "8. Governing Law", text: "These terms are governed by the laws of the Kingdom of Saudi Arabia. Please use our Contact Us form." },
  ];

  return (
    <PageShell>
      <InnerHero pageSlug="terms" title={isAr ? "الشروط والأحكام" : "Terms & Conditions"} subtitle={isAr ? "الأطر القانونية التي تنظم استخدام سينا" : "Legal frameworks governing platform usage"} isAr={isAr} image={heroImg} />
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

export default TermsPage;
