import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, History, Filter, ChevronLeft, ChevronRight, Download, FileJson, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Hard cap how many rows a single export can pull. Larger exports should
// go through a proper reporting pipeline, not the browser. This keeps us
// well under supabase-js default row limit and avoids frozen tabs.
const EXPORT_MAX_ROWS = 5000;

/**
 * Escape a value for CSV. Wraps in quotes if it contains comma, quote,
 * newline, or CR; doubles embedded quotes per RFC 4180.
 */
const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const triggerBrowserDownload = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  update: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  delete: "bg-red-500/10 text-red-700 border-red-500/20",
  approve: "bg-primary/10 text-primary border-primary/20",
  reject: "bg-amber-500/10 text-amber-700 border-amber-500/20",
};

const actionLabels: Record<string, { ar: string; en: string }> = {
  create: { ar: "إنشاء", en: "Create" },
  update: { ar: "تعديل", en: "Update" },
  delete: { ar: "حذف", en: "Delete" },
  approve: { ar: "اعتماد", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },
  reset_password: { ar: "إعادة تعيين كلمة المرور", en: "Reset Password" },
};

const entityLabels: Record<string, { ar: string; en: string }> = {
  land: { ar: "أرض", en: "Land" },
  developer: { ar: "مطور", en: "Developer" },
  owner: { ar: "مالك", en: "Owner" },
  deal: { ar: "صفقة", en: "Deal" },
  deal_request: { ar: "طلب شراكة", en: "Deal Request" },
  content: { ar: "محتوى", en: "Content" },
  user: { ar: "مستخدم", en: "User" },
};

const PAGE_SIZE = 20;

/** Escape characters that could break PostgREST .or()/.ilike() filter syntax */
const sanitizeFilterInput = (input: string): string =>
  input.replace(/[%_(),.\\]/g, (ch) => `\\${ch}`);

const AdminAuditLog: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سجل العمليات" : "Audit Log");

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [exporting, setExporting] = useState<null | "csv" | "json">(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (search) {
      const safe = sanitizeFilterInput(search);
      query = query.or(`user_email.ilike.%${safe}%,entity_id.ilike.%${safe}%`);
    }

    const { data } = await query;
    setLogs(data || []);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }, [page, entityFilter, actionFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /**
   * P1.8 — Export the CURRENT filter set (not the on-screen page).
   * Runs the same query builder as fetchLogs but pulls up to
   * EXPORT_MAX_ROWS in one shot, then writes a file client-side.
   *
   * Security note: audit_logs RLS already restricts SELECT to admins,
   * so there's no privilege-escalation surface here — we just reuse
   * whatever rows supabase-js is willing to return to this session.
   */
  const runExport = useCallback(async (fmt: "csv" | "json") => {
    setExporting(fmt);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(EXPORT_MAX_ROWS);

      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (search) {
        const safe = sanitizeFilterInput(search);
        query = query.or(`user_email.ilike.%${safe}%,entity_id.ilike.%${safe}%`);
      }

      const { data, error } = await query;
      if (error) {
        toast({ variant: "destructive", title: isAr ? "فشل التصدير" : "Export failed", description: error.message });
        return;
      }
      const rows = data || [];
      if (rows.length === 0) {
        toast({ title: isAr ? "لا توجد سجلات للتصدير" : "No logs to export" });
        return;
      }

      const stamp = format(new Date(), "yyyy-MM-dd_HHmm");
      if (fmt === "json") {
        const blob = new Blob([JSON.stringify(rows, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        triggerBrowserDownload(`audit_logs_${stamp}.json`, blob);
      } else {
        // CSV header follows the audit_logs column order most admins expect.
        const headers = [
          "created_at",
          "user_email",
          "user_id",
          "action",
          "entity_type",
          "entity_id",
          "details",
        ];
        const lines = [headers.join(",")];
        for (const row of rows) {
          lines.push([
            csvEscape(row.created_at),
            csvEscape(row.user_email),
            csvEscape(row.user_id),
            csvEscape(row.action),
            csvEscape(row.entity_type),
            csvEscape(row.entity_id),
            csvEscape(row.details),
          ].join(","));
        }
        // Prepend UTF-8 BOM so Excel opens Arabic correctly.
        const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
          type: "text/csv;charset=utf-8",
        });
        triggerBrowserDownload(`audit_logs_${stamp}.csv`, blob);
      }

      toast({
        title: isAr ? "تم التصدير" : "Export complete",
        description: isAr
          ? `تم تصدير ${rows.length} سجل${rows.length >= EXPORT_MAX_ROWS ? " (تم بلوغ الحد الأقصى)" : ""}.`
          : `Exported ${rows.length} rows${rows.length >= EXPORT_MAX_ROWS ? " (max cap reached)" : ""}.`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "فشل التصدير" : "Export failed", description: err.message });
    } finally {
      setExporting(null);
    }
  }, [entityFilter, actionFilter, search, toast, isAr]);

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
      <AdminPageHeader
        icon={History}
        titleAr="سجل العمليات"
        titleEn="Audit Log"
        descAr="تتبع جميع العمليات: من عدّل ماذا ومتى"
        descEn="Track all operations: who changed what and when"
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9 h-9" placeholder={isAr ? "بحث بالبريد أو المعرف..." : "Search by email or ID..."} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={entityFilter} onValueChange={v => { setEntityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={isAr ? "نوع الكيان" : "Entity Type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            {Object.entries(entityLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder={isAr ? "نوع العملية" : "Action"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            {Object.entries(actionLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* P1.8 — export buttons. Both respect the current filters. */}
        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            disabled={exporting !== null}
            onClick={() => runExport("csv")}
            title={isAr ? "تصدير النتائج الحالية CSV" : "Export current filters as CSV"}
          >
            {exporting === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            disabled={exporting !== null}
            onClick={() => runExport("json")}
            title={isAr ? "تصدير النتائج الحالية JSON" : "Export current filters as JSON"}
          >
            {exporting === "json" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileJson className="h-3.5 w-3.5" />}
            JSON
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <History className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد سجلات" : "No logs found"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="rounded-xl border border-border/60 bg-card flex items-center justify-between p-4 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge variant="outline" className={`text-[10px] shrink-0 ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                  {actionLabels[log.action]?.[isAr ? "ar" : "en"] || log.action}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-light text-foreground truncate">
                    <span className="font-medium">{entityLabels[log.entity_type]?.[isAr ? "ar" : "en"] || log.entity_type}</span>
                    {log.entity_id && <span className="text-muted-foreground ms-1 text-xs">#{log.entity_id.slice(0, 8)}</span>}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs font-light text-muted-foreground truncate">
                      {JSON.stringify(log.details).slice(0, 80)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-end shrink-0 ms-4">
                <p className="text-xs font-light text-muted-foreground">{log.user_email || "—"}</p>
                <p className="text-[10px] text-muted-foreground/60" dir="ltr">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm")}</p>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <span className="text-sm font-light text-muted-foreground">{page + 1}</span>
            <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
              {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
