import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { listSeoIssues, resolveSeoIssue } from "@/services/seo/issues.service";
import type { SeoIssue } from "@/types/seo";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminSeoIssues: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setIssues(await listSeoIssues({ resolved: showResolved ? undefined : false }));
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [showResolved]);

  const handleResolve = async (id: string) => {
    try { await resolveSeoIssue(id, user?.id ?? null); await load(); }
    catch (err: unknown) { toast({ variant: "destructive", title: String(err) }); }
  };

  const sevClass: Record<string, string> = {
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    high: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#1E374B] dark:text-white">
          {isAr ? "مشاكل الجودة المكتشفة" : "Detected Quality Issues"}
        </h2>
        <label className="inline-flex items-center gap-2 text-[12px] text-slate-500">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          {isAr ? "عرض المحلولة" : "Show resolved"}
        </label>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : issues.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="text-[14px] text-slate-500">{isAr ? "لا توجد مشاكل غير محلولة" : "No unresolved issues"}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {issues.map((i) => (
              <li key={i.id} className="px-4 py-3 flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{i.issue_type}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevClass[i.severity] ?? ""}`}>
                      {i.severity}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mt-1">
                    {typeof i.details?.message === "string" ? i.details.message : JSON.stringify(i.details)}
                  </p>
                </div>
                {!i.is_resolved && (
                  <button
                    onClick={() => handleResolve(i.id)}
                    className="shrink-0 h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100"
                  >
                    {isAr ? "حل" : "Resolve"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSeoIssues;
