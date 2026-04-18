import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSeoPageById, updateSeoPage, setSeoPageStatus, deleteSeoPage,
} from "@/services/seo/pages.service";
import { evaluatePageQuality } from "@/services/seo/quality.service";
import type { SeoPage, SeoPageStatus } from "@/types/seo";
import { pageStatusLabels } from "@/types/seo";
import {
  ArrowLeft, ArrowRight, Save, Trash2, Eye, EyeOff, ExternalLink,
  CheckCircle2, AlertTriangle, FileText, Code,
} from "lucide-react";

const AdminSeoPageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowRight : ArrowLeft;
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState<SeoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schemaText, setSchemaText] = useState("");
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [faqText, setFaqText] = useState("");
  const [faqError, setFaqError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getSeoPageById(id);
      setPage(p);
      if (p) {
        setSchemaText(JSON.stringify(p.schema_json ?? {}, null, 2));
        setFaqText(JSON.stringify(p.faq_items ?? [], null, 2));
      }
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const patch = (p: Partial<SeoPage>) => {
    if (!page) return;
    setPage({ ...page, ...p });
    setDirty(true);
  };

  const handleSchemaChange = (text: string) => {
    setSchemaText(text);
    setDirty(true);
    try {
      const parsed = JSON.parse(text);
      if (parsed !== null && typeof parsed !== "object") throw new Error("Must be object or array");
      setSchemaError(null);
      if (page) setPage({ ...page, schema_json: parsed });
    } catch (err: unknown) {
      setSchemaError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleFaqChange = (text: string) => {
    setFaqText(text);
    setDirty(true);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      setFaqError(null);
      if (page) setPage({ ...page, faq_items: parsed });
    } catch (err: unknown) {
      setFaqError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleSave = async () => {
    if (!page) return;
    if (schemaError || faqError) {
      toast({ variant: "destructive", title: isAr ? "أصلح أخطاء JSON أولاً" : "Fix JSON errors first" });
      return;
    }
    setSaving(true);
    try {
      const saved = await updateSeoPage(page.id, {
        title: page.title,
        meta_description: page.meta_description,
        h1: page.h1,
        intro: page.intro,
        body_html: page.body_html,
        canonical_url: page.canonical_url,
        og_title: page.og_title,
        og_description: page.og_description,
        og_image: page.og_image,
        schema_json: page.schema_json,
        faq_items: page.faq_items,
        internal_links: page.internal_links,
        noindex: page.noindex,
        nofollow: page.nofollow,
      });
      setPage(saved);
      setDirty(false);
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (status: SeoPageStatus) => {
    if (!page) return;
    try {
      const updated = await setSeoPageStatus(page.id, status, user?.id);
      setPage(updated);
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  const handleDelete = async () => {
    if (!page) return;
    if (!confirm(isAr ? "حذف الصفحة نهائياً؟" : "Delete this page permanently?")) return;
    try {
      await deleteSeoPage(page.id);
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
      navigate("/admincp/seo/pages");
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>;
  if (!page) return <div className="p-10 text-center text-slate-400">{isAr ? "الصفحة غير موجودة" : "Page not found"}</div>;

  const quality = evaluatePageQuality(page);
  const statusMeta = pageStatusLabels[page.status];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <Link to="/admincp/seo/pages" className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-[#2B4C66] mb-2">
              <Arrow className="w-3.5 h-3.5" strokeWidth={2} />
              {isAr ? "العودة للصفحات" : "Back to pages"}
            </Link>
            <h2 className="text-[18px] font-bold text-[#1E374B] dark:text-white truncate">{page.title}</h2>
            <p className="text-[12px] font-mono text-slate-400 truncate mt-0.5" dir="ltr">{page.slug}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              statusMeta.color === "emerald" ? "bg-emerald-50 text-emerald-700"
              : statusMeta.color === "amber" ? "bg-amber-50 text-amber-700"
              : statusMeta.color === "rose" ? "bg-rose-50 text-rose-700"
              : "bg-slate-100 text-slate-600"
            }`}>
              {isAr ? statusMeta.ar : statusMeta.en}
            </span>
            {page.status === "published" && (
              <a
                href={`${page.locale === "en" ? "/en" : ""}${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200/70 dark:border-white/10 text-[12px] font-semibold hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                {isAr ? "معاينة" : "Preview"}
              </a>
            )}
          </div>
        </div>

        {/* Quality bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? "درجة الجودة" : "Quality score"}
              </span>
              <span className="text-[13px] font-bold text-[#1E374B] dark:text-white" dir="ltr">
                {quality.score} / 100
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quality.score >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : quality.score >= 60 ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-rose-500 to-rose-600"
                }`}
                style={{ width: `${quality.score}%` }}
              />
            </div>
          </div>
          <div className="text-[12px] text-slate-500 text-end">
            <p>{isAr ? `${quality.wordCount} كلمة` : `${quality.wordCount} words`}</p>
            <p>{isAr ? `${quality.issues.length} مشكلة` : `${quality.issues.length} issue(s)`}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* SEO meta */}
          <Section title={isAr ? "بيانات SEO" : "SEO Metadata"} icon={FileText}>
            <Field label={isAr ? "عنوان الصفحة" : "Title"} value={page.title} onChange={(v) => patch({ title: v })} hint={`${page.title.length} / 70`} />
            <Field label={isAr ? "Meta description" : "Meta description"} value={page.meta_description} onChange={(v) => patch({ meta_description: v })} multi hint={`${page.meta_description.length} / 170`} />
            <Field label="H1" value={page.h1} onChange={(v) => patch({ h1: v })} />
            <Field label={isAr ? "Canonical URL" : "Canonical URL"} value={page.canonical_url ?? ""} onChange={(v) => patch({ canonical_url: v })} dir="ltr" />
          </Section>

          {/* Body */}
          <Section title={isAr ? "المحتوى" : "Content"} icon={FileText}>
            <Field label={isAr ? "مقدّمة" : "Intro"} value={page.intro ?? ""} onChange={(v) => patch({ intro: v })} multi />
            <Field label={isAr ? "جسم الصفحة (HTML)" : "Body HTML"} value={page.body_html ?? ""} onChange={(v) => patch({ body_html: v })} multi rows={10} />
          </Section>

          {/* FAQ */}
          <Section title={isAr ? "الأسئلة الشائعة (JSON)" : "FAQ (JSON)"} icon={FileText}>
            <textarea
              value={faqText}
              onChange={(e) => handleFaqChange(e.target.value)}
              rows={8}
              dir="ltr"
              className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border text-[12px] font-mono ${faqError ? "border-rose-400" : "border-slate-200/70 dark:border-white/10"}`}
            />
            {faqError ? (
              <p className="text-[11px] text-rose-600 mt-1 font-mono">{faqError}</p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr
                  ? "مصفوفة من {question_ar, question_en, answer_ar, answer_en}"
                  : "Array of {question_ar, question_en, answer_ar, answer_en}"}
              </p>
            )}
          </Section>

          {/* JSON-LD */}
          <Section title={isAr ? "Structured Data (JSON-LD)" : "Structured Data (JSON-LD)"} icon={Code}>
            <textarea
              value={schemaText}
              onChange={(e) => handleSchemaChange(e.target.value)}
              rows={10}
              dir="ltr"
              className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border text-[12px] font-mono ${schemaError ? "border-rose-400" : "border-slate-200/70 dark:border-white/10"}`}
            />
            {schemaError ? (
              <p className="text-[11px] text-rose-600 mt-1 font-mono">{schemaError}</p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr
                  ? "يُحقَن داخل <script type=\"application/ld+json\"> عند عرض الصفحة."
                  : "Injected as <script type=\"application/ld+json\"> on page render."}
              </p>
            )}
          </Section>

          {/* Open Graph */}
          <Section title="Open Graph" icon={FileText}>
            <Field label="og:title" value={page.og_title ?? ""} onChange={(v) => patch({ og_title: v })} />
            <Field label="og:description" value={page.og_description ?? ""} onChange={(v) => patch({ og_description: v })} multi />
            <Field label="og:image" value={page.og_image ?? ""} onChange={(v) => patch({ og_image: v })} dir="ltr" />
          </Section>
        </div>

        {/* Right column */}
        <aside className="space-y-5">
          {/* Actions */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-4 space-y-2">
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isAr ? "حفظ التعديلات" : "Save changes"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStatus("ready_for_review")}
                disabled={page.status === "ready_for_review"}
                className="h-9 rounded-xl bg-amber-50 text-amber-700 text-[12px] font-bold hover:bg-amber-100 disabled:opacity-50"
              >
                {isAr ? "جاهز" : "Ready"}
              </button>
              <button
                onClick={() => handleStatus("published")}
                disabled={page.status === "published"}
                className="h-9 rounded-xl bg-emerald-50 text-emerald-700 text-[12px] font-bold hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isAr ? "نشر" : "Publish"}
              </button>
              <button
                onClick={() => handleStatus("draft")}
                disabled={page.status === "draft"}
                className="h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[12px] font-bold disabled:opacity-50"
              >
                {isAr ? "مسودة" : "Draft"}
              </button>
              <button
                onClick={() => handleStatus("archived")}
                disabled={page.status === "archived"}
                className="h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[12px] font-bold disabled:opacity-50"
              >
                {isAr ? "أرشفة" : "Archive"}
              </button>
            </div>

            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={page.noindex}
                onChange={(e) => patch({ noindex: e.target.checked })}
              />
              {page.noindex ? <EyeOff className="w-4 h-4 text-rose-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
              <span className="text-[13px] text-[#1E374B] dark:text-white font-semibold">Noindex</span>
            </label>
            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={page.nofollow}
                onChange={(e) => patch({ nofollow: e.target.checked })}
              />
              <span className="text-[13px] text-[#1E374B] dark:text-white font-semibold">Nofollow</span>
            </label>

            <button
              onClick={handleDelete}
              className="w-full h-9 rounded-xl text-rose-600 text-[12px] font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 inline-flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isAr ? "حذف الصفحة" : "Delete page"}
            </button>
          </div>

          {/* Quality issues */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-4">
            <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              {isAr ? "فحص الجودة" : "Quality checks"}
            </h4>
            {quality.issues.length === 0 ? (
              <div className="flex items-center gap-2 text-[12px] text-emerald-700">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                {isAr ? "كل الفحوصات ناجحة" : "All checks passed"}
              </div>
            ) : (
              <ul className="space-y-2">
                {quality.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11.5px]">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      issue.severity === "critical" || issue.severity === "high" ? "text-rose-600"
                      : issue.severity === "medium" ? "text-amber-600"
                      : "text-slate-400"
                    }`} strokeWidth={1.8} />
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-slate-400">{issue.type}</p>
                      <p className="text-slate-600 dark:text-slate-300">{issue.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bindings */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-4">
            <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              {isAr ? "الارتباطات" : "Bindings"}
            </h4>
            <dl className="space-y-2 text-[12px]">
              <Row k={isAr ? "النوع" : "Type"} v={page.page_type} />
              <Row k={isAr ? "اللغة" : "Locale"} v={page.locale} />
              <Row k={isAr ? "وضع المحتوى" : "Mode"} v={page.content_mode} />
              <Row k={isAr ? "الكيان" : "Entity"} v={page.entity_id ?? "—"} />
              {page.bound_developer_id && <Row k={isAr ? "المطور" : "Developer"} v={page.bound_developer_id} />}
              <Row k={isAr ? "أُنشئ" : "Generated"} v={page.generated_at ? new Date(page.generated_at).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-US") : "—"} />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-5">
    <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#1E374B] dark:text-white mb-4">
      {Icon && <Icon className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.8} />}
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; multi?: boolean; dir?: string; hint?: string; rows?: number }> = ({ label, value, onChange, multi, dir, hint, rows = 3 }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    {multi ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        dir={dir}
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
      />
    )}
    {hint && <p className="text-[10px] text-slate-400 mt-0.5 text-end font-mono" dir="ltr">{hint}</p>}
  </div>
);

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex items-start justify-between gap-2">
    <dt className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">{k}</dt>
    <dd className="text-slate-700 dark:text-slate-300 font-mono text-[11px] truncate max-w-[180px]" dir="ltr">{v}</dd>
  </div>
);

export default AdminSeoPageDetail;
