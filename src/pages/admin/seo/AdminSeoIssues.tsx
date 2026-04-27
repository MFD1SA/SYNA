import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { listSeoIssues, resolveSeoIssue, resolveSeoIssuesBulk } from "@/services/seo/issues.service";
import type { SeoIssue } from "@/types/seo";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";

const AdminSeoIssues: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setIssues(await listSeoIssues({ resolved: showResolved ? undefined : false }));
      setSelected(new Set());
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [showResolved]);

  const handleResolve = async (id: string) => {
    try {
      await resolveSeoIssue(id, user?.id ?? null);
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_issue", id, { action: "resolved" });
      }
      toast({ title: isAr ? "تم الحل" : "Resolved" });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  // Only unresolved rows can be checked / bulk-resolved
  const unresolvedIssues = useMemo(() => issues.filter((i) => !i.is_resolved), [issues]);
  const allUnresolvedIds = useMemo(() => unresolvedIssues.map((i) => i.id), [unresolvedIssues]);
  const allSelected = selected.size > 0 && selected.size === allUnresolvedIds.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allUnresolvedIds));
  };

  const handleBulkResolve = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selected);
      const n = await resolveSeoIssuesBulk(ids, user?.id ?? null);
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_issue", "bulk", { action: "bulk_resolved", count: n, ids });
      }
      toast({
        title: isAr ? `تم حلّ ${n} مشكلة` : `Resolved ${n} issue(s)`,
      });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleResolveAllFiltered = async () => {
    if (allUnresolvedIds.length === 0) return;
    if (!confirm(isAr ? `سيتم حل ${allUnresolvedIds.length} مشكلة غير محلولة. هل تريد المتابعة؟` : `Resolve all ${allUnresolvedIds.length} unresolved issues?`)) return;
    setBulkBusy(true);
    try {
      const n = await resolveSeoIssuesBulk(allUnresolvedIds, user?.id ?? null);
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_issue", "bulk_all", { action: "resolve_all_unresolved", count: n });
      }
      toast({ title: isAr ? `تم حلّ ${n} مشكلة` : `Resolved ${n} issue(s)` });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setBulkBusy(false);
    }
  };

  const sevClass: Record<string, string> = {
    critical: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-400/30",
    high: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-400/30",
    medium: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-400/30",
    low: "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10",
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-[#020202] dark:text-white">
          {isAr ? "مشاكل الجودة المكتشفة" : "Detected Quality Issues"}
        </h2>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-300">
            <input
              type="checkbox"
              className="accent-[#2B2B2B]"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            {isAr ? "عرض المحلولة" : "Show resolved"}
          </label>
          {allUnresolvedIds.length > 0 && (
            <button
              onClick={handleResolveAllFiltered}
              disabled={bulkBusy}
              className="h-9 px-3 rounded-lg text-[12px] font-semibold text-[#2B2B2B] dark:text-[#9BBEDB] border border-[#2B2B2B]/20 dark:border-[#2B2B2B]/40 hover:bg-[#2B2B2B]/5 dark:hover:bg-white/5 disabled:opacity-50"
            >
              {isAr ? `حلّ جميع غير المحلولة (${allUnresolvedIds.length})` : `Resolve all unresolved (${allUnresolvedIds.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar — shows only when selections exist */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#2B2B2B]/5 dark:bg-[#2B2B2B]/15 border border-[#2B2B2B]/20 dark:border-[#2B2B2B]/30 px-4 py-2.5">
          <p className="text-[12.5px] font-semibold text-[#020202] dark:text-white">
            {isAr ? `${selected.size} مشكلة محددة` : `${selected.size} selected`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold text-slate-500 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5"
            >
              {isAr ? "إلغاء" : "Clear"}
            </button>
            <button
              onClick={handleBulkResolve}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-bold bg-gradient-to-r from-[#2B2B2B] to-[#020202] text-white disabled:opacity-60"
            >
              {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isAr ? "حلّ المحدد" : "Resolve selected"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {/* Select-All header — only when there's something to select */}
        {!loading && unresolvedIssues.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/60 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
            <input
              type="checkbox"
              className="accent-[#2B2B2B]"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleAll}
              id="select-all-issues"
            />
            <label htmlFor="select-all-issues" className="text-[12px] font-semibold text-slate-600 dark:text-slate-200 cursor-pointer select-none">
              {isAr ? `تحديد الكل (${unresolvedIssues.length})` : `Select all (${unresolvedIssues.length})`}
            </label>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : issues.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="text-[14px] text-slate-500 dark:text-slate-300">
              {isAr ? "لا توجد مشاكل غير محلولة" : "No unresolved issues"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {issues.map((i) => {
              const isChecked = selected.has(i.id);
              return (
                <li
                  key={i.id}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                    isChecked ? "bg-[#2B2B2B]/[0.03] dark:bg-[#2B2B2B]/10" : "hover:bg-slate-50/60 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {!i.is_resolved && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(i.id)}
                      className="mt-2 accent-[#2B2B2B] shrink-0"
                    />
                  )}
                  <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                    i.is_resolved ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-amber-50 dark:bg-amber-500/15"
                  }`}>
                    {i.is_resolved
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" strokeWidth={1.7} />
                      : <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300" strokeWidth={1.7} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-300">{i.issue_type}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevClass[i.severity] ?? ""}`}>
                        {i.severity}
                      </span>
                      {i.is_resolved && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-400/30">
                          {isAr ? "محلولة" : "resolved"}
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-slate-600 dark:text-slate-200 mt-1">
                      {typeof i.details?.message === "string" ? i.details.message : JSON.stringify(i.details)}
                    </p>
                  </div>
                  {!i.is_resolved && (
                    <button
                      onClick={() => handleResolve(i.id)}
                      className="shrink-0 h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/30"
                    >
                      {isAr ? "حل" : "Resolve"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSeoIssues;
