import React from "react";

interface InnerHeroProps {
  title: string;
  subtitle: string;
  isAr: boolean;
  image?: string;
}

const InnerHero: React.FC<InnerHeroProps> = ({ title, subtitle, isAr, image }) => {
  return (
    <div className="relative py-20 lg:py-28 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Background */}
      {image ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-sina-charcoal/85 via-sina-charcoal/75 to-sina-charcoal/90" />
          <img src={image} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.5) saturate(0.7)" }} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-sina-charcoal" />
      )}

      <div className="container relative z-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        <p className="text-[15px] md:text-[16px] text-white/60 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default InnerHero;
