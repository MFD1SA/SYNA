import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";
import { listSeoEntities, updateSeoEntity, createSeoEntity, deleteSeoEntity } from "@/services/seo/entities.service";
import type { SeoEntity, SeoEntityType } from "@/types/seo";
import { Plus, Trash2, ShieldCheck } from "lucide-react";

const TABS: Array<{ key: SeoEntityType; ar: string; en: string }> = [
  { key: "city",          ar: "المدن",       en: "Cities" },
  { key: "district",      ar: "الأحياء",     en: "Districts" },
  { key: "property_type", ar: "أنواع العقار", en: "Property Types" },
  { key: "service",       ar: "الخدمات",     en: "Services" },
  { key: "topic",         ar: "الموضوعات",   en: "Topics" },
];

const AdminSeoEntities: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SeoEntityType>("city");
  const [rows, setRows] = useState<SeoEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newNameEn, setNewNameEn] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSeoEntities(activeTab);
      setRows(data);
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeTab]);

  const handleToggleActive = async (row: SeoEntity) => {
    try {
      await updateSeoEntity(row.id, { is_active: !row.is_active });
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_entity", row.id, { field: "is_active", from: row.is_active, to: !row.is_active, entity_type: row.entity_type, slug: row.slug });
      }
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };
  const handleToggleSensitive = async (row: SeoEntity) => {
    try {
      await updateSeoEntity(row.id, { is_sensitive: !row.is_sensitive });
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_entity", row.id, { field: "is_sensitive", from: row.is_sensitive, to: !row.is_sensitive, entity_type: row.entity_type, slug: row.slug });
      }
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };
  const handleDelete = async (row: SeoEntity) => {
    if (!confirm(isAr ? "حذف هذا الكيان؟" : "Delete this entity?")) return;
    try {
      await deleteSeoEntity(row.id);
      if (user) {
        await logAudit(user.id, user.email, "delete", "seo_entity", row.id, { entity_type: row.entity_type, slug: row.slug, name_ar: row.name_ar, name_en: row.name_en });
      }
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };
  const handleCreate = async () => {
    if (!newSlug.trim() || !newNameAr.trim() || !newNameEn.trim()) {
      toast({ variant: "destructive", title: isAr ? "عبّئ الحقول المطلوبة" : "Fill all fields" });
      return;
    }
    try {
      const created = await createSeoEntity({
        entity_type: activeTab,
        slug: newSlug.trim().toLowerCase(),
        name_ar: newNameAr.trim(),
        name_en: newNameEn.trim(),
        is_active: true,
      });
      if (user) {
        await logAudit(user.id, user.email, "create", "seo_entity", created.id, {
          entity_type: created.entity_type,
          slug: created.slug,
          name_ar: created.name_ar,
          name_en: created.name_en,
          is_active: created.is_active,
        });
      }
      setNewSlug(""); setNewNameAr(""); setNewNameEn("");
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-tabs for entity type */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-100/70 dark:bg-white/5 p-1 border border-slate-200/70 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`h-9 px-3.5 rounded-xl text-[12.5px] font-semibold transition-all ${activeTab === t.key ? "bg-white dark:bg-slate-800 text-[#1E374B] dark:text-white shadow-[0_2px_8px_-4px_rgba(15,31,46,0.15)]" : "text-slate-500 hover:text-[#1E374B] dark:hover:text-white"}`}
          >
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Create */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            placeholder="slug"
            dir="ltr"
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px] font-mono"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
          />
          <input
            placeholder={isAr ? "الاسم (عربي)" : "Name (Arabic)"}
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
            value={newNameAr}
            onChange={(e) => setNewNameAr(e.target.value)}
          />
          <input
            placeholder={isAr ? "الاسم (إنجليزي)" : "Name (English)"}
            dir="ltr"
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
            value={newNameEn}
            onChange={(e) => setNewNameEn(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="h-10 rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold inline-flex items-center justify-center gap-2 shadow-[0_4px_12px_-4px_rgba(43,76,102,0.45)]"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "إضافة" : "Add"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "لا توجد كيانات." : "No entities."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-start">Slug</th>
                  <th className="px-4 py-3 text-start">{isAr ? "عربي" : "Arabic"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "إنجليزي" : "English"}</th>
                  <th className="px-4 py-3 text-center">{isAr ? "مفعّل" : "Active"}</th>
                  <th className="px-4 py-3 text-center">{isAr ? "حسّاس" : "Sensitive"}</th>
                  <th className="px-4 py-3 text-end"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-500" dir="ltr">{r.slug}</td>
                    <td className="px-4 py-3 font-semibold text-[#1E374B] dark:text-white">{r.name_ar}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300" dir="ltr">{r.name_en}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {r.is_active ? (isAr ? "مفعّل" : "Active") : (isAr ? "معطّل" : "Inactive")}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleSensitive(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.is_sensitive ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-400"}`}
                      >
                        {r.is_sensitive && <ShieldCheck className="w-3 h-3" />}
                        {r.is_sensitive ? (isAr ? "حسّاس" : "Sensitive") : (isAr ? "لا" : "No")}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => handleDelete(r)}
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSeoEntities;
