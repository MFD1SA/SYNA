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
      <div className="flex items-center gap-0.5">
        {stageOrder.map((s, idx) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= currentIdx ? "bg-primary" : "bg-border"}`}
            title={isAr ? stageConfig[s]?.ar : stageConfig[s]?.en}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
      <div className="flex items-center gap-1">
        {stageOrder.map((s, idx) => {
          const sc = stageConfig[s];
          const SIcon = sc?.icon || CheckCircle2;
          const isActive = s === currentStage;
          const isPast = idx < currentIdx;

          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : isPast
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border bg-muted/30"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <SIcon className={`h-3 w-3 ${isActive ? sc?.color : "text-muted-foreground/30"}`} />
                )}
              </div>
              <span
                className={`text-[8px] text-center leading-tight ${
                  isActive ? "font-medium text-primary" : isPast ? "text-emerald-600" : "text-muted-foreground/40"
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
