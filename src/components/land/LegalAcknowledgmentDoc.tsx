import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { Shield, FileText } from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  LandFormData,
  usageLabels,
  goalLabels,
  projectModelLabels,
  contributionModelLabels,
  PLATFORM_BROKERAGE_RATE,
  PLATFORM_OPERATIONAL_RATE,
  PLATFORM_TOTAL_RATE,
} from "./LandFormConstants";

interface Props {
  form: LandFormData;
  referenceNumber?: string;
  ownerName?: string;
  companyName?: string;
  date?: string;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtSAR = (n: number, isAr?: boolean) => isAr ? `${fmt(n)} ريال` : `${fmt(n)} SAR`;

const LegalAcknowledgmentDoc: React.FC<Props> = ({ form, referenceNumber, ownerName, companyName, date }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const area = parseFloat(form.land_area_sqm) || 0;
  const pricePerSqm = parseFloat(form.estimated_price_per_sqm) || 0;
  const totalValue = parseFloat(form.estimated_total_value) || 0;
  const effectiveTotal = totalValue || (area * pricePerSqm);
  const brokerageCommission = effectiveTotal * PLATFORM_BROKERAGE_RATE;
  const operationalFee = effectiveTotal * PLATFORM_OPERATIONAL_RATE;
  const totalPlatformShare = effectiveTotal * PLATFORM_TOTAL_RATE;
  const issuedDate = date || new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-2xl mx-auto bg-white text-foreground p-8 rounded-xl border border-border print:border-0 print:shadow-none" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="text-center mb-6">
        <img src={logoImg} alt="SINA" className="mx-auto h-10 w-auto object-contain mb-3" />
        <h1 className="text-lg font-semibold">
          {isAr ? "وثيقة الإقرار القانوني" : "Legal Acknowledgment Document"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">SINA Platform — {isAr ? "منصة سينا للتطوير العقاري" : "Real Estate Development Platform"}</p>
        {referenceNumber && (
          <p className="text-xs text-muted-foreground mt-2">
            {isAr ? "رقم المرجع:" : "Reference #:"} <span className="font-mono font-medium">{referenceNumber}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">{isAr ? "تاريخ الإصدار:" : "Date:"} {issuedDate}</p>
      </div>

      <Separator className="my-4" />

      {/* Owner Info */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          {isAr ? "بيانات المالك" : "Owner Information"}
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {ownerName && <div><span className="text-muted-foreground">{isAr ? "اسم المالك:" : "Owner:"}</span> <span className="font-medium">{ownerName}</span></div>}
          {companyName && <div><span className="text-muted-foreground">{isAr ? "الشركة:" : "Company:"}</span> <span className="font-medium">{companyName}</span></div>}
        </div>
      </div>

      {/* Land Info */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          {isAr ? "بيانات الأرض" : "Land Details"}
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">{isAr ? "المدينة:" : "City:"}</span> <span className="font-medium">{form.city}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "الحي:" : "District:"}</span> <span className="font-medium">{form.district || "—"}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "المساحة:" : "Area:"}</span> <span className="font-medium">{fmt(area)} {isAr ? "م²" : "sqm"}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "نوع الاستخدام:" : "Usage:"}</span> <span className="font-medium">{isAr ? usageLabels[form.usage_type]?.ar : usageLabels[form.usage_type]?.en}</span></div>
          {form.deed_number && <div><span className="text-muted-foreground">{isAr ? "رقم الصك:" : "Deed #:"}</span> <span className="font-medium">{form.deed_number}</span></div>}
          {form.plan_number && <div><span className="text-muted-foreground">{isAr ? "رقم المخطط:" : "Plan #:"}</span> <span className="font-medium">{form.plan_number}</span></div>}
          <div><span className="text-muted-foreground">{isAr ? "نموذج المشروع:" : "Model:"}</span> <span className="font-medium">{isAr ? projectModelLabels[form.project_model]?.ar : projectModelLabels[form.project_model]?.en}</span></div>
          <div><span className="text-muted-foreground">{isAr ? "هدف الشراكة:" : "Goal:"}</span> <span className="font-medium">{isAr ? goalLabels[form.partnership_goal]?.ar : goalLabels[form.partnership_goal]?.en}</span></div>
        </div>
      </div>

      {/* Pricing */}
      {effectiveTotal > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2">{isAr ? "التقييم التقديري" : "Estimated Pricing"}</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {pricePerSqm > 0 && <div><span className="text-muted-foreground">{isAr ? "سعر المتر:" : "Price/sqm:"}</span> <span className="font-medium">{fmtSAR(pricePerSqm)}</span></div>}
            <div><span className="text-muted-foreground">{isAr ? "القيمة الإجمالية:" : "Total Value:"}</span> <span className="font-medium">{fmtSAR(effectiveTotal)}</span></div>
          </div>
        </div>
      )}

      {/* Platform Fees */}
      {effectiveTotal > 0 && (
        <div className="mb-4 rounded-lg border border-border/60 p-3">
          <h2 className="text-sm font-semibold mb-2">{isAr ? "رسوم المنصة" : "Platform Fees"}</h2>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>{isAr ? "عمولة السعي العقاري (2.50%)" : "Real Estate Brokerage (2.50%)"}</span><span className="font-medium">{fmtSAR(brokerageCommission)}</span></div>
            <div className="flex justify-between"><span>{isAr ? "أتعاب المنصة (1.50%)" : "Platform Fee (1.50%)"}</span><span className="font-medium">{fmtSAR(operationalFee)}</span></div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold"><span>{isAr ? "إجمالي حصة المنصة (4.00%)" : "Total Platform Share (4.00%)"}</span><span className="text-primary">{fmtSAR(totalPlatformShare)}</span></div>
          </div>
        </div>
      )}

      <Separator className="my-4" />

      {/* Legal Disclaimers */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold mb-2">{isAr ? "الإخلاءات القانونية" : "Legal Disclaimers"}</h2>
        <div className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
          <p>1. {isAr ? "السعر التقديري مقدم من مالك الأرض ولا يمثل تقييماً من المنصة." : "The estimated price was provided by the land owner and does not represent a platform valuation."}</p>
          <p>2. {isAr ? "المنصة لا تقدم تقييماً عقارياً رسمياً." : "The platform does not provide official property valuation."}</p>
          <p>3. {isAr ? "حصة المنصة (4%) تُحتسب من قيمة الأرض فقط ومقرة من الأطراف." : "The platform share (4%) is calculated on land value only and acknowledged by the parties."}</p>
          <p>4. {isAr ? "السعر التقديري غير ملزم وقابل للتعديل بالاتفاق." : "The estimated price is not binding and may be modified by agreement."}</p>
          <p>5. {isAr ? "أي سعر نهائي متفق عليه سيوثق في ملحق منفصل." : "Any final agreed price will be documented in a separate addendum."}</p>
          <p>6. {isAr ? "المنصة لا تقدم توصيات استثمارية أو تمويلية." : "The platform does not provide investment or financing recommendations."}</p>
          <p>7. {isAr ? "تغطية التخارج ليست من مسؤولية المنصة." : "Exit coverage is not the responsibility of the platform."}</p>
        </div>
      </div>

      {/* Acceptance */}
      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mb-4">
        <h2 className="text-sm font-semibold mb-2">{isAr ? "إقرار بالقبول" : "Acceptance Statement"}</h2>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {isAr
            ? "أقر أنا الموقع أدناه بأنني قرأت وفهمت جميع الإخلاءات القانونية المذكورة أعلاه وأوافق على شروط وأحكام المنصة بما في ذلك هيكل الرسوم المعلن (عمولة وساطة 2.50% + رسوم تشغيلية 0.50% = 3.00%)."
            : "I, the undersigned, acknowledge that I have read and understood all legal disclaimers stated above and agree to the platform terms and conditions including the disclosed fee structure (Brokerage 2.50% + Operational 0.50% = 3.00%)."}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 border-b border-dashed border-muted-foreground/30 pb-1">
            <p className="text-[10px] text-muted-foreground">{isAr ? "توقيع المالك" : "Owner Signature"}</p>
          </div>
          <div className="flex-1 border-b border-dashed border-muted-foreground/30 pb-1">
            <p className="text-[10px] text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground mt-6">
        <p>SINA Platform v1.0.0 — {isAr ? "شركة دوما للتقنية" : "DOMA Technology Company"}</p>
        <p className="mt-0.5">{isAr ? "هذه الوثيقة تم إنشاؤها آلياً ومحفوظة في سجل الفرصة" : "This document was auto-generated and stored in the opportunity record"}</p>
      </div>
    </div>
  );
};

export default LegalAcknowledgmentDoc;
