import React from "react";
import { CheckCircle2 } from "lucide-react";
import { stageConfig, stageOrder } from "./dealStageConfig";

interface Props {
  currentStage: string;
  isAr: boolean;
  compact?: boolean;
}

const DealStagePipeline: React.FC<Props> = ({ currentStage, isAr, compact }) => {
  const currentIdx = stageOrder.indexOf(currentStage);

  if (compact) {
    return (
      <div className="flex items-center gap-0.5" dir="ltr">
        {stageOrder.map((s, idx) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors ${
              idx <= currentIdx
                ? idx === currentIdx
                  ? "bg-[#2B4C66] shadow-sm"
                  : "bg-emerald-500"
                : "bg-border/60"
            }`}
            title={isAr ? stageConfig[s]?.ar : stageConfig[s]?.en}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2B4C66]/15 bg-gradient-to-b from-[#2B4C66]/[0.03] to-transparent p-4" dir="ltr">
      <div className="flex items-center gap-1">
        {stageOrder.map((s, idx) => {
          const sc = stageConfig[s];
          const SIcon = sc?.icon || CheckCircle2;
          const isActive = s === currentStage;
          const isPast = idx < currentIdx;

          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-[#2B4C66] bg-[#2B4C66]/10 shadow-sm"
                    : isPast
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border/50 bg-muted/20"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <SIcon className={`h-3.5 w-3.5 ${isActive ? "text-[#2B4C66]" : "text-muted-foreground/30"}`} />
                )}
              </div>
              <span
                className={`text-[8px] text-center leading-tight max-w-[60px] ${
                  isActive ? "font-semibold text-[#2B4C66]" : isPast ? "font-medium text-emerald-600" : "text-muted-foreground/40"
                }`}
              >
                {isAr ? sc?.ar : sc?.en}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DealStagePipeline;
