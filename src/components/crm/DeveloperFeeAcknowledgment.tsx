import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Shield, Banknote } from "lucide-react";
import { PLATFORM_BROKERAGE_RATE, PLATFORM_OPERATIONAL_RATE, PLATFORM_TOTAL_RATE } from "@/components/land/LandFormConstants";

interface Props {
  accepted: boolean;
  onAccept: (v: boolean) => void;
}

const DeveloperFeeAcknowledgment: React.FC<Props> = ({ accepted, onAccept }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Banknote className="h-4 w-4 text-primary" />
        {isAr ? "إقرار رسوم المنصة" : "Platform Fee Acknowledgment"}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{isAr ? "عمولة السعي العقاري" : "Real Estate Brokerage Commission"}</span>
          <span className="font-medium">2.50%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{isAr ? "أتعاب المنصة" : "Platform Services Fee"}</span>
          <span className="font-medium">1.50%</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>{isAr ? "إجمالي حصة المنصة" : "Total Platform Share"}</span>
          <span className="text-primary">4.00%</span>
        </div>
      </div>

      <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-blue-800">
            {isAr
              ? "تُحتسب حصة المنصة (4%) من قيمة الأرض فقط. يجب تضمينها في دراسة الجدوى المالية. الاتفاق على الدفع يكون مباشرة بين المالك والمطور."
              : "The platform share (4%) is calculated on the land value only. It must be included in your financial feasibility study. Payment is arranged directly between owner and developer."}
          </p>
        </div>
      </div>

      <label className="flex items-start gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAccept(e.target.checked)}
          className="mt-0.5 rounded border-border"
        />
        <span className="text-xs text-foreground">
          {isAr
            ? "أقر بعلمي بهيكل رسوم المنصة (عمولة سعي 2.50% + أتعاب المنصة 1.50% = 4.00% من قيمة الأرض) وسأضمنها في دراسة الجدوى."
            : "I acknowledge the platform fee structure (Brokerage 2.50% + Platform Fee 1.50% = 4.00% of land value) and will include it in my feasibility study."}
        </span>
      </label>
    </div>
  );
};

export default DeveloperFeeAcknowledgment;
