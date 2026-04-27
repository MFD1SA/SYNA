import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * PageHeader — shared, panel-aware page hero used by Admin / Owner / CRM.
 *
 * Visual contract:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  ╔═══╗   ADMIN · OVERVIEW                                   │
 *   │  ║▣◆ ║   Operational dashboard               [actions]      │
 *   │  ╚═══╝   First line of description, kept calm and short.   │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * - The icon block is a 48px gradient tile with a thin gold/blue ring
 *   matched to the `variant` prop (admin = blue+gold, owner = gold,
 *   developer = blue). All colors come from design-tokens, not hex.
 * - Eyebrow text is bilingual; we pass strings already lowercased and
 *   uppercase via tracking; eyebrow is OPTIONAL.
 * - Description respects RTL via `useLanguage`.
 * - Actions render right (LTR) / left (RTL) of the title via flex-end.
 * - Children slot below the description is for inline pills / chips.
 *
 * Why a shared component: 6 pages had hand-rolled headers with
 * inconsistent typography scales. Centralising means every page upgrade
 * is applied once.
 */

export type PageHeaderVariant = "admin" | "owner" | "developer";

export interface PageHeaderProps {
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  /** Small kicker above the title (e.g. "ADMIN · OVERVIEW"). */
  eyebrowAr?: string;
  eyebrowEn?: string;
  variant?: PageHeaderVariant;
  /** Right-aligned action slot — buttons / search / filters. */
  actions?: React.ReactNode;
  /** Optional inline chip row below description (counts, status pills). */
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<PageHeaderVariant, {
  iconBg: string;
  iconRing: string;
  iconColor: string;
  eyebrow: string;
  accent: string;
}> = {
  admin: {
    iconBg: "bg-gradient-to-br from-[#2B2B2B] to-[#020202]",
    iconRing: "ring-1 ring-[#C45A41]/40",
    iconColor: "text-[#C45A41]",
    eyebrow: "text-[#C45A41]",
    accent: "from-[#C45A41]/0 via-[#C45A41]/40 to-[#C45A41]/0",
  },
  owner: {
    iconBg: "bg-gradient-to-br from-[#C45A41] to-[#A24832]",
    iconRing: "ring-1 ring-white/40 dark:ring-white/10",
    iconColor: "text-white",
    eyebrow: "text-[#A24832]",
    accent: "from-[#C45A41]/0 via-[#C45A41]/50 to-[#C45A41]/0",
  },
  developer: {
    iconBg: "bg-gradient-to-br from-[#2B2B2B] to-[#020202]",
    iconRing: "ring-1 ring-white/30 dark:ring-white/10",
    iconColor: "text-white",
    eyebrow: "text-[#2B2B2B] dark:text-[#9FB7CC]",
    accent: "from-[#2B2B2B]/0 via-[#2B2B2B]/40 to-[#2B2B2B]/0",
  },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  titleAr,
  titleEn,
  descAr,
  descEn,
  eyebrowAr,
  eyebrowEn,
  variant = "admin",
  actions,
  children,
  className,
}) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const v = variantStyles[variant];
  const eyebrow = isAr ? eyebrowAr : eyebrowEn;

  return (
    <header
      className={cn(
        "relative mb-7 pb-5",
        // Hairline accent under the header that fades out — gives the
        // hero a quiet "framed" feel without a heavy border.
        "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r",
        `after:${v.accent}`,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Iconic accent block */}
          <div
            className={cn(
              "shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_-12px_rgba(15,31,46,0.45)]",
              v.iconBg,
              v.iconRing,
            )}
          >
            <Icon className={cn("h-[22px] w-[22px]", v.iconColor)} strokeWidth={1.6} />
          </div>

          {/* Title block */}
          <div className="min-w-0 flex-1 pt-0.5">
            {eyebrow && (
              <p
                className={cn(
                  "text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5",
                  v.eyebrow,
                )}
              >
                {eyebrow}
              </p>
            )}
            <h1 className="text-[22px] md:text-[26px] font-bold text-[#020202] dark:text-white tracking-tight leading-tight">
              {isAr ? titleAr : titleEn}
            </h1>
            {(descAr || descEn) && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                {isAr ? descAr : descEn}
              </p>
            )}
            {children && (
              <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
            )}
          </div>
        </div>

        {actions && (
          <div className="shrink-0 flex items-center gap-2 pt-1">{actions}</div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
