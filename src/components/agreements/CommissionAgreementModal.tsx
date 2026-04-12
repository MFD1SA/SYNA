import React, { useState } from "react";
import { Shield, FileText, DollarSign, AlertTriangle, CheckCircle2, X, Building2, User, Phone as PhoneIcon, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  isAr: boolean;
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  companyName?: string;
  contactPersonName?: string;
  phone?: string;
}

const CommissionAgreementModal: React.FC<Props> = ({
  isAr,
  open,
  onAccept,
  onDecline,
  companyName,
  contactPersonName,
  phone,
}) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToBottom(true);
  };

  const agreementDate = isAr
    ? new Date().toLocaleDateString("ar-SA")
    : new Date().toLocaleDateString("en-US");

  const displayCompany = companyName?.trim() || (isAr ? "المطور العقاري" : "The Developer");
  const displayContact = contactPersonName?.trim() || (isAr ? "الممثل المفوّض" : "Authorized Representative");
  const displayPhone = phone?.trim() || (isAr ? "غير محدد" : "Not provided");

  const articleHeadingClass = "font-semibold text-[#2B4C66] text-[13px] border-s-[3px] border-[#2B4C66] ps-3 py-0.5 mb-1.5";

  const fontFamily = isAr
    ? "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif"
    : "'Segoe UI', Tahoma, sans-serif";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        style={{ fontFamily }}
      >
        {/* Header — premium gradient */}
        <div
          className="px-6 pt-5 pb-4"
          style={{
            background: "linear-gradient(135deg, #2B4C66 0%, #1E374B 60%, #162A3A 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-white tracking-tight">
                  {isAr ? "اتفاقية عمولة المنصة" : "Platform Commission Agreement"}
                </h2>
                <p className="text-[11px] text-white/60 mt-0.5">
                  {isAr ? "الإصدار v1.0 — يجب الموافقة لإكمال التسجيل" : "Version v1.0 — Acceptance required to complete registration"}
                </p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-white/70" strokeWidth={1.5} />
              <span className="text-[11px] text-white/80 font-medium">
                {isAr ? `تاريخ الاتفاقية: ${agreementDate}` : `Agreement Date: ${agreementDate}`}
              </span>
            </div>
          </div>

          {/* Parties section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Party 1: Platform */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-3">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1.5">
                {isAr ? "الطرف الأول" : "First Party"}
              </p>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-white/70 shrink-0" strokeWidth={1.5} />
                <span className="text-[12px] font-bold text-white">
                  {isAr ? "منصة سينا" : "SINA Platform"}
                </span>
              </div>
              <p className="text-[10px] text-white/50">
                {isAr ? "مشغّل المنصة العقارية" : "Real Estate Platform Operator"}
              </p>
            </div>

            {/* Party 2: Developer */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-3">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1.5">
                {isAr ? "الطرف الثاني" : "Second Party"}
              </p>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-white/70 shrink-0" strokeWidth={1.5} />
                <span className="text-[12px] font-bold text-white truncate" title={displayCompany}>
                  {displayCompany}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-white/50 shrink-0" strokeWidth={1.5} />
                <span className="text-[10px] text-white/50 truncate">{displayContact}</span>
              </div>
              {phone?.trim() && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PhoneIcon className="w-3 h-3 text-white/50 shrink-0" strokeWidth={1.5} />
                  <span className="text-[10px] text-white/50 direction-ltr" dir="ltr">{displayPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Commission summary strip */}
        <div className="px-6 py-3 bg-[#F8FAFB] border-b border-gray-100">
          <div className="rounded-xl border border-[#2B4C66]/12 bg-white p-4">
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
                  : "Commission covers the entire transaction value including land and real estate development"}
              </p>
            </div>
          </div>
        </div>

        {/* Agreement text — scrollable */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 text-[12px] leading-[1.9] text-gray-600"
          style={{ fontFamily }}
          onScroll={handleScroll}
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              {isAr ? "نص الاتفاقية الكامل" : "Full Agreement Text"}
            </span>
          </div>

          {isAr ? (
            <div className="space-y-5 whitespace-pre-line">
              <p className="font-bold text-gray-900 text-[15px] text-center pb-2 border-b border-gray-100">
                اتفاقية عمولة منصة سينا للتطوير العقاري
              </p>

              <div>
                <p className={articleHeadingClass}>المادة الأولى: أطراف الاتفاقية</p>
                <p>
                  هذه الاتفاقية مبرمة بين <strong>منصة سينا للتطوير العقاري</strong> (الطرف الأول — المشغّل) و<strong>{displayCompany}</strong> (الطرف الثاني — المطور العقاري) ممثّلاً بـ <strong>{displayContact}</strong>، جوال: <span dir="ltr">{displayPhone}</span>، وذلك بتاريخ <strong>{agreementDate}</strong>.
                </p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة الثانية: نطاق الاتفاقية</p>
                <p>تسري هذه الاتفاقية على جميع الصفقات والشراكات العقارية التي تتم عبر المنصة وتشمل صفقات الأراضي والتطوير العقاري بجميع أنواعها</p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة الثالثة: هيكل العمولة</p>
                <p>1. عمولة الوساطة العقارية: 2.50% من القيمة الإجمالية للصفقة</p>
                <p>2. أتعاب المنصة التشغيلية: 0.50% من القيمة الإجمالية للصفقة</p>
                <p>3. إجمالي حصة المنصة: 3.00% من القيمة الإجمالية للصفقة</p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة الرابعة: نطاق العمولة</p>
                <p>تشمل العمولة المذكورة أعلاه كامل قيمة الصفقة بما في ذلك قيمة الأرض وقيمة التطوير العقاري</p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة الخامسة: التزامات المطور</p>
                <p>1. يلتزم المطور بسداد كامل حصة المنصة عند إتمام الصفقة</p>
                <p>2. يلتزم المطور بعدم التواصل المباشر مع مالك الأرض خارج المنصة بهدف تجاوز العمولة</p>
                <p>3. يلتزم المطور بالحفاظ على سرية المعلومات المتاحة عبر المنصة</p>
                <p>4. يلتزم المطور بعدم استخدام المعلومات المقدمة عبر المنصة لأي غرض خارج نطاق الصفقة</p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة السادسة: السرية وحفظ الحقوق</p>
                <p>1. جميع المعلومات المتبادلة عبر المنصة سرية ومحمية</p>
                <p>2. يحق للمنصة اتخاذ الإجراءات القانونية في حال مخالفة شروط السرية أو تجاوز المنصة</p>
                <p>3. تحتفظ المنصة بحق تعليق أو إلغاء حساب المطور في حال المخالفة</p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة السابعة: مدة الاتفاقية</p>
                <p>تسري هذه الاتفاقية من تاريخ الموافقة عليها وتظل سارية طوال فترة استخدام المطور للمنصة</p>
              </div>

              <div>
                <p className={articleHeadingClass}>المادة الثامنة: القبول والموافقة</p>
                <p>بالموافقة على هذه الاتفاقية يقر <strong>{displayCompany}</strong> ممثّلاً بـ <strong>{displayContact}</strong> بأنه قرأ وفهم جميع البنود المذكورة أعلاه ويوافق عليها بالكامل وبإرادته الحرة</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 whitespace-pre-line">
              <p className="font-bold text-gray-900 text-[15px] text-center pb-2 border-b border-gray-100">
                SINA Real Estate Development Platform Commission Agreement
              </p>

              <div>
                <p className={articleHeadingClass}>Article 1: Parties</p>
                <p>
                  This agreement is entered into between <strong>SINA Real Estate Development Platform</strong> (First Party — the Operator) and <strong>{displayCompany}</strong> (Second Party — the Developer) represented by <strong>{displayContact}</strong>, Phone: <span dir="ltr">{displayPhone}</span>, on <strong>{agreementDate}</strong>.
                </p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 2: Scope</p>
                <p>This agreement applies to all real estate transactions and partnerships conducted through the platform including land deals and real estate development of all types</p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 3: Commission Structure</p>
                <p>1. Real Estate Brokerage Commission: 2.50% of the total transaction value</p>
                <p>2. Platform Operational Fee: 0.50% of the total transaction value</p>
                <p>3. Total Platform Share: 3.00% of the total transaction value</p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 4: Commission Coverage</p>
                <p>The above commission covers the entire transaction value including land value and real estate development value</p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 5: Developer Obligations</p>
                <p>1. The developer commits to paying the full platform share upon deal completion</p>
                <p>2. The developer shall not contact the land owner directly outside the platform to bypass the commission</p>
                <p>3. The developer shall maintain confidentiality of information available through the platform</p>
                <p>4. The developer shall not use information provided through the platform for any purpose outside the scope of the transaction</p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 6: Confidentiality and Rights Protection</p>
                <p>1. All information exchanged through the platform is confidential and protected</p>
                <p>2. The platform reserves the right to take legal action in case of breach of confidentiality or platform bypass</p>
                <p>3. The platform reserves the right to suspend or cancel the developer account in case of violation</p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 7: Duration</p>
                <p>This agreement is effective from the date of acceptance and remains in force throughout the developer use of the platform</p>
              </div>

              <div>
                <p className={articleHeadingClass}>Article 8: Acceptance</p>
                <p>By accepting this agreement, <strong>{displayCompany}</strong> represented by <strong>{displayContact}</strong> acknowledges having read and understood all the above terms and agrees to them fully and voluntarily</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — acceptance area */}
        <div className="px-6 py-5 border-t-2 border-[#2B4C66]/10 bg-gradient-to-b from-gray-50/80 to-gray-100/50">
          {!scrolledToBottom && (
            <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-2.5 text-center mb-4">
              <p className="text-[12px] text-amber-700 font-semibold">
                {isAr ? "يرجى قراءة الاتفاقية كاملة قبل الموافقة" : "Please read the full agreement before accepting"}
              </p>
            </div>
          )}

          <label
            className={`flex items-start gap-3 cursor-pointer mb-4 p-3 rounded-xl border transition-all ${
              !scrolledToBottom
                ? "opacity-50 pointer-events-none border-gray-100 bg-white/50"
                : checked
                  ? "border-[#2B4C66]/25 bg-[#2B4C66]/[0.04]"
                  : "border-gray-200 bg-white hover:border-[#2B4C66]/20"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-0.5 rounded border-gray-300 w-4 h-4 accent-[#2B4C66]"
            />
            <span className="text-[12px] text-gray-700 leading-relaxed">
              {isAr
                ? "أقر بأنني قرأت وفهمت جميع بنود هذه الاتفاقية وأوافق عليها بالكامل بما في ذلك هيكل العمولة (عمولة وساطة 2.50% + رسوم تشغيلية 0.50% = إجمالي 3.00%)"
                : "I confirm that I have read and understood all terms of this agreement and accept them in full including the commission structure (Brokerage 2.50% + Operational 0.50% = Total 3.00%)"}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 h-[46px] border border-gray-200 text-gray-600 text-[13px] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={onAccept}
              disabled={!checked}
              className="flex-1 h-[46px] text-white text-[13px] font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              style={{
                background: checked
                  ? "linear-gradient(135deg, #2B4C66 0%, #1E374B 100%)"
                  : "#2B4C66",
              }}
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
