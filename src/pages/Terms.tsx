import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { FileText } from "lucide-react";

const TermsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الشروط والأحكام" : "Terms & Conditions");

  const sections = isAr ? [
    { title: "1. مقدمة", text: "مرحباً بك في SYNA، المنصة المتخصصة في تسهيل شراكات التطوير العقاري بين ملاك الأراضي والمطورين في المملكة العربية السعودية، والمملوكة لشركة سينا للتقنية. باستخدامك لهذه المنصة فإنك توافق على الالتزام بهذه الشروط والأحكام." },
    { title: "2. التعريفات", text: '"المنصة" تشير إلى SYNA وجميع الخدمات المرتبطة بها. "مالك الأرض" يشير إلى من يسجل أرضه للبحث عن شريك تطوير. "المطور" يشير إلى الشركة المسجلة تجارياً والتي تبحث عن فرص تطوير. "الصفقة" تشمل دورة الشراكة من الطلب حتى الإغلاق.' },
    { title: "3. شروط الاستخدام", text: "يجب أن يكون عمر المستخدم 18 عاماً على الأقل. يلتزم المطور بتقديم سجل تجاري ساري المفعول. يلتزم مالك الأرض بتقديم بيانات صحيحة عن أرضه. يتحمل كل طرف مسؤولية الحفاظ على سرية بيانات حسابه." },
    { title: "4. العمولة والرسوم", text: "تفرض المنصة عمولة بنسبة 2.50% تُدفع من المطور عند إتمام الصفقة بنجاح. لا توجد رسوم تسجيل أو اشتراك شهري. العمولة مستحقة فقط عند إغلاق الاتفاق بين الطرفين." },
    { title: "5. الخصوصية والسرية", text: "بيانات مالك الأرض الحساسة (رقم الصك، الموقع الدقيق، هوية المالك) لا تُعرض للمطور إلا بعد موافقة المالك صراحةً. أي محاولة للتحايل على نظام الخصوصية تعرض الحساب للإيقاف الفوري." },
    { title: "6. الملكية الفكرية", text: "جميع المحتويات والتصاميم والعلامات التجارية المتعلقة بالمنصة هي ملك لشركة سينا للتقنية. لا يجوز نسخ أو تعديل أو توزيع أي محتوى من المنصة دون إذن كتابي مسبق." },
    { title: "7. حدود المسؤولية", text: "المنصة وسيط تقني فقط ولا تتحمل مسؤولية نتائج الشراكات أو الاتفاقات بين الأطراف. لا تضمن الشركة دقة البيانات المقدمة من المستخدمين." },
    { title: "8. إنهاء الحساب", text: "يحق للشركة تعليق أو إنهاء حساب المستخدم في حالة مخالفة هذه الشروط. يمكن للمستخدم إلغاء حسابه في أي وقت." },
    { title: "9. القانون الواجب التطبيق", text: "تخضع هذه الشروط لأنظمة المملكة العربية السعودية. للتواصل يرجى استخدام نموذج \"اتصل بنا\"." },
  ] : [
    { title: "1. Introduction", text: "Welcome to SYNA, a platform specializing in facilitating real estate development partnerships between landowners and developers in Saudi Arabia, owned by SYNA Technology. By using this platform, you agree to comply with these Terms and Conditions." },
    { title: "2. Definitions", text: '"Platform" refers to SYNA and all associated services. "Landowner" refers to those who list their land seeking a development partner. "Developer" refers to a commercially registered company seeking development opportunities. "Deal" encompasses the partnership cycle from request to closure.' },
    { title: "3. Terms of Use", text: "Users must be at least 18 years old. Developers must provide a valid commercial register. Landowners must provide accurate land data. Each party is responsible for maintaining account confidentiality." },
    { title: "4. Commission & Fees", text: "The platform charges a 2.50% commission paid by the developer upon successful deal closure. There are no registration or monthly subscription fees. Commission is due only upon agreement closure between both parties." },
    { title: "5. Privacy & Confidentiality", text: "Sensitive landowner data (deed number, exact location, owner identity) is not shown to developers until explicit owner approval. Any attempt to circumvent the privacy system results in immediate account suspension." },
    { title: "6. Intellectual Property", text: "All content, designs, and trademarks related to the platform are the property of SYNA Technology." },
    { title: "7. Limitation of Liability", text: "The platform is a technical intermediary only and bears no responsibility for partnership outcomes or agreements between parties." },
    { title: "8. Account Termination", text: "The company reserves the right to suspend or terminate accounts for violations. Users can cancel their account at any time." },
    { title: "9. Governing Law", text: 'These terms are governed by the laws of the Kingdom of Saudi Arabia. Please use our "Contact Us" form.' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <PageHeader icon={FileText} title={isAr ? "الشروط والأحكام" : "Terms & Conditions"} description={isAr ? "الشروط والأحكام التي تنظّم استخدام منصة سينا والعلاقة بين الأطراف" : "The terms and conditions governing the use of the SYNA platform and the relationship between parties"} />
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

export default TermsPage;
