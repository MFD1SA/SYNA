import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, ShieldCheck, Handshake, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { BrandVariant } from "./BrandToggle";
import logoImg from "@/assets/logo.png";

interface HeroSectionProps {
  variant?: BrandVariant;
}

const HeroSection: React.FC<HeroSectionProps> = ({ variant = "portfolio" }) => {
  const { lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const isAr = lang === "ar";

  const features = [
    { icon: Eye, label: isAr ? "خصوصية الملاك" : "Owner Privacy" },
    { icon: ShieldCheck, label: isAr ? "مطورون مؤهلون" : "Verified Developers" },
    { icon: Handshake, label: isAr ? "إدارة الصفقات" : "Deal Management" },
    { icon: Network, label: isAr ? "شراكات مؤسسية" : "Institutional Partnerships" },
  ];

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-background">
      {/* Subtle luxury background elements - No neon/glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,hsl(var(--muted)/0.4)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />

      {/* Main Content */}
      <div className="container relative z-10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 flex justify-center"
          >
            <div className="rounded-2xl border border-muted/50 bg-card/60 p-4 shadow-sm backdrop-blur-md">
              <img src={logoImg} alt="SYNA Enterprise" className="h-16 w-auto object-contain md:h-20" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mb-6 text-4xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            {isAr ? "منصة سينا العقارية" : "SYNA Real Estate"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="mb-8 text-lg font-light leading-relaxed text-muted-foreground md:text-2xl"
          >
            {isAr 
              ? "منصة مؤسسية راقية لربط ملاك الأراضي بالمطورين العقاريين المؤهلين ضمن بيئة من الخصوصية وإدارة الصفقات المحترفة." 
              : "An institutional platform connecting landowners with qualified developers in an environment of privacy and professional deal management."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
          >
            <Button size="lg" asChild className="group h-14 min-w-[200px] rounded-sm px-8 text-base shadow-md transition-all">
              <Link to="/auth/login">
                {isAr ? "تسجيل الدخول للنظام" : "Access Platform"}
                <Arrow className="h-4 w-4 ms-2 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-14 min-w-[200px] rounded-sm px-8 text-base bg-transparent border-foreground/20 text-foreground hover:bg-muted">
              <a href="#how-it-works">{isAr ? "اكتشف آلية العمل" : "Discover Process"}</a>
            </Button>
          </motion.div>
        </div>

        {/* Value Propositions / Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="mx-auto mt-24 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4 md:gap-8"
        >
          {features.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-4 rounded-xl border border-muted/40 bg-card/40 p-6 text-center shadow-sm backdrop-blur-md transition-all hover:bg-card/80 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-foreground md:text-base">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
