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

const OwnerNDAConsentModal: React.FC<Props> = ({ isAr, open, landCity, landDistrict, loading, onAccept, onReject, onClose }) => {
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
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">
                  {isAr ? "اتفاقية عدم الإفصاح — مالك الأرض" : "Non-Disclosure Agreement — Land Owner"}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {isAr ? `الإصدار 1.0 — خاصة بأرضك: ${landLabel}` : `Version 1.0 — For your land: ${landLabel}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 mt-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {isAr
                  ? "يجب الموافقة على هذه الاتفاقية قبل الاطلاع على بيانات المطورين المتقدمين على أرضك. رفض الاتفاقية نهائي ولا يمكن التراجع عنه لهذه الأرض."
                  : "You must accept this agreement before viewing developer details for applicants on your land. Rejection is final and cannot be reversed for this land."}
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
              <p className="font-bold text-gray-800 text-[14px]">اتفاقية عدم الإفصاح — مالك الأرض — منصة سينا للتطوير العقاري</p>

              <div>
                <p className="font-semibold text-gray-800">المادة الأولى: أطراف الاتفاقية</p>
                <p>هذه الاتفاقية مبرمة بين منصة سينا للتطوير العقاري (المشغّل) ومالك الأرض (الطرف الثاني) المسجّل في المنصة، وتتعلق بالأرض المحددة: <strong>{landLabel}</strong></p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثانية: نطاق السرية</p>
                <p>يلتزم مالك الأرض بالحفاظ على سرية كافة المعلومات المتعلقة بالمطورين المتقدمين على أرضه عبر المنصة، بما في ذلك:</p>
                <p>1. هوية المطورين وأسماء شركاتهم وعلاماتهم التجارية</p>
                <p>2. المقترحات والدراسات المقدمة من المطورين</p>
                <p>3. التقارير والتحليلات التي تقدمها المنصة عن المطورين</p>
                <p>4. شروط التفاوض والأسعار المطروحة</p>
                <p>5. أي معلومات أخرى يتم تبادلها عبر المنصة بخصوص هذه الفرصة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الثالثة: التزامات مالك الأرض</p>
                <p>1. عدم إفشاء بيانات المطورين لأي طرف ثالث دون موافقة خطية من المنصة</p>
                <p>2. عدم التواصل المباشر مع المطورين خارج المنصة بهدف تجاوز المنصة أو عمولتها</p>
                <p>3. عدم استخدام المعلومات المقدمة عن المطورين لأي غرض خارج نطاق تقييم الشراكة</p>
                <p>4. اتخاذ التدابير المعقولة لحماية المعلومات السرية من الوصول غير المصرح به</p>
                <p>5. إبلاغ المنصة فوراً في حال حدوث أي اختراق أو إفشاء غير مقصود</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الرابعة: مدة السرية</p>
                <p>تسري التزامات السرية من تاريخ قبول هذه الاتفاقية وتستمر لمدة ثلاث (3) سنوات بعد انتهاء العلاقة التعاقدية أو إغلاق جميع الطلبات على هذه الأرض، أيهما لاحق.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة الخامسة: الاستثناءات</p>
                <p>لا تشمل التزامات السرية المعلومات التي:</p>
                <p>1. أصبحت متاحة للعموم دون خطأ من مالك الأرض</p>
                <p>2. كانت بحوزة مالك الأرض قبل تلقيها عبر المنصة مع إثبات ذلك</p>
                <p>3. تم الحصول عليها من مصدر مستقل دون انتهاك لالتزامات السرية</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة السادسة: الجزاءات</p>
                <p>في حال مخالفة أحكام هذه الاتفاقية:</p>
                <p>1. يحق للمنصة تعليق أو إلغاء حساب مالك الأرض فوراً</p>
                <p>2. يحق للمنصة المطالبة بالتعويض عن أي أضرار ناتجة عن الإخلال</p>
                <p>3. يحق للمنصة اتخاذ كافة الإجراءات القانونية المتاحة</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">المادة السابعة: القبول</p>
                <p>بالموافقة على هذه الاتفاقية يقر مالك الأرض بأنه قرأ وفهم جميع البنود أعلاه ويوافق عليها بالكامل وبإرادته الحرة، ويدرك أن رفض هذه الاتفاقية يمنعه من الاطلاع على بيانات المطورين المتقدمين على هذه الأرض.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 whitespace-pre-line font-[inherit]">
              <p className="font-bold text-gray-800 text-[14px]">Non-Disclosure Agreement — Land Owner — SINA Real Estate Development Platform</p>

              <div>
                <p className="font-semibold text-gray-800">Article 1: Parties</p>
                <p>This agreement is entered into between SINA Real Estate Development Platform (the Operator) and the Land Owner (Second Party) registered on the platform, in relation to the land: <strong>{landLabel}</strong></p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 2: Scope of Confidentiality</p>
                <p>The land owner commits to maintaining the confidentiality of all information related to developers who have applied for their land through the platform, including:</p>
                <p>1. Developer identities, company names, and brand names</p>
                <p>2. Proposals and studies submitted by developers</p>
                <p>3. Reports and analyses provided by the platform about developers</p>
                <p>4. Negotiation terms and proposed pricing</p>
                <p>5. Any other information exchanged through the platform regarding this opportunity</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 3: Land Owner Obligations</p>
                <p>1. Not to disclose developer data to any third party without written consent from the platform</p>
                <p>2. Not to contact developers directly outside the platform to bypass the platform or its commission</p>
                <p>3. Not to use information provided about developers for any purpose outside the scope of evaluating the partnership</p>
                <p>4. To take reasonable measures to protect confidential information from unauthorized access</p>
                <p>5. To immediately notify the platform in case of any breach or unintended disclosure</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 4: Duration of Confidentiality</p>
                <p>Confidentiality obligations are effective from the date of acceptance and continue for three (3) years after the end of the contractual relationship or closure of all requests on this land, whichever is later.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 5: Exceptions</p>
                <p>Confidentiality obligations do not cover information that:</p>
                <p>1. Has become publicly available without fault of the land owner</p>
                <p>2. Was in the land owner's possession prior to receiving it through the platform, with proof thereof</p>
                <p>3. Was obtained from an independent source without breach of confidentiality obligations</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 6: Penalties</p>
                <p>In case of violation of this agreement:</p>
                <p>1. The platform reserves the right to immediately suspend or cancel the land owner's account</p>
                <p>2. The platform reserves the right to claim compensation for any damages resulting from the breach</p>
                <p>3. The platform reserves the right to take all available legal actions</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Article 7: Acceptance</p>
                <p>By accepting this agreement, the land owner acknowledges having read and understood all the above terms and agrees to them fully and voluntarily, and understands that rejecting this agreement prevents them from viewing developer details for applicants on this land.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
                ? "أقر بأنني قرأت وفهمت جميع بنود اتفاقية عدم الإفصاح الخاصة بأرضي وأوافق عليها بالكامل"
                : "I confirm that I have read and understood all terms of this Non-Disclosure Agreement for my land and accept them in full"}
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

export default OwnerNDAConsentModal;
