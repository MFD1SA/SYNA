import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, Layers, Handshake, Video, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type FeatureKey = "privacy" | "verification" | "dealCrm" | "meetings";

const features: { key: FeatureKey; icon: typeof Eye; slug: string }[] = [
  { key: "privacy", icon: Eye, slug: "privacy" },
  { key: "verification", icon: Layers, slug: "structured-access" },
  { key: "dealCrm", icon: Handshake, slug: "deal-tracking" },
  { key: "meetings", icon: Video, slug: "meetings" },
];

const FeaturesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section id="features" className="relative bg-[hsl(210,30%,4%)] py-24 md:py-32">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.15)] to-transparent" />
        <div className="absolute top-20 start-[10%] h-[400px] w-[400px] rounded-full bg-[hsl(200,80%,40%,0.03)] blur-[120px]" />
        <div className="absolute bottom-20 end-[10%] h-[300px] w-[300px] rounded-full bg-[hsl(195,85%,50%,0.03)] blur-[100px]" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-[hsl(200,80%,45%,0.2)] bg-[hsl(200,80%,45%,0.06)] px-4 py-1.5 text-xs font-light text-[hsl(200,80%,60%)]">
            {isAr ? "أدوات ذكية" : "Smart Tools"}
          </span>
          <h2 className="mb-4 text-3xl font-medium text-white md:text-4xl lg:text-5xl">
            {t.features.title}
          </h2>
          <p className="text-base font-light text-[hsl(210,15%,50%)] md:text-lg">
            {t.features.subtitle}
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon, slug }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <Link
                to={`/features/${slug}`}
                className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-[hsl(210,22%,12%)] bg-gradient-to-b from-[hsl(210,28%,8%)] to-[hsl(210,28%,6%)] p-7 no-underline transition-all duration-500 hover:border-[hsl(200,80%,45%,0.3)] hover:shadow-[0_20px_60px_-15px_hsl(200,80%,50%,0.12)]"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -top-20 start-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-[hsl(200,80%,50%,0.08)] blur-[60px]" />
                </div>

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,50%,0)] to-transparent transition-all duration-500 group-hover:via-[hsl(200,80%,50%,0.4)]" />

                <div className="relative">
                  <div className="mb-5 inline-flex items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)] p-3 transition-all duration-400 group-hover:border-[hsl(200,80%,45%,0.25)] group-hover:bg-[hsl(200,80%,45%,0.1)] group-hover:shadow-[0_0_20px_-5px_hsl(200,80%,50%,0.2)]">
                    <Icon className="h-6 w-6 text-[hsl(200,80%,55%)] transition-colors duration-300 group-hover:text-[hsl(195,85%,65%)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2.5 text-lg font-medium text-white">
                    {t.features[key]}
                  </h3>
                  <p className="mb-4 text-sm font-light leading-relaxed text-[hsl(210,15%,50%)]">
                    {t.features[`${key}Desc`]}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-light text-[hsl(200,80%,55%)] opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <span>{isAr ? "اكتشف المزيد" : "Learn more"}</span>
                    <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
