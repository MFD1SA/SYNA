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
 * Premium quick-actions grid — gradient icon tile, hover lift, arrow reveal.
 * Uses solid, accessible colors — no glass fog over text.
 */
export const QuickActions: React.FC<Props> = ({ actions, className }) => {
  // Explicit solid gradients per tone — guarantees icon contrast
  const toneStyles: Record<Tone, { grad: string; glow: string; corner: string }> = {
    primary: {
      grad: "bg-gradient-to-br from-[#2B4C66] to-[#1E374B]",
      glow: "shadow-[0_8px_20px_-8px_rgba(43,76,102,0.55)]",
      corner: "bg-[#2B4C66]/10 dark:bg-[#2B4C66]/25",
    },
    gold: {
      grad: "bg-gradient-to-br from-[#C2A86B] to-[#A88A4A]",
      glow: "shadow-[0_8px_20px_-8px_rgba(194,168,107,0.55)]",
      corner: "bg-[#C2A86B]/15 dark:bg-[#C2A86B]/25",
    },
    success: {
      grad: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      glow: "shadow-[0_8px_20px_-8px_rgba(16,185,129,0.55)]",
      corner: "bg-emerald-500/15 dark:bg-emerald-500/25",
    },
    warn: {
      grad: "bg-gradient-to-br from-amber-500 to-amber-600",
      glow: "shadow-[0_8px_20px_-8px_rgba(245,158,11,0.55)]",
      corner: "bg-amber-500/15 dark:bg-amber-500/25",
    },
    danger: {
      grad: "bg-gradient-to-br from-rose-500 to-rose-600",
      glow: "shadow-[0_8px_20px_-8px_rgba(244,63,94,0.55)]",
      corner: "bg-rose-500/15 dark:bg-rose-500/25",
    },
    neutral: {
      grad: "bg-gradient-to-br from-slate-500 to-slate-700",
      glow: "shadow-[0_8px_20px_-8px_rgba(100,116,139,0.5)]",
      corner: "bg-slate-500/15 dark:bg-slate-500/25",
    },
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4", className)}>
      {actions.map((a, i) => {
        const Icon = a.icon;
        const tone: Tone = a.tone ?? "primary";
        const t = toneStyles[tone];

        const Inner = (
          <>
            {/* Corner glow — subtle, no text interference */}
            <div className={cn(
              "pointer-events-none absolute -top-10 -end-10 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              t.corner,
            )} />

            <div className="relative flex items-start justify-between mb-3">
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                t.grad,
                t.glow,
              )}>
                <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-300">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" strokeWidth={2} />
              </div>
            </div>

            <p className="relative text-[13.5px] font-bold text-[#1E374B] dark:text-white leading-snug">
              {a.label}
            </p>
            {a.description && (
              <p className="relative text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                {a.description}
              </p>
            )}
          </>
        );

        const clsn = "group relative overflow-hidden rounded-2xl p-4 md:p-5 bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 hover:border-[#C2A86B]/40 dark:hover:border-[#C2A86B]/30 hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(15,31,46,0.18)] dark:hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 text-start cursor-pointer";

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
