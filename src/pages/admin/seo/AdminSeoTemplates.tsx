import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { listSeoTemplates, updateSeoTemplate } from "@/services/seo/templates.service";
import type { SeoTemplate } from "@/types/seo";
import { pageTypeLabels, contentModeLabels } from "@/types/seo";
import { Save, FileCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";

const AdminSeoTemplates: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<SeoTemplate[]>([]);
  const [selected, setSelected] = useState<SeoTemplate | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSeoTemplates();
      setTemplates(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const patch = (p: Partial<SeoTemplate>) => {
    if (!selected) return;
    setSelected({ ...selected, ...p });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const saved = await updateSeoTemplate(selected.id, {
        title_template_ar: selected.title_template_ar,
        title_template_en: selected.title_template_en,
        meta_description_ar: selected.meta_description_ar,
        meta_description_en: selected.meta_description_en,
        h1_template_ar: selected.h1_template_ar,
        h1_template_en: selected.h1_template_en,
        intro_template_ar: selected.intro_template_ar,
        intro_template_en: selected.intro_template_en,
        canonical_pattern: selected.canonical_pattern,
        default_content_mode: selected.default_content_mode,
        is_active: selected.is_active,
      });
      setSelected(saved);
      setDirty(false);
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_template", saved.id, {
          name: saved.name,
          page_type: saved.page_type,
          is_active: saved.is_active,
        });
      }
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* List */}
      <aside className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setDirty(false); }}
                className={`w-full px-4 py-3 text-start hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${selected?.id === t.id ? "bg-[#2B4C66]/[0.04] dark:bg-[#2B4C66]/10 border-s-4 border-[#C2A86B]" : "border-s-4 border-transparent"}`}
              >
                <div className="flex items-center gap-2">
                  <FileCog className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.7} />
                  <p className="text-[13px] font-bold text-[#1E374B] dark:text-white truncate">{t.name}</p>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 ms-6">
                  {isAr ? pageTypeLabels[t.page_type].ar : pageTypeLabels[t.page_type].en}
                  {t.is_default && <span className="ms-2 text-[#C2A86B]">★ default</span>}
                </p>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Editor */}
      <section className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-6">
        {!selected ? (
          <p className="text-center text-slate-400 py-10">{isAr ? "اختر قالباً" : "Select a template"}</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#1E374B] dark:text-white">{selected.name}</h3>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                  {isAr ? pageTypeLabels[selected.page_type].ar : pageTypeLabels[selected.page_type].en}
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isAr ? "حفظ" : "Save"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label={isAr ? "عنوان الصفحة (عربي)" : "Title template (AR)"} value={selected.title_template_ar} onChange={(v) => patch({ title_template_ar: v })} hint="{{name_ar}}" />
              <Field label={isAr ? "عنوان الصفحة (إنجليزي)" : "Title template (EN)"} value={selected.title_template_en} onChange={(v) => patch({ title_template_en: v })} hint="{{name_en}}" dir="ltr" />
              <Field label={isAr ? "Meta description (عربي)" : "Meta description (AR)"} value={selected.meta_description_ar} onChange={(v) => patch({ meta_description_ar: v })} />
              <Field label={isAr ? "Meta description (إنجليزي)" : "Meta description (EN)"} value={selected.meta_description_en} onChange={(v) => patch({ meta_description_en: v })} dir="ltr" />
              <Field label={isAr ? "H1 (عربي)" : "H1 (AR)"} value={selected.h1_template_ar} onChange={(v) => patch({ h1_template_ar: v })} />
              <Field label={isAr ? "H1 (إنجليزي)" : "H1 (EN)"} value={selected.h1_template_en} onChange={(v) => patch({ h1_template_en: v })} dir="ltr" />
              <Field label={isAr ? "Intro (عربي)" : "Intro (AR)"} value={selected.intro_template_ar ?? ""} onChange={(v) => patch({ intro_template_ar: v })} multi />
              <Field label={isAr ? "Intro (إنجليزي)" : "Intro (EN)"} value={selected.intro_template_en ?? ""} onChange={(v) => patch({ intro_template_en: v })} multi dir="ltr" />
              <Field label={isAr ? "Canonical pattern" : "Canonical pattern"} value={selected.canonical_pattern} onChange={(v) => patch({ canonical_pattern: v })} dir="ltr" hint="/sa/{{slug}}" />
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                  {isAr ? "وضع المحتوى الافتراضي" : "Default content mode"}
                </label>
                <select
                  value={selected.default_content_mode}
                  onChange={(e) => patch({ default_content_mode: e.target.value as SeoTemplate["default_content_mode"] })}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
                >
                  {Object.entries(contentModeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/10 p-4 text-[12px] text-slate-500">
              <p className="font-semibold mb-1">{isAr ? "الحقول المتاحة" : "Available variables"}</p>
              <p className="font-mono" dir="ltr">
                {"{{name_ar}} {{name_en}} {{slug}} {{lands_count}} {{developers_count}}"}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
  dir?: string;
  hint?: string;
}> = ({ label, value, onChange, multi, dir, hint }) => (
  <div>
    <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
      {label}
    </label>
    {multi ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
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
    {hint && <p className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">{hint}</p>}
  </div>
);

export default AdminSeoTemplates;
