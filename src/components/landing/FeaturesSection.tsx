import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, Layers, Handshake, Video, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
    <section id="features" className="relative py-6 md:py-8">
      <div className="container relative">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="mb-2 text-3xl font-medium text-foreground md:text-4xl">
            {t.features.title}
          </h2>
          <p className="text-base font-light text-muted-foreground">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon, slug }) => (
            <Link
              key={key}
              to={`/features/${slug}`}
              className="group relative cursor-pointer overflow-hidden doma-card p-5 no-underline"
            >
              <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.04] transition-all duration-300 group-hover:scale-150 group-hover:bg-primary/[0.06]" />
              <div className="relative">
                <Icon className="mb-3 h-6 w-6 text-primary" strokeWidth={1.5} />
                <h3 className="mb-1.5 text-base font-medium text-foreground">
                  {t.features[key]}
                </h3>
                <p className="mb-2 text-sm font-light leading-relaxed text-muted-foreground">
                  {t.features[`${key}Desc`]}
                </p>
                <div className="flex items-center gap-1 text-xs font-light text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span>{isAr ? "اكتشف المزيد" : "Learn more"}</span>
                  <Arrow className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
