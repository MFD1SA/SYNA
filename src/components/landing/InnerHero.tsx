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
  /** Show image as a full illustration (no brightness filter, no heavy gradient wash). */
  illustrated?: boolean;
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
  illustrated,
}) => {
  // For illustrated heroes we always honor the static SVG prop and skip the DB
  // lookup so the curated illustration is never overridden by legacy DB entries.
  const { heroImage } = useHeroImage(illustrated ? undefined : pageSlug);

  // Resolved image: for illustrations the prop wins; otherwise DB takes priority.
  const resolvedImage = illustrated ? (image || heroImage?.desktop) : (heroImage?.desktop || image || undefined);
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <div
      data-nav-theme="dark"
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
              style={illustrated ? undefined : { filter: "brightness(0.55) saturate(0.85)" }}
            />
          </picture>
          {/* Gradient overlays — darker toward the text side (skipped for illustrations) */}
          {!illustrated && (
            <>
              <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#020202]/95 via-[#020202]/85 to-[#020202]/70" />
              <div
                className={`absolute inset-0 z-[2] ${
                  isAr
                    ? "bg-gradient-to-l from-transparent via-[#020202]/50 to-[#020202]/80"
                    : "bg-gradient-to-r from-[#020202]/80 via-[#020202]/50 to-transparent"
                }`}
              />
            </>
          )}
          {/* Light side-anchored scrim for illustrations — keeps text legible without darkening the art */}
          {illustrated && (
            <div
              className={`absolute inset-0 z-[2] ${
                isAr
                  ? "bg-gradient-to-l from-[#020202]/80 via-[#020202]/40 to-transparent"
                  : "bg-gradient-to-r from-[#020202]/80 via-[#020202]/40 to-transparent"
              }`}
            />
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #020202 0%, #2B2B2B 50%, #020202 100%)" }}
        />
      )}

      {/* Decorative architectural grid — subtle blueprint mesh */}
      <div
        className="absolute inset-0 z-[3] opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Fine dot mesh on top of grid for depth */}
      <div
        className="absolute inset-0 z-[3] opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #DFD8D2 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* DOMA palette glow — Orange + Beige tints + darker depth blob */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        <div className="absolute -top-24 end-16 w-[420px] h-[420px] rounded-full bg-[#C45A41]/20 blur-[110px]" />
        <div className="absolute top-32 start-8 w-72 h-72 rounded-full bg-[#DFD8D2]/12 blur-3xl" />
        <div className="absolute -bottom-24 start-1/3 w-[520px] h-[260px] rounded-full bg-[#6899B4]/10 blur-3xl" />
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
          <h1 className={`relative text-[26px] sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-5 tracking-tight leading-[1.15] ${isAr ? "" : "font-display"}`}>
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
