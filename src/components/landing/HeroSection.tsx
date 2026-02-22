import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Building2, Map, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      {/* Decorative bg elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 end-[-10%] h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -bottom-32 start-[-5%] h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.02] blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs font-light text-primary">
              {lang === "ar" ? "إدارة عقارية ذكية" : "Smart Real Estate Management"}
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
            <span className="doma-gradient-text">{t.hero.title}</span>
          </h1>
          <p className="mb-4 text-lg font-light text-primary/80 md:text-xl">
            {t.hero.subtitle}
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
            {t.hero.description}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild className="gap-2 rounded-xl px-8 doma-gradient doma-shadow">
              <Link to="/register">
                {t.hero.cta}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="rounded-xl border-border/60 px-8">
              <a href="#features">{t.hero.learnMore}</a>
            </Button>
          </div>
        </div>

        {/* Floating feature pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Map, label: lang === "ar" ? "خريطة تفاعلية" : "Interactive Map" },
            { icon: FileText, label: lang === "ar" ? "إدارة العقود" : "Contract Management" },
            { icon: Building2, label: lang === "ar" ? "إدارة المشاريع" : "Project Management" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 doma-shadow">
              <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-light text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
