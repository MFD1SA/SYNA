import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  listPublishQueue, removeFromQueue, processQueue,
  type SeoPublishQueueItem,
} from "@/services/seo/queue.service";
import { Play, Trash2, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const AdminSeoQueue: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();

  const [rows, setRows] = useState<SeoPublishQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listPublishQueue());
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await processQueue();
      toast({
        title: isAr ? "اكتملت المعالجة" : "Queue processed",
        description: isAr ? `نُفِّذت ${result.processed}، فشلت ${result.failed}` : `Processed ${result.processed}, failed ${result.failed}`,
      });
      await load();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async (id: string) => {
    try { await removeFromQueue(id); await load(); }
    catch (err: unknown) { toast({ variant: "destructive", title: String(err) }); }
  };

  const statusIcon = (s: SeoPublishQueueItem["status"]) => {
    if (s === "queued") return <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.8} />;
    if (s === "processing") return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" strokeWidth={1.8} />;
    if (s === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />;
    return <XCircle className="w-4 h-4 text-rose-600" strokeWidth={1.8} />;
  };

  const queuedCount = rows.filter((r) => r.status === "queued").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[#1E374B] dark:text-white">
            {isAr ? "طابور النشر" : "Publish Queue"}
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {isAr
              ? `${queuedCount} صفحة بانتظار النشر المجدول. التنفيذ يدوي حالياً.`
              : `${queuedCount} pages waiting for scheduled publishing. Processing is manual for now.`}
          </p>
        </div>
        <button
          onClick={handleProcess}
          disabled={processing || queuedCount === 0}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isAr ? "تشغيل المعالجة" : "Run processor"}
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-[13px] text-slate-500">{isAr ? "الطابور فارغ." : "Queue is empty."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "الصفحة" : "Page"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "الهدف" : "Target"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "موعد التنفيذ" : "Scheduled"}</th>
                  <th className="px-4 py-3 text-end"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className="text-[12px] font-semibold capitalize">{r.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500" dir="ltr">{r.page_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {r.target_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-500">
                      {r.scheduled_for ? new Date(r.scheduled_for).toLocaleString(isAr ? "ar-SA-u-nu-latn" : "en-US") : (isAr ? "فوراً" : "Immediate")}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => handleRemove(r.id)}
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

export default AdminSeoQueue;
