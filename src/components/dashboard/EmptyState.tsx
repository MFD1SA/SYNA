import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, action, className, compact }) => {
  return (
    <div className={cn("text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40", compact ? "py-8 px-5" : "py-12 px-6", className)}>
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100/80 dark:bg-slate-700/40 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      <h4 className="text-[14px] font-semibold text-[#1E374B] dark:text-white mb-1">{title}</h4>
      {description && <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-[320px] mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
