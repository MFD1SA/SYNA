import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  showArea?: boolean;
}

/** Pure-SVG sparkline — no external deps. */
export const TrendSparkline: React.FC<Props> = ({
  data,
  width = 220,
  height = 64,
  color = "#2B4C66",
  className,
  showArea = true,
}) => {
  const id = useId().replace(/:/g, "");
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const pts = data.map((v, i) => {
    const x = pad + (i * innerW) / Math.max(1, data.length - 1);
    const y = pad + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  const area = `${d} L ${pts[pts.length - 1][0].toFixed(2)} ${(height - pad).toFixed(2)} L ${pts[0][0].toFixed(2)} ${(height - pad).toFixed(2)} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={cn("block", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && <path d={area} fill={`url(#spark-${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} />
    </svg>
  );
};

export default TrendSparkline;
