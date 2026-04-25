import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";
import {
  listSeoRedirects, createSeoRedirect, updateSeoRedirect, deleteSeoRedirect,
} from "@/services/seo/redirects.service";
import type { SeoRedirect } from "@/types/seo";
import { Plus, Trash2, Repeat2 } from "lucide-react";

const AdminSeoRedirects: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const { user } = useAuth();

  const [rows, setRows] = useState<SeoRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");
  const [tgt, setTgt] = useState("");
  const [code, setCode] = useState<301 | 302>(301);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listSeoRedirects());
    } catch (err: unknown) {
      toast({ variant: "destructive", title: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleCreate = async () => {
    if (!src.trim() || !tgt.trim()) { toast({ variant: "destructive", title: isAr ? "أدخل المصدر والهدف" : "Enter source and target" }); return; }
    try {
      const created = await createSeoRedirect({
        source_path: src.trim(),
        target_path: tgt.trim(),
        status_code: code,
        is_active: true,
      });
      if (user) {
        await logAudit(user.id, user.email, "create", "seo_redirect", created.id, {
          source_path: created.source_path,
          target_path: created.target_path,
          status_code: created.status_code,
          is_active: created.is_active,
        });
      }
      setSrc(""); setTgt("");
      await load();
    } catch (err: unknown) { toast({ variant: "destructive", title: String(err) }); }
  };

  const handleToggle = async (r: SeoRedirect) => {
    try {
      await updateSeoRedirect(r.id, { is_active: !r.is_active });
      if (user) {
        await logAudit(user.id, user.email, "update", "seo_redirect", r.id, { field: "is_active", from: r.is_active, to: !r.is_active });
      }
      await load();
    }
    catch (err: unknown) { toast({ variant: "destructive", title: String(err) }); }
  };

  const handleDelete = async (r: SeoRedirect) => {
    if (!confirm(isAr ? "حذف هذا التحويل؟" : "Delete this redirect?")) return;
    try {
      await deleteSeoRedirect(r.id);
      if (user) {
        await logAudit(user.id, user.email, "delete", "seo_redirect", r.id, {
          source_path: r.source_path,
          target_path: r.target_path,
          status_code: r.status_code,
        });
      }
      await load();
    }
    catch (err: unknown) { toast({ variant: "destructive", title: String(err) }); }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2">
          <input placeholder={isAr ? "المصدر /old-path" : "Source /old-path"} dir="ltr" value={src} onChange={(e) => setSrc(e.target.value)} className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px] font-mono" />
          <input placeholder={isAr ? "الهدف /new-path" : "Target /new-path"} dir="ltr" value={tgt} onChange={(e) => setTgt(e.target.value)} className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px] font-mono" />
          <select value={code} onChange={(e) => setCode(Number(e.target.value) as 301 | 302)} className="h-10 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200/70 dark:border-white/10 text-[13px]">
            <option value={301}>301</option>
            <option value={302}>302</option>
          </select>
          <button onClick={handleCreate} className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {isAr ? "إضافة" : "Add"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">{isAr ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <Repeat2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-[13px] text-slate-500">{isAr ? "لا توجد تحويلات." : "No redirects."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-start">{isAr ? "المصدر" : "Source"}</th>
                  <th className="px-4 py-3 text-start">{isAr ? "الهدف" : "Target"}</th>
                  <th className="px-4 py-3 text-center">{isAr ? "الحالة" : "Code"}</th>
                  <th className="px-4 py-3 text-center">{isAr ? "مفعّل" : "Active"}</th>
                  <th className="px-4 py-3 text-end"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono text-[12px]" dir="ltr">{r.source_path}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#2B4C66]" dir="ltr">{r.target_path}</td>
                    <td className="px-4 py-3 text-center font-mono text-[11px]" dir="ltr">{r.status_code}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(r)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {r.is_active ? (isAr ? "مفعّل" : "On") : (isAr ? "معطّل" : "Off")}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button onClick={() => handleDelete(r)} className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center">
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

export default AdminSeoRedirects;
