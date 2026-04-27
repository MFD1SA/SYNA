/**
 * SINA design tokens — single source of truth for dashboards.
 * All values are static strings so Tailwind's JIT can pick them up.
 */

export const colors = {
  primary: "#2B2B2B",
  deep: "#020202",
  gold: "#C45A41",
  goldLight: "#D7C084",
  goldDeep: "#A24832",
  sand: "#F7F4ED",
  mist: "#F7F8FA",
  line: "rgba(15, 31, 46, 0.10)",
} as const;

export const radii = {
  sm: "rounded-lg", // 8
  md: "rounded-[14px]",
  lg: "rounded-[20px]",
  xl: "rounded-[28px]",
} as const;

export const shadows = {
  card: "shadow-[0_2px_12px_-4px_rgba(15,31,46,0.08)]",
  soft: "shadow-[0_4px_24px_-8px_rgba(15,31,46,0.10)]",
  pop: "shadow-[0_10px_40px_-12px_rgba(15,31,46,0.18)]",
} as const;

/** Glass surface — use the flavor that matches the role (neutral / gold / blue). */
export const glass = {
  neutral:
    "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10",
  gold:
    "bg-[#FAF6EC]/70 dark:bg-[#020202]/60 backdrop-blur-xl border border-[#C45A41]/30 dark:border-[#C45A41]/20",
  blue:
    "bg-[#EEF3F7]/70 dark:bg-[#020202]/60 backdrop-blur-xl border border-[#2B2B2B]/15 dark:border-[#2B2B2B]/30",
  hero:
    "bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/50 backdrop-blur-2xl border border-white/70 dark:border-white/10",
} as const;

export type Tone = "primary" | "gold" | "success" | "warn" | "danger" | "neutral";

export const toneRing: Record<Tone, string> = {
  primary: "ring-[#2B2B2B]/20 text-[#2B2B2B]",
  gold: "ring-[#C45A41]/25 text-[#A24832]",
  success: "ring-emerald-500/20 text-emerald-600",
  warn: "ring-amber-500/25 text-amber-600",
  danger: "ring-rose-500/25 text-rose-600",
  neutral: "ring-slate-400/20 text-slate-600",
};

export const toneBg: Record<Tone, string> = {
  primary: "bg-[#2B2B2B]/[0.07]",
  gold: "bg-[#C45A41]/[0.12]",
  success: "bg-emerald-50",
  warn: "bg-amber-50",
  danger: "bg-rose-50",
  neutral: "bg-slate-100/70",
};

export const toneText: Record<Tone, string> = {
  primary: "text-[#2B2B2B]",
  gold: "text-[#A24832]",
  success: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-rose-700",
  neutral: "text-slate-700",
};
