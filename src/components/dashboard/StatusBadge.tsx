import React from "react";
import { cn } from "@/lib/utils";

type Variant = "active" | "pending" | "success" | "warn" | "danger" | "neutral" | "gold";

const map: Record<Variant, string> = {
  active: "bg-[#2B4C66]/[0.08] text-[#2B4C66] ring-1 ring-[#2B4C66]/15",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  gold: "bg-[#C2A86B]/[0.12] text-[#A88A4A] ring-1 ring-[#C2A86B]/25",
};

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ children, variant = "neutral", className, dot }) => {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", map[variant], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
};

export default StatusBadge;
