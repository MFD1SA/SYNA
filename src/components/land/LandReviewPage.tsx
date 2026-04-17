import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import logoImg from "@/assets/logo.png";
import {
  MapPin, Ruler, FileText, Building2, Landmark, AlertTriangle,
  Banknote, Shield, CheckCircle2,
} from "lucide-react";
import {
  LandFormData,
  usageLabels,
  goalLabels,
  projectModelLabels,
  developmentSubtypes,
  contributionModelLabels,
  PLATFORM_BROKERAGE_RATE,
  PLATFORM_OPERATIONAL_RATE,
  PLATFORM_TOTAL_RATE,
} from "./LandFormConstants";

interface Props {
  form: LandFormData;
  onAcceptLegal: (v: boolean) => void;
  onAcceptFees: (v: boolean) => void;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtSAR = (n: number, isAr?: boolean) => isAr ? `${fmt(n)} ريال` : `${fmt(n)} SAR`;

const LandReviewPage: React.FC<Props> = ({ form, onAcceptLegal, onAcceptFees }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const area = parseFloat(form.land_area_sqm) || 0;
  const pricePerSqm = parseFloat(form.estimated_price_per_sqm) || 0;
  const totalValue = parseFloat(form.estimated_total_value) || 0;
  const effectiveTotal = totalValue || (area * pricePerSqm);
  const brokerageCommission = effectiveTotal * PLATFORM_BROKERAGE_RATE;
  const operationalFee = effectiveTotal * PLATFORM_OPERATIONAL_RATE;
  const totalPlatformShare = effectiveTotal * PLATFORM_TOTAL_RATE;

  const subtypeOptions = developmentSubtypes[form.usage_type]?.options || [];
  const selectedSubtype = subtypeOptions.find(o => o.value === form.development_subtype);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <img src={logoImg} alt="SINA" className="mx-auto h-8 w-auto object-contain mb-2" />
        <h2 className="text-lg font-semibold text-foreground">
          {isAr ? "ملخص الطلب والمراجعة النهائية" : "Submission Summary & Final Review"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isAr ? "يرجى مراجعة جميع البيانات قبل التقديم" : "Please review all data before submission"}
        </p>
      </div>

      {/* Land Info */}
      <div className="rounded-lg border border-border/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          {isAr ? "بيانات الأرض" : "Land Information"}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">{isAr ? "المدينة:" : "City:"}</span> <span className="font-medium">{form.city}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "الحي:" : "District:"}</span> <span className="font-medium">{form.district || "—"}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "المساحة:" : "Area:"}</span> <span className="font-medium">{fmt(area)} {isAr ? "م²" : "sqm"}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "نوع الاستخدام:" : "Usage:"}</span> <span className="font-medium">{isAr ? usageLabels[form.usage_type]?.ar : usageLabels[form.usage_type]?.en}</span></div>
          {form.plan_number && <div><span className="text-muted-foreground">{isAr ? "رقم المخطط:" : "Plan #:"}</span> <span className="font-medium">{form.plan_number}</span></div>}
          {form.plot_number && <div><span className="text-muted-foreground">{isAr ? "رقم القطعة:" : "Plot #:"}</span> <span className="font-medium">{form.plot_number}</span></div>}
          {form.parcel_count && <div><span className="text-muted-foreground">{isAr ? "عدد القطع:" : "Parcels:"}</span> <span className="font-medium">{form.parcel_count}</span></div>}
          {form.deed_number && <div><span className="text-muted-foreground">{isAr ? "رقم الصك:" : "Deed #:"}</span> <span className="font-medium">{form.deed_number}</span></div>}
          {form.deed_date && <div><span className="text-muted-foreground">{isAr ? "تاريخ الصك:" : "Deed Date:"}</span> <span className="font-medium">{form.deed_date}</span></div>}
          {form.brokerage_license_number && <div className="col-span-2"><span className="text-muted-foreground">{isAr ? "رقم رخصة الوساطة:" : "Brokerage License:"}</span> <span className="font-medium">{form.brokerage_license_number}</span></div>}
        </div>
      </div>

      {/* Project Model */}
      <div className="rounded-lg border border-border/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-primary" />
          {isAr ? "نموذج المشروع" : "Project Model"}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">{isAr ? "النموذج:" : "Model:"}</span> <span className="font-medium">{isAr ? projectModelLabels[form.project_model]?.ar : projectModelLabels[form.project_model]?.en}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "هدف الشراكة:" : "Goal:"}</span> <span className="font-medium">{isAr ? goalLabels[form.partnership_goal]?.ar : goalLabels[form.partnership_goal]?.en}</span></div>
          {selectedSubtype && <div><span className="text-muted-foreground">{isAr ? "نوع التطوير:" : "Dev Type:"}</span> <span className="font-medium">{isAr ? selectedSubtype.ar : selectedSubtype.en}</span></div>}
        </div>
        {form.project_model === "real_estate_contribution" && form.contribution_model && (
          <div className="mt-2 text-xs">
            <span className="text-muted-foreground">{isAr ? "نموذج المساهمة:" : "Contribution:"}</span>{" "}
            <Badge variant="outline" className="text-[10px]">
              {isAr ? contributionModelLabels[form.contribution_model]?.ar : contributionModelLabels[form.contribution_model]?.en}
            </Badge>
            {form.contribution_model === "partial_exit" && form.exit_percentage && (
              <span className="ms-2 font-medium">{form.exit_percentage}% {isAr ? "تخارج" : "exit"}</span>
            )}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="rounded-lg border border-border/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Banknote className="h-4 w-4 text-primary" />
          {isAr ? "التقييم التقديري" : "Estimated Pricing"}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {pricePerSqm > 0 && <div><span className="text-muted-foreground">{isAr ? "سعر المتر:" : "Price/sqm:"}</span> <span className="font-medium">{fmtSAR(pricePerSqm)}</span></div>}
          {effectiveTotal > 0 && <div><span className="text-muted-foreground">{isAr ? "القيمة الإجمالية:" : "Total Value:"}</span> <span className="font-medium">{fmtSAR(effectiveTotal)}</span></div>}
        </div>

        {/* Price Disclaimer */}
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-800">
              {isAr
                ? "السعر المذكور هو سعر تقديري مقدم من مالك الأرض لأغراض عرض الفرصة فقط. لا يمثل هذا السعر تقييماً رسمياً من المنصة. قد يختلف السعر النهائي المتفق عليه بين المالك والمطور وسيتم توثيقه في اتفاقية منفصلة عند الحاجة."
                : "The price mentioned is an estimated price provided by the land owner for opportunity presentation purposes only. This price does not represent an official valuation by the platform. The final agreed price between the owner and developer may differ and will be documented in a separate agreement if required."}
            </p>
          </div>
        </div>
      </div>

      {/* Platform Fees */}
      {effectiveTotal > 0 && (
        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Landmark className="h-4 w-4 text-primary" />
            {isAr ? "رسوم المنصة" : "Platform Fees"}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isAr ? "عمولة السعي العقاري (2.50%)" : "Real Estate Brokerage (2.50%)"}</span>
              <span className="font-medium">{fmtSAR(brokerageCommission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isAr ? "أتعاب المنصة (1.50%)" : "Platform Fee (1.50%)"}</span>
              <span className="font-medium">{fmtSAR(operationalFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{isAr ? "إجمالي حصة المنصة (4.00%)" : "Total Platform Share (4.00%)"}</span>
              <span className="text-primary">{fmtSAR(totalPlatformShare)}</span>
            </div>
          </div>

          {/* Fee Notice */}
          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-[11px] leading-relaxed text-blue-800">
              {isAr
                ? "تُحتسب حصة المنصة من قيمة الأرض فقط. الاتفاق على آلية الدفع يكون مباشرة بين المالك والمطور."
                : "Platform fees are calculated on the land value only. Payment arrangement is directly between the owner and developer."}
            </p>
          </div>
        </div>
      )}

      {/* Exit Coverage Notice (for contribution model) */}
      {form.project_model === "real_estate_contribution" && form.contribution_model === "partial_exit" && (
        <div className="rounded-md border border-orange-500/20 bg-orange-500/5 p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-orange-800">
              {isAr
                ? "تغطية التخارج ليست من مسؤولية المنصة. على المطور توضيح آلية تغطية التخارج في عرضه: (مستثمرين، تمويل، طرح خاص)."
                : "Exit coverage is NOT the responsibility of the platform. The developer must explain in their proposal how the exit will be covered: Investors, Financing, or Private Placement."}
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Legal Acknowledgment */}
      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          {isAr ? "الإقرار القانوني" : "Legal Acknowledgment"}
        </div>

        <div className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
          <p>• {isAr ? "السعر التقديري مقدم من مالك الأرض ولا يمثل تقييماً من المنصة." : "The estimated price was provided by the land owner and does not represent a platform valuation."}</p>
          <p>• {isAr ? "المنصة لا تقدم تقييماً عقارياً رسمياً." : "The platform does not provide official property valuation."}</p>
          <p>• {isAr ? "حصة المنصة (4%) تُحتسب من قيمة الأرض فقط ومقرة من الأطراف." : "The platform share (4%) is calculated on land value only and acknowledged by the parties."}</p>
          <p>• {isAr ? "السعر التقديري غير ملزم وقابل للتعديل بالاتفاق." : "The estimated price is not binding and may be modified by agreement."}</p>
          <p>• {isAr ? "أي سعر نهائي متفق عليه سيوثق في ملحق منفصل." : "Any final agreed price will be documented in a separate addendum."}</p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.legal_acknowledgment_accepted}
              onChange={(e) => onAcceptLegal(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <span className="text-xs text-foreground">
              {isAr
                ? "أقر بأنني قرأت وفهمت جميع الإخلاءات القانونية أعلاه وأوافق عليها."
                : "I acknowledge that I have read, understood, and agree to all the legal disclaimers above."}
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.platform_fee_acknowledged}
              onChange={(e) => onAcceptFees(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <span className="text-xs text-foreground">
              {isAr
                ? "أقر بعلمي بهيكل رسوم المنصة (عمولة سعي 2.50% + أتعاب المنصة 1.50% = 4.00% من قيمة الأرض)."
                : "I acknowledge the platform fee structure (Brokerage 2.50% + Platform Fee 1.50% = 4.00% of land value)."}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LandReviewPage;
