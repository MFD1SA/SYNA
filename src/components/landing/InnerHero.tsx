import React from "react";
import { useHeroImage } from "@/hooks/useHeroImage";

interface InnerHeroProps {
  title: string;
  subtitle: string;
  isAr: boolean;
  image?: string;
  /** Page slug for dynamic hero image lookup (e.g. "about", "blog"). Falls back to `image` prop if no DB image. */
  pageSlug?: string;
}

const InnerHero: React.FC<InnerHeroProps> = ({ title, subtitle, isAr, image, pageSlug }) => {
  const { heroImage } = useHeroImage(pageSlug);

  // Resolved image: DB image takes priority, then static prop, then nothing
  const resolvedImage = heroImage?.desktop || image || undefined;

  return (
    <div className="relative py-16 lg:py-20 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Background */}
      {resolvedImage ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#0F1F2E]/92 via-[#1E374B]/82 to-[#0F1F2E]/88" />
          <picture>
            {heroImage?.mobile && (
              <source media="(max-width: 768px)" srcSet={heroImage.mobile} />
            )}
            <img src={resolvedImage} alt={isAr ? (heroImage?.alt_ar || "") : (heroImage?.alt_en || "")} className="w-full h-full object-cover" style={{ filter: "brightness(0.45) saturate(0.75)" }} />
          </picture>
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1E374B 0%, #2B4C66 50%, #1E374B 100%)" }} />
      )}

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 z-10 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <div className="container relative z-20">

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-[15px] md:text-[16px] text-white/65 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default InnerHero;
