import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";
import { listSeoRules, updateSeoRule } from "@/services/seo/rules.service";
import type { SeoGenerationRule } from "@/types/seo";
import { contentModeLabels, pageTypeLabels } from "@/types/seo";

const AdminSeoRules: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [rules, setRules] = useState<SeoGenerationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRules(await listSeoRules());
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleToggle = async (r: SeoGenerationRule) => {
    try {
      await updateSeoRule(r.id, { is_active: !r.is_active });
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_rule", r.id, { field: "is_active", from: r.is_active, to: !r.is_active });
      }
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  const handleModeChange = async (r: SeoGenerationRule, mode: SeoGenerationRule["content_mode"]) => {
    try {
      await updateSeoRule(r.id, { content_mode: mode });
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_rule", r.id, { field: "content_mode", from: r.content_mode, to: mode });
      }
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
      {loading ? (
        <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-start">{isAr ? "الاسم" : "Name"}</th>
                <th className="px-4 py-3 text-start">{isAr ? "النوع" : "Type"}</th>
                <th className="px-4 py-3 text-center">{isAr ? "بوابات الجودة" : "Gates"}</th>
                <th className="px-4 py-3 text-end">{isAr ? "الحد الأقصى للتشغيل" : "Max/run"}</th>
                <th className="px-4 py-3 text-start">{isAr ? "الوضع" : "Mode"}</th>
                <th className="px-4 py-3 text-center">{isAr ? "مفعّل" : "Active"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rules.map((r) => {
                const gates = r.quality_gates as Record<string, unknown>;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-[#1E374B] dark:text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {isAr ? pageTypeLabels[r.page_type].ar : pageTypeLabels[r.page_type].en}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-wrap gap-1">
                        {gates?.min_word_count ? <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-300">min {String(gates.min_word_count)}w</span> : null}
                        {gates?.require_internal_links ? <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{String(gates.require_internal_links)} links</span> : null}
                        {gates?.require_faq ? <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-700">FAQ</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end font-mono text-[12px]" dir="ltr">{r.max_pages_per_run ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.content_mode}
                        onChange={(e) => handleModeChange(r, e.target.value as SeoGenerationRule["content_mode"])}
                        className="h-8 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[11.5px] font-semibold"
                      >
                        {Object.entries(contentModeLabels).map(([k, v]) => (
                          <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {r.is_active ? (isAr ? "مفعّل" : "On") : (isAr ? "معطّل" : "Off")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSeoRules;
