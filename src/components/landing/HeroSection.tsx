import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-primary/[0.03] py-24 md:py-36">
      {/* Decorative bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 end-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 start-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative text-center">
        <h1 className="mb-4 text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {t.hero.title}
        </h1>
        <p className="mb-3 text-lg font-light text-primary md:text-xl">
          {t.hero.subtitle}
        </p>
        <p className="mx-auto mb-10 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
          {t.hero.description}
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button size="lg" asChild className="gap-2 rounded-lg px-8">
            <Link to="/register">
              {t.hero.cta}
              <Arrow className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="rounded-lg px-8">
            <a href="#features">{t.hero.learnMore}</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
