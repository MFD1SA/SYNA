import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, Layers, Handshake, Video } from "lucide-react";
import { Link } from "react-router-dom";
import type { BrandVariant } from "./BrandToggle";
import logoImg from "@/assets/logo.png";

interface HeroSectionProps {
  variant?: BrandVariant;
}

const HeroSection: React.FC<HeroSectionProps> = ({ variant = "portfolio" }) => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const isAr = lang === "ar";

  const pills = [
    { icon: Eye, label: isAr ? "خصوصية كاملة" : "Full Privacy" },
    { icon: Layers, label: isAr ? "وصول منظم" : "Structured Access" },
    { icon: Handshake, label: isAr ? "متابعة الصفقات" : "Deal Tracking" },
    { icon: Video, label: isAr ? "اجتماعات مدمجة" : "Integrated Meetings" },
  ];

  // Dark cinematic hero
  return (
    <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-[hsl(210,30%,7%)] transition-colors duration-500">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 end-[-10%] h-[500px] w-[500px] rounded-full bg-[hsl(200,80%,35%,0.08)] blur-[120px]" />
        <div className="absolute -bottom-32 start-[-8%] h-[400px] w-[400px] rounded-full bg-[hsl(195,85%,50%,0.06)] blur-[100px]" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[hsl(200,80%,35%,0.04)] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(200 80% 55%) 0.5px, transparent 0.5px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[hsl(210,30%,7%)] to-transparent" />
      </div>

      <div className="container relative z-10 py-12 md:py-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 flex justify-center">
            <img src={logoImg} alt="SYNA" className="h-28 w-28 object-contain drop-shadow-2xl" />
          </div>

          <h1 className="mb-5 text-6xl font-medium tracking-tight text-white md:text-7xl lg:text-8xl">
            SYNA
          </h1>

          <p className="mb-4 text-xl font-medium text-[hsl(200,80%,55%)] md:text-2xl">
            {isAr ? "نحو شراكات تطوير أكثر وضوحاً" : "Towards Clearer Development Partnerships"}
          </p>

          <p className="mx-auto mb-12 max-w-2xl text-base font-light leading-relaxed text-[hsl(210,15%,60%)]">
            {t.hero.description}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild className="h-13 gap-2.5 rounded-xl px-12 text-base syna-gradient syna-shadow-lg">
              <Link to="/auth/login">
                {t.hero.cta}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-13 rounded-xl border-[hsl(210,22%,20%)] bg-transparent px-12 text-base text-[hsl(210,15%,75%)] hover:bg-[hsl(210,22%,12%)] hover:text-white">
              <a href="#how-it-works">{t.hero.learnMore}</a>
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {pills.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-[hsl(210,22%,16%)] bg-[hsl(210,28%,10%,0.8)] px-4 py-2 backdrop-blur-sm transition-all duration-200 hover:border-[hsl(200,80%,45%,0.3)] hover:bg-[hsl(210,28%,13%)]">
              <Icon className="h-3.5 w-3.5 text-[hsl(200,80%,50%)]" strokeWidth={1.5} />
              <span className="text-xs font-light text-[hsl(210,15%,75%)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
