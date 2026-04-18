import React, { useState } from "react";
import { Shield, FileText, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Building2, User, Phone as PhoneIcon, Calendar, Percent, Scale, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

interface Props {
  isAr: boolean;
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  companyName?: string;
  contactPersonName?: string;
  phone?: string;
  /** Optional developer company logo URL — shown next to the developer name. */
  developerLogoUrl?: string;
  /** Optional CR / commercial registration number for reference in the contract. */
  crNumber?: string;
}

const CommissionAgreementModal: React.FC<Props> = ({
  isAr,
  open,
  onAccept,
  onDecline,
  companyName,
  contactPersonName,
  phone,
  developerLogoUrl,
  crNumber,
}) => {
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const agreementDate = isAr
    ? new Date().toLocaleDateString("ar-SA-u-nu-latn")
    : new Date().toLocaleDateString("en-US");

  // Reference number for contract tracking
  const refNumber = `SINA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const displayCompany = companyName?.trim() || (isAr ? "المطور العقاري" : "The Developer");
  const displayContact = contactPersonName?.trim() || (isAr ? "الممثل المفوّض" : "Authorized Representative");
  const displayPhone = phone?.trim() || (isAr ? "غير محدد" : "Not provided");
  const displayCR = crNumber?.trim() || (isAr ? "غير محدد" : "Not provided");

  const articleHeadingClass = "font-bold text-[#1E374B] text-[16px] border-s-[4px] border-[#2B4C66] ps-4 py-1 mb-3";

  const fontFamily = isAr
    ? "'IBM Plex Sans Arabic', system-ui, sans-serif"
    : "'Inter', system-ui, sans-serif";

  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const handlePrint = () => window.print();

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#F7F8FA] overflow-y-auto agreement-doc"
      dir={isAr ? "rtl" : "ltr"}
      style={{ fontFamily }}
    >
      {/* Print-only styles: renders as a formal letter */}
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }
          body, html { background: white !important; }
          body { visibility: hidden; }
          .agreement-doc, .agreement-doc * { visibility: visible; }
          .agreement-doc {
            position: absolute !important;
            inset: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .agreement-frame {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            page-break-inside: auto;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .agreement-frame > * { page-break-inside: avoid; }
          .agreement-section { break-inside: avoid; page-break-inside: avoid; }
          .print-header {
            display: flex !important;
            border-bottom: 2px solid #1E374B !important;
            padding-bottom: 14px !important;
            margin-bottom: 20px !important;
          }
        }
        .print-only { display: none; }
        .agreement-frame { border: 1px solid rgba(15, 31, 46, 0.12); }
      `}</style>

      {/* Top navigation bar — hidden on print */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 no-print">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 h-[60px] flex items-center justify-between">
          <button
            onClick={onDecline}
            className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-[#2B4C66] transition-colors"
          >
            <BackArrow className="w-4 h-4" strokeWidth={1.5} />
            {isAr ? "العودة للتسجيل" : "Back to Registration"}
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 text-[12px] font-medium text-gray-500 hover:text-[#2B4C66] px-3 py-1.5 rounded-md border border-gray-200 hover:border-[#2B4C66]/30 transition-colors"
              title={isAr ? "طباعة الاتفاقية" : "Print agreement"}
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
              {isAr ? "طباعة" : "Print"}
            </button>
            <Link to="/">
              <img src={logoImg} alt="SINA" className="h-7 w-auto object-contain" />
            </Link>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-[900px] mx-auto px-6 md:px-10 py-10">
        {/* ═══════ OUTER BLACK FRAME ═══════ */}
        <div className="agreement-frame rounded-lg bg-white p-8 md:p-12 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)]">

          {/* ═══════ PRINT-ONLY LETTERHEAD ═══════ */}
          <div className="print-header print-only agreement-section" style={{ alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <img src={logoImg} alt="SINA" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
            <div style={{ textAlign: isAr ? "left" : "right", fontSize: "10px", color: "#6B7280" }}>
              <div style={{ fontWeight: 700, color: "#1E374B", fontSize: "11px", marginBottom: "2px" }}>
                {isAr ? "سينا للتطوير العقاري" : "SINA Real Estate Development"}
              </div>
              <div>{isAr ? `رقم المرجع: ${refNumber}` : `Ref #: ${refNumber}`}</div>
              <div>{isAr ? `تاريخ الإصدار: ${agreementDate}` : `Issued: ${agreementDate}`}</div>
            </div>
          </div>

          {/* ═══════ Page Header (screen) ═══════ */}
          <div className="text-center mb-10 agreement-section no-print">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 p-2" style={{ background: "linear-gradient(135deg, #2B4C66, #1E374B)" }}>
              <img src={logoImg} alt="SINA" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-[28px] md:text-[32px] font-bold text-[#1E374B] tracking-tight mb-3">
              {isAr ? "اتفاقية الخدمات والأتعاب المهنية" : "Professional Services & Fees Agreement"}
            </h1>
            <p className="text-[15px] text-gray-500 max-w-[550px] mx-auto leading-relaxed">
              {isAr
                ? "وثيقة ملزمة قانونياً — يرجى مراجعة جميع البنود بعناية قبل الموافقة"
                : "Legally binding document — please review all clauses carefully before accepting"}
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-[#2B4C66]/[0.06] border border-[#2B4C66]/10">
              <Calendar className="w-3.5 h-3.5 text-[#2B4C66]/60" strokeWidth={1.5} />
              <span className="text-[12px] font-medium text-[#2B4C66]/70">
                {isAr ? `تاريخ: ${agreementDate}` : `Date: ${agreementDate}`}
              </span>
              <span className="text-[11px] text-gray-400 ms-1">• {refNumber}</span>
              <span className="text-[11px] text-gray-400 ms-1">v2.0</span>
            </div>
          </div>

          {/* Print title */}
          <div className="print-only text-center mb-6 agreement-section">
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1E374B", marginBottom: "4px" }}>
              {isAr ? "اتفاقية الخدمات والأتعاب المهنية" : "Professional Services & Fees Agreement"}
            </h1>
            <p style={{ fontSize: "10px", color: "#6B7280" }}>
              {isAr ? "وثيقة رسمية ملزمة قانونياً" : "Official Legally Binding Document"}
            </p>
          </div>

          {/* ═══════ Parties Cards ═══════ */}
          <div className="grid md:grid-cols-2 gap-4 mb-8 agreement-section">
            {/* Party 1: SINA */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] font-bold mb-3">
                {isAr ? "الطرف الأول — مقدّم الخدمات" : "First Party — Service Provider"}
              </p>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2 shrink-0" style={{ background: "linear-gradient(135deg, #2B4C66, #1E374B)" }}>
                  <img src={logoImg} alt="SINA" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-[#1E374B]">{isAr ? "سينا للتطوير العقاري" : "SINA Real Estate Development"}</p>
                  <p className="text-[11px] text-gray-400">{isAr ? "مشغّل ومدير الخدمات العقارية" : "Real Estate Services Operator"}</p>
                </div>
              </div>
            </div>

            {/* Party 2: Developer */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] font-bold mb-3">
                {isAr ? "الطرف الثاني — المطوّر العقاري" : "Second Party — The Developer"}
              </p>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#C2A86B]/15 flex items-center justify-center overflow-hidden shrink-0">
                  {developerLogoUrl ? (
                    <img src={developerLogoUrl} alt={displayCompany} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-5 h-5 text-[#C2A86B]" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-[#1E374B] truncate">{displayCompany}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" strokeWidth={1.5} />
                      {displayContact}
                    </span>
                    {phone?.trim() && (
                      <span className="flex items-center gap-1" dir="ltr">
                        <PhoneIcon className="w-3 h-3" strokeWidth={1.5} />
                        {displayPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ Fees Summary ═══════ */}
          <div className="rounded-2xl border border-[#2B4C66]/10 bg-white p-6 md:p-8 mb-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] agreement-section">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#2B4C66]/[0.07] flex items-center justify-center">
                <Percent className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.5} />
              </div>
              <h2 className="text-[16px] font-bold text-[#1E374B]">
                {isAr ? "ملخص هيكل الأتعاب" : "Fees Structure Summary"}
              </h2>
            </div>
            <div className="space-y-3 text-[15px]">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{isAr ? "عمولة السعي العقاري" : "Real Estate Brokerage Fee"}</span>
                <span className="font-bold text-gray-800 text-[16px]" dir="ltr">2.50%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{isAr ? "أتعاب المنصة" : "Platform Services Fee"}</span>
                <span className="font-bold text-gray-800 text-[16px]" dir="ltr">1.50%</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-[#1E374B] text-[16px]">{isAr ? "إجمالي الأتعاب المهنية" : "Total Professional Fees"}</span>
                <span className="font-bold text-[#2B4C66] text-[20px]" dir="ltr">4.00%</span>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50/80 border border-blue-200/50 p-4">
              <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[13px] text-blue-700 leading-relaxed">
                {isAr
                  ? "تُحتسب الأتعاب من قيمة الأرض فقط (لا تشمل قيمة التطوير العقاري). الاتفاق على آلية الدفع يكون مباشرة بين المالك والمطور."
                  : "Fees are calculated on the land value only (excluding real estate development value). Payment arrangement is directly between the owner and developer."}
              </p>
            </div>
          </div>

          {/* ═══════ Full Agreement Text ═══════ */}
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] mb-8 agreement-section">
            <div className="px-6 md:px-8 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2B4C66]/[0.07] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.5} />
              </div>
              <h2 className="text-[16px] font-bold text-[#1E374B]">
                {isAr ? "نص الاتفاقية الكامل" : "Full Agreement Text"}
              </h2>
            </div>

            <div className="px-6 md:px-8 py-8 text-[15px] leading-[2.1] text-gray-700">
              {isAr ? (
                <div className="space-y-7">
                  <p className="font-bold text-[#1E374B] text-[19px] text-center pb-4 border-b-2 border-[#2B4C66]/10">
                    اتفاقية الخدمات والأتعاب المهنية — سينا للتطوير العقاري
                  </p>

                  <p className="text-[13px] text-gray-500 text-center">
                    أُبرمت بتاريخ <strong>{agreementDate}</strong> — رقم المرجع: <strong>{refNumber}</strong>
                  </p>

                  <div>
                    <p className={articleHeadingClass}>التمهيد</p>
                    <p>
                      بناءً على رغبة الطرفين في تنظيم علاقتهما المهنية، وتحديد حقوقهما والتزاماتهما بما لا يتعارض مع الأنظمة المعمول بها في المملكة العربية السعودية، ولا سيّما نظام الوساطة العقارية ولوائحه التنفيذية الصادرة عن الهيئة العامة للعقار (REGA)، وأنظمة حماية المعلومات والخصوصية ونظام مكافحة التستّر التجاري ونظام مكافحة غسل الأموال، فقد تم إبرام هذه الاتفاقية بإرادة الطرفين وكامل أهليتهما المعتبرة شرعاً ونظاماً.
                    </p>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الأولى: أطراف الاتفاقية</p>
                    <p>
                      أُبرمت هذه الاتفاقية بين:
                    </p>
                    <p className="ps-4 mt-2">
                      <strong>الطرف الأول:</strong> <strong>سينا للتطوير العقاري</strong> — مقدّم الخدمات ومشغّل المنصة.
                    </p>
                    <p className="ps-4">
                      <strong>الطرف الثاني:</strong> <strong>{displayCompany}</strong>{crNumber ? `، سجل تجاري رقم ${displayCR}` : ""} — المطور العقاري، ممثّلاً بـ <strong>{displayContact}</strong>، جوال: <span dir="ltr" className="font-medium">{displayPhone}</span>.
                    </p>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الثانية: التعريفات</p>
                    <div className="space-y-2 ps-1">
                      <p><strong>«المنصة»:</strong> سينا للاستثمارات العقارية الرقمية وما يتبعها من خدمات وساطة عقارية وتسهيل للشراكات والصفقات.</p>
                      <p><strong>«الصفقة»:</strong> أي اتفاق أو عقد ينشأ بين الطرف الثاني وأيّ طرف ثالث (مالك أرض أو مستثمر) بناءً على خدمة قدّمتها المنصة أو معلومة أُتيحت من خلالها.</p>
                      <p><strong>«قيمة الأرض»:</strong> السعر الإجمالي المتفق عليه للأرض في الصفقة، ولا يشمل قيمة التطوير أو البناء.</p>
                      <p><strong>«المعلومات السرية»:</strong> كل بيان أو مستند أو معلومة يُطّلع عليها الطرف الثاني من خلال المنصة، سواء كانت متعلقة بالمالك أو بالأرض أو بأطراف أخرى.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الثالثة: نطاق الاتفاقية</p>
                    <p>تسري هذه الاتفاقية على كل صفقة أو شراكة أو تعامل ينشأ بين الطرف الثاني وأيّ مالك أرض أو طرف ثالث تعرّف إليه أو حصل على بياناته — بشكل مباشر أو غير مباشر — من خلال المنصة، وتستمر سارية طوال فترة استخدام المنصة وبعد ذلك لمدة (24) شهراً من آخر تفاعل.</p>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الرابعة: هيكل الأتعاب المهنية</p>
                    <div className="space-y-2 ps-1">
                      <p>١. <strong>عمولة السعي العقاري:</strong> <span dir="ltr" className="text-[#2B4C66] font-bold">2.50%</span> من قيمة الأرض، مستحقة للوسيط العقاري وفقاً لنظام الوساطة العقارية.</p>
                      <p>٢. <strong>أتعاب المنصة:</strong> <span dir="ltr" className="text-[#2B4C66] font-bold">1.50%</span> من قيمة الأرض، مقابل الخدمات التشغيلية والتقنية والاستشارية التي تقدمها المنصة.</p>
                      <p>٣. <strong>إجمالي الأتعاب المهنية:</strong> <span dir="ltr" className="text-[#2B4C66] font-bold">4.00%</span> من قيمة الأرض.</p>
                      <p className="text-[13px] text-gray-500 italic mt-2">تُحتسب النسب المذكورة على قيمة الأرض فقط ولا تشمل قيمة التطوير أو التشييد.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الخامسة: آلية الدفع واستحقاق الأتعاب</p>
                    <div className="space-y-2 ps-1">
                      <p>١. تستحق الأتعاب فور اكتمال التعاقد النهائي بين المطور ومالك الأرض (سواء كان عقد بيع، أو شراكة، أو تطوير، أو أي صيغة تعاقدية مماثلة).</p>
                      <p>٢. يتم الاتفاق على آلية السداد الفعلية مباشرة بين المالك والمطوّر، على أن تُسدَّد حصة المنصة (4.00%) إلى <strong>سينا للتطوير العقاري</strong> خلال مدة أقصاها (30) يوماً من تاريخ توقيع العقد النهائي.</p>
                      <p>٣. يُعتبر التأخر في السداد خرقاً لهذه الاتفاقية ويترتب عليه فوائد تأخير بحدّ أقصى لا يُخالف الأنظمة السارية، فضلاً عن حق المنصة في اتخاذ الإجراءات القانونية.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة السادسة: التزامات الطرف الثاني (المطور)</p>
                    <div className="space-y-2 ps-1">
                      <p>١. <strong>حسن النية والشفافية:</strong> يلتزم المطوّر بالتصرّف بحسن نية وإفصاح كامل في جميع تعاملاته عبر المنصة.</p>
                      <p>٢. <strong>حظر التحايل:</strong> يُحظر على المطوّر إبرام أي صفقة — بشكل مباشر أو عبر طرف ثالث مرتبط به — مع أيّ مالك أو طرف تعرّف إليه من خلال المنصة دون إشعار سينا وسداد الأتعاب المستحقة. ويُعدّ أي تحايل على هذا الالتزام إخلالاً جسيماً يستوجب التعويض الكامل.</p>
                      <p>٣. <strong>السرية:</strong> يلتزم المطوّر بالحفاظ على سرية جميع المعلومات التي اطّلع عليها عبر المنصة، وعدم إفشائها أو استخدامها لأيّ غرض خارج نطاق الصفقة.</p>
                      <p>٤. <strong>عدم المنافسة غير المشروعة:</strong> يُحظر على المطور استخدام بيانات الملاك أو المعلومات السرية لأيّ نشاط موازٍ أو منافس خلال مدة الاتفاقية وبعد انتهائها لمدة (24) شهراً.</p>
                      <p>٥. <strong>دقة البيانات:</strong> يتحمّل المطوّر كامل المسؤولية عن صحة وكمال البيانات التي يقدمها عند التسجيل واستخدام المنصة.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة السابعة: ضمانات المنصة وحدود المسؤولية</p>
                    <div className="space-y-2 ps-1">
                      <p>١. تقدّم المنصة خدماتها ببذل العناية المهنية المعتادة، ولا تضمن نتيجة أيّ صفقة أو جدوى أيّ استثمار.</p>
                      <p>٢. لا تُعدّ المعلومات المعروضة على المنصة تقييمات عقارية رسمية ولا مشورة استثمارية.</p>
                      <p>٣. يتم التعامل مع المعلومات الشخصية وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الثامنة: السرية وحماية البيانات</p>
                    <div className="space-y-2 ps-1">
                      <p>١. تُعدّ جميع المعلومات المتبادلة بين الطرفين <strong>سرية تامة</strong> ومحمية بموجب هذه الاتفاقية والأنظمة المعمول بها.</p>
                      <p>٢. يلتزم الطرف الثاني بعدم نسخ أو تصوير أو مشاركة أي مستند أو معلومة مع أيّ طرف ثالث دون موافقة كتابية من سينا.</p>
                      <p>٣. يستمر التزام السرية لمدة (5) خمس سنوات من تاريخ انتهاء هذه الاتفاقية.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة التاسعة: الإخلال والجزاءات</p>
                    <div className="space-y-2 ps-1">
                      <p>١. يُعدّ كل مما يلي إخلالاً جوهرياً بالاتفاقية: التحايل على الأتعاب، إفشاء المعلومات السرية، تقديم بيانات كاذبة، أو التواصل المباشر مع المالك لتجاوز المنصة.</p>
                      <p>٢. في حال الإخلال، يحق للمنصة: (أ) المطالبة بكامل الأتعاب المستحقة مضاعفةً كتعويض اتفاقي، (ب) تعليق أو إلغاء حساب المطور، (ج) اتخاذ جميع الإجراءات القانونية والنظامية المتاحة.</p>
                      <p>٣. لا تُخلّ الجزاءات المذكورة بحق المنصة في المطالبة بالأضرار الفعلية والتبعية الإضافية.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة العاشرة: المدة والإنهاء</p>
                    <div className="space-y-2 ps-1">
                      <p>١. تسري هذه الاتفاقية من تاريخ الموافقة عليها إلكترونياً وتظل سارية طوال فترة استخدام المنصة.</p>
                      <p>٢. يحق لأيّ طرف إنهاء الاتفاقية بإشعار كتابي مسبق مدته (30) يوماً، مع بقاء الالتزامات المتعلقة بالسرية والأتعاب المستحقة سارية المفعول بعد الإنهاء.</p>
                      <p>٣. لا يترتب على الإنهاء إسقاط أيّ حقوق نشأت قبله.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الحادية عشرة: القانون الواجب التطبيق وتسوية النزاعات</p>
                    <div className="space-y-2 ps-1">
                      <p>١. تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية وتُفسَّر وفقاً لها.</p>
                      <p>٢. يسعى الطرفان لتسوية أيّ نزاع ودياً، وفي حال تعذّر ذلك يُحال النزاع إلى الجهة القضائية المختصة في مدينة الرياض.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الثانية عشرة: أحكام عامة</p>
                    <div className="space-y-2 ps-1">
                      <p>١. <strong>الإشعارات:</strong> تُرسل عبر البريد الإلكتروني المسجّل لكلا الطرفين وتُعدّ نافذة من تاريخ الإرسال.</p>
                      <p>٢. <strong>الموافقة الإلكترونية:</strong> توقيع الطرف الثاني إلكترونياً على هذه الاتفاقية له ذات الأثر القانوني للتوقيع الكتابي، وفقاً لنظام التعاملات الإلكترونية السعودي.</p>
                      <p>٣. <strong>استقلالية البنود:</strong> بطلان أيّ بند لا يؤثر على باقي البنود.</p>
                      <p>٤. <strong>الاتفاقية الكاملة:</strong> تمثّل هذه الاتفاقية مع ملاحقها كامل التفاهم بين الطرفين، وتلغي ما قبلها من اتفاقيات شفهية أو كتابية.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>المادة الثالثة عشرة: الإقرار والقبول</p>
                    <p>
                      بالموافقة الإلكترونية على هذه الاتفاقية، يُقرّ <strong>{displayCompany}</strong> ممثّلاً بـ <strong>{displayContact}</strong> بأنه قرأ جميع بنود هذه الاتفاقية وفهم محتواها، وأنه يوافق عليها بالكامل وبإرادته الحرة والمنفردة، دون إكراه أو تضليل، وأنه مخوَّل نظاماً بتوقيعها نيابة عن الطرف الثاني.
                    </p>
                  </div>

                  {/* Signature block */}
                  <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-200 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-8 font-semibold">الطرف الأول</p>
                      <p className="text-[13px] text-gray-700 border-t border-gray-300 pt-2">سينا للتطوير العقاري</p>
                      <p className="text-[11px] text-gray-400">التوقيع الإلكتروني المعتمد</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-8 font-semibold">الطرف الثاني</p>
                      <p className="text-[13px] text-gray-700 border-t border-gray-300 pt-2">{displayContact}</p>
                      <p className="text-[11px] text-gray-400">عن {displayCompany}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-7">
                  <p className="font-bold text-[#1E374B] text-[19px] text-center pb-4 border-b-2 border-[#2B4C66]/10">
                    Professional Services & Fees Agreement — SINA Real Estate Development
                  </p>

                  <p className="text-[13px] text-gray-500 text-center">
                    Executed on <strong>{agreementDate}</strong> — Reference: <strong>{refNumber}</strong>
                  </p>

                  <div>
                    <p className={articleHeadingClass}>Preamble</p>
                    <p>Based on the mutual desire of both parties to regulate their professional relationship and define their rights and obligations in accordance with the applicable laws of the Kingdom of Saudi Arabia — including the Real Estate Brokerage Law and its Implementing Regulations issued by the General Real Estate Authority (REGA), the Personal Data Protection Law, the Anti-Concealment Law, and the Anti-Money Laundering Law — this Agreement is entered into by the free and legally valid consent of both parties.</p>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 1: Parties</p>
                    <p>This Agreement is executed between:</p>
                    <p className="ps-4 mt-2">
                      <strong>First Party:</strong> <strong>SINA Real Estate Development</strong> — the Service Provider and platform operator.
                    </p>
                    <p className="ps-4">
                      <strong>Second Party:</strong> <strong>{displayCompany}</strong>{crNumber ? `, CR No. ${displayCR}` : ""} — the Developer, represented by <strong>{displayContact}</strong>, Phone: <span dir="ltr" className="font-medium">{displayPhone}</span>.
                    </p>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 2: Definitions</p>
                    <div className="space-y-2 ps-1">
                      <p><strong>"Platform":</strong> The SINA digital platform and all related brokerage and partnership-facilitation services.</p>
                      <p><strong>"Transaction":</strong> Any agreement or contract entered into between the Second Party and any third party (landowner or investor) based on a service or information made available through the Platform.</p>
                      <p><strong>"Land Value":</strong> The total agreed price of the land, excluding development or construction value.</p>
                      <p><strong>"Confidential Information":</strong> Any data, document, or information accessed by the Second Party through the Platform.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 3: Scope</p>
                    <p>This Agreement applies to every transaction, partnership, or dealing arising between the Second Party and any landowner or third party identified — directly or indirectly — through the Platform, and remains effective throughout the use of the Platform and for twenty-four (24) months following the last interaction.</p>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 4: Professional Fees Structure</p>
                    <div className="space-y-2 ps-1">
                      <p>1. <strong>Real Estate Brokerage Fee:</strong> <span dir="ltr" className="text-[#2B4C66] font-bold">2.50%</span> of the Land Value, due under the Real Estate Brokerage Law.</p>
                      <p>2. <strong>Platform Services Fee:</strong> <span dir="ltr" className="text-[#2B4C66] font-bold">1.50%</span> of the Land Value, for operational, technical, and advisory services.</p>
                      <p>3. <strong>Total Professional Fees:</strong> <span dir="ltr" className="text-[#2B4C66] font-bold">4.00%</span> of the Land Value.</p>
                      <p className="text-[13px] text-gray-500 italic mt-2">All percentages are calculated on the Land Value only and exclude development or construction value.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 5: Payment Mechanism & Accrual</p>
                    <div className="space-y-2 ps-1">
                      <p>1. Fees become due upon the conclusion of the final contract between the Developer and the landowner (whether sale, partnership, development, or equivalent arrangement).</p>
                      <p>2. The actual payment mechanism is agreed directly between the owner and the Developer, provided the Platform's share (4.00%) is remitted to <strong>SINA Real Estate Development</strong> within a maximum of thirty (30) days from signature of the final contract.</p>
                      <p>3. Late payment constitutes a breach and may incur late-payment interest up to the legally permitted maximum, without prejudice to the Platform's right to take legal action.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 6: Developer's Obligations</p>
                    <div className="space-y-2 ps-1">
                      <p>1. <strong>Good Faith & Transparency:</strong> The Developer shall act in good faith and with full disclosure in all Platform dealings.</p>
                      <p>2. <strong>Circumvention Prohibited:</strong> The Developer is prohibited from concluding any transaction — directly or through any related third party — with any owner or party identified through the Platform without notifying SINA and paying the due fees. Any circumvention is a material breach requiring full indemnification.</p>
                      <p>3. <strong>Confidentiality:</strong> The Developer shall maintain the confidentiality of all Platform-sourced information and not disclose or use it outside the scope of the transaction.</p>
                      <p>4. <strong>Non-Compete:</strong> The Developer shall not use owner data or Confidential Information in any parallel or competing activity during the Agreement and for twenty-four (24) months thereafter.</p>
                      <p>5. <strong>Data Accuracy:</strong> The Developer bears full responsibility for the accuracy and completeness of all data provided.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 7: Platform Warranties & Liability Limits</p>
                    <div className="space-y-2 ps-1">
                      <p>1. The Platform provides services with customary professional care and does not warrant the outcome of any transaction or the feasibility of any investment.</p>
                      <p>2. Information presented on the Platform does not constitute official property valuations or investment advice.</p>
                      <p>3. Personal data is handled in accordance with the Saudi Personal Data Protection Law.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 8: Confidentiality & Data Protection</p>
                    <div className="space-y-2 ps-1">
                      <p>1. All information exchanged is <strong>strictly confidential</strong> and protected under this Agreement and applicable law.</p>
                      <p>2. The Second Party shall not copy, photograph, or share any document or information with any third party without SINA's written consent.</p>
                      <p>3. Confidentiality obligations survive for five (5) years after the termination of this Agreement.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 9: Breach & Remedies</p>
                    <div className="space-y-2 ps-1">
                      <p>1. Any of the following constitutes a material breach: circumventing fees, disclosing confidential information, providing false data, or directly contacting the owner to bypass the Platform.</p>
                      <p>2. In case of breach, the Platform is entitled to: (a) claim the full due fees doubled as agreed-upon liquidated damages; (b) suspend or terminate the Developer's account; (c) pursue all available legal remedies.</p>
                      <p>3. The foregoing remedies are without prejudice to the Platform's right to claim additional actual and consequential damages.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 10: Term & Termination</p>
                    <div className="space-y-2 ps-1">
                      <p>1. This Agreement takes effect upon electronic acceptance and remains effective throughout the use of the Platform.</p>
                      <p>2. Either party may terminate the Agreement by thirty (30) days' prior written notice, provided that confidentiality and due-fee obligations survive such termination.</p>
                      <p>3. Termination does not waive any rights accrued prior thereto.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 11: Governing Law & Dispute Resolution</p>
                    <div className="space-y-2 ps-1">
                      <p>1. This Agreement is governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.</p>
                      <p>2. The parties shall seek to settle any dispute amicably; failing which the dispute shall be referred to the competent judicial authority in the city of Riyadh.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 12: General Provisions</p>
                    <div className="space-y-2 ps-1">
                      <p>1. <strong>Notices:</strong> Sent via the parties' registered email and deemed effective as of the date of dispatch.</p>
                      <p>2. <strong>Electronic Consent:</strong> The Second Party's electronic signature has the same legal effect as a handwritten signature, pursuant to the Saudi Electronic Transactions Law.</p>
                      <p>3. <strong>Severability:</strong> Invalidity of any clause does not affect the remaining clauses.</p>
                      <p>4. <strong>Entire Agreement:</strong> This Agreement, together with its annexes, constitutes the entire understanding of the parties and supersedes all prior oral or written agreements.</p>
                    </div>
                  </div>

                  <div>
                    <p className={articleHeadingClass}>Article 13: Acknowledgment & Acceptance</p>
                    <p>By electronically accepting this Agreement, <strong>{displayCompany}</strong>, represented by <strong>{displayContact}</strong>, acknowledges having read and understood all terms, and accepts them in full voluntarily, without coercion or misrepresentation, being legally authorized to execute this Agreement on behalf of the Second Party.</p>
                  </div>

                  <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-200 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-8 font-semibold">First Party</p>
                      <p className="text-[13px] text-gray-700 border-t border-gray-300 pt-2">SINA Real Estate Development</p>
                      <p className="text-[11px] text-gray-400">Certified electronic signature</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-8 font-semibold">Second Party</p>
                      <p className="text-[13px] text-gray-700 border-t border-gray-300 pt-2">{displayContact}</p>
                      <p className="text-[11px] text-gray-400">On behalf of {displayCompany}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ Acceptance Section (screen only) ═══════ */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 md:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] mb-2 no-print agreement-section">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
              </div>
              <h2 className="text-[16px] font-bold text-[#1E374B]">
                {isAr ? "الإقرار والموافقة" : "Acknowledgment & Acceptance"}
              </h2>
            </div>

            <label
              className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-all mb-6 ${
                checked
                  ? "border-[#2B4C66]/30 bg-[#2B4C66]/[0.03] shadow-[0_0_0_4px_rgba(43,76,102,0.06)]"
                  : "border-gray-200 bg-gray-50/50 hover:border-[#2B4C66]/15 hover:bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 rounded border-gray-300 w-5 h-5 accent-[#2B4C66]"
              />
              <span className="text-[14px] text-gray-700 leading-[1.9]">
                {isAr
                  ? "أقر بأنني قرأت وفهمت جميع بنود هذه الاتفاقية وأوافق عليها بالكامل، بما في ذلك هيكل الأتعاب المهنية (عمولة سعي 2.50% + أتعاب المنصة 1.50% = 4.00% من قيمة الأرض)، والتزامات السرية وعدم التحايل، وأنني مخوَّل نظاماً بتوقيعها."
                  : "I confirm that I have read and understood all terms of this Agreement and accept them in full, including the fees structure (Brokerage 2.50% + Platform 1.50% = 4.00% of land value), confidentiality and anti-circumvention obligations, and that I am legally authorized to execute it."}
              </span>
            </label>

            <div className="flex gap-4">
              <button
                onClick={onDecline}
                className="flex-1 h-[52px] border border-gray-200 text-gray-600 text-[14px] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                {isAr ? "العودة" : "Go Back"}
              </button>
              <button
                onClick={onAccept}
                disabled={!checked}
                className="flex-1 h-[52px] text-white text-[14px] font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
                style={{
                  background: checked
                    ? "linear-gradient(135deg, #2B4C66 0%, #1E374B 100%)"
                    : "#9CA3AF",
                }}
              >
                <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                {isAr ? "أوافق وأستكمل التسجيل" : "Accept & Complete Registration"}
              </button>
            </div>
          </div>

        </div>{/* end outer frame */}
      </div>
    </div>
  );
};

export default CommissionAgreementModal;
