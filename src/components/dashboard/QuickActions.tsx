import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { toneBg, toneText, type Tone } from "@/lib/design-tokens";

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

export const QuickActions: React.FC<Props> = ({ actions, className }) => {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      {actions.map((a, i) => {
        const Icon = a.icon;
        const tone: Tone = a.tone ?? "primary";
        const Inner = (
          <>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", toneBg[tone])}>
              <Icon className={cn("w-5 h-5", toneText[tone])} strokeWidth={1.6} />
            </div>
            <p className="text-[13px] font-semibold text-[#1E374B] dark:text-white">{a.label}</p>
            {a.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{a.description}</p>}
          </>
        );
        const clsn = "group rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-white/70 dark:border-white/5 hover:border-[#2B4C66]/20 hover:shadow-[0_8px_24px_-12px_rgba(15,31,46,0.15)] transition-all text-start";
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
