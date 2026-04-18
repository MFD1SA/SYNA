import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { listSeoPages, setSeoPageStatus, deleteSeoPage, updateSeoPage } from "@/services/seo/pages.service";
import type { SeoPage, SeoPageStatus, SeoPageType } from "@/types/seo";
import { pageStatusLabels, pageTypeLabels } from "@/types/seo";
import {
  Search, ExternalLink, CheckCircle2, FileText, Eye, Trash2, Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminSeoPages: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [rows, setRows] = useState<SeoPage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SeoPageStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SeoPageType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await listSeoPages({
        status: statusFilter === "all" ? undefined : statusFilter,
        pageType: typeFilter === "all" ? undefined : typeFilter,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      setRows(result.rows);
      setTotal(result.total);
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, typeFilter]);

  const handlePublish = async (id: string) => {
    try {
      await setSeoPageStatus(id, "published", user?.id);
      toast({ title: isAr ? "تم النشر" : "Published" });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };
  const handleMarkReady = async (id: string) => {
    try {
      await setSeoPageStatus(id, "ready_for_review", user?.id);
      toast({ title: isAr ? "جاهز للمراجعة" : "Marked ready" });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };
  const handleNoindex = async (id: string, currentNoindex: boolean) => {
    try {
      await updateSeoPage(id, { noindex: !currentNoindex });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "حذف هذه الصفحة نهائياً؟" : "Delete this page permanently?")) return;
    try {
      await deleteSeoPage(id);
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  const statusBadge = (s: SeoPageStatus) => {
    const l = pageStatusLabels[s];
    const cls = l.color === "emerald" ? "bg-emerald-50 text-emerald-700"
      : l.color === "amber" ? "bg-amber-50 text-amber-700"
      : l.color === "rose" ? "bg-rose-50 text-rose-700"
      : "bg-slate-100 text-slate-600";
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{isAr ? l.ar : l.en}</span>;
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
  }, [rows, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={isAr ? "بحث في العناوين أو الـ slug..." : "Search titles or slugs..."}
            className="w-full h-10 ps-10 pe-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px] focus:outline-none focus:border-[#2B4C66]/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SeoPageStatus | "all")}
          >
            <option value="all">{isAr ? "كل الحالات" : "All statuses"}</option>
            {Object.entries(pageStatusLabels).map(([k, v]) => (
              <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
            ))}
          </select>
          <select
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as SeoPageType | "all")}
          >
            <option value="all">{isAr ? "كل الأنواع" : "All types"}</option>
            {Object.entries(pageTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
            ))}
          </select>
        </div>
        <span className="text-[12px] text-slate-500 ms-auto">
          {isAr ? `${total} صفحة` : `${total} pages`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-[14px] text-slate-500">{isAr ? "لا توجد صفحات مطابقة." : "No matching pages."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-start">{isAr ? "العنوان" : "Title"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "النوع" : "Type"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "اللغة" : "Locale"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-end">{isAr ? "الجودة" : "Score"}</th>
                  <th className="px-4 py-3 text-end"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1E374B] dark:text-white line-clamp-1">{r.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono line-clamp-1" dir="ltr">{r.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">
                      {isAr ? pageTypeLabels[r.page_type].ar : pageTypeLabels[r.page_type].en}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[12px] uppercase font-mono" dir="ltr">{r.locale}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-end font-bold text-[#1E374B] dark:text-white" dir="ltr">
                      {r.quality_score ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "published" && (
                          <a
                            href={`${r.locale === "en" ? "/en" : ""}${r.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-[#2B4C66] hover:bg-[#2B4C66]/5 flex items-center justify-center transition-colors"
                            title={isAr ? "فتح" : "Open"}
                          >
                            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                          </a>
                        )}
                        {r.status === "draft" && (
                          <button
                            onClick={() => handleMarkReady(r.id)}
                            className="h-7 px-2.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors"
                            title={isAr ? "جاهز للمراجعة" : "Ready"}
                          >
                            {isAr ? "جاهز" : "Ready"}
                          </button>
                        )}
                        {r.status === "ready_for_review" && (
                          <button
                            onClick={() => handlePublish(r.id)}
                            className="h-7 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                            title={isAr ? "نشر" : "Publish"}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? "نشر" : "Publish"}
                          </button>
                        )}
                        <button
                          onClick={() => handleNoindex(r.id, r.noindex)}
                          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${r.noindex ? "bg-rose-50 text-rose-700" : "text-slate-400 hover:bg-slate-100"}`}
                          title={isAr ? "تبديل Noindex" : "Toggle Noindex"}
                        >
                          <Eye className={`w-3.5 h-3.5 ${r.noindex ? "line-through" : ""}`} strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          title={isAr ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                        </button>
                      </div>
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

export default AdminSeoPages;
