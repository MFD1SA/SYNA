import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { logAudit } from "@/lib/auditLog";
import CrmLayout from "@/components/crm/CrmLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Mail,
  AlertTriangle,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  Download,
  User,
  MapPin,
  Scale,
  LockKeyhole,
  Pencil,
  Save,
  Loader2,
  Settings as SettingsIcon,
} from "lucide-react";
import { getMyCommissionAgreement, type DeveloperAgreement } from "@/services/agreements.service";
import AvatarUpload from "@/components/shared/AvatarUpload";
import logoImg from "@/assets/logo.png";

type DeveloperRow = Tables<"developers">;

const MAX_FILE_SIZE = 20 * 1024 * 1024;

/* Platform-wide password policy. Keep in lock-step with AdminSettings and
 * OwnerSettings — all three must agree so a user cannot circumvent the rule
 * by resetting from a weaker panel. Supabase default is 6; 10 is what the
 * current auth_password_policies recommendation requires. */
const MIN_PASSWORD_LENGTH = 10;

/* ── HTML escape helper ────────────────────────────────────────────
 * Defence-in-depth: developer-supplied fields (company name, contact)
 * are interpolated directly into the agreement HTML. Even though the
 * data was sanitised at insert time, encoding here means the printed
 * document never accidentally renders unintended HTML. */
function escAttr(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── Helper: Generate legally-rigorous agreement document in new tab ─
 *
 * Why this exists separately from the on-screen modal: the modal lives
 * inside the SPA, but admins need to print the agreement for hand-signing,
 * email it for the developer's records, and archive a self-contained
 * file. This generator produces an A4-paginated, frame-bordered, dual-
 * logo, fully-articled legal document mirroring the modal — but as a
 * standalone HTML document that prints cleanly and renders identically
 * regardless of the SPA's current state.
 *
 * Visual contract (single A4 page or paginated as needed):
 *
 *   ╔═══════════════════════════════════════════════════════════════╗
 *   ║   [SINA logo]              [Developer logo or initial]         ║
 *   ║   Reference, Date, Version row                                ║
 *   ║                                                               ║
 *   ║   Title block + tagline                                       ║
 *   ║                                                               ║
 *   ║   PARTY 1 cards │ PARTY 2 cards                                ║
 *   ║                                                               ║
 *   ║   FEES summary table                                          ║
 *   ║                                                               ║
 *   ║   ARTICLE 1 — Parties                                         ║
 *   ║   ARTICLE 2 — Definitions                                     ║
 *   ║   …                                                           ║
 *   ║   ARTICLE 13 — Acknowledgment & Acceptance                    ║
 *   ║                                                               ║
 *   ║   [Signature: SINA] [Signature: Developer] [Stamp]            ║
 *   ║                                                               ║
 *   ║   Footer: page numbers, ref no., generated-at timestamp       ║
 *   ╚═══════════════════════════════════════════════════════════════╝
 *
 * Direction-safe: passes `dir` on <html>, uses logical text-align in CSS.
 * Logos: SINA logo is loaded from the deployed origin so the new-tab
 * blob URL can resolve it; the developer logo is already a public
 * Supabase URL or null (in which case we fall back to a styled initial). */
function generateAgreementPdf(
  agreement: DeveloperAgreement,
  developer: DeveloperRow | null,
  developerLogoUrl: string | null,
  isAr: boolean,
) {
  // Current canonical commission structure (v2.0)
  const CURRENT_BROKERAGE = 2.50;
  const CURRENT_OPERATIONAL = 1.50;
  const CURRENT_TOTAL = 4.00;
  const CURRENT_VERSION = "v2.0";

  const title = isAr ? "اتفاقية الخدمات والأتعاب المهنية" : "Professional Services & Fees Agreement";
  const subtitle = isAr ? "وثيقة رسمية ملزمة قانونياً" : "Official Legally Binding Document";

  const acceptedRaw = agreement.accepted_at;
  const acceptedDate = acceptedRaw
    ? new Date(acceptedRaw).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const today = new Date().toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Reference number — derived from agreement.id where possible, otherwise
  // synthesised so the document always has a unique identifier.
  const refNumber = `SINA-${new Date().getFullYear()}-${(agreement.id || "").substring(0, 6).toUpperCase() || String(Date.now()).slice(-6)}`;

  // Developer identity (legal party) ─────────────────────────────────
  const companyName = developer?.company_name?.trim() || (isAr ? "المطور العقاري" : "The Developer");
  const contactName = developer?.contact_person_name?.trim() || (isAr ? "الممثل المفوّض" : "Authorised Representative");
  const phone = developer?.phone?.trim() || (isAr ? "غير محدد" : "Not provided");
  const email = developer?.email?.trim() || "—";
  const crNumber = developer?.cr_number?.trim() || (isAr ? "غير محدد" : "Not provided");
  const city = developer?.city?.trim() || "—";

  // Logos — SINA logo must be an absolute URL so the blob:// new tab can
  // resolve it. Vite imports give us a relative path like /assets/logo-x.png.
  const sinaLogoUrl = `${window.location.origin}${logoImg}`;
  const devLogoBlock = developerLogoUrl
    ? `<img src="${escAttr(developerLogoUrl)}" alt="${escAttr(companyName)}" style="width:100%;height:100%;object-fit:contain;padding:4px;" />`
    : `<div style="font-size:18px;font-weight:700;color:#C45A41;">${escAttr(companyName.charAt(0).toUpperCase())}</div>`;

  // Localised number formatter for percentages — Arabic-Indic numerals
  // would break the print layout in many PDF viewers, so we always use
  // Latin numerals with explicit dir="ltr" wrappers.
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;

  // ─── Article body — bilingual, all 13 clauses ────────────────────
  const articlesAr = `
    <h2 class="art-h">التمهيد</h2>
    <p>بناءً على رغبة الطرفين في تنظيم علاقتهما المهنية، وتحديد حقوقهما والتزاماتهما بما لا يتعارض مع الأنظمة المعمول بها في المملكة العربية السعودية، ولا سيّما نظام الوساطة العقارية ولوائحه التنفيذية الصادرة عن الهيئة العامة للعقار (REGA)، ونظام حماية البيانات الشخصية، ونظام مكافحة التستّر التجاري، ونظام مكافحة غسل الأموال، فقد تم إبرام هذه الاتفاقية بإرادة الطرفين وكامل أهليتهما المعتبرة شرعاً ونظاماً.</p>

    <h2 class="art-h">المادة الأولى: أطراف الاتفاقية</h2>
    <p>أُبرمت هذه الاتفاقية بين:</p>
    <p class="indent"><strong>الطرف الأول:</strong> <strong>سينا للتطوير العقاري</strong> — مقدّم الخدمات ومشغّل المنصة.</p>
    <p class="indent"><strong>الطرف الثاني:</strong> <strong>${escAttr(companyName)}</strong>${developer?.cr_number ? `، سجل تجاري رقم <span dir="ltr">${escAttr(crNumber)}</span>` : ""} — المطور العقاري، ممثّلاً بـ <strong>${escAttr(contactName)}</strong>، جوال: <span dir="ltr">${escAttr(phone)}</span>${developer?.email ? `، بريد إلكتروني: <span dir="ltr">${escAttr(email)}</span>` : ""}${developer?.city ? `، المدينة: ${escAttr(city)}` : ""}.</p>

    <h2 class="art-h">المادة الثانية: التعريفات</h2>
    <p><strong>«المنصة»:</strong> سينا للاستثمارات العقارية الرقمية وما يتبعها من خدمات وساطة عقارية وتسهيل للشراكات والصفقات.</p>
    <p><strong>«الصفقة»:</strong> أي اتفاق أو عقد ينشأ بين الطرف الثاني وأيّ طرف ثالث (مالك أرض أو مستثمر) بناءً على خدمة قدّمتها المنصة أو معلومة أُتيحت من خلالها.</p>
    <p><strong>«قيمة الأرض»:</strong> السعر الإجمالي المتفق عليه للأرض في الصفقة، ولا يشمل قيمة التطوير أو البناء.</p>
    <p><strong>«المعلومات السرية»:</strong> كل بيان أو مستند أو معلومة يُطّلع عليها الطرف الثاني من خلال المنصة، سواء كانت متعلقة بالمالك أو بالأرض أو بأطراف أخرى.</p>

    <h2 class="art-h">المادة الثالثة: نطاق الاتفاقية</h2>
    <p>تسري هذه الاتفاقية على كل صفقة أو شراكة أو تعامل ينشأ بين الطرف الثاني وأيّ مالك أرض أو طرف ثالث تعرّف إليه أو حصل على بياناته — بشكل مباشر أو غير مباشر — من خلال المنصة، وتستمر سارية طوال فترة استخدام المنصة وبعد ذلك لمدة (24) شهراً من آخر تفاعل.</p>

    <h2 class="art-h">المادة الرابعة: هيكل الأتعاب المهنية</h2>
    <p>١. <strong>عمولة السعي العقاري:</strong> <span dir="ltr" class="rate">${fmtPct(CURRENT_BROKERAGE)}</span> من قيمة الأرض، مستحقة للوسيط العقاري وفقاً لنظام الوساطة العقارية.</p>
    <p>٢. <strong>أتعاب المنصة:</strong> <span dir="ltr" class="rate">${fmtPct(CURRENT_OPERATIONAL)}</span> من قيمة الأرض، مقابل الخدمات التشغيلية والتقنية والاستشارية التي تقدمها المنصة.</p>
    <p>٣. <strong>إجمالي الأتعاب المهنية:</strong> <span dir="ltr" class="rate">${fmtPct(CURRENT_TOTAL)}</span> من قيمة الأرض.</p>
    <p class="note">تُحتسب النسب المذكورة على قيمة الأرض فقط ولا تشمل قيمة التطوير أو التشييد.</p>

    <h2 class="art-h">المادة الخامسة: آلية الدفع واستحقاق الأتعاب</h2>
    <p>١. تستحق الأتعاب فور اكتمال التعاقد النهائي بين المطور ومالك الأرض (سواء كان عقد بيع، أو شراكة، أو تطوير، أو أي صيغة تعاقدية مماثلة).</p>
    <p>٢. يتم الاتفاق على آلية السداد الفعلية مباشرة بين المالك والمطوّر، على أن تُسدَّد حصة المنصة (${fmtPct(CURRENT_TOTAL)}) إلى <strong>سينا للتطوير العقاري</strong> خلال مدة أقصاها (30) يوماً من تاريخ توقيع العقد النهائي.</p>
    <p>٣. يُعتبر التأخر في السداد خرقاً لهذه الاتفاقية ويترتب عليه فوائد تأخير بحدّ أقصى لا يُخالف الأنظمة السارية، فضلاً عن حق المنصة في اتخاذ الإجراءات القانونية.</p>

    <h2 class="art-h">المادة السادسة: التزامات الطرف الثاني (المطور)</h2>
    <p>١. <strong>حسن النية والشفافية:</strong> يلتزم المطوّر بالتصرّف بحسن نية وإفصاح كامل في جميع تعاملاته عبر المنصة.</p>
    <p>٢. <strong>حظر التحايل:</strong> يُحظر على المطوّر إبرام أي صفقة — بشكل مباشر أو عبر طرف ثالث مرتبط به — مع أيّ مالك أو طرف تعرّف إليه من خلال المنصة دون إشعار سينا وسداد الأتعاب المستحقة. ويُعدّ أي تحايل على هذا الالتزام إخلالاً جسيماً يستوجب التعويض الكامل.</p>
    <p>٣. <strong>السرية:</strong> يلتزم المطوّر بالحفاظ على سرية جميع المعلومات التي اطّلع عليها عبر المنصة، وعدم إفشائها أو استخدامها لأيّ غرض خارج نطاق الصفقة.</p>
    <p>٤. <strong>عدم المنافسة غير المشروعة:</strong> يُحظر على المطور استخدام بيانات الملاك أو المعلومات السرية لأيّ نشاط موازٍ أو منافس خلال مدة الاتفاقية وبعد انتهائها لمدة (24) شهراً.</p>
    <p>٥. <strong>دقة البيانات:</strong> يتحمّل المطوّر كامل المسؤولية عن صحة وكمال البيانات التي يقدمها عند التسجيل واستخدام المنصة.</p>

    <h2 class="art-h">المادة السابعة: ضمانات المنصة وحدود المسؤولية</h2>
    <p>١. تقدّم المنصة خدماتها ببذل العناية المهنية المعتادة، ولا تضمن نتيجة أيّ صفقة أو جدوى أيّ استثمار.</p>
    <p>٢. لا تُعدّ المعلومات المعروضة على المنصة تقييمات عقارية رسمية ولا مشورة استثمارية.</p>
    <p>٣. يتم التعامل مع المعلومات الشخصية وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية.</p>

    <h2 class="art-h">المادة الثامنة: السرية وحماية البيانات</h2>
    <p>١. تُعدّ جميع المعلومات المتبادلة بين الطرفين <strong>سرية تامة</strong> ومحمية بموجب هذه الاتفاقية والأنظمة المعمول بها.</p>
    <p>٢. يلتزم الطرف الثاني بعدم نسخ أو تصوير أو مشاركة أي مستند أو معلومة مع أيّ طرف ثالث دون موافقة كتابية من سينا.</p>
    <p>٣. يستمر التزام السرية لمدة (5) خمس سنوات من تاريخ انتهاء هذه الاتفاقية.</p>

    <h2 class="art-h">المادة التاسعة: الإخلال والجزاءات</h2>
    <p>١. يُعدّ كل مما يلي إخلالاً جوهرياً بالاتفاقية: التحايل على الأتعاب، إفشاء المعلومات السرية، تقديم بيانات كاذبة، أو التواصل المباشر مع المالك لتجاوز المنصة.</p>
    <p>٢. في حال الإخلال، يحق للمنصة: (أ) المطالبة بكامل الأتعاب المستحقة مضاعفةً كتعويض اتفاقي، (ب) تعليق أو إلغاء حساب المطور، (ج) اتخاذ جميع الإجراءات القانونية والنظامية المتاحة.</p>
    <p>٣. لا تُخلّ الجزاءات المذكورة بحق المنصة في المطالبة بالأضرار الفعلية والتبعية الإضافية.</p>

    <h2 class="art-h">المادة العاشرة: المدة والإنهاء</h2>
    <p>١. تسري هذه الاتفاقية من تاريخ الموافقة عليها إلكترونياً وتظل سارية طوال فترة استخدام المنصة.</p>
    <p>٢. يحق لأيّ طرف إنهاء الاتفاقية بإشعار كتابي مسبق مدته (30) يوماً، مع بقاء الالتزامات المتعلقة بالسرية والأتعاب المستحقة سارية المفعول بعد الإنهاء.</p>
    <p>٣. لا يترتب على الإنهاء إسقاط أيّ حقوق نشأت قبله.</p>

    <h2 class="art-h">المادة الحادية عشرة: القانون الواجب التطبيق وتسوية النزاعات</h2>
    <p>١. تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية وتُفسَّر وفقاً لها.</p>
    <p>٢. يسعى الطرفان لتسوية أيّ نزاع ودياً، وفي حال تعذّر ذلك يُحال النزاع إلى الجهة القضائية المختصة في مدينة الرياض.</p>

    <h2 class="art-h">المادة الثانية عشرة: أحكام عامة</h2>
    <p>١. <strong>الإشعارات:</strong> تُرسل عبر البريد الإلكتروني المسجّل لكلا الطرفين وتُعدّ نافذة من تاريخ الإرسال.</p>
    <p>٢. <strong>الموافقة الإلكترونية:</strong> توقيع الطرف الثاني إلكترونياً على هذه الاتفاقية له ذات الأثر القانوني للتوقيع الكتابي، وفقاً لنظام التعاملات الإلكترونية السعودي.</p>
    <p>٣. <strong>استقلالية البنود:</strong> بطلان أيّ بند لا يؤثر على باقي البنود.</p>
    <p>٤. <strong>الاتفاقية الكاملة:</strong> تمثّل هذه الاتفاقية مع ملاحقها كامل التفاهم بين الطرفين، وتلغي ما قبلها من اتفاقيات شفهية أو كتابية.</p>

    <h2 class="art-h">المادة الثالثة عشرة: الإقرار والقبول</h2>
    <p>بالموافقة الإلكترونية على هذه الاتفاقية، يُقرّ <strong>${escAttr(companyName)}</strong> ممثّلاً بـ <strong>${escAttr(contactName)}</strong> بأنه قرأ جميع بنود هذه الاتفاقية وفهم محتواها، وأنه يوافق عليها بالكامل وبإرادته الحرة والمنفردة، دون إكراه أو تضليل، وأنه مخوَّل نظاماً بتوقيعها نيابة عن الطرف الثاني.</p>
  `;

  const articlesEn = `
    <h2 class="art-h">Preamble</h2>
    <p>Based on the mutual desire of both parties to regulate their professional relationship and define their rights and obligations in accordance with the applicable laws of the Kingdom of Saudi Arabia — including the Real Estate Brokerage Law and its Implementing Regulations issued by the General Real Estate Authority (REGA), the Personal Data Protection Law, the Anti-Concealment Law, and the Anti-Money Laundering Law — this Agreement is entered into by the free and legally valid consent of both parties.</p>

    <h2 class="art-h">Article 1: Parties</h2>
    <p>This Agreement is executed between:</p>
    <p class="indent"><strong>First Party:</strong> <strong>SINA Real Estate Development</strong> — the Service Provider and platform operator.</p>
    <p class="indent"><strong>Second Party:</strong> <strong>${escAttr(companyName)}</strong>${developer?.cr_number ? `, CR No. <span dir="ltr">${escAttr(crNumber)}</span>` : ""} — the Developer, represented by <strong>${escAttr(contactName)}</strong>, Phone: <span dir="ltr">${escAttr(phone)}</span>${developer?.email ? `, Email: <span dir="ltr">${escAttr(email)}</span>` : ""}${developer?.city ? `, City: ${escAttr(city)}` : ""}.</p>

    <h2 class="art-h">Article 2: Definitions</h2>
    <p><strong>"Platform":</strong> The SINA digital platform and all related brokerage and partnership-facilitation services.</p>
    <p><strong>"Transaction":</strong> Any agreement or contract entered into between the Second Party and any third party (landowner or investor) based on a service or information made available through the Platform.</p>
    <p><strong>"Land Value":</strong> The total agreed price of the land, excluding development or construction value.</p>
    <p><strong>"Confidential Information":</strong> Any data, document, or information accessed by the Second Party through the Platform.</p>

    <h2 class="art-h">Article 3: Scope</h2>
    <p>This Agreement applies to every transaction, partnership, or dealing arising between the Second Party and any landowner or third party identified — directly or indirectly — through the Platform, and remains effective throughout the use of the Platform and for twenty-four (24) months following the last interaction.</p>

    <h2 class="art-h">Article 4: Professional Fees Structure</h2>
    <p>1. <strong>Real Estate Brokerage Fee:</strong> <span dir="ltr" class="rate">${fmtPct(CURRENT_BROKERAGE)}</span> of the Land Value, due under the Real Estate Brokerage Law.</p>
    <p>2. <strong>Platform Services Fee:</strong> <span dir="ltr" class="rate">${fmtPct(CURRENT_OPERATIONAL)}</span> of the Land Value, for operational, technical, and advisory services.</p>
    <p>3. <strong>Total Professional Fees:</strong> <span dir="ltr" class="rate">${fmtPct(CURRENT_TOTAL)}</span> of the Land Value.</p>
    <p class="note">All percentages are calculated on the Land Value only and exclude development or construction value.</p>

    <h2 class="art-h">Article 5: Payment Mechanism &amp; Accrual</h2>
    <p>1. Fees become due upon the conclusion of the final contract between the Developer and the landowner (whether sale, partnership, development, or equivalent arrangement).</p>
    <p>2. The actual payment mechanism is agreed directly between the owner and the Developer, provided the Platform's share (${fmtPct(CURRENT_TOTAL)}) is remitted to <strong>SINA Real Estate Development</strong> within a maximum of thirty (30) days from signature of the final contract.</p>
    <p>3. Late payment constitutes a breach and may incur late-payment interest up to the legally permitted maximum, without prejudice to the Platform's right to take legal action.</p>

    <h2 class="art-h">Article 6: Developer's Obligations</h2>
    <p>1. <strong>Good Faith &amp; Transparency:</strong> The Developer shall act in good faith and with full disclosure in all Platform dealings.</p>
    <p>2. <strong>Circumvention Prohibited:</strong> The Developer is prohibited from concluding any transaction — directly or through any related third party — with any owner or party identified through the Platform without notifying SINA and paying the due fees. Any circumvention is a material breach requiring full indemnification.</p>
    <p>3. <strong>Confidentiality:</strong> The Developer shall maintain the confidentiality of all Platform-sourced information and not disclose or use it outside the scope of the transaction.</p>
    <p>4. <strong>Non-Compete:</strong> The Developer shall not use owner data or Confidential Information in any parallel or competing activity during the Agreement and for twenty-four (24) months thereafter.</p>
    <p>5. <strong>Data Accuracy:</strong> The Developer bears full responsibility for the accuracy and completeness of all data provided.</p>

    <h2 class="art-h">Article 7: Platform Warranties &amp; Liability Limits</h2>
    <p>1. The Platform provides services with customary professional care and does not warrant the outcome of any transaction or the feasibility of any investment.</p>
    <p>2. Information presented on the Platform does not constitute official property valuations or investment advice.</p>
    <p>3. Personal data is handled in accordance with the Saudi Personal Data Protection Law.</p>

    <h2 class="art-h">Article 8: Confidentiality &amp; Data Protection</h2>
    <p>1. All information exchanged is <strong>strictly confidential</strong> and protected under this Agreement and applicable law.</p>
    <p>2. The Second Party shall not copy, photograph, or share any document or information with any third party without SINA's written consent.</p>
    <p>3. Confidentiality obligations survive for five (5) years after the termination of this Agreement.</p>

    <h2 class="art-h">Article 9: Breach &amp; Remedies</h2>
    <p>1. Any of the following constitutes a material breach: circumventing fees, disclosing confidential information, providing false data, or directly contacting the owner to bypass the Platform.</p>
    <p>2. In case of breach, the Platform is entitled to: (a) claim the full due fees doubled as agreed-upon liquidated damages; (b) suspend or terminate the Developer's account; (c) pursue all available legal remedies.</p>
    <p>3. The foregoing remedies are without prejudice to the Platform's right to claim additional actual and consequential damages.</p>

    <h2 class="art-h">Article 10: Term &amp; Termination</h2>
    <p>1. This Agreement takes effect upon electronic acceptance and remains effective throughout the use of the Platform.</p>
    <p>2. Either party may terminate the Agreement by thirty (30) days' prior written notice, provided that confidentiality and due-fee obligations survive such termination.</p>
    <p>3. Termination does not waive any rights accrued prior thereto.</p>

    <h2 class="art-h">Article 11: Governing Law &amp; Dispute Resolution</h2>
    <p>1. This Agreement is governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.</p>
    <p>2. The parties shall seek to settle any dispute amicably; failing which the dispute shall be referred to the competent judicial authority in the city of Riyadh.</p>

    <h2 class="art-h">Article 12: General Provisions</h2>
    <p>1. <strong>Notices:</strong> Sent via the parties' registered email and deemed effective as of the date of dispatch.</p>
    <p>2. <strong>Electronic Consent:</strong> The Second Party's electronic signature has the same legal effect as a handwritten signature, pursuant to the Saudi Electronic Transactions Law.</p>
    <p>3. <strong>Severability:</strong> Invalidity of any clause does not affect the remaining clauses.</p>
    <p>4. <strong>Entire Agreement:</strong> This Agreement, together with its annexes, constitutes the entire understanding of the parties and supersedes all prior oral or written agreements.</p>

    <h2 class="art-h">Article 13: Acknowledgment &amp; Acceptance</h2>
    <p>By electronically accepting this Agreement, <strong>${escAttr(companyName)}</strong>, represented by <strong>${escAttr(contactName)}</strong>, acknowledges having read and understood all terms, and accepts them in full voluntarily, without coercion or misrepresentation, being legally authorised to execute this Agreement on behalf of the Second Party.</p>
  `;

  const articles = isAr ? articlesAr : articlesEn;
  const fontFamily = isAr
    ? "'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif"
    : "'Inter', system-ui, sans-serif";

  // Status pill text
  const acceptedLabel = agreement.accepted
    ? (isAr ? "تم القبول إلكترونياً" : "Electronically Accepted")
    : (isAr ? "بانتظار الموافقة" : "Pending Acceptance");

  const html = `<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${escAttr(title)} — ${escAttr(refNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #F4F5F7; }
    body {
      font-family: ${fontFamily};
      color: #1E293B;
      line-height: 1.85;
      font-size: 13.5px;
      padding: 32px 16px 64px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Outer document — A4 width, decorative gold + slate frame */
    .doc {
      max-width: 880px;
      margin: 0 auto;
      background: #fff;
      padding: 48px 56px 56px;
      box-shadow: 0 6px 32px -10px rgba(15, 31, 46, 0.18);
      position: relative;
      border: 2px solid #020202;
      border-radius: 4px;
    }
    /* Inner gold border line */
    .doc::before {
      content: "";
      position: absolute;
      inset: 8px;
      border: 1px solid #C45A41;
      pointer-events: none;
      border-radius: 2px;
    }
    /* Subtle SINA watermark behind content */
    .doc::after {
      content: "SINA";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 220px;
      font-weight: 700;
      color: rgba(43, 76, 102, 0.04);
      letter-spacing: 0.1em;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }
    .doc > * { position: relative; z-index: 1; }

    /* Header — dual-logo + ref bar */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 18px;
      margin-bottom: 22px;
      border-bottom: 2px solid #020202;
    }
    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-sina {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #2B2B2B, #020202);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      box-shadow: 0 4px 14px -4px rgba(43, 76, 102, 0.4);
    }
    .logo-sina img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }
    .logo-dev {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: rgba(194, 168, 107, 0.12);
      border: 1px solid rgba(194, 168, 107, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .ref-bar {
      text-align: ${isAr ? "left" : "right"};
      font-size: 10.5px;
      color: #64748B;
      line-height: 1.7;
    }
    .ref-bar .ref-key { color: #020202; font-weight: 700; font-size: 11px; }

    /* Title block */
    .title-block { text-align: center; margin-bottom: 28px; }
    .title-block h1 {
      font-size: 22px;
      color: #020202;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: ${isAr ? "0" : "-0.01em"};
    }
    .title-block .sub {
      font-size: 12px;
      color: #64748B;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .pill-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 14px;
      flex-wrap: wrap;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 600;
      border: 1px solid;
    }
    .pill-blue { background: rgba(43, 76, 102, 0.06); color: #2B2B2B; border-color: rgba(43, 76, 102, 0.18); }
    .pill-gold { background: rgba(194, 168, 107, 0.10); color: #8B6F2F; border-color: rgba(194, 168, 107, 0.32); }
    .pill-emerald { background: #ECFDF5; color: #065F46; border-color: #A7F3D0; }
    .pill-amber { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }

    /* Parties cards */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 26px;
    }
    .party {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px 18px;
      background: #FBFCFD;
    }
    .party .role {
      font-size: 9.5px;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .party .row { display: flex; align-items: center; gap: 10px; }
    .party .body { min-width: 0; }
    .party .name {
      font-size: 14px;
      font-weight: 700;
      color: #020202;
      line-height: 1.35;
    }
    .party .meta-line {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
      line-height: 1.55;
    }

    /* Fees */
    .fees {
      border: 1px solid rgba(43, 76, 102, 0.14);
      background: linear-gradient(180deg, #FFFFFF, #F8FAFC);
      border-radius: 12px;
      padding: 20px 22px;
      margin-bottom: 26px;
    }
    .fees h2 {
      font-size: 13px;
      font-weight: 700;
      color: #020202;
      margin-bottom: 12px;
      letter-spacing: 0.02em;
    }
    .fees-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
    }
    .fees-row .lbl { color: #475569; }
    .fees-row .val { font-weight: 700; color: #020202; }
    .fees-total {
      border-top: 1px dashed #CBD5E1;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 15px;
    }
    .fees-total .lbl { font-weight: 700; color: #020202; }
    .fees-total .val { color: #2B2B2B; font-size: 18px; font-weight: 700; }
    .fees-note {
      margin-top: 12px;
      padding: 10px 12px;
      background: rgba(43, 76, 102, 0.04);
      border-${isAr ? "right" : "left"}: 3px solid #2B2B2B;
      border-radius: 6px;
      font-size: 11.5px;
      color: #334155;
      line-height: 1.7;
    }

    /* Articles body */
    .articles { font-size: 13px; line-height: 2.0; color: #334155; }
    .articles .art-h {
      font-size: 14px;
      font-weight: 700;
      color: #020202;
      border-${isAr ? "right" : "left"}: 4px solid #2B2B2B;
      padding-${isAr ? "right" : "left"}: 14px;
      margin: 22px 0 10px;
      page-break-after: avoid;
    }
    .articles p { margin: 6px 0; text-align: ${isAr ? "right" : "left"}; }
    .articles .indent { padding-${isAr ? "right" : "left"}: 18px; }
    .articles .note { font-size: 11.5px; color: #64748B; font-style: italic; margin-top: 6px; }
    .articles strong { color: #020202; }
    .articles .rate { color: #2B2B2B; font-weight: 700; background: rgba(43, 76, 102, 0.06); padding: 1px 6px; border-radius: 4px; }

    /* Signature blocks */
    .signatures {
      margin-top: 36px;
      padding-top: 22px;
      border-top: 2px dashed #CBD5E1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .sig {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px 18px 14px;
      background: #FFFFFF;
    }
    .sig .sig-role {
      font-size: 10px;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .sig .sig-name {
      font-size: 14px;
      font-weight: 700;
      color: #020202;
      margin-bottom: 4px;
    }
    .sig .sig-sub { font-size: 11px; color: #64748B; }
    .sig .sig-line {
      margin-top: 36px;
      border-top: 1px solid #020202;
      padding-top: 6px;
      font-size: 10.5px;
      color: #64748B;
    }
    .sig .sig-stamp {
      margin-top: 10px;
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .sig-stamp.accepted { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .sig-stamp.pending { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }

    /* Footer */
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #E2E8F0;
      font-size: 10.5px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .footer .footer-r { text-align: ${isAr ? "left" : "right"}; }
    .footer strong { color: #475569; }

    /* Toolbar (screen only) */
    .toolbar {
      max-width: 880px;
      margin: 0 auto 16px;
      display: flex;
      gap: 8px;
      justify-content: ${isAr ? "flex-start" : "flex-end"};
    }
    .btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12.5px;
      font-weight: 600;
      border: 1px solid #E2E8F0;
      background: #fff;
      color: #020202;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn:hover { border-color: #2B2B2B; background: rgba(43, 76, 102, 0.04); }
    .btn-primary {
      background: linear-gradient(135deg, #2B2B2B, #020202);
      color: #fff;
      border-color: transparent;
    }
    .btn-primary:hover { background: linear-gradient(135deg, #020202, #142A3F); }

    /* Print rules */
    @media print {
      @page { size: A4; margin: 14mm 12mm; }
      html, body { background: #fff !important; }
      body { padding: 0; }
      .toolbar { display: none !important; }
      .doc {
        box-shadow: none !important;
        border: 2px solid #000 !important;
        margin: 0 !important;
        padding: 28px 32px 36px !important;
        page-break-inside: auto;
      }
      .doc::before { border: 1px solid #C45A41 !important; }
      .doc::after { color: rgba(43, 76, 102, 0.04) !important; }
      .articles .art-h { page-break-after: avoid; }
      .signatures { page-break-inside: avoid; }
      .party, .sig, .fees { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" class="btn" onclick="window.close()">${isAr ? "إغلاق" : "Close"}</button>
    <button type="button" class="btn btn-primary" onclick="window.print()">${isAr ? "طباعة الاتفاقية" : "Print Agreement"}</button>
  </div>

  <article class="doc" role="document" aria-label="${escAttr(title)}">
    <!-- Letterhead with dual logos and reference bar -->
    <div class="header">
      <div class="logo-wrap">
        <div class="logo-sina"><img src="${escAttr(sinaLogoUrl)}" alt="SINA" onerror="this.style.display='none'" /></div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#020202;">${isAr ? "سينا للتطوير العقاري" : "SINA Real Estate Development"}</div>
          <div style="font-size:10.5px;color:#94A3B8;letter-spacing:0.04em;">${isAr ? "مشغّل ومدير الخدمات العقارية" : "Real Estate Services Operator"}</div>
        </div>
      </div>
      <div class="ref-bar">
        <div><span class="ref-key">${isAr ? "رقم المرجع:" : "Reference No.:"}</span> <span dir="ltr">${escAttr(refNumber)}</span></div>
        <div><span class="ref-key">${isAr ? "تاريخ الإصدار:" : "Issued:"}</span> <span dir="ltr">${escAttr(today)}</span></div>
        <div><span class="ref-key">${isAr ? "الإصدار:" : "Version:"}</span> ${CURRENT_VERSION}</div>
      </div>
    </div>

    <!-- Title block -->
    <div class="title-block">
      <h1>${escAttr(title)}</h1>
      <div class="sub">${escAttr(subtitle)}</div>
      <div class="pill-row">
        <span class="pill ${agreement.accepted ? "pill-emerald" : "pill-amber"}">
          ${agreement.accepted ? "✓" : "•"} ${escAttr(acceptedLabel)}
        </span>
        <span class="pill pill-blue">${isAr ? "وفق نظام المملكة العربية السعودية" : "Governed by Saudi Arabian Law"}</span>
      </div>
    </div>

    <!-- Parties cards (dual logos visible side-by-side) -->
    <div class="parties">
      <div class="party">
        <div class="role">${isAr ? "الطرف الأول — مقدّم الخدمات" : "First Party — Service Provider"}</div>
        <div class="row">
          <div class="logo-sina" style="width:44px;height:44px;flex-shrink:0;"><img src="${escAttr(sinaLogoUrl)}" alt="SINA" onerror="this.style.display='none'" /></div>
          <div class="body">
            <div class="name">${isAr ? "سينا للتطوير العقاري" : "SINA Real Estate Development"}</div>
            <div class="meta-line">${isAr ? "مشغّل المنصة الرقمية للوساطة العقارية" : "Operator of the digital real-estate brokerage platform"}</div>
          </div>
        </div>
      </div>
      <div class="party">
        <div class="role">${isAr ? "الطرف الثاني — المطوّر العقاري" : "Second Party — The Developer"}</div>
        <div class="row">
          <div class="logo-dev">${devLogoBlock}</div>
          <div class="body">
            <div class="name">${escAttr(companyName)}</div>
            <div class="meta-line">${escAttr(contactName)}${developer?.cr_number ? ` • <span dir="ltr">${escAttr(crNumber)}</span>` : ""}${developer?.phone ? ` • <span dir="ltr">${escAttr(phone)}</span>` : ""}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fees summary table -->
    <div class="fees">
      <h2>${isAr ? "ملخص هيكل الأتعاب المهنية" : "Professional Fees Structure Summary"}</h2>
      <div class="fees-row"><span class="lbl">${isAr ? "عمولة السعي العقاري" : "Real Estate Brokerage Fee"}</span><span class="val" dir="ltr">${fmtPct(CURRENT_BROKERAGE)}</span></div>
      <div class="fees-row"><span class="lbl">${isAr ? "أتعاب المنصة" : "Platform Services Fee"}</span><span class="val" dir="ltr">${fmtPct(CURRENT_OPERATIONAL)}</span></div>
      <div class="fees-row fees-total"><span class="lbl">${isAr ? "إجمالي الأتعاب المهنية" : "Total Professional Fees"}</span><span class="val" dir="ltr">${fmtPct(CURRENT_TOTAL)}</span></div>
      <div class="fees-note">${isAr
        ? "تُحتسب الأتعاب من قيمة الأرض فقط (لا تشمل قيمة التطوير العقاري)، وتستحق خلال 30 يوماً من تاريخ توقيع العقد النهائي."
        : "Fees are calculated on the Land Value only (excluding development value) and are due within 30 days from the final-contract signature date."}</div>
    </div>

    <!-- Articles -->
    <div class="articles">
      ${articles}
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig">
        <div class="sig-role">${isAr ? "الطرف الأول — السينا" : "First Party — SINA"}</div>
        <div class="sig-name">${isAr ? "سينا للتطوير العقاري" : "SINA Real Estate Development"}</div>
        <div class="sig-sub">${isAr ? "بصفتها مشغّل المنصة" : "as Platform Operator"}</div>
        <div class="sig-line">${isAr ? "التوقيع المعتمد للمنصة / الختم" : "Authorised Platform Signature / Stamp"}</div>
        <span class="sig-stamp ${agreement.accepted ? "accepted" : "pending"}">${escAttr(acceptedLabel)}</span>
      </div>
      <div class="sig">
        <div class="sig-role">${isAr ? "الطرف الثاني — المطور" : "Second Party — Developer"}</div>
        <div class="sig-name">${escAttr(contactName)}</div>
        <div class="sig-sub">${isAr ? "عن" : "On behalf of"} ${escAttr(companyName)}</div>
        <div class="sig-line">${isAr ? "التوقيع الإلكتروني / المعتمد" : "Electronic / Authorised Signature"}</div>
        <span class="sig-stamp ${agreement.accepted ? "accepted" : "pending"}">${agreement.accepted ? escAttr(acceptedDate) : (isAr ? "بانتظار التوقيع" : "Awaiting Signature")}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <div><strong>SINA</strong> — ${isAr ? "وثيقة قانونية ملزمة" : "Legally Binding Document"}</div>
        <div>${isAr ? "تم إنشاء هذه الوثيقة إلكترونياً وتُعدّ نافذة المفعول وفق نظام التعاملات الإلكترونية" : "Generated electronically; enforceable under the Electronic Transactions Law"}</div>
      </div>
      <div class="footer-r">
        <div><strong>${isAr ? "المرجع:" : "Ref:"}</strong> <span dir="ltr">${escAttr(refNumber)}</span></div>
        <div><strong>${isAr ? "أنشئ في:" : "Generated:"}</strong> <span dir="ltr">${escAttr(today)}</span></div>
      </div>
    </div>
  </article>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  // Free the blob URL once the new tab has had time to consume it. 60s is
  // generous; revoking immediately would race the new-tab navigation on
  // slow networks.
  if (w) setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ── Locked field display ──────────────────────────────────────── */
const LockedField: React.FC<{
  label: string;
  value: string;
  icon?: React.ReactNode;
  dir?: string;
}> = ({ label, value, icon, dir }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
      {icon}
      {label}
    </Label>
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-gray-50/60 px-3 py-2.5">
      <LockKeyhole className="h-3.5 w-3.5 text-gray-300 shrink-0" />
      <span className="text-sm text-foreground flex-1" dir={dir}>
        {value}
      </span>
    </div>
  </div>
);

/* ── Main Component ────────────────────────────────────────────── */
const CrmSettings: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الإعدادات" : "Settings");
  const { toast } = useToast();

  const [developer, setDeveloper] = useState<DeveloperRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable inputs
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [brandNameInput, setBrandNameInput] = useState("");
  const [crNumberInput, setCrNumberInput] = useState("");
  const [contactPersonInput, setContactPersonInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [crFile, setCrFile] = useState<File | null>(null);
  const [crSignedUrl, setCrSignedUrl] = useState<string | null>(null);

  // Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [agreement, setAgreement] = useState<DeveloperAgreement | null>(null);

  /* Synchronous re-entry guards. React batches setState, so a second click
   * on the same button before the re-render commits would slip past the
   * disabled check — the ref catches it before the network call. */
  const savingProfileRef = useRef(false);
  const savingPasswordRef = useRef(false);

  const isAr = lang === "ar";

  /* Stash the latest `isAr` in a ref so the data-fetch effect can surface
   * error toasts in the user's current language WITHOUT depending on `isAr`.
   *
   * Why this matters: previously the effect declared `[user, toast, isAr]`
   * as deps. Toggling the language re-ran the effect, which re-fetched the
   * developer row and called `setCompanyNameInput(...)` etc. — wiping out
   * any unsaved edits the user had typed. Users described it as "the page
   * refreshes automatically when I change the language." This ref pattern
   * keeps toast messages localised but makes the effect run once per user. */
  const isArRef = useRef(isAr);
  useEffect(() => { isArRef.current = isAr; }, [isAr]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchDev = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      if (error) {
        toast({ variant: "destructive", title: isArRef.current ? "خطأ" : "Error", description: error.message });
        setLoading(false);
        return;
      }

      setDeveloper(data);
      setCompanyNameInput(data?.company_name || "");
      setBrandNameInput(data?.marketing_brand_name || "");
      setCrNumberInput(data?.cr_number || "");
      setContactPersonInput(data?.contact_person_name || "");
      setCityInput(data?.city || "");
      setEmailInput(data?.email || user.email || "");
      setPhoneInput(data?.phone || "");
      setWebsiteInput(data?.website || "");
      setLogoUrl((data as any)?.logo_url || null);
      setLoading(false);
    };

    const fetchAgreement = async () => {
      const ag = await getMyCommissionAgreement();
      if (cancelled) return;
      setAgreement(ag);
    };

    fetchDev();
    fetchAgreement();

    return () => { cancelled = true; };
    // Intentionally omit `isAr` and `toast` — see ref pattern above. They
    // are stable references; `isAr` is read via ref to keep messages
    // localised without resetting the form on every language toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Generate signed URL for CR file
  useEffect(() => {
    if (!developer?.cr_file_url) { setCrSignedUrl(null); return; }
    if (developer.cr_file_url.startsWith("http")) { setCrSignedUrl(developer.cr_file_url); return; }

    const createSignedUrl = async () => {
      const { data } = await supabase.storage.from("developer-docs").createSignedUrl(developer.cr_file_url, 3600);
      setCrSignedUrl(data?.signedUrl ?? null);
    };
    createSignedUrl();
  }, [developer?.cr_file_url]);

  const normalizeWebsite = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  };

  // Helper: check if field was already filled in DB (locked)
  const isLocked = (key: keyof DeveloperRow) => {
    if (!developer) return false;
    const val = developer[key];
    return val !== null && val !== undefined && val !== "" && val !== "—";
  };

  /* ── Password change ───────────────────────────────────────── */
  const handlePasswordChange = async () => {
    if (savingPasswordRef.current) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr
          ? `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`
          : `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }

    savingPasswordRef.current = true;
    setSavingPassword(true);
    try {
      // Do NOT pre-verify with signInWithPassword — that rotates the session
      // tokens mid-request and can log the user out of other open tabs.
      // Supabase's updateUser rejects stale sessions with AuthSessionMissingError.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
        return;
      }

      toast({ title: isAr ? "تم التحديث" : "Updated", description: isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully" });
      setPassword("");
      setConfirmPassword("");

      // Security-sensitive action — always audit, especially on success,
      // for forensic trails.
      try {
        await logAudit(user?.id || "", user?.email, "password.change", "auth", user?.id || "", {});
      } catch (e) { console.error("Audit log failed:", e); }
    } finally {
      setSavingPassword(false);
      savingPasswordRef.current = false;
    }
  };

  /* ── Save profile data ─────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!user || !developer?.id) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "لم يتم العثور على ملف المطور" : "Developer profile not found" });
      return;
    }
    if (savingProfileRef.current) return;

    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format" });
      return;
    }

    savingProfileRef.current = true;
    setSavingProfile(true);
    try {
      let uploadedCrPath = developer.cr_file_url;

      // Upload CR file if selected
      if (crFile) {
        const isPdf = crFile.type === "application/pdf" || crFile.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) throw new Error(isAr ? "يرجى رفع ملف PDF فقط" : "Please upload a PDF file only");
        if (crFile.size > MAX_FILE_SIZE) throw new Error(isAr ? "حجم الملف يجب أن يكون أقل من 20MB" : "File size must be less than 20MB");

        const filePath = `${user.id}/cr_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage.from("developer-docs").upload(filePath, crFile, { contentType: "application/pdf" });
        if (uploadError) throw uploadError;
        uploadedCrPath = filePath;

        // P1.3 — notify admin team so CR verification doesn't sit in a queue.
        // Fire-and-forget; failure is non-fatal since admins also see the
        // document on their dashboard.
        supabase
          .rpc("notify_all_admins", {
            _type: "developer_cr_uploaded",
            _title_ar: "سجل تجاري بانتظار التحقق",
            _title_en: "Commercial registration pending verification",
            _message_ar: `المطور ${developer.company_name ?? "—"} رفع السجل التجاري لمراجعته`,
            _message_en: `Developer ${developer.company_name ?? "—"} uploaded a commercial registration for review`,
            _entity_type: "developer",
            _entity_id: developer.id,
          })
          .then((res) => {
            if (res.error) console.warn("[CrmSettings] notify_all_admins:", res.error.message);
          });
      }

      // Build update object — only include fields that are NOT locked
      const updateObj: Record<string, any> = {};

      if (!isLocked("company_name") && companyNameInput.trim()) updateObj.company_name = companyNameInput.trim();
      if (!isLocked("marketing_brand_name") && brandNameInput.trim()) updateObj.marketing_brand_name = brandNameInput.trim();
      if (!isLocked("cr_number") && crNumberInput.trim()) updateObj.cr_number = crNumberInput.trim();
      if (!isLocked("contact_person_name") && contactPersonInput.trim()) updateObj.contact_person_name = contactPersonInput.trim();
      if (!isLocked("city") && cityInput.trim()) updateObj.city = cityInput.trim();
      if (!isLocked("email") && trimmedEmail) updateObj.email = trimmedEmail;
      if (!isLocked("phone") && phoneInput.trim()) updateObj.phone = phoneInput.trim();
      if (!isLocked("website") && normalizeWebsite(websiteInput)) updateObj.website = normalizeWebsite(websiteInput);
      if (crFile && uploadedCrPath) updateObj.cr_file_url = uploadedCrPath;
      updateObj.logo_url = logoUrl;

      if (Object.keys(updateObj).length === 0 && !crFile) {
        toast({ title: isAr ? "تنبيه" : "Notice", description: isAr ? "لا توجد تغييرات لحفظها" : "No changes to save" });
        setSavingProfile(false);
        return;
      }

      // Update email in auth if changed
      if (updateObj.email && updateObj.email !== (user.email || developer.email)) {
        const { error: authEmailError } = await supabase.auth.updateUser({ email: updateObj.email });
        if (authEmailError) throw authEmailError;
      }

      const { error: updateError } = await supabase.from("developers").update(updateObj).eq("id", developer.id);
      if (updateError) throw updateError;

      // Refresh developer data
      const { data: refreshed } = await supabase.from("developers").select("*").eq("id", developer.id).single();
      if (refreshed) {
        setDeveloper(refreshed);
        setCompanyNameInput(refreshed.company_name || "");
        setBrandNameInput(refreshed.marketing_brand_name || "");
        setCrNumberInput(refreshed.cr_number || "");
        setContactPersonInput(refreshed.contact_person_name || "");
        setCityInput(refreshed.city || "");
        setEmailInput(refreshed.email || user.email || "");
        setPhoneInput(refreshed.phone || "");
        setWebsiteInput(refreshed.website || "");
      }

      setCrFile(null);

      if (uploadedCrPath && !uploadedCrPath.startsWith("http")) {
        const { data } = await supabase.storage.from("developer-docs").createSignedUrl(uploadedCrPath, 3600);
        setCrSignedUrl(data?.signedUrl ?? null);
      }

      toast({
        title: isAr ? "تم الحفظ" : "Saved",
        description: isAr ? "تم حفظ جميع البيانات بنجاح" : "All data saved successfully",
      });

      // Audit trail — developer profile edits need to be reviewable, since
      // some fields (CR number, email) are identity-sensitive.
      try {
        await logAudit(
          user.id,
          user.email,
          "developer.profile_update",
          "developer",
          developer.id,
          { fields: Object.keys(updateObj), cr_file_uploaded: !!crFile },
        );
      } catch (e) { console.error("Audit log failed:", e); }
    } catch (error: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message || (isAr ? "فشل حفظ البيانات" : "Failed to save data") });
    } finally {
      setSavingProfile(false);
      savingProfileRef.current = false;
    }
  };

  /* ── Completeness ──────────────────────────────────────────── */
  const completeness = useMemo(() => {
    if (!developer) return { percent: 0, missing: [] as string[] };

    const fields: { key: keyof DeveloperRow; ar: string; en: string }[] = [
      { key: "company_name", ar: "اسم الشركة", en: "Company Name" },
      { key: "marketing_brand_name", ar: "الاسم التجاري", en: "Brand Name" },
      { key: "cr_number", ar: "رقم السجل التجاري", en: "CR Number" },
      { key: "cr_file_url", ar: "ملف السجل التجاري", en: "CR Document" },
      { key: "contact_person_name", ar: "اسم المسؤول", en: "Contact Person" },
      { key: "email", ar: "البريد الإلكتروني", en: "Email" },
      { key: "phone", ar: "رقم الجوال", en: "Phone" },
      { key: "website", ar: "الموقع الإلكتروني", en: "Website" },
      { key: "city", ar: "المدينة", en: "City" },
    ];

    const missing = fields.filter((f) => !developer[f.key]);
    const percent = Math.round(((fields.length - missing.length) / fields.length) * 100);
    return { percent, missing: missing.map((m) => (isAr ? m.ar : m.en)) };
  }, [developer, isAr]);

  /* ── Status badge ──────────────────────────────────────────── */
  const statusBadge = (status: string) => {
    const map: Record<string, { ar: string; en: string; cls: string; Icon: typeof CheckCircle2 }> = {
      pending_review: { ar: "قيد المراجعة", en: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
      verified: { ar: "موثّق", en: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
      rejected: { ar: "مرفوض", en: "Rejected", cls: "bg-red-50 text-red-700 border-red-200", Icon: AlertTriangle },
    };
    const s = map[status] || map.pending_review;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${s.cls}`}>
        <s.Icon className="h-3 w-3" />
        {isAr ? s.ar : s.en}
      </span>
    );
  };

  // Count how many editable (unlocked) fields exist
  const editableFields = developer ? (["company_name", "marketing_brand_name", "cr_number", "contact_person_name", "city", "email", "phone", "website"] as (keyof DeveloperRow)[]).filter(k => !isLocked(k)) : [];
  const hasEditableFields = editableFields.length > 0 || !developer?.cr_file_url;

  return (
    <CrmLayout>
      <PageHeader
        icon={SettingsIcon}
        titleAr="الإعدادات"
        titleEn="Settings"
        descAr="بيانات حسابك وإعدادات الأمان"
        descEn="Your account details and security settings"
        variant="developer"
      />

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : (
        <>
          {/* Completeness warning — flat icon, dark-mode parity */}
          {completeness.percent < 100 && (
            <div className="mb-6 rounded-2xl border border-amber-300/50 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" strokeWidth={1.6} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    {isAr ? "معلوماتك غير مكتملة، يرجى إكمالها لتفادي خسارة الفرص." : "Your profile is incomplete. Complete it to avoid missing opportunities."}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={completeness.percent} className="h-2 flex-1" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300" dir="ltr">{completeness.percent}%</span>
                  </div>
                  {completeness.missing.length > 0 && (
                    <p className="mt-1.5 text-xs text-amber-700/80 dark:text-amber-300/80">
                      {isAr ? "الحقول الناقصة: " : "Missing: "}{completeness.missing.join("، ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ─── LEFT COLUMN: Company Data ─────────────────────── */}
            <div className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-[#2B2B2B]" strokeWidth={1.5} />
                  {isAr ? "بيانات الشركة" : "Company Information"}
                </h3>
                {developer && statusBadge(developer.verification_status)}
              </div>

              {!developer ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {isAr ? "لا يوجد ملف مطوّر مرتبط بهذا الحساب." : "No developer profile linked to this account."}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Company Logo */}
                  <AvatarUpload
                    currentUrl={logoUrl}
                    displayName={developer.company_name || developer.marketing_brand_name || "D"}
                    label={isAr ? "شعار الشركة" : "Company Logo"}
                    isAr={isAr}
                    folder="logos"
                    size="lg"
                    onUpload={(url) => setLogoUrl(url)}
                    onRemove={() => setLogoUrl(null)}
                  />

                  {/* Company Name */}
                  {isLocked("company_name") ? (
                    <LockedField label={isAr ? "اسم الشركة" : "Company Name"} value={developer.company_name} icon={<Building2 className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "اسم الشركة" : "Company Name"}
                      </Label>
                      <Input value={companyNameInput} onChange={(e) => setCompanyNameInput(e.target.value)} placeholder={isAr ? "أدخل اسم الشركة" : "Enter company name"} />
                    </div>
                  )}

                  {/* Brand Name */}
                  {isLocked("marketing_brand_name") ? (
                    <LockedField label={isAr ? "الاسم التجاري" : "Brand Name"} value={developer.marketing_brand_name!} icon={<Building2 className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "الاسم التجاري" : "Brand Name"}
                      </Label>
                      <Input value={brandNameInput} onChange={(e) => setBrandNameInput(e.target.value)} placeholder={isAr ? "أدخل الاسم التجاري" : "Enter brand name"} />
                    </div>
                  )}

                  {/* CR Number */}
                  {isLocked("cr_number") ? (
                    <LockedField label={isAr ? "رقم السجل التجاري" : "CR Number"} value={developer.cr_number!} icon={<FileText className="h-3 w-3" />} dir="ltr" />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "رقم السجل التجاري" : "CR Number"}
                      </Label>
                      <Input value={crNumberInput} onChange={(e) => setCrNumberInput(e.target.value)} placeholder="1010XXXXXX" dir="ltr" />
                    </div>
                  )}

                  {/* Contact Person */}
                  {isLocked("contact_person_name") ? (
                    <LockedField label={isAr ? "اسم المسؤول" : "Contact Person"} value={developer.contact_person_name!} icon={<User className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "اسم المسؤول" : "Contact Person"}
                      </Label>
                      <Input value={contactPersonInput} onChange={(e) => setContactPersonInput(e.target.value)} placeholder={isAr ? "الاسم الكامل" : "Full name"} />
                    </div>
                  )}

                  {/* City */}
                  {isLocked("city") ? (
                    <LockedField label={isAr ? "المدينة" : "City"} value={developer.city!} icon={<MapPin className="h-3 w-3" />} />
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "المدينة" : "City"}
                      </Label>
                      <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder={isAr ? "الرياض، جدة..." : "Riyadh, Jeddah..."} />
                    </div>
                  )}

                  {/* Email & Phone row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isLocked("email") ? (
                      <LockedField label={isAr ? "البريد الإلكتروني" : "Email"} value={developer.email!} icon={<Mail className="h-3 w-3" />} dir="ltr" />
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Pencil className="h-3 w-3 text-amber-500" />
                          {isAr ? "البريد الإلكتروني" : "Email"}
                        </Label>
                        <Input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="name@example.com" dir="ltr" />
                      </div>
                    )}

                    {isLocked("phone") ? (
                      <LockedField label={isAr ? "رقم الجوال" : "Phone"} value={developer.phone!} icon={<Phone className="h-3 w-3" />} dir="ltr" />
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Pencil className="h-3 w-3 text-amber-500" />
                          {isAr ? "رقم الجوال" : "Phone"}
                        </Label>
                        <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  {isLocked("website") ? (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {isAr ? "الموقع الإلكتروني" : "Website"}
                      </Label>
                      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-gray-50/60 px-3 py-2.5">
                        <LockKeyhole className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        <span className="text-sm text-foreground flex-1" dir="ltr">{developer.website}</span>
                        <a href={developer.website!} target="_blank" rel="noopener noreferrer" className="text-[#2B2B2B] hover:text-[#020202]">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3 text-amber-500" />
                        {isAr ? "الموقع الإلكتروني" : "Website"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={websiteInput} onChange={(e) => setWebsiteInput(e.target.value)} placeholder="https://example.com" className="flex-1" dir="ltr" />
                        {normalizeWebsite(websiteInput) && (
                          <a href={normalizeWebsite(websiteInput)!} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#2B2B2B] hover:text-[#020202]">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CR File upload — only if not already uploaded */}
                  {!isLocked("cr_file_url") && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Upload className="h-3 w-3 text-amber-500" />
                        {isAr ? "رفع السجل التجاري (PDF)" : "Upload CR (PDF)"}
                      </Label>
                      <Input type="file" accept=".pdf" onChange={(e) => setCrFile(e.target.files?.[0] || null)} />
                      {crFile && <p className="text-xs text-muted-foreground">{isAr ? "الملف المحدد:" : "Selected:"} {crFile.name}</p>}
                    </div>
                  )}

                  {/* Save button — only show if there are editable fields */}
                  {hasEditableFields && (
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      variant="outline"
                      className="w-full mt-2 border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10"
                    >
                      {savingProfile ? (
                        <><Loader2 className="h-4 w-4 animate-spin me-2" strokeWidth={1.6} />{isAr ? "جاري الحفظ..." : "Saving..."}</>
                      ) : (
                        <><Save className="h-4 w-4 me-2" strokeWidth={1.6} />{isAr ? "حفظ البيانات" : "Save Data"}</>
                      )}
                    </Button>
                  )}

                  {/* All locked message */}
                  {!hasEditableFields && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        {isAr ? "تم استكمال جميع البيانات. لتعديل أي معلومة يرجى التواصل مع الإدارة." : "All data is complete. Contact admin to modify any information."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── RIGHT COLUMN ──────────────────────────────────── */}
            <div className="space-y-6">
              {/* Documents */}
              <div className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-[#2B2B2B]" strokeWidth={1.5} />
                  {isAr ? "المستندات المرفقة" : "Attached Documents"}
                </h3>

                <div className="flex items-center justify-between rounded-xl border border-border/40 dark:border-slate-800 p-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2B2B2B]/15 dark:border-[#7BA3C5]/30 bg-transparent">
                      <FileText className="h-[18px] w-[18px] text-[#2B2B2B] dark:text-[#9CC3DD]" strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{isAr ? "السجل التجاري" : "Commercial Registration"}</p>
                      <p className="text-[11px] text-muted-foreground">PDF</p>
                    </div>
                  </div>
                  {crSignedUrl ? (
                    <a href={crSignedUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#2B2B2B] dark:hover:text-[#9CC3DD]">
                        <Download className="h-4 w-4" strokeWidth={1.6} />
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{isAr ? "غير متوفر" : "N/A"}</span>
                  )}
                </div>
              </div>

              {/* Password Change */}
              <div className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-[#2B2B2B]" strokeWidth={1.5} />
                  {isAr ? "تغيير كلمة المرور" : "Change Password"}
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isAr ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                        className="pe-10"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr
                        ? `${MIN_PASSWORD_LENGTH} أحرف على الأقل`
                        : `At least ${MIN_PASSWORD_LENGTH} characters`}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={isAr ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                        className="pe-10"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={!password || !confirmPassword || savingPassword}
                    variant="outline"
                    className="w-full border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10"
                  >
                    {savingPassword ? (
                      <><Loader2 className="h-4 w-4 animate-spin me-2" strokeWidth={1.6} />{isAr ? "جاري الحفظ..." : "Saving..."}</>
                    ) : (
                      <><Lock className="h-4 w-4 me-2" strokeWidth={1.6} />{isAr ? "تحديث كلمة المرور" : "Update Password"}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Commission Agreement */}
              {agreement && (
                <div className="rounded-2xl border border-gray-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Scale className="h-4 w-4 text-[#2B2B2B]" strokeWidth={1.5} />
                    {isAr ? "اتفاقية الخدمات والأتعاب" : "Services & Fees Agreement"}
                  </h3>

                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between rounded-xl border border-border/40 dark:border-slate-800 p-3">
                      <span className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        agreement.accepted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
                      }`}>
                        {agreement.accepted
                          ? <><CheckCircle2 className="h-3 w-3" strokeWidth={1.7} /> {isAr ? "تم القبول" : "Accepted"}</>
                          : <><Clock className="h-3 w-3" strokeWidth={1.7} /> {isAr ? "معلقة" : "Pending"}</>
                        }
                      </span>
                    </div>

                    {/* Commission breakdown */}
                    <div className="rounded-xl border border-border/40 dark:border-slate-800 p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "أتعاب الوساطة" : "Brokerage Fee"}</span>
                        <span className="font-semibold text-foreground" dir="ltr">{agreement.commission_brokerage}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "الأتعاب التشغيلية" : "Operational Fee"}</span>
                        <span className="font-semibold text-foreground" dir="ltr">{agreement.commission_operational}%</span>
                      </div>
                      <div className="border-t border-border/40 dark:border-slate-800 pt-2 flex justify-between text-xs">
                        <span className="font-bold text-foreground">{isAr ? "الإجمالي" : "Total"}</span>
                        <span className="font-bold text-[#2B2B2B] dark:text-[#9CC3DD]" dir="ltr">{agreement.commission_total}%</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="rounded-xl border border-border/40 dark:border-slate-800 p-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "الإصدار" : "Version"}</span>
                        <span className="font-medium">{agreement.agreement_version}</span>
                      </div>
                      {agreement.accepted_at && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{isAr ? "تاريخ القبول" : "Accepted At"}</span>
                          <span className="font-medium" dir="ltr">
                            {new Date(agreement.accepted_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Download as PDF — outline */}
                    <Button
                      variant="outline"
                      className="w-full border-[#2B2B2B]/30 text-[#2B2B2B] hover:bg-[#2B2B2B]/5 hover:text-[#020202] dark:border-[#7BA3C5]/40 dark:text-[#9CC3DD] dark:hover:bg-[#7BA3C5]/10"
                      onClick={() => generateAgreementPdf(agreement, developer, logoUrl, isAr)}
                    >
                      <Download className="h-4 w-4 me-2" strokeWidth={1.6} />
                      {isAr ? "تحميل الاتفاقية (PDF)" : "Download Agreement (PDF)"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </CrmLayout>
  );
};

export default CrmSettings;
