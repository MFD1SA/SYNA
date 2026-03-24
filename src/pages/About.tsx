import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Handshake, Target, Users, Landmark, ShieldCheck, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import headerAboutImg from "@/assets/header-about.jpg";

const AboutPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "من نحن" : "About Us");

  const values = [
    { icon: Handshake, label: isAr ? "شراكات حقيقية" : "Real Partnerships", desc: isAr ? "تحويل الأراضي البيضاء إلى مشاريع منتجة عبر شراكات تطوير أو مساهمات عقارية مرخصة" : "Transforming white lands into productive projects through development partnerships or licensed real estate contributions" },
    { icon: Target, label: isAr ? "شفافية كاملة" : "Full Transparency", desc: isAr ? "مراحل مُتابعة دقيقة ومنظمة من الطلب حتى الإغلاق" : "Precise and organized tracking stages from request to closure" },
    { icon: Users, label: isAr ? "ربط ذكي" : "Smart Matching", desc: isAr ? "جمع ملاك الأراضي بالمطورين العقاريين المؤهلين والموثقين" : "Connecting landowners with qualified and verified real estate developers" },
  ];

  const whyItems = [
    { icon: Landmark, text: isAr ? "مساعدة ملاك الأراضي على إيجاد فرص تطوير تقلل من أعباء رسوم الأراضي البيضاء" : "Help landowners find development opportunities to reduce white land fee burdens" },
    { icon: ShieldCheck, text: isAr ? "تمكين المطورين من الوصول إلى فرص واضحة المعايير قبل الدخول في الاجتماعات" : "Enable developers to access opportunities with clear criteria before meetings" },
    { icon: TrendingUp, text: isAr ? "تنظيم مراحل التواصل والاجتماعات لضمان وضوح الرؤية وتحديد الأهداف" : "Organize communication and meeting stages to ensure clarity and goal alignment" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHeader
        icon={Info}
        title={isAr ? "عن سينا" : "About SYNA"}
        description={isAr ? "تعرّف على رؤية سينا ودورها في تنظيم شراكات التطوير العقاري والمساهمات العقارية بين ملاك الأراضي والمطورين" : "Learn about SYNA's vision and its role in organizing real estate development partnerships and contributions between landowners and developers"}
        backgroundImage={headerAboutImg}
      />
      
      <main className="py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
            <p className="text-lg font-light leading-relaxed text-muted-foreground">
              {isAr ? "في ظل التغيرات التنظيمية ورسوم الأراضي البيضاء، أصبح كثير من ملاك الأراضي يبحثون عن حلول عملية لتحويل أصولهم إلى مشاريع منتجة دون الدخول في تعقيدات البيع أو تحمل تكاليف التطوير بمفردهم." : "With regulatory changes and white land fees, many landowners seek practical solutions to transform their assets into productive projects without the complexities of selling or bearing development costs alone."}
            </p>
            <p className="mt-6 text-lg font-light leading-relaxed text-muted-foreground">
              {isAr ? "من هنا جاءت فكرة سينا… لتكون وجهة الشراكات التطويرية والمساهمات العقارية المرخصة التي تجمع بين مالك الأرض والمطور العقاري ضمن بيئة منظمة وواضحة من البداية." : "This is where SYNA comes in — the destination for development partnerships and licensed real estate contributions connecting landowners with developers in an organized and clear environment from the start."}
            </p>
          </motion.div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
            {values.map(({ icon: Icon, label, desc }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-primary">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-lg font-medium text-foreground">{label}</h3>
                <p className="text-sm font-light leading-relaxed text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-20 max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">{isAr ? "لماذا سينا؟" : "Why SYNA?"}</h2>
            <div className="space-y-4">
              {whyItems.map(({ icon: Icon, text }, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-base font-light leading-relaxed text-muted-foreground pt-3">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto mt-20 max-w-3xl rounded-xl border border-border bg-muted/30 p-10 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">{isAr ? "رؤيتنا" : "Our Vision"}</h2>
            <p className="text-base font-light leading-relaxed text-muted-foreground">
              {isAr ? "نؤمن بأن الأرض ليست مجرد مساحة خام، بل فرصة لبناء قيمة مستدامة. من خلال سينا نسعى إلى تحويل الأفكار إلى شراكات تطويرية ومساهمات العقارية حقيقية، وتحويل الأراضي إلى مشاريع منتجة تسهم في نمو المدن وتحفيز الاقتصاد العقاري بطريقة متوازنة واحترافية." : "We believe land is not just raw space — it's an opportunity to build sustainable value. Through SYNA, we aim to transform ideas into real development partnerships and real estate contributions, and lands into productive projects that contribute to urban growth and stimulate the real estate economy in a balanced and professional manner."}
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
