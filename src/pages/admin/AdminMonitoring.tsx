import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Clock, Mail, XOctagon, RefreshCw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";

/**
 * High-Control monitoring dashboard.
 *
 * Aggregates signals that need operator attention:
 *   1. Stuck deals — updated_at older than 7 days and still in an active phase.
 *   2. Recently rejected deals — closed_lost with a rejection_reason.
 *   3. Owner invitations — last 20 invite events (whether email was sent or not).
 *   4. Failed email sends — invites/notifications where email_sent=false in details.
 *
 * Data comes from `deal_requests` and `audit_logs`; no extra table required.
 */

const STUCK_DAYS = 7;

interface StuckDeal {
  id: string;
  current_phase: string | null;
  updated_at: string;
  lands?: { city: string | null; district: string | null } | null;
  developers?: { company_name: string | null } | null;
}

interface RejectedDeal {
  id: string;
  closed_at: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  lands?: { city: string | null } | null;
  developers?: { company_name: string | null } | null;
}

interface AuditRow {
  id: string;
  action: string;
  user_email: string | null;
  entity_id: string | null;
  created_at: string;
  details: Record<string, any> | null;
}

interface DeadLetterEmail {
  id: string;
  event_type: string;
  recipient_email: string;
  status: string;
  attempts: number;
  max_attempts: number;
  error: string | null;
  created_at: string;
  last_attempt_at: string | null;
}

const AdminMonitoring: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const locale = isAr ? arLocale : enUS;
  usePageTitle(isAr ? "لوحة المراقبة" : "Monitoring");

  const [loading, setLoading] = useState(true);
  const [stuck, setStuck] = useState<StuckDeal[]>([]);
  const [rejected, setRejected] = useState<RejectedDeal[]>([]);
  const [invites, setInvites] = useState<AuditRow[]>([]);
  const [failedEmails, setFailedEmails] = useState<AuditRow[]>([]);
  // Dead-letter queue: emails the retry cron has given up on
  // (status = 'failed' AND attempts >= max_attempts). These will
  // never auto-retry — admin needs to triage manually.
  const [deadLetter, setDeadLetter] = useState<DeadLetterEmail[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const stuckThreshold = new Date(Date.now() - STUCK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const [stuckRes, rejectedRes, inviteRes, dlqRes] = await Promise.all([
      supabase
        .from("deal_requests")
        .select("id, current_phase, updated_at, lands(city, district), developers(company_name)")
        .lt("updated_at", stuckThreshold)
        .not("current_phase", "in", "(closed_won,closed_lost)")
        .order("updated_at", { ascending: true })
        .limit(20),
      supabase
        .from("deal_requests")
        .select("id, closed_at, rejection_reason, rejected_by, lands(city), developers(company_name)")
        .eq("current_phase", "closed_lost")
        .order("closed_at", { ascending: false })
        .limit(10),
      supabase
        .from("audit_logs")
        .select("id, action, user_email, entity_id, created_at, details")
        .eq("action", "owner.invite")
        .order("created_at", { ascending: false })
        .limit(20),
      // Dead-letter queue: emails that exhausted retries
      supabase
        .from("email_log" as any)
        .select("id, event_type, recipient_email, status, attempts, max_attempts, error, created_at, last_attempt_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    setStuck((stuckRes.data as any) || []);
    setRejected((rejectedRes.data as any) || []);

    const inviteRows = (inviteRes.data as AuditRow[]) || [];
    setInvites(inviteRows);
    setFailedEmails(inviteRows.filter((r) => r.details?.email_sent === false));

    // Filter to truly dead-letter rows: attempts >= max_attempts.
    // Rows still under max are pending retry, not stuck.
    const dlq = ((dlqRes.data as DeadLetterEmail[]) || []).filter(
      (r) => r.attempts >= r.max_attempts,
    );
    setDeadLetter(dlq);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const relative = (iso: string) =>
    formatDistanceToNow(new Date(iso), { addSuffix: true, locale });

  const phaseLabels: Record<string, { ar: string; en: string }> = {
    nda_pending: { ar: "في انتظار اتفاقية السرية", en: "NDA pending" },
    nda_signed: { ar: "تم توقيع NDA", en: "NDA signed" },
    under_review: { ar: "تحت المراجعة", en: "Under review" },
    docs_shared: { ar: "تم مشاركة الملفات", en: "Docs shared" },
    negotiation: { ar: "تفاوض", en: "Negotiation" },
  };

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={Activity}
          titleAr="لوحة المراقبة"
          titleEn="Monitoring"
          descAr="مؤشرات صحة النظام: الصفقات المتعثرة، الدعوات الفاشلة، عمليات الرفض"
          descEn="System health signals: stuck deals, failed invitations, rejections"
          actions={
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? "animate-spin" : ""}`} />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
          }
        />

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard
            icon={Clock}
            label={isAr ? "صفقات متعثرة" : "Stuck Deals"}
            sub={isAr ? `> ${STUCK_DAYS} أيام` : `> ${STUCK_DAYS} days`}
            value={stuck.length}
            tone="amber"
            loading={loading}
          />
          <KpiCard
            icon={XOctagon}
            label={isAr ? "صفقات مرفوضة" : "Rejected Deals"}
            sub={isAr ? "أحدث 10" : "Latest 10"}
            value={rejected.length}
            tone="red"
            loading={loading}
          />
          <KpiCard
            icon={Mail}
            label={isAr ? "دعوات الملاك" : "Owner Invites"}
            sub={isAr ? "أحدث 20" : "Latest 20"}
            value={invites.length}
            tone="blue"
            loading={loading}
          />
          <KpiCard
            icon={AlertTriangle}
            label={isAr ? "إيميلات فشلت" : "Email Failures"}
            sub={isAr ? "من الدعوات" : "From invites"}
            value={failedEmails.length}
            tone={failedEmails.length > 0 ? "red" : "gray"}
            loading={loading}
          />
        </div>

        {/* Dead-letter queue: emails that exhausted retries.
            Appears as a banner ABOVE the detail sections so the
            admin sees it first. The retry cron will not pick these
            up again (attempts >= max_attempts) — manual intervention
            required (resend, update template, fix recipient, etc.). */}
        {deadLetter.length > 0 && (
          <Section
            icon={XOctagon}
            titleAr="إيميلات في طابور الفشل النهائي (Dead-Letter)"
            titleEn="Dead-Letter Email Queue"
            descAr="استنفذت جميع محاولات الإرسال — تتطلب تدخل يدوي"
            descEn="Exhausted all retry attempts — requires manual triage"
          >
            <div className="space-y-2">
              {deadLetter.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-red-200/60 bg-red-50/30 p-4 flex items-start gap-3 hover:border-red-300 transition-all"
                >
                  <Mail className="h-4 w-4 text-red-500 shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {e.event_type} → {e.recipient_email}
                      </p>
                      <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700 border-red-500/20">
                        {isAr ? `${e.attempts}/${e.max_attempts} محاولات` : `${e.attempts}/${e.max_attempts} attempts`}
                      </Badge>
                    </div>
                    {e.error && (
                      <p className="text-xs text-red-600 mt-1 truncate" dir="ltr" title={e.error}>
                        {e.error.slice(0, 200)}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">
                      {isAr ? "آخر محاولة: " : "Last attempt: "}
                      <span dir="ltr">{e.last_attempt_at ? relative(e.last_attempt_at) : isAr ? "—" : "—"}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Stuck deals */}
        <Section
          icon={Clock}
          titleAr="صفقات متعثرة"
          titleEn="Stuck Deals"
          descAr={`لم يحدث تغيير منذ أكثر من ${STUCK_DAYS} أيام`}
          descEn={`No activity in over ${STUCK_DAYS} days`}
        >
          {loading ? (
            <SkeletonRows />
          ) : stuck.length === 0 ? (
            <EmptyState isAr={isAr} msgAr="لا توجد صفقات متعثرة" msgEn="No stuck deals" />
          ) : (
            <div className="space-y-2">
              {stuck.map((d) => (
                <div key={d.id} className="rounded-xl border border-amber-200/60 bg-amber-50/30 p-4 flex items-center justify-between hover:border-amber-300 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {d.developers?.company_name || "—"} → {d.lands?.city || "—"}
                        {d.lands?.district ? ` · ${d.lands.district}` : ""}
                      </p>
                      {d.current_phase && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                          {phaseLabels[d.current_phase]?.[isAr ? "ar" : "en"] || d.current_phase.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isAr ? "آخر تحديث:" : "Last update:"} {relative(d.updated_at)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/admincp/deals`, "_self")}>
                    {isAr ? "عرض" : "View"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Rejected deals */}
        <Section
          icon={XOctagon}
          titleAr="الصفقات المرفوضة حديثاً"
          titleEn="Recently Rejected"
          descAr="آخر 10 صفقات انتهت بالرفض"
          descEn="Latest 10 deals closed as lost"
        >
          {loading ? (
            <SkeletonRows />
          ) : rejected.length === 0 ? (
            <EmptyState isAr={isAr} msgAr="لا توجد صفقات مرفوضة" msgEn="No rejected deals" />
          ) : (
            <div className="space-y-2">
              {rejected.map((d) => (
                <div key={d.id} className="rounded-xl border border-red-200/60 bg-red-50/30 p-4">
                  <p className="text-sm font-medium text-gray-800">
                    {d.developers?.company_name || "—"} → {d.lands?.city || "—"}
                  </p>
                  {d.rejection_reason && (
                    <p className="text-[12px] text-gray-600 mt-1 line-clamp-2">{d.rejection_reason}</p>
                  )}
                  {d.closed_at && (
                    <p className="text-[10px] text-gray-400 mt-1">{relative(d.closed_at)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Failed emails */}
        {failedEmails.length > 0 && (
          <Section
            icon={AlertTriangle}
            titleAr="إيميلات دعوة فشلت"
            titleEn="Failed Invitation Emails"
            descAr="لم يتمكن النظام من إرسال رسالة الدعوة — قد تحتاج المتابعة يدوياً"
            descEn="Invite email didn't go out — may require manual follow-up"
          >
            <div className="space-y-2">
              {failedEmails.map((r) => (
                <div key={r.id} className="rounded-xl border border-red-300/60 bg-red-50/40 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm font-medium text-gray-800">{r.details?.email || "—"}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {isAr ? "السبب:" : "Reason:"} {r.details?.reason || (isAr ? "غير محدد" : "unknown")} · {relative(r.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recent invitations */}
        <Section
          icon={Mail}
          titleAr="أحدث دعوات الملاك"
          titleEn="Recent Owner Invitations"
          descAr="آخر 20 دعوة تم إرسالها"
          descEn="Latest 20 invitations issued"
        >
          {loading ? (
            <SkeletonRows />
          ) : invites.length === 0 ? (
            <EmptyState isAr={isAr} msgAr="لم يتم إرسال أي دعوات بعد" msgEn="No invitations sent yet" />
          ) : (
            <div className="space-y-2">
              {invites.map((r) => {
                const sent = r.details?.email_sent !== false;
                return (
                  <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.details?.email || "—"}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isAr ? "بواسطة:" : "By:"} {r.user_email || "—"} · {relative(r.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] ${sent ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-red-500/10 text-red-700 border-red-500/30"}`}
                    >
                      {sent ? (isAr ? "تم الإرسال" : "Sent") : (isAr ? "فشل" : "Failed")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </AdminLayout>
  );
};

// -- helpers --------------------------------------------------------------

const toneClasses: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  red: "bg-red-500/10 text-red-700 border-red-500/20",
  blue: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  gray: "bg-muted text-muted-foreground border-border",
};

const KpiCard: React.FC<{
  icon: React.ElementType;
  label: string;
  sub: string;
  value: number;
  tone: "amber" | "red" | "blue" | "gray";
  loading: boolean;
}> = ({ icon: Icon, label, sub, value, tone, loading }) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-[10px] text-gray-400 truncate">{sub}</p>
      </div>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${toneClasses[tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
    </div>
    <div className="mt-3">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  </div>
);

const Section: React.FC<{
  icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  children: React.ReactNode;
}> = ({ icon: Icon, titleAr, titleEn, descAr, descEn, children }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
        <h2 className="text-[15px] font-semibold text-gray-800">{isAr ? titleAr : titleEn}</h2>
      </div>
      <p className="text-[12px] text-gray-400 mb-3 ms-6">{isAr ? descAr : descEn}</p>
      {children}
    </section>
  );
};

const SkeletonRows: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
    ))}
  </div>
);

const EmptyState: React.FC<{ isAr: boolean; msgAr: string; msgEn: string }> = ({ isAr, msgAr, msgEn }) => (
  <div className="py-10 text-center text-[13px] text-gray-400 rounded-xl border border-dashed border-border/60">
    {isAr ? msgAr : msgEn}
  </div>
);

export default AdminMonitoring;
