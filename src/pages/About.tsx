import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Handshake, Target, Users, Landmark, ShieldCheck, TrendingUp, Info } from "lucide-react";

const AboutPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "من نحن" : "About Us");

  const values = [
    { icon: Handshake, label: isAr ? "شراكات حقيقية" : "Real Partnerships", desc: isAr ? "تحويل الأراضي البيضاء إلى مشاريع منتجة عبر شراكات تطوير واضحة" : "Transforming white lands into productive projects through clear partnerships" },
    { icon: Target, label: isAr ? "شفافية كاملة" : "Full Transparency", desc: isAr ? "مراحل مُتابعة دقيقة ومنظمة من الطلب حتى الإغلاق" : "Precise and organized tracking stages from request to closure" },
    { icon: Users, label: isAr ? "ربط ذكي" : "Smart Matching", desc: isAr ? "جمع ملاك الأراضي بالمطورين العقاريين المؤهلين والموثقين" : "Connecting landowners with qualified and verified real estate developers" },
  ];

  const whyItems = [
    { icon: Landmark, text: isAr ? "مساعدة ملاك الأراضي على إيجاد فرص تطوير تقلل من أعباء رسوم الأراضي البيضاء" : "Help landowners find development opportunities to reduce white land fee burdens" },
    { icon: ShieldCheck, text: isAr ? "تمكين المطورين من الوصول إلى فرص واضحة المعايير قبل الدخول في الاجتماعات" : "Enable developers to access opportunities with clear criteria before meetings" },
    { icon: TrendingUp, text: isAr ? "تنظيم مراحل التواصل والاجتماعات لضمان وضوح الرؤية وتحديد الأهداف" : "Organize communication and meeting stages to ensure clarity and goal alignment" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHeader
        icon={Info}
        title={isAr ? "عن دوما" : "About DOMA"}
        description={isAr
          ? "تعرّف على رؤية دوما ودورها في تنظيم شراكات التطوير العقاري بين ملاك الأراضي والمطورين"
          : "Learn about DOMA's vision and its role in organizing real estate development partnerships between landowners and developers"}
      />
      <main className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-base font-light leading-relaxed text-muted-foreground">
              {isAr
                ? "في ظل التغيرات التنظيمية ورسوم الأراضي البيضاء، أصبح كثير من ملاك الأراضي يبحثون عن حلول عملية لتحويل أصولهم إلى مشاريع منتجة دون الدخول في تعقيدات البيع أو تحمل تكاليف التطوير بمفردهم."
                : "With regulatory changes and white land fees, many landowners seek practical solutions to transform their assets into productive projects without the complexities of selling or bearing development costs alone."}
            </p>
            <p className="mt-3 text-base font-light leading-relaxed text-muted-foreground">
              {isAr
                ? "من هنا جاءت فكرة دوما… لتكون وجهة الشراكات التطويرية التي تجمع بين مالك الأرض والمطور العقاري ضمن بيئة منظمة وواضحة من البداية."
                : "This is where DOMA comes in — the destination for development partnerships connecting landowners with developers in an organized and clear environment from the start."}
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {values.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="doma-card p-5 text-center">
                <Icon className="mx-auto mb-3 h-6 w-6 text-primary" strokeWidth={1.5} />
                <h3 className="mb-1.5 text-base font-medium text-foreground">{label}</h3>
                <p className="text-sm font-light text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <h2 className="mb-4 text-center text-xl font-medium text-foreground">
              {isAr ? "لماذا دوما؟" : "Why DOMA?"}
            </h2>
            <div className="space-y-3">
              {whyItems.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl border border-border/40 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <h2 className="mb-2 text-lg font-medium text-foreground">{isAr ? "رؤيتنا" : "Our Vision"}</h2>
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              {isAr
                ? "نؤمن بأن الأرض ليست مجرد مساحة خام، بل فرصة لبناء قيمة مستدامة. من خلال دوما نسعى إلى تحويل الأفكار إلى شراكات حقيقية، وتحويل الأراضي إلى مشاريع منتجة تسهم في نمو المدن وتحفيز الاقتصاد العقاري بطريقة متوازنة واحترافية."
                : "We believe land is not just raw space — it's an opportunity to build sustainable value. Through DOMA, we aim to transform ideas into real partnerships and lands into productive projects that contribute to urban growth and stimulate the real estate economy in a balanced and professional manner."}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
