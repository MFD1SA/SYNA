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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(210,30%,4%)]">
      {/* Animated orbital rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute h-[700px] w-[700px] rounded-full border border-[hsl(200,80%,40%,0.06)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute h-[900px] w-[900px] rounded-full border border-[hsl(195,85%,50%,0.04)]"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute h-[1100px] w-[1100px] rounded-full border border-dashed border-[hsl(200,80%,40%,0.03)]"
        />
      </div>

      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 start-1/4 h-[500px] w-[500px] rounded-full bg-[hsl(200,80%,45%)] blur-[160px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 end-1/4 h-[400px] w-[400px] rounded-full bg-[hsl(195,85%,55%)] blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[hsl(210,60%,30%)] blur-[180px]"
        />
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(200 80% 60%) 0.5px, transparent 0.5px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Gradient fade bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[hsl(210,30%,4%)] via-[hsl(210,30%,4%,0.8)] to-transparent" />

      {/* Content */}
      <div className="container relative z-10 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Logo — large with glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-[hsl(200,80%,45%,0.15)] blur-[60px]" />
              <img src={logoImg} alt="SYNA" className="relative h-40 w-40 object-contain drop-shadow-[0_0_40px_hsl(200,80%,50%,0.4)] md:h-52 md:w-52" />
            </div>
          </motion.div>

          {/* Brand name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-4 text-7xl font-medium tracking-tight md:text-8xl lg:text-9xl"
            style={{
              background: "linear-gradient(135deg, hsl(0 0% 100%), hsl(200 80% 70%), hsl(195 85% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SYNA
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-4 text-xl font-medium text-[hsl(200,80%,60%)] md:text-2xl lg:text-3xl"
          >
            {isAr ? "نحو شراكات تطوير أكثر وضوحاً" : "Towards Clearer Development Partnerships"}
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mx-auto mb-14 max-w-2xl text-base font-light leading-relaxed text-[hsl(210,15%,55%)] md:text-lg"
          >
            {t.hero.description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
          >
            <Button size="lg" asChild className="group h-14 gap-3 rounded-2xl px-14 text-base font-medium syna-gradient syna-shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_50px_-10px_hsl(200,80%,50%,0.4)]">
              <Link to="/auth/login">
                {t.hero.cta}
                <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-14 rounded-2xl border-[hsl(210,22%,18%)] bg-[hsl(210,28%,8%,0.6)] px-14 text-base text-[hsl(210,15%,75%)] backdrop-blur-sm transition-all duration-300 hover:border-[hsl(200,80%,45%,0.3)] hover:bg-[hsl(210,22%,12%)] hover:text-white hover:scale-[1.02]">
              <a href="#how-it-works">{t.hero.learnMore}</a>
            </Button>
          </motion.div>
        </div>

        {/* Feature cards grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          {pills.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.1 + i * 0.12 }}
              className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-[hsl(210,22%,13%)] bg-[hsl(210,28%,7%,0.8)] px-4 py-6 backdrop-blur-md transition-all duration-400 hover:border-[hsl(200,80%,45%,0.3)] hover:bg-[hsl(210,28%,9%)] hover:shadow-[0_8px_30px_-8px_hsl(200,80%,50%,0.15)] hover:-translate-y-1"
            >
              {/* Corner glow */}
              <div className="pointer-events-none absolute -top-6 -end-6 h-16 w-16 rounded-full bg-[hsl(200,80%,50%,0.06)] transition-all duration-500 group-hover:scale-[3] group-hover:bg-[hsl(200,80%,50%,0.08)]" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.15)] bg-[hsl(200,80%,45%,0.08)] transition-all duration-300 group-hover:border-[hsl(200,80%,45%,0.3)] group-hover:bg-[hsl(200,80%,45%,0.12)] group-hover:shadow-[0_0_16px_-4px_hsl(200,80%,50%,0.25)]">
                <Icon className="h-5 w-5 text-[hsl(200,80%,55%)] transition-colors duration-300 group-hover:text-[hsl(195,85%,65%)]" strokeWidth={1.5} />
              </div>
              <span className="relative text-center text-sm font-light text-[hsl(210,15%,65%)] transition-colors duration-300 group-hover:text-white">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-[hsl(200,80%,50%,0.3)] to-transparent" />
            <div className="h-2 w-2 rounded-full bg-[hsl(200,80%,50%,0.3)]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
