import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import cityRiyadhImg from "@/assets/city-riyadh.jpg";

interface HeroSectionProps {
  variant?: "portfolio" | "default";
}

const HeroSection: React.FC<HeroSectionProps> = ({ variant = "portfolio" }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();

  return (
    <section className="relative h-screen min-h-[800px] w-full overflow-hidden bg-primary pt-0 pb-0">
      {/* Cinematic Riyadh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={cityRiyadhImg} 
          alt="Riyadh Architectural Excellence" 
          className="h-full w-full object-cover grayscale-[0.3] brightness-[0.8]" 
        />
      </div>

      <div className="container relative z-20 flex h-full items-center">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="mb-8 block text-[10px] font-bold uppercase tracking-[0.6em] text-accent/80">
              {isAr ? "سينا للاستثمارات العقارية" : "SYNA Real Estate Investments"}
            </span>
            <h1 className="cinematic-header text-white mb-10 leading-[0.9]">
              {isAr ? "سيـــادة العمــران" : "Architectural Sovereignty"}
            </h1>
            <p className="executive-sub text-white/50 mb-14">
              {isAr 
                ? "نصيغ مستقبل العاصمة عبر تمكين شراكات استثمارية استثنائية." 
                : "Shaping the Capital's legacy through elite institutional investment partnerships."}
            </p>
            <div className="flex flex-wrap gap-8">
              <button 
                onClick={() => navigate("/auth?role=owner")}
                className="luxury-button bg-accent border-accent text-primary hover:bg-transparent hover:text-accent h-[60px] px-12"
              >
                {isAr ? "عرض الفرص" : "View Opportunities"}
              </button>
              <button 
                onClick={() => navigate("/contact")}
                className="luxury-button border-white/30 text-white hover:border-white hover:bg-white/5 h-[60px] px-12"
              >
                {isAr ? "تواصل مؤسسي" : "Executive Inquiry"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modern Scroll Indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
        <div className="w-[1px] h-24 bg-gradient-to-b from-accent to-transparent opacity-30" />
      </div>
    </section>
  );
};

export default HeroSection;
