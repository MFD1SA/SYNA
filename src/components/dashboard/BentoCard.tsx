import React from "react";
import { cn } from "@/lib/utils";
import { glass, shadows } from "@/lib/design-tokens";

type Variant = "neutral" | "gold" | "blue" | "hero";
type Span = "full" | "half" | "third" | "two-thirds" | "quarter";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  span?: Span;
  padding?: "sm" | "md" | "lg";
  as?: keyof JSX.IntrinsicElements;
  onClick?: () => void;
  interactive?: boolean;
}

const spanMap: Record<Span, string> = {
  full: "col-span-12",
  half: "col-span-12 md:col-span-6",
  third: "col-span-12 sm:col-span-6 lg:col-span-4",
  "two-thirds": "col-span-12 lg:col-span-8",
  quarter: "col-span-6 md:col-span-3",
};

const padMap = {
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  variant = "neutral",
  span = "half",
  padding = "md",
  as: Tag = "div",
  onClick,
  interactive,
}) => {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "relative rounded-[20px]",
        glass[variant],
        shadows.card,
        padMap[padding],
        spanMap[span],
        interactive && "transition-all hover:shadow-[0_10px_40px_-12px_rgba(15,31,46,0.18)] hover:-translate-y-[1px] cursor-pointer",
        className,
      )}
    >
      {children}
    </Tag>
  );
};

export default BentoCard;
