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
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <PageHeader
        icon={Info}
        title={isAr ? "عن سينا" : "About SYNA"}
        description={isAr ? "تعرّف على رؤية سينا ودورها في تنظيم شراكات التطوير العقاري بين ملاك الأراضي والمطورين" : "Learn about SYNA's vision and its role in organizing real estate development partnerships between landowners and developers"}
        backgroundImage={headerAboutImg}
      />
      <main className="py-12 md:py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
            <p className="text-base font-light leading-relaxed text-[hsl(210,15%,50%)]">
              {isAr ? "في ظل التغيرات التنظيمية ورسوم الأراضي البيضاء، أصبح كثير من ملاك الأراضي يبحثون عن حلول عملية لتحويل أصولهم إلى مشاريع منتجة دون الدخول في تعقيدات البيع أو تحمل تكاليف التطوير بمفردهم." : "With regulatory changes and white land fees, many landowners seek practical solutions to transform their assets into productive projects without the complexities of selling or bearing development costs alone."}
            </p>
            <p className="mt-3 text-base font-light leading-relaxed text-[hsl(210,15%,50%)]">
              {isAr ? "من هنا جاءت فكرة سينا… لتكون وجهة الشراكات التطويرية التي تجمع بين مالك الأرض والمطور العقاري ضمن بيئة منظمة وواضحة من البداية." : "This is where SYNA comes in — the destination for development partnerships connecting landowners with developers in an organized and clear environment from the start."}
            </p>
          </motion.div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {values.map(({ icon: Icon, label, desc }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6 text-center transition-all duration-400 hover:border-[hsl(200,80%,45%,0.25)]">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)]">
                  <Icon className="h-5 w-5 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
                </div>
                <h3 className="mb-1.5 text-base font-medium text-white">{label}</h3>
                <p className="text-sm font-light text-[hsl(210,15%,50%)]">{desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <h2 className="mb-4 text-center text-xl font-medium text-white">{isAr ? "لماذا سينا؟" : "Why SYNA?"}</h2>
            <div className="space-y-3">
              {whyItems.map(({ icon: Icon, text }, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-4 transition-all duration-300 hover:border-[hsl(200,80%,45%,0.2)]">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)]">
                    <Icon className="h-4 w-4 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-light leading-relaxed text-[hsl(210,15%,55%)]">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[hsl(200,80%,45%,0.15)] bg-[hsl(200,80%,45%,0.04)] p-6 text-center">
            <h2 className="mb-2 text-lg font-medium text-white">{isAr ? "رؤيتنا" : "Our Vision"}</h2>
            <p className="text-sm font-light leading-relaxed text-[hsl(210,15%,50%)]">
              {isAr ? "نؤمن بأن الأرض ليست مجرد مساحة خام، بل فرصة لبناء قيمة مستدامة. من خلال سينا نسعى إلى تحويل الأفكار إلى شراكات حقيقية، وتحويل الأراضي إلى مشاريع منتجة تسهم في نمو المدن وتحفيز الاقتصاد العقاري بطريقة متوازنة واحترافية." : "We believe land is not just raw space — it's an opportunity to build sustainable value. Through SYNA, we aim to transform ideas into real partnerships and lands into productive projects that contribute to urban growth and stimulate the real estate economy in a balanced and professional manner."}
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
