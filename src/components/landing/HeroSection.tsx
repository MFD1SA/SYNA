import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Map, FileText, Building2, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const isAr = lang === "ar";

  const stats = [
    { value: isAr ? "+٥٠٠" : "500+", label: isAr ? "مشروع عقاري" : "Real Estate Projects" },
    { value: isAr ? "+١٠٠٠" : "1000+", label: isAr ? "وحدة مُدارة" : "Managed Units" },
    { value: "٩٩٪", label: isAr ? "وقت التشغيل" : "Uptime" },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-36 lg:py-44">
      {/* Layered decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 end-[-15%] h-[600px] w-[600px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute -bottom-40 start-[-10%] h-[500px] w-[500px] rounded-full bg-accent/[0.06] blur-[100px]" />
        <div className="absolute top-1/3 start-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-primary/[0.015] blur-[120px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Top badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.04] px-5 py-2">
            <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            <span className="text-xs font-light tracking-wide text-primary">
              {isAr ? "إدارة عقارية ذكية — الجيل القادم" : "Smart Real Estate Management — Next Gen"}
            </span>
          </div>

          {/* Main heading with gradient */}
          <h1 className="mb-6 text-5xl font-medium tracking-tight text-foreground md:text-6xl lg:text-7xl">
            <span className="doma-gradient-text">{t.hero.title}</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-5 text-lg font-light text-primary/80 md:text-xl lg:text-2xl">
            {t.hero.subtitle}
          </p>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">
            {t.hero.description}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild className="h-12 gap-2.5 rounded-xl px-10 text-base doma-gradient doma-shadow-lg">
              <Link to="/register">
                {t.hero.cta}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 rounded-xl border-border/50 px-10 text-base hover:bg-surface">
              <a href="#features">{t.hero.learnMore}</a>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto mt-20 max-w-2xl">
          <div className="grid grid-cols-3 divide-x divide-border/50 rtl:divide-x-reverse">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 text-center">
                <p className="text-2xl font-medium text-foreground md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs font-light text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating feature pills */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Map, label: isAr ? "خريطة تفاعلية" : "Interactive Map" },
            { icon: FileText, label: isAr ? "إدارة العقود" : "Contract Management" },
            { icon: Building2, label: isAr ? "إدارة المشاريع" : "Project Management" },
            { icon: BarChart3, label: isAr ? "تحليلات فورية" : "Real-time Analytics" },
            { icon: Shield, label: isAr ? "أمان متقدم" : "Advanced Security" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-border/40 bg-card/80 px-4 py-2 backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:doma-shadow">
              <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              <span className="text-xs font-light text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
