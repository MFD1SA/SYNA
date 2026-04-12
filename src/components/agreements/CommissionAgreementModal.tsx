import React, { useState } from "react";
import { Shield, FileText, DollarSign, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  isAr: boolean;
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const CommissionAgreementModal: React.FC<Props> = ({ isAr, open, onAccept, onDecline }) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToBottom(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2B4C66]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#2B4C66]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">
                  {isAr ? "اتفاقية عمولة المنصة" : "Platform Commission Agreement"}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {isAr ? "الإصدار v1.0 — يجب الموافقة لإكمال التسجيل" : "Version v1.0 — Acceptance required to complete registration"}
                </p>
              </div>
            </div>
            <button onClick={onDecline} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Commission summary */}
          <div className="rounded-xl border border-[#2B4C66]/15 bg-[#2B4C66]/[0.03] p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-gray-800">
                {isAr ? "ملخص هيكل العمولة" : "Commission Structure Summary"}
              </span>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500">{isAr ? "عمولة الوساطة العقارية" : "Real Estate Brokerage"}</span>
                <span className="font-semibold text-gray-800">2.50%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isAr ? "أتعاب المنصة التشغيلية" : "Platform Operational Fee"}</span>
                <span className="font-semibold text-gray-800">0.50%</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">{isAr ? "إجمالي حصة المنصة" : "Total Platform Share"}</span>
                <span className="font-bold text-[#2B4C66] text-[15px]">3.00%</span>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50/80 border border-amber-200/50 p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {isAr
                  ? "تشمل العمولة كامل قيمة الصفقة بما في ذلك الأرض والتطوير العقاري"
                  : "Commission covers the entire transaction value including land and real estate development"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Agreement text — scrollable */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 text-[12px] leading-[1.9] text-gray-600"
          onScroll={handleScroll}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              {isAr ? "نص الاتفاقية الكامل" : "Full Agreement Text"}
            </span>
          </div>

          {isAr ? (
            <div className="space-y-4 whitespace-pre-line font-[inherit]">
              <p className="font-bold text-gray-800 text-[14px]">اتفاقية عمولة منصة سينا للتطوير العقاري</p>

              <div>
                <p className="font-semibold text-gray-800">المادة الأولى: أطراف الاتفاقية</p>
                <p>هذه الاتفاقية مبرمة بين منصة سينا للتطوير العقاري (المشغّل) والمطور العقاري (الطرف الثاني) المسجّل في المنصة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثانية: نطاق الاتفاقية</p>
                <p>تسري هذه الاتفاقية على جميع الصفقات والشراكات العقارية التي تتم عبر المنصة وتشمل صفقات الأراضي والتطوير العقاري بجميع أنواعها</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثالثة: هيكل العمولة</p>
                <p>1. عمولة الوساطة العقارية: 2.50% من القيمة الإجمالية للصفقة</p>
                <p>2. أتعاب المنصة التشغيلية: 0.50% من القيمة الإجمالية للصفقة</p>
                <p>3. إجمالي حصة المنصة: 3.00% من القيمة الإجمالية للصفقة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الرابعة: نطاق العمولة</p>
                <p>تشمل العمولة المذكورة أعلاه كامل قيمة الصفقة بما في ذلك قيمة الأرض وقيمة التطوير العقاري</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الخامسة: التزامات المطور</p>
                <p>1. يلتزم المطور بسداد كامل حصة المنصة عند إتمام الصفقة</p>
                <p>2. يلتزم المطور بعدم التواصل المباشر مع مالك الأرض خارج المنصة بهدف تجاوز العمولة</p>
                <p>3. يلتزم المطور بالحفاظ على سرية المعلومات المتاحة عبر المنصة</p>
                <p>4. يلتزم المطور بعدم استخدام المعلومات المقدمة عبر المنصة لأي غرض خارج نطاق الصفقة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة السادسة: السرية وحفظ الحقوق</p>
                <p>1. جميع المعلومات المتبادلة عبر المنصة سرية ومحمية</p>
                <p>2. يحق للمنصة اتخاذ الإجراءات القانونية في حال مخالفة شروط السرية أو تجاوز المنصة</p>
                <p>3. تحتفظ المنصة بحق تعليق أو إلغاء حساب المطور في حال المخالفة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة السابعة: مدة الاتفاقية</p>
                <p>تسري هذه الاتفاقية من تاريخ الموافقة عليها وتظل سارية طوال فترة استخدام المطور للمنصة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثامنة: القبول والموافقة</p>
                <p>بالموافقة على هذه الاتفاقية يقر المطور بأنه قرأ وفهم جميع البنود المذكورة أعلاه ويوافق عليها بالكامل وبإرادته الحرة</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 whitespace-pre-line font-[inherit]">
              <p className="font-bold text-gray-800 text-[14px]">SINA Real Estate Development Platform Commission Agreement</p>

              <div>
                <p className="font-semibold text-gray-800">Article 1: Parties</p>
                <p>This agreement is entered into between SINA Real Estate Development Platform (the Operator) and the Real Estate Developer (Second Party) registered on the platform</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 2: Scope</p>
                <p>This agreement applies to all real estate transactions and partnerships conducted through the platform including land deals and real estate development of all types</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 3: Commission Structure</p>
                <p>1. Real Estate Brokerage Commission: 2.50% of the total transaction value</p>
                <p>2. Platform Operational Fee: 0.50% of the total transaction value</p>
                <p>3. Total Platform Share: 3.00% of the total transaction value</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 4: Commission Coverage</p>
                <p>The above commission covers the entire transaction value including land value and real estate development value</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 5: Developer Obligations</p>
                <p>1. The developer commits to paying the full platform share upon deal completion</p>
                <p>2. The developer shall not contact the land owner directly outside the platform to bypass the commission</p>
                <p>3. The developer shall maintain confidentiality of information available through the platform</p>
                <p>4. The developer shall not use information provided through the platform for any purpose outside the scope of the transaction</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 6: Confidentiality and Rights Protection</p>
                <p>1. All information exchanged through the platform is confidential and protected</p>
                <p>2. The platform reserves the right to take legal action in case of breach of confidentiality or platform bypass</p>
                <p>3. The platform reserves the right to suspend or cancel the developer account in case of violation</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 7: Duration</p>
                <p>This agreement is effective from the date of acceptance and remains in force throughout the developer use of the platform</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 8: Acceptance</p>
                <p>By accepting this agreement the developer acknowledges having read and understood all the above terms and agrees to them fully and voluntarily</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — acceptance */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {!scrolledToBottom && (
            <p className="text-[11px] text-amber-600 text-center mb-3 font-medium">
              {isAr ? "يرجى قراءة الاتفاقية كاملة قبل الموافقة" : "Please read the full agreement before accepting"}
            </p>
          )}

          <label className={`flex items-start gap-3 cursor-pointer mb-4 ${!scrolledToBottom ? "opacity-50 pointer-events-none" : ""}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-0.5 rounded border-gray-300 w-4 h-4"
            />
            <span className="text-[12px] text-gray-700 leading-relaxed">
              {isAr
                ? "أقر بأنني قرأت وفهمت جميع بنود هذه الاتفاقية وأوافق عليها بالكامل بما في ذلك هيكل العمولة (عمولة وساطة 2.50% + رسوم تشغيلية 0.50% = إجمالي 3.00%)"
                : "I confirm that I have read and understood all terms of this agreement and accept them in full including the commission structure (Brokerage 2.50% + Operational 0.50% = Total 3.00%)"
              }
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 h-[44px] border border-gray-200 text-gray-600 text-[13px] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={onAccept}
              disabled={!checked}
              className="flex-1 h-[44px] bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
              {isAr ? "أوافق على الاتفاقية" : "Accept Agreement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionAgreementModal;
