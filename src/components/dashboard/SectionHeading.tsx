import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { toneBg, toneText, type Tone } from "@/lib/design-tokens";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  action?: React.ReactNode;
  className?: string;
}

/**
 * SectionHeading — used inside cards to introduce a sub-region.
 *
 * Upgrade: title bumped to 16px / heavier weight, subtitle gets a
 * generous max-width so it can wrap two lines instead of being cut by
 * `truncate`. The icon container is now rounded-2xl to match KpiTile.
 */
export const SectionHeading: React.FC<Props> = ({ title, subtitle, icon: Icon, tone = "primary", action, className }) => {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", toneBg[tone])}>
            <Icon className={cn("w-[18px] h-[18px]", toneText[tone])} strokeWidth={1.6} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-[#1E374B] dark:text-white truncate tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeading;
