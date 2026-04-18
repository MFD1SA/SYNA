import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/design-tokens";

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  tone?: Tone;
  description?: string;
}

interface Props {
  actions: QuickAction[];
  className?: string;
}

/**
 * Quick-actions — clean card grid, clear labels, no text clipping.
 * - Icon: fixed square gradient tile (48×48)
 * - Label: wraps naturally; never truncated mid-word
 * - Description: optional, smaller, line-clamped to 2 lines
 * - No hover-only decoration that reserves space at rest
 */
export const QuickActions: React.FC<Props> = ({ actions, className }) => {
  // Explicit solid gradients per tone — guarantees icon-on-card contrast
  const toneStyles: Record<Tone, { grad: string; glow: string }> = {
    primary: {
      grad: "bg-gradient-to-br from-[#2B4C66] to-[#1E374B]",
      glow: "shadow-[0_6px_16px_-6px_rgba(43,76,102,0.55)]",
    },
    gold: {
      grad: "bg-gradient-to-br from-[#C2A86B] to-[#A88A4A]",
      glow: "shadow-[0_6px_16px_-6px_rgba(194,168,107,0.55)]",
    },
    success: {
      grad: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      glow: "shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]",
    },
    warn: {
      grad: "bg-gradient-to-br from-amber-500 to-amber-600",
      glow: "shadow-[0_6px_16px_-6px_rgba(245,158,11,0.55)]",
    },
    danger: {
      grad: "bg-gradient-to-br from-rose-500 to-rose-600",
      glow: "shadow-[0_6px_16px_-6px_rgba(244,63,94,0.55)]",
    },
    neutral: {
      grad: "bg-gradient-to-br from-slate-500 to-slate-700",
      glow: "shadow-[0_6px_16px_-6px_rgba(100,116,139,0.5)]",
    },
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      {actions.map((a, i) => {
        const Icon = a.icon;
        const tone: Tone = a.tone ?? "primary";
        const t = toneStyles[tone];

        const Inner = (
          <>
            {/* Icon tile — square, explicit size, centered */}
            <div
              className={cn(
                "flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 shrink-0",
                t.grad,
                t.glow,
              )}
              style={{ width: "44px", height: "44px", minWidth: "44px", minHeight: "44px" }}
            >
              <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>

            {/* Label — wraps naturally, never clipped mid-word */}
            <div className="mt-3 min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#1E374B] dark:text-white leading-[1.35] break-words">
                {a.label}
              </p>
              {a.description && (
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-[1.5] line-clamp-2 break-words">
                  {a.description}
                </p>
              )}
            </div>
          </>
        );

        const clsn = cn(
          "group flex flex-col items-start text-start",
          "rounded-2xl p-4",
          "bg-white dark:bg-slate-800",
          "border border-slate-200/80 dark:border-white/10",
          "hover:border-[#C2A86B]/50 dark:hover:border-[#C2A86B]/40",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(15,31,46,0.18)]",
          "dark:hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.5)]",
          "transition-all duration-300 cursor-pointer",
          "min-h-[130px]",
        );

        return a.href ? (
          <a key={i} href={a.href} className={clsn}>{Inner}</a>
        ) : (
          <button key={i} type="button" onClick={a.onClick} className={clsn}>{Inner}</button>
        );
      })}
    </div>
  );
};

export default QuickActions;
