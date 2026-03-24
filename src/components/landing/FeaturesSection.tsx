import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, ShieldCheck, Handshake, Network, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type FeatureKey = "privacy" | "verification" | "dealCrm" | "meetings";

const features: { key: FeatureKey; icon: typeof Eye; slug: string }[] = [
  { key: "privacy", icon: Eye, slug: "privacy" },
  { key: "verification", icon: ShieldCheck, slug: "structured-access" },
  { key: "dealCrm", icon: Handshake, slug: "deal-tracking" },
  { key: "meetings", icon: Network, slug: "meetings" },
];

const FeaturesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section id="features" className="relative bg-background py-20 px-4 md:px-0">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-muted/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? "المميزات المؤسسية" : "Institutional Features"}
          </span>
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {t.features.title}
          </h2>
          <p className="text-lg font-light leading-relaxed text-muted-foreground">
            {t.features.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                className="group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-border hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>

                <h3 className="mb-3 text-lg font-medium text-foreground">
                  {t.features[key]}
                </h3>

                <p className="mb-8 text-sm font-light leading-relaxed text-muted-foreground">
                  {t.features[`${key}Desc`]}
                </p>

                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
                  <span>{isAr ? "اقرأ المزيد" : "Read More"}</span>
                  <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
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
