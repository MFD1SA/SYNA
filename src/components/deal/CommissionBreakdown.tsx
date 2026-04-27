import React from "react";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, Banknote } from "lucide-react";
import { PLATFORM_BROKERAGE_RATE, PLATFORM_OPERATIONAL_RATE, PLATFORM_TOTAL_RATE } from "@/components/land/LandFormConstants";

interface Props {
  isAr: boolean;
  estimatedPricePerSqm?: number;
  estimatedTotalValue?: number;
  landAreaSqm?: number;
  showDisclaimer?: boolean;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtSAR = (n: number, isAr?: boolean) => isAr ? `${fmt(n)} ريال` : `${fmt(n)} SAR`;

const CommissionBreakdown: React.FC<Props> = ({
  isAr,
  estimatedPricePerSqm = 0,
  estimatedTotalValue = 0,
  landAreaSqm = 0,
  showDisclaimer = true,
}) => {
  const effectiveTotal = estimatedTotalValue || (landAreaSqm * estimatedPricePerSqm);
  const brokerageAmount = effectiveTotal * PLATFORM_BROKERAGE_RATE;
  const operationalAmount = effectiveTotal * PLATFORM_OPERATIONAL_RATE;
  const totalPlatformShare = effectiveTotal * PLATFORM_TOTAL_RATE;

  return (
    <div className="rounded-xl border border-[#2B2B2B]/15 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2B2B2B]/10">
          <Banknote className="h-4 w-4 text-[#2B2B2B]" />
        </div>
        {isAr ? "تفاصيل العمولة والرسوم" : "Commission & Fee Details"}
      </div>

      {/* Estimated Pricing */}
      {effectiveTotal > 0 && (
        <div className="space-y-1.5 text-xs">
          {estimatedPricePerSqm > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isAr ? "السعر التقديري للمتر" : "Est. Price per sqm"}</span>
              <span className="font-medium tabular-nums" dir="ltr">{fmtSAR(estimatedPricePerSqm, isAr)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{isAr ? "القيمة التقديرية للأرض" : "Est. Land Value"}</span>
            <span className="font-medium tabular-nums" dir="ltr">{fmtSAR(effectiveTotal, isAr)}</span>
          </div>
          <Separator />
        </div>
      )}

      {/* Fee breakdown */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{isAr ? "عمولة السعي العقاري" : "Real Estate Brokerage"}</span>
          <span className="font-medium tabular-nums" dir="ltr">2.50%{effectiveTotal > 0 ? ` (${fmtSAR(brokerageAmount, isAr)})` : ""}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{isAr ? "أتعاب المنصة" : "Platform Fee"}</span>
          <span className="font-medium tabular-nums" dir="ltr">1.50%{effectiveTotal > 0 ? ` (${fmtSAR(operationalAmount, isAr)})` : ""}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>{isAr ? "إجمالي حصة المنصة" : "Total Platform Share"}</span>
          <span className="text-[#2B2B2B] tabular-nums" dir="ltr">4.00%{effectiveTotal > 0 ? ` (${fmtSAR(totalPlatformShare, isAr)})` : ""}</span>
        </div>
      </div>

      {/* Disclaimers */}
      {showDisclaimer && (
        <>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-amber-800">
                {isAr
                  ? "السعر التقديري مقدم من مالك الأرض ولا يمثل تقييماً من المنصة. السعر غير ملزم وقابل للتعديل بالاتفاق."
                  : "The estimated price is provided by the land owner and does not represent a platform valuation. It is non-binding and subject to agreement."}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2.5 flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              {isAr
                ? "تُحتسب العمولة من قيمة الأرض فقط — الدفع مباشرة بين المالك والمطور"
                : "Commission calculated on land value only — payment directly between owner and developer"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionBreakdown;
