import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, ShieldCheck, Handshake, Network, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const serviceItems: { titleAr: string; titleEn: string; icon: typeof Eye; descAr: string; descEn: string }[] = [
  { 
    titleAr: "تنسيق الفرص الاستثمارية", 
    titleEn: "Investment Coordination", 
    icon: Network, 
    descAr: "نعمل بجدية مؤسسية على تحليل وتنسيق الفرص العقارية النوعية لضمان أعلى مستويات التوافق بين الأطراف.",
    descEn: "We work with institutional rigor to analyze and coordinate high-quality real estate opportunities, ensuring maximum alignment between stakeholders."
  },
  { 
    titleAr: "حوكمة الشراكة", 
    titleEn: "Asset Governance", 
    icon: ShieldCheck, 
    descAr: "تطبيق معايير حوكمة صارمة تضمن حقوق كافة الأطراف وتعزز من جودة القرار الاستثماري.",
    descEn: "Implementing rigorous governance standards that protect all parties' rights and enhance the quality of investment decisions."
  },
  { 
    titleAr: "إدارة الاتصال الاستراتيجي", 
    titleEn: "Strategic Connectivity", 
    icon: Handshake, 
    descAr: "ربط ملاك الأراضي بالمطورين العقاريين المؤهلين في بيئة آمنة وموثوقة.",
    descEn: "Connecting landowners with qualified developers in a secure and reliable environment."
  },
  { 
    titleAr: "تحسين قيمة الأصول", 
    titleEn: "Asset Value Elevation", 
    icon: Eye, 
    descAr: "رفع جودة الفرصة العقارية من خلال مراجعة دقيقة وتطوير مسار واضح نحو التنفيذ الناجح.",
    descEn: "Elevating real estate opportunities through meticulous review and developing a clear path toward successful execution."
  },
];

const FeaturesSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section id="services" className="relative bg-background py-16 lg:py-20 px-4 md:px-0 overflow-hidden">
      {/* Background Element */}
      <div className="absolute top-0 end-0 w-1/2 h-full bg-secondary/30 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-24 flex flex-col md:flex-row md:items-end md:justify-between gap-8"
        >
          <div className="max-w-2xl border-s-2 border-accent ps-8">
            <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              {isAr ? "الخدمات المؤسسية" : "Institutional Services"}
            </span>
            <h2 className="text-4xl font-medium tracking-tight text-primary md:text-5xl uppercase leading-tight">
              {isAr ? "حلول استثمارية متكاملة لرفع جودة التحول العمراني" : "Integrated Solutions for Urban Excellence"}
            </h2>
          </div>
          <p className="max-w-md text-sm font-light leading-relaxed text-muted-foreground/80">
            {isAr 
              ? "نقدم نهجاً مؤسسياً فريداً يتجاوز الوساطة التقليدية، ليركز على خلق القيمة والاستدامة في كافة مراحل الصفقة العقارية." 
              : "We provide a unique institutional approach that goes beyond traditional brokerage, focusing on value creation and sustainability throughout every stage of the real estate deal."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-px bg-border/40 border border-border/40 md:grid-cols-2 lg:grid-cols-4">
          {serviceItems.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="group relative flex flex-col bg-background p-10 transition-colors hover:bg-primary"
            >
              <div className="mb-10 inline-flex h-12 w-12 items-center justify-center border border-border bg-muted/30 text-primary transition-all duration-500 group-hover:border-accent/30 group-hover:bg-accent group-hover:text-primary">
                <feature.icon className="h-5 w-5" strokeWidth={1} />
              </div>

              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors group-hover:text-accent">
                {isAr ? feature.titleAr : feature.titleEn}
              </h3>

              <p className="text-sm font-light leading-relaxed text-muted-foreground group-hover:text-white/60 transition-colors">
                {isAr ? feature.descAr : feature.descEn}
              </p>

              <div className="absolute bottom-8 end-8 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-10 pointer-events-none">
                <feature.icon className="h-full w-full stroke-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
