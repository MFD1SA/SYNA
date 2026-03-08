import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, Layers, Handshake, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-[hsl(210,30%,4%)]">
      {/* Subtle background gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 start-0 h-full w-full bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(200,80%,25%,0.12),transparent_70%)]" />
        <div className="absolute bottom-0 end-0 h-full w-full bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,hsl(195,85%,30%,0.06),transparent_60%)]" />
      </div>

      {/* Minimal grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(hsl(200 80% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(200 80% 60%) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top light line */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.15)] to-transparent" />

      {/* Gradient fade bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(210,30%,4%)] to-transparent" />

      {/* Content */}
      <div className="container relative z-10 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-2 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 scale-[2] rounded-full bg-[hsl(200,80%,45%,0.08)] blur-[50px]" />
              <img src={logoImg} alt="SYNA" className="relative h-44 w-44 object-contain md:h-56 md:w-56" />
            </div>
          </motion.div>

          {/* Brand name */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-5 -mt-2 text-6xl font-semibold tracking-tight md:text-7xl lg:text-8xl"
            style={{
              background: "linear-gradient(180deg, hsl(0 0% 95%), hsl(200 60% 75%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SYNA
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mb-3 text-lg font-normal text-[hsl(200,60%,65%)] md:text-xl lg:text-2xl"
          >
            {isAr ? "نحو شراكات تطوير أكثر وضوحاً" : "Towards Clearer Development Partnerships"}
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mx-auto mb-12 max-w-xl text-sm font-light leading-relaxed text-[hsl(210,15%,50%)] md:text-base"
          >
            {t.hero.description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
          >
            <Button size="lg" asChild className="group h-13 gap-3 rounded-2xl px-12 text-base font-medium syna-gradient syna-shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_10px_40px_-10px_hsl(200,80%,50%,0.35)]">
              <Link to="/auth/login">
                {t.hero.cta}
                <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-13 rounded-2xl border-[hsl(210,22%,16%)] bg-[hsl(210,28%,7%,0.5)] px-12 text-base text-[hsl(210,15%,70%)] backdrop-blur-sm transition-all duration-300 hover:border-[hsl(200,80%,45%,0.25)] hover:bg-[hsl(210,22%,10%)] hover:text-white">
              <a href="#how-it-works">{t.hero.learnMore}</a>
            </Button>
          </motion.div>
        </div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          {pills.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.95 + i * 0.08 }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,6%,0.7)] px-4 py-5 backdrop-blur-sm transition-all duration-300 hover:border-[hsl(200,80%,45%,0.2)] hover:bg-[hsl(210,28%,8%)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)] transition-all duration-300 group-hover:border-[hsl(200,80%,45%,0.25)] group-hover:bg-[hsl(200,80%,45%,0.1)]">
                <Icon className="h-4.5 w-4.5 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
              </div>
              <span className="text-center text-xs font-light text-[hsl(210,15%,55%)] transition-colors duration-300 group-hover:text-[hsl(210,15%,75%)]">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
