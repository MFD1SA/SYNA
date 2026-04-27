import React from "react";
import { cn } from "@/lib/utils";
import { toneBg, toneText, type Tone } from "@/lib/design-tokens";
import { ArrowDownRight, ArrowUpRight, Minus, LucideIcon } from "lucide-react";

interface KpiTileProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  tone?: Tone;
  delta?: number;
  isAr?: boolean;
  suffix?: string;
  loading?: boolean;
  className?: string;
}

/**
 * KpiTile — single metric tile.
 *
 * Visual upgrade over the previous version:
 * - Tabular numerals for clean vertical alignment of value rows.
 * - Slightly larger icon container (10×10) with rounded-2xl, gives the
 *   icon room to breathe at higher pixel densities.
 * - Hover micro-interaction: icon container scales slightly so the tile
 *   feels alive without being noisy.
 * - Delta pill uses semantic emerald/rose tokens with dark-mode variants
 *   that read well on the slate backgrounds.
 */
export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "primary",
  delta,
  isAr,
  suffix,
  loading,
  className,
}) => {
  const deltaIcon =
    delta == null
      ? null
      : delta > 0
        ? <ArrowUpRight className="w-3 h-3" />
        : delta < 0
          ? <ArrowDownRight className="w-3 h-3" />
          : <Minus className="w-3 h-3" />;
  const deltaTone =
    delta == null
      ? ""
      : delta > 0
        ? "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/15"
        : delta < 0
          ? "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/15"
          : "text-slate-500 bg-slate-100 dark:text-slate-300 dark:bg-slate-500/15";

  return (
    <div className={cn("group relative", className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] leading-tight">
          {label}
        </p>
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
              toneBg[tone],
            )}
          >
            <Icon className={cn("w-[18px] h-[18px]", toneText[tone])} strokeWidth={1.6} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        {loading ? (
          <div className="h-8 w-24 rounded-md bg-slate-200/70 dark:bg-slate-700/60 animate-pulse" />
        ) : (
          <>
            <span
              className="text-[26px] md:text-[30px] font-bold text-[#020202] dark:text-white tracking-tight leading-none"
              dir="ltr"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </span>
            {suffix && (
              <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{suffix}</span>
            )}
          </>
        )}
      </div>
      {(sublabel || delta != null) && (
        <div className="mt-3 flex items-center gap-2">
          {delta != null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5",
                deltaTone,
              )}
              dir="ltr"
            >
              {deltaIcon}
              <span>{delta > 0 ? "+" : ""}{delta}%</span>
            </span>
          )}
          {sublabel && (
            <span className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiTile;
