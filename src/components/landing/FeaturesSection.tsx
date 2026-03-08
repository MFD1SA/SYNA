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
    <section id="features" className="relative bg-[hsl(210,30%,4%)] py-20 md:py-28">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-[hsl(200,80%,40%,0.04)] blur-[120px]" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="mb-3 text-3xl font-medium text-white md:text-4xl lg:text-5xl">
            {t.features.title}
          </h2>
          <p className="text-base font-light text-[hsl(210,15%,55%)] md:text-lg">
            {t.features.subtitle}
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon, slug }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={`/features/${slug}`}
                className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6 no-underline transition-all duration-400 hover:border-[hsl(200,80%,45%,0.25)] hover:bg-[hsl(210,28%,9%)] hover:shadow-[0_8px_40px_-10px_hsl(200,80%,50%,0.12)]"
              >
                <div className="pointer-events-none absolute -end-10 -top-10 h-28 w-28 rounded-full bg-[hsl(200,80%,50%,0.04)] transition-all duration-500 group-hover:scale-[2] group-hover:bg-[hsl(200,80%,50%,0.06)]" />
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.15)] bg-[hsl(200,80%,45%,0.08)] p-2.5">
                    <Icon className="h-5 w-5 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-base font-medium text-white">
                    {t.features[key]}
                  </h3>
                  <p className="mb-3 text-sm font-light leading-relaxed text-[hsl(210,15%,55%)]">
                    {t.features[`${key}Desc`]}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-light text-[hsl(200,80%,55%)] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    <span>{isAr ? "اكتشف المزيد" : "Learn more"}</span>
                    <Arrow className="h-3 w-3" />
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
