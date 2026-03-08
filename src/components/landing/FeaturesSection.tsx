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
    <section id="features" className="relative bg-[hsl(210,30%,4%)] py-14 md:py-18">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.15)] to-transparent" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h2 className="mb-3 text-2xl font-medium text-white md:text-3xl lg:text-4xl">
            {t.features.title}
          </h2>
          <p className="text-sm font-light text-[hsl(210,15%,50%)] md:text-base">
            {t.features.subtitle}
          </p>
        </motion.div>

        {/* Equal-height grid with flex stretch */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon, slug }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex"
            >
              <Link
                to={`/features/${slug}`}
                className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[hsl(210,22%,12%)] bg-gradient-to-b from-[hsl(210,28%,8%)] to-[hsl(210,28%,6%)] p-6 no-underline transition-all duration-500 hover:border-[hsl(200,80%,45%,0.3)] hover:shadow-[0_16px_40px_-12px_hsl(200,80%,50%,0.1)]"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,50%,0)] to-transparent transition-all duration-500 group-hover:via-[hsl(200,80%,50%,0.4)]" />

                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)] transition-all duration-400 group-hover:border-[hsl(200,80%,45%,0.25)] group-hover:bg-[hsl(200,80%,45%,0.1)]">
                  <Icon className="h-5 w-5 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
                </div>

                <h3 className="mb-2 text-base font-medium text-white">
                  {t.features[key]}
                </h3>

                {/* Fixed-height description area */}
                <p className="mb-auto text-sm font-light leading-relaxed text-[hsl(210,15%,50%)]">
                  {t.features[`${key}Desc`]}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-light text-[hsl(200,80%,55%)] opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span>{isAr ? "اكتشف المزيد" : "Learn more"}</span>
                  <Arrow className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
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
