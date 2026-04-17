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
    delta == null ? null : delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : delta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />;
  const deltaTone =
    delta == null ? "" : delta > 0 ? "text-emerald-600 bg-emerald-50" : delta < 0 ? "text-rose-600 bg-rose-50" : "text-slate-500 bg-slate-100";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
          {label}
        </p>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", toneBg[tone])}>
            <Icon className={cn("w-4 h-4", toneText[tone])} strokeWidth={1.6} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        {loading ? (
          <div className="h-8 w-24 rounded-md bg-slate-200/70 dark:bg-slate-700/60 animate-pulse" />
        ) : (
          <>
            <span className="text-[26px] md:text-[30px] font-bold text-[#1E374B] dark:text-white tracking-tight leading-none" dir="ltr">
              {value}
            </span>
            {suffix && <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{suffix}</span>}
          </>
        )}
      </div>
      {(sublabel || delta != null) && (
        <div className="mt-3 flex items-center gap-2">
          {delta != null && (
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5", deltaTone)}>
              {deltaIcon}
              <span dir="ltr">{delta > 0 ? "+" : ""}{delta}%</span>
            </span>
          )}
          {sublabel && <span className="text-[12px] text-slate-500 dark:text-slate-400">{sublabel}</span>}
        </div>
      )}
    </div>
  );
};

export default KpiTile;
