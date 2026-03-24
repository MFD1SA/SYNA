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
  usePageTitle(isAr ? "سينا للاستثمارات العقارية | عن الشركة" : "SYNA Real Estate Investments | About");

  const values = [
    { 
      labelAr: "الحوكمة المؤسسية", 
      labelEn: "Institutional Governance", 
      descAr: "نلتزم بأعلى معايير الحوكمة لضمان شفافية الصفقات وحماية مصالح كافة الأطراف في كل مرحلة استثمارية.", 
      descEn: "We commit to the highest governance standards to ensure deal transparency and protect stakeholders’ interests at every investment stage."
    },
    { 
      labelAr: "التميز العمراني", 
      labelEn: "Urban Excellence", 
      descAr: "نؤمن بتحويل الأصول العقارية إلى مشاريع نوعية تساهم في الارتقاء بالمشهد الحضري وتعظيم القيمة الاقتصادية.", 
      descEn: "We believe in transforming real estate assets into quality projects that contribute to the urban scene and maximize economic value."
    },
    { 
      labelAr: "الاتصال الاستراتيجي", 
      labelEn: "Strategic Connectivity", 
      descAr: "نبني جسور الثقة بين كبار ملاك الأراضي والمطورين الأكثر تأهيلاً لخلق شراكات تخدم رؤية المملكة.", 
      descEn: "We build bridges of trust between major landowners and the most qualified developers to create partnerships that serve the Kingdom's vision."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative pt-40 pb-24 overflow-hidden bg-primary">
         <img src={headerAboutImg} alt="SYNA" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
         <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
         <div className="container relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-accent mb-6">
                {isAr ? "عن الكيان الاستثماري" : "Institutional Profile"}
              </span>
              <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-8 border-s-4 border-accent ps-8">
                {isAr ? "سينا للاستثمارات العقارية" : "SYNA Real Estate Investments"}
              </h1>
              <p className="max-w-2xl text-xl font-light text-white/60 leading-relaxed text-balance">
                {isAr 
                  ? "نعمل كمحرك استراتيجي لرفع جودة الاستثمار العقاري من خلال ربط الفرص النوعية بالكفاءات التطويرية." 
                  : "We act as a strategic driver to elevate real estate investment quality by connecting curated opportunities with development expertise."}
              </p>
            </motion.div>
         </div>
      </div>
      
      <main className="py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-medium tracking-tight text-primary mb-10 flex items-center gap-4">
                <div className="h-px w-8 bg-accent" />
                {isAr ? "فلسفتنا الاستثمارية" : "Our Investment Philosophy"}
              </h2>
              <div className="space-y-8 text-lg font-light leading-relaxed text-muted-foreground/80">
                <p>
                  {isAr 
                    ? "في ظل التحول التاريخي الذي تشهده المملكة العربية السعودية، نؤمن في سينا بأن الاستثمار العقاري هو الركيزة الأساسية للتطور العمراني المستدام. نحن لا نسعى لمجرد ربط الأطراف، بل نعمل كشريك استراتيجي يرفع من جودة الفرصة الاستثمارية قبل طرحها." 
                    : "Amid the historic transformation in Saudi Arabia, we at SYNA believe real estate investment is the core pillar of sustainable urban development. We don't just connect parties; we act as a strategic partner enhancing investment opportunities before they are presented."}
                </p>
                <p>
                  {isAr 
                    ? "من خلال نموذج عملنا القائم على الحوكمة والخصوصية، نمنح ملاك الأراضي والمطورين بيئة محترفة تتجاوز الأساليب التقليدية، لضمان تحويل الأراضي البيضاء إلى مشاريع وطنية منتجة." 
                    : "Through our business model based on governance and privacy, we provide landowners and developers with a professional environment that transcends traditional methods, ensuring the transformation of white lands into productive national projects."}
                </p>
              </div>
            </motion.div>
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/5 -z-10 skew-y-3" />
              <img src={headerAboutImg} alt="About SYNA" className="w-full grayscale border border-border/40" />
            </div>
          </div>

          <div className="mt-40 grid md:grid-cols-3 gap-px bg-border/40 border border-border/40">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-background p-12 hover:bg-muted/30 transition-colors">
                <span className="block text-[10px] font-bold text-accent uppercase tracking-widest mb-6">0{i+1}</span>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6">{isAr ? v.labelAr : v.labelEn}</h3>
                <p className="text-sm font-light leading-relaxed text-muted-foreground">{isAr ? v.descAr : v.descEn}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-40 bg-primary p-20 text-center relative overflow-hidden">
            <div className="luxury-grid absolute inset-0 opacity-10" />
            <h2 className="text-3xl font-medium text-white mb-8 relative z-10 tracking-[0.2em] uppercase">{isAr ? "رؤية الريادة" : "A Vision of Leadership"}</h2>
            <p className="max-w-3xl mx-auto text-lg font-light leading-relaxed text-white/50 relative z-10 text-balance">
              {isAr 
                ? "نسعى لأن نكون المرجع الأول للاستثمارات العقارية النوعية في المملكة، مساهمين في بناء مستقبل يتسم بالكفاءة والجمال والنمو الاقتصادي المستدام." 
                : "We strive to be the premier reference for quality real estate investments in the Kingdom, contributing to a future characterized by efficiency, beauty, and sustainable economic growth."}
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
