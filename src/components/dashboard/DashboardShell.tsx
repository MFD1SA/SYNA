import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  /** AR/LTR direction awareness. */
  isAr?: boolean;
  className?: string;
  accent?: "blue" | "gold";
}

/**
 * DashboardShell — premium glassmorphism background container used by Owner
 * and Developer dashboards. Paints ambient gradients (muted on light/dark)
 * behind the BentoGrid children.
 */
export const DashboardShell: React.FC<Props> = ({ children, isAr, className, accent = "blue" }) => {
  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        "relative min-h-full pb-12",
        "bg-[radial-gradient(80%_60%_at_50%_0%,rgba(43,76,102,0.06)_0%,transparent_65%),radial-gradient(60%_50%_at_100%_100%,rgba(194,168,107,0.08)_0%,transparent_70%)]",
        "dark:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(43,76,102,0.25)_0%,transparent_65%),radial-gradient(60%_50%_at_100%_100%,rgba(194,168,107,0.12)_0%,transparent_70%)]",
        className,
      )}
    >
      {/* Decorative floating blobs (pure CSS, GPU-cheap) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -top-24 -end-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-40 dark:opacity-25",
            accent === "gold" ? "bg-[#C2A86B]/30" : "bg-[#2B4C66]/25",
          )}
        />
        <div
          className={cn(
            "absolute top-1/3 -start-32 w-[360px] h-[360px] rounded-full blur-3xl opacity-30 dark:opacity-20",
            accent === "gold" ? "bg-[#2B4C66]/25" : "bg-[#C2A86B]/30",
          )}
        />
      </div>
      <div className="relative z-[1] px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[1600px] mx-auto">
        {children}
      </div>
    </div>
  );
};

/** 12-column bento grid used by both dashboards. */
export const BentoGrid: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className }) => (
  <div className={cn("grid grid-cols-12 gap-4 md:gap-5", className)}>{children}</div>
);

export default DashboardShell;
