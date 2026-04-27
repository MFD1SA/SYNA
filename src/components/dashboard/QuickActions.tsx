import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, LucideIcon } from "lucide-react";
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
 * Premium Quick Actions — dashboard-grade polish.
 *
 * Per-card design:
 *   ┌─────────────────────┐
 *   │  ● top accent bar   │
 *   │                     │
 *   │  ┌───┐              │
 *   │  │icn│     ↗        │ ← arrow drifts on hover
 *   │  └───┘              │
 *   │                     │
 *   │  Label              │
 *   │  description        │
 *   └─────────────────────┘
 *
 * - Thin gold/blue accent bar at the top, tone-aware
 * - Square gradient icon badge (40×40) with soft matched-tone glow
 * - Top-right ArrowUpRight in a subtle ghost pill — slides + scales on hover
 * - Label on its own line (never clipped), description line-clamped to 2
 * - Lift + tone-aware border highlight on hover
 * - Works at any grid width (including third-span Bento columns)
 */
export const QuickActions: React.FC<Props> = ({ actions, className }) => {
  const toneStyles: Record<Tone, {
    grad: string;
    glow: string;
    bar: string;
    hoverBorder: string;
    hoverShadow: string;
  }> = {
    primary: {
      grad: "bg-gradient-to-br from-[#2B2B2B] to-[#020202]",
      glow: "shadow-[0_8px_20px_-8px_rgba(43,76,102,0.5)]",
      bar: "bg-gradient-to-r from-[#2B2B2B] via-[#3A6088] to-transparent",
      hoverBorder: "hover:border-[#2B2B2B]/35 dark:hover:border-[#7FA7C4]/30",
      hoverShadow: "hover:shadow-[0_16px_32px_-14px_rgba(43,76,102,0.28)]",
    },
    gold: {
      grad: "bg-gradient-to-br from-[#C45A41] to-[#A24832]",
      glow: "shadow-[0_8px_20px_-8px_rgba(194,168,107,0.55)]",
      bar: "bg-gradient-to-r from-[#C45A41] via-[#D7C084] to-transparent",
      hoverBorder: "hover:border-[#C45A41]/50 dark:hover:border-[#C45A41]/40",
      hoverShadow: "hover:shadow-[0_16px_32px_-14px_rgba(194,168,107,0.32)]",
    },
    success: {
      grad: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      glow: "shadow-[0_8px_20px_-8px_rgba(16,185,129,0.5)]",
      bar: "bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent",
      hoverBorder: "hover:border-emerald-500/40",
      hoverShadow: "hover:shadow-[0_16px_32px_-14px_rgba(16,185,129,0.28)]",
    },
    warn: {
      grad: "bg-gradient-to-br from-amber-500 to-amber-600",
      glow: "shadow-[0_8px_20px_-8px_rgba(245,158,11,0.5)]",
      bar: "bg-gradient-to-r from-amber-500 via-amber-400 to-transparent",
      hoverBorder: "hover:border-amber-500/40",
      hoverShadow: "hover:shadow-[0_16px_32px_-14px_rgba(245,158,11,0.28)]",
    },
    danger: {
      grad: "bg-gradient-to-br from-rose-500 to-rose-600",
      glow: "shadow-[0_8px_20px_-8px_rgba(244,63,94,0.5)]",
      bar: "bg-gradient-to-r from-rose-500 via-rose-400 to-transparent",
      hoverBorder: "hover:border-rose-500/40",
      hoverShadow: "hover:shadow-[0_16px_32px_-14px_rgba(244,63,94,0.28)]",
    },
    neutral: {
      grad: "bg-gradient-to-br from-slate-500 to-slate-700",
      glow: "shadow-[0_8px_20px_-8px_rgba(100,116,139,0.45)]",
      bar: "bg-gradient-to-r from-slate-400 via-slate-300 to-transparent",
      hoverBorder: "hover:border-slate-400/50 dark:hover:border-white/20",
      hoverShadow: "hover:shadow-[0_16px_32px_-14px_rgba(100,116,139,0.22)]",
    },
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {actions.map((a, i) => {
        const Icon = a.icon;
        const tone: Tone = a.tone ?? "primary";
        const t = toneStyles[tone];

        const Inner = (
          <>
            {/* Tone accent bar */}
            <div className={cn("absolute inset-x-0 top-0 h-[2px] rounded-t-2xl", t.bar)} />

            {/* Top row: gradient icon tile + ghost arrow pill */}
            <div className="relative flex items-start justify-between">
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[4deg]",
                  t.grad,
                  t.glow,
                )}
                style={{ width: "40px", height: "40px", minWidth: "40px", minHeight: "40px" }}
              >
                <Icon className="w-[19px] h-[19px] text-white" strokeWidth={2} />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300">
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" strokeWidth={2} />
              </div>
            </div>

            {/* Label */}
            <div className="relative mt-4 min-w-0">
              <p className="text-[14px] font-bold leading-tight text-[#020202] dark:text-white break-words">
                {a.label}
              </p>
              {a.description && (
                <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-300 line-clamp-2 break-words">
                  {a.description}
                </p>
              )}
            </div>
          </>
        );

        const clsn = cn(
          "group relative flex flex-col items-stretch justify-between",
          "rounded-2xl p-4",
          "bg-white dark:bg-slate-800/80",
          "border border-slate-200/80 dark:border-white/10",
          "shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] dark:shadow-none",
          "transition-all duration-300 cursor-pointer text-start overflow-hidden",
          "hover:-translate-y-1",
          t.hoverBorder,
          t.hoverShadow,
          "min-h-[124px]",
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
