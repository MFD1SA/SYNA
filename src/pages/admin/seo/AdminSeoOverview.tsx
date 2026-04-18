import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getSeoOverview, type SeoOverviewCounts } from "@/services/seo/pages.service";
import { triggerSeoGeneration, listGenerationRuns } from "@/services/seo/generation.service";
import { listSeoRules } from "@/services/seo/rules.service";
import type { SeoGenerationRule, SeoGenerationRun } from "@/types/seo";
import {
  FileText, CheckCircle2, AlertTriangle, EyeOff, Archive, FileWarning, Copy,
  Sparkles, Loader2, ShieldCheck,
} from "lucide-react";

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: number; tone?: "default" | "warn" | "danger" | "success" }> =
({ icon: Icon, label, value, tone = "default" }) => {
  const toneCls = tone === "warn" ? "bg-amber-50 text-amber-700"
    : tone === "danger" ? "bg-rose-50 text-rose-700"
    : tone === "success" ? "bg-emerald-50 text-emerald-700"
    : "bg-[#2B4C66]/[0.06] text-[#2B4C66]";
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneCls}`}>
          <Icon className="w-5 h-5" strokeWidth={1.7} />
        </div>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[24px] font-bold text-[#1E374B] dark:text-white tracking-tight leading-none mt-1" dir="ltr">{value}</p>
    </div>
  );
};

const AdminSeoOverview: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();

  const [counts, setCounts] = useState<SeoOverviewCounts | null>(null);
  const [rules, setRules] = useState<SeoGenerationRule[]>([]);
  const [runs, setRuns] = useState<SeoGenerationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, r, runsData] = await Promise.all([
        getSeoOverview(),
        listSeoRules(),
        listGenerationRuns(5),
      ]);
      setCounts(c);
      setRules(r);
      setRuns(runsData);
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleGenerate = async (ruleId?: string) => {
    setRunning(true);
    try {
      const result = await triggerSeoGeneration({ ruleId });
      toast({
        title: isAr ? "اكتمل التوليد" : "Generation complete",
        description: isAr
          ? `تم توليد ${result.pagesGenerated} صفحة، وتخطّي ${result.pagesSkipped}.`
          : `Generated ${result.pagesGenerated} pages, skipped ${result.pagesSkipped}.`,
      });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: isAr ? "فشل التوليد" : "Generation failed", description: String(err) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label={isAr ? "الإجمالي" : "Total"} value={counts?.total ?? 0} />
        <StatCard icon={CheckCircle2} label={isAr ? "منشور" : "Published"} value={counts?.published ?? 0} tone="success" />
        <StatCard icon={AlertTriangle} label={isAr ? "بانتظار المراجعة" : "Review"} value={counts?.readyForReview ?? 0} tone="warn" />
        <StatCard icon={FileText} label={isAr ? "مسودة" : "Draft"} value={counts?.draft ?? 0} />
        <StatCard icon={EyeOff} label={isAr ? "Noindex" : "Noindex"} value={counts?.noindex ?? 0} tone="danger" />
        <StatCard icon={Archive} label={isAr ? "مؤرشف" : "Archived"} value={counts?.archived ?? 0} />
        <StatCard icon={Copy} label={isAr ? "عناوين مكررة" : "Duplicate titles"} value={counts?.duplicateTitles ?? 0} tone="warn" />
        <StatCard icon={FileWarning} label={isAr ? "بدون canonical" : "Missing canonical"} value={counts?.missingCanonical ?? 0} tone="warn" />
      </div>

      {/* Generation trigger */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[17px] font-bold text-[#1E374B] dark:text-white mb-1">
              {isAr ? "محرّك التوليد" : "Generation Engine"}
            </h2>
            <p className="text-[12px] text-slate-500">
              {isAr
                ? "يشغّل القواعد النشطة فقط، مع تطبيق كل بوابات الجودة ومنع التكرار تلقائياً."
                : "Runs only active rules, applying all quality gates and dedupe checks automatically."}
            </p>
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={running || loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold disabled:opacity-60 shadow-[0_6px_16px_-6px_rgba(43,76,102,0.5)] hover:shadow-[0_10px_24px_-8px_rgba(43,76,102,0.6)] transition-all"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAr ? "تشغيل كل القواعد" : "Run all rules"}
          </button>
        </div>

        <div className="space-y-2">
          {rules.length === 0 && <p className="text-[13px] text-slate-400">{isAr ? "لا توجد قواعد." : "No rules configured."}</p>}
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${r.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <p className="text-[13px] font-bold text-[#1E374B] dark:text-white truncate">{r.name}</p>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{r.page_type}</span>
                  {r.content_mode === "manual_only" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                      {isAr ? "مراجعة يدوية" : "Manual"}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleGenerate(r.id)}
                disabled={running || !r.is_active}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[12px] font-semibold text-[#2B4C66] dark:text-[#7FA7C4] hover:bg-[#2B4C66]/5 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? "تشغيل" : "Run"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent runs */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-6">
        <h2 className="text-[17px] font-bold text-[#1E374B] dark:text-white mb-4">
          {isAr ? "آخر تشغيلات التوليد" : "Recent generation runs"}
        </h2>
        {runs.length === 0 ? (
          <p className="text-[13px] text-slate-400">{isAr ? "لم يتم تشغيل توليد بعد." : "No runs yet."}</p>
        ) : (
          <div className="space-y-2">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/10 p-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-slate-500">
                    {new Date(r.created_at).toLocaleString(isAr ? "ar-SA-u-nu-latn" : "en-US")}
                  </p>
                  <p className="text-[13px] font-semibold text-[#1E374B] dark:text-white">
                    {isAr ? "ولّد" : "Generated"}: <span dir="ltr">{r.pages_generated}</span> • {isAr ? "تخطّى" : "Skipped"}: <span dir="ltr">{r.pages_skipped}</span>
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === "completed" ? "bg-emerald-50 text-emerald-700" : r.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSeoOverview;
