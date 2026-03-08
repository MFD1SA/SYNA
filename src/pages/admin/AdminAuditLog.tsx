import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, History, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

const AdminAuditLog: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سجل العمليات" : "Audit Log");

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (search) query = query.or(`user_email.ilike.%${search}%,entity_id.ilike.%${search}%`);

    const { data } = await query;
    setLogs(data || []);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, entityFilter, actionFilter, search]);

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
            <div key={log.id} className="doma-card flex items-center justify-between p-4">
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
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-light text-muted-foreground">{page + 1}</span>
            <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAuditLog;
