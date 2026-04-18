import React from "react";
import { Link } from "react-router-dom";
import { useHeroImage } from "@/hooks/useHeroImage";
import { ChevronLeft, ChevronRight, LucideIcon, Sparkles } from "lucide-react";

interface InnerHeroProps {
  title: string;
  subtitle: string;
  isAr: boolean;
  image?: string;
  /** Page slug for dynamic hero image lookup (e.g. "about", "blog"). Falls back to `image` prop if no DB image. */
  pageSlug?: string;
  /** Optional decorative icon badge (top-left). Falls back to Sparkles. */
  icon?: LucideIcon;
  /** Optional short eyebrow label rendered above the title. */
  eyebrow?: string;
  /** Hide the default Home → Title breadcrumb. */
  hideBreadcrumb?: boolean;
}

const InnerHero: React.FC<InnerHeroProps> = ({
  title,
  subtitle,
  isAr,
  image,
  pageSlug,
  icon: Icon = Sparkles,
  eyebrow,
  hideBreadcrumb,
}) => {
  const { heroImage } = useHeroImage(pageSlug);

  // Resolved image: DB image takes priority, then static prop, then nothing
  const resolvedImage = heroImage?.desktop || image || undefined;
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <div
      className="relative pt-20 pb-14 sm:pt-24 sm:pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24 overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background */}
      {resolvedImage ? (
        <div className="absolute inset-0">
          {/* Image */}
          <picture>
            {heroImage?.mobile && (
              <source media="(max-width: 768px)" srcSet={heroImage.mobile} />
            )}
            <img
              src={resolvedImage}
              alt={isAr ? (heroImage?.alt_ar || "") : (heroImage?.alt_en || "")}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.85)" }}
            />
          </picture>
          {/* Gradient overlays — darker toward the text side */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#0F1F2E]/95 via-[#1E374B]/85 to-[#0F1F2E]/70" />
          <div
            className={`absolute inset-0 z-[2] ${
              isAr
                ? "bg-gradient-to-l from-transparent via-[#1E374B]/50 to-[#0F1F2E]/80"
                : "bg-gradient-to-r from-[#0F1F2E]/80 via-[#1E374B]/50 to-transparent"
            }`}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #1E374B 0%, #2B4C66 50%, #1E374B 100%)" }}
        />
      )}

      {/* Decorative dot pattern */}
      <div
        className="absolute inset-0 z-[3] opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        <div className="absolute -top-20 end-20 w-80 h-80 rounded-full bg-[#C2A86B]/15 blur-3xl" />
        <div className="absolute top-40 start-10 w-64 h-64 rounded-full bg-[#2B4C66]/25 blur-3xl" />
      </div>

      <div className="container relative z-[10]">
        {/* Breadcrumb */}
        {!hideBreadcrumb && (
          <nav className="mb-4 md:mb-6 flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[12px] font-medium text-white/55">
            <Link
              to="/"
              className="hover:text-white transition-colors"
            >
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <Chevron className="h-3 w-3 opacity-60" strokeWidth={2} />
            <span className="text-white/90 line-clamp-1">{title}</span>
          </nav>
        )}

        {/* Title */}
        <div className="max-w-3xl">
          <h1 className="relative text-[26px] sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-5 tracking-tight leading-[1.15]">
            {title}
          </h1>
          <p className="text-[14px] sm:text-[15px] md:text-[17px] text-white/70 max-w-2xl leading-relaxed mt-4 md:mt-5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom fade-to-white for smoother transition to next section */}
      <div className="absolute inset-x-0 bottom-0 z-[4] h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default InnerHero;
