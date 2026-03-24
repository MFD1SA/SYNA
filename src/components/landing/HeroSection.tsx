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

import riyadhImg from "@/assets/city-riyadh.jpg";

const HeroSection: React.FC<HeroSectionProps> = ({ variant = "portfolio" }) => {
  const { lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const isAr = lang === "ar";

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-primary">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={riyadhImg} 
          alt="Riyadh Skyline" 
          className="h-full w-full object-cover opacity-40 mix-blend-luminosity grayscale" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/40 to-primary" />
        <div className="luxury-grid absolute inset-0 opacity-10" />
      </div>

      {/* Main Content */}
      <div className="container relative z-10 px-6 pt-32 pb-20">
        <div className="flex flex-col items-start max-w-5xl">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-12 flex items-center gap-6"
          >
            <div className="h-px w-12 bg-accent/60" />
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-accent">
              {isAr ? "سينا للاستثمارات العقارية" : "SYNA Real Estate Investments"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mb-10 text-5xl font-medium leading-[1.05] tracking-tight text-white md:text-[5.5rem] lg:text-[6.5rem] text-balance"
          >
            {isAr 
              ? "نصنع مستقبل الاستثمار العمراني" 
              : "Shaping the Future of Urban Investment"}
          </motion.h1>

          <div className="grid md:grid-cols-2 gap-12 items-end w-full">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="text-lg font-light leading-relaxed text-white/60 md:text-xl text-balance border-s border-accent/30 ps-8"
            >
              {isAr 
                ? "كيان استثماري رائد يجمع بين عمق الخبرة العقارية وحداثة التنفيذ، لنخلق فرصاً استثنائية في قلب العاصمة الرياض وعواصم النمو." 
                : "A premier investment entity merging profound real estate expertise with modern execution, creating exceptional opportunities in the heart of Riyadh and emerging growth hubs."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-6 justify-end"
            >
              <Link 
                to="/auth/login" 
                className="group flex h-16 items-center justify-center gap-4 bg-accent px-10 text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-white"
              >
                {isAr ? "ولوج بوابة المستثمرين" : "Investor Access"}
                <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
              <Link 
                to="/about" 
                className="group flex h-16 items-center justify-center gap-4 border border-white/20 px-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/5 hover:border-white"
              >
                {isAr ? "من نحن" : "Our Entity"}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Corporate Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-32 flex flex-wrap items-center gap-x-16 gap-y-8 opacity-40 border-t border-white/10 pt-12"
        >
          {[
            { label: isAr ? "حوكمة مؤسسية" : "Institutional Governance" },
            { label: isAr ? "شركاء استراتيجيين" : "Strategic Partners" },
            { label: isAr ? "فرص نوعية" : "Curated Opportunities" },
            { label: isAr ? "شفافية مطلقة" : "Absolute Transparency" }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
