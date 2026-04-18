import React, { useState } from "react";
import { Shield, FileText, AlertTriangle, CheckCircle2, X, XCircle, Loader2 } from "lucide-react";

interface Props {
  isAr: boolean;
  open: boolean;
  landCity: string;
  landDistrict?: string;
  loading?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

const NDAConsentModal: React.FC<Props> = ({ isAr, open, landCity, landDistrict, loading, onAccept, onReject, onClose }) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const landLabel = landDistrict ? `${landCity} - ${landDistrict}` : landCity;

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
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">
                  {isAr ? "اتفاقية عدم الإفصاح" : "Non-Disclosure Agreement"}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {isAr ? `الإصدار 1.0 — خاصة بالفرصة: ${landLabel}` : `Version 1.0 — For opportunity: ${landLabel}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scope notice */}
          <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-4 mt-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {isAr
                  ? "هذه الاتفاقية خاصة بالفرصة العقارية المحددة أعلاه. يجب الموافقة عليها قبل تقديم طلب الشراكة. رفض الاتفاقية نهائي ولا يمكن التراجع عنه لهذه الفرصة."
                  : "This agreement is specific to the real estate opportunity identified above. Acceptance is required before submitting a partnership request. Rejection is final and cannot be reversed for this opportunity."}
              </p>
            </div>
          </div>
        </div>

        {/* NDA text — scrollable */}
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
              <p className="font-bold text-gray-800 text-[14px]">اتفاقية عدم الإفصاح — سينا للاستثمارات العقارية للتطوير العقاري</p>

              <div>
                <p className="font-semibold text-gray-800">المادة الأولى: أطراف الاتفاقية</p>
                <p>هذه الاتفاقية مبرمة بين سينا للاستثمارات العقارية للتطوير العقاري (المشغّل) والمطور العقاري (الطرف الثاني) المسجّل في المنصة، وتتعلق بالفرصة العقارية المحددة: <strong>{landLabel}</strong></p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثانية: نطاق السرية</p>
                <p>يلتزم المطور بالحفاظ على سرية كافة المعلومات المتعلقة بالفرصة العقارية المحددة، بما في ذلك على سبيل المثال لا الحصر:</p>
                <p>1. بيانات الأرض والموقع والمساحة والمخططات</p>
                <p>2. الدراسات والتقارير الفنية والمالية المقدمة عبر المنصة</p>
                <p>3. هوية مالك الأرض وبيانات التواصل معه (عند الكشف عنها)</p>
                <p>4. شروط الشراكة والتفاوض والأسعار</p>
                <p>5. أي معلومات أخرى يتم تبادلها عبر المنصة بخصوص هذه الفرصة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثالثة: التزامات المطور</p>
                <p>1. عدم إفشاء أي معلومات سرية لأي طرف ثالث دون موافقة خطية مسبقة من المنصة</p>
                <p>2. عدم استخدام المعلومات السرية لأي غرض خارج نطاق تقييم الفرصة العقارية والتقدم لها</p>
                <p>3. عدم التواصل المباشر مع مالك الأرض خارج المنصة بهدف تجاوز المنصة أو عمولتها</p>
                <p>4. اتخاذ التدابير المعقولة لحماية المعلومات السرية من الوصول غير المصرح به</p>
                <p>5. إبلاغ المنصة فوراً في حال حدوث أي اختراق أو إفشاء غير مقصود</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الرابعة: مدة السرية</p>
                <p>تسري التزامات السرية من تاريخ قبول هذه الاتفاقية وتستمر لمدة ثلاث (3) سنوات بعد انتهاء العلاقة التعاقدية أو إغلاق الفرصة العقارية، أيهما لاحق.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الخامسة: الاستثناءات</p>
                <p>لا تشمل التزامات السرية المعلومات التي:</p>
                <p>1. أصبحت متاحة للعموم دون خطأ من المطور</p>
                <p>2. كانت بحوزة المطور قبل تلقيها عبر المنصة مع إثبات ذلك</p>
                <p>3. تم الحصول عليها من مصدر مستقل دون انتهاك لالتزامات السرية</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة السادسة: الجزاءات</p>
                <p>في حال مخالفة أحكام هذه الاتفاقية:</p>
                <p>1. يحق للمنصة تعليق أو إلغاء حساب المطور فوراً</p>
                <p>2. يحق للمنصة المطالبة بالتعويض عن أي أضرار ناتجة عن الإخلال</p>
                <p>3. يحق للمنصة اتخاذ كافة الإجراءات القانونية المتاحة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة السابعة: القبول</p>
                <p>بالموافقة على هذه الاتفاقية يقر المطور بأنه قرأ وفهم جميع البنود أعلاه ويوافق عليها بالكامل وبإرادته الحرة، ويدرك أن رفض هذه الاتفاقية يمنعه من التقدم لهذه الفرصة العقارية المحددة.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 whitespace-pre-line font-[inherit]">
              <p className="font-bold text-gray-800 text-[14px]">Non-Disclosure Agreement — SINA Real Estate Development Platform</p>

              <div>
                <p className="font-semibold text-gray-800">Article 1: Parties</p>
                <p>This agreement is entered into between SINA Real Estate Development Platform (the Operator) and the Real Estate Developer (Second Party) registered on the platform, in relation to the specific real estate opportunity: <strong>{landLabel}</strong></p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 2: Scope of Confidentiality</p>
                <p>The developer commits to maintaining the confidentiality of all information related to the specified real estate opportunity, including but not limited to:</p>
                <p>1. Land data, location, area, and plans</p>
                <p>2. Technical and financial studies and reports provided through the platform</p>
                <p>3. The identity and contact details of the land owner (when disclosed)</p>
                <p>4. Partnership terms, negotiation details, and pricing</p>
                <p>5. Any other information exchanged through the platform regarding this opportunity</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 3: Developer Obligations</p>
                <p>1. Not to disclose any confidential information to any third party without prior written consent from the platform</p>
                <p>2. Not to use confidential information for any purpose outside the scope of evaluating and applying for the real estate opportunity</p>
                <p>3. Not to contact the land owner directly outside the platform to bypass the platform or its commission</p>
                <p>4. To take reasonable measures to protect confidential information from unauthorized access</p>
                <p>5. To immediately notify the platform in case of any breach or unintended disclosure</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 4: Duration of Confidentiality</p>
                <p>Confidentiality obligations are effective from the date of acceptance of this agreement and continue for three (3) years after the end of the contractual relationship or the closure of the real estate opportunity, whichever is later.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 5: Exceptions</p>
                <p>Confidentiality obligations do not cover information that:</p>
                <p>1. Has become publicly available without fault of the developer</p>
                <p>2. Was in the developer's possession prior to receiving it through the platform, with proof thereof</p>
                <p>3. Was obtained from an independent source without breach of confidentiality obligations</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 6: Penalties</p>
                <p>In case of violation of this agreement:</p>
                <p>1. The platform reserves the right to immediately suspend or cancel the developer's account</p>
                <p>2. The platform reserves the right to claim compensation for any damages resulting from the breach</p>
                <p>3. The platform reserves the right to take all available legal actions</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 7: Acceptance</p>
                <p>By accepting this agreement, the developer acknowledges having read and understood all the above terms and agrees to them fully and voluntarily, and understands that rejecting this agreement prevents them from applying for this specific real estate opportunity.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — acceptance */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {!scrolledToBottom && (
            <p className="text-[11px] text-amber-600 text-center mb-3 font-medium">
              {isAr ? "يرجى قراءة الاتفاقية كاملة قبل الموافقة أو الرفض" : "Please read the full agreement before accepting or rejecting"}
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
                ? "أقر بأنني قرأت وفهمت جميع بنود اتفاقية عدم الإفصاح الخاصة بهذه الفرصة العقارية وأوافق عليها بالكامل"
                : "I confirm that I have read and understood all terms of this Non-Disclosure Agreement for this real estate opportunity and accept them in full"}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={!scrolledToBottom || loading}
              className="flex-1 h-[44px] border border-red-200 text-red-600 text-[13px] font-semibold rounded-xl hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" strokeWidth={1.5} />
              {isAr ? "أرفض الاتفاقية" : "Reject Agreement"}
            </button>
            <button
              onClick={onAccept}
              disabled={!checked || loading}
              className="flex-1 h-[44px] bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
              )}
              {isAr ? "أوافق على الاتفاقية" : "Accept Agreement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NDAConsentModal;
