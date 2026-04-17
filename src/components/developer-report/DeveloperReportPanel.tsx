import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Loader2, Building2, Globe, Shield, Clock, CheckCircle2,
  AlertCircle, BarChart3, Calendar, Mail, Phone, Hash, RefreshCw,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  getReport, generateReport, isCacheValid,
  type DeveloperReport, type DeveloperReportData,
  reportStatusLabels, reportStatusColors,
  reliabilityLabels, reliabilityColors,
} from "@/services/developerReport.service";

interface DeveloperReportPanelProps {
  requestId: string;
  developerId: string;
  currentPhase: string;
  viewerRole: "owner" | "admin";
  isAr: boolean;
}

/* Phases where the report is available (brand_visible or later, excluding terminal) */
const REPORT_AVAILABLE_PHASES = [
  "nda_both_accepted", "under_review",
  "study_required", "study_submitted", "study_under_review", "study_changes_requested",
  "study_resubmitted", "study_approved",
  "meeting_proposed", "meeting_confirmed", "meeting_completed",
  "report_pending_approval", "report_approved", "report_changes_requested", "report_expired",
  "negotiation_active", "final_approval", "closed_won",
];

const safeUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  if (/^javascript:/i.test(url)) return "#";
  return `https://${url}`;
};

const DeveloperReportPanel: React.FC<DeveloperReportPanelProps> = ({
  requestId, developerId, currentPhase, viewerRole, isAr,
}) => {
  const { toast } = useToast();
  const [report, setReport] = useState<DeveloperReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const isAvailable = REPORT_AVAILABLE_PHASES.includes(currentPhase);

  const fetchReport = useCallback(async () => {
    if (!isAvailable) { setLoading(false); return; }
    try {
      const r = await getReport({ dealRequestId: requestId });
      setReport(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [requestId, isAvailable]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (!isAvailable) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateReport({ dealRequestId: requestId, developerId });
    setGenerating(false);
    if (result.success) {
      toast({ title: isAr ? "تم إنشاء التقرير بنجاح" : "Report generated successfully" });
      if (result.report) setReport(result.report);
      else await fetchReport();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const data = report?.report_data as DeveloperReportData | null;
  const canGenerate = !report || report.status === "failed" || !isCacheValid(report);
  const hasReport = report?.status === "completed" && data;

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h4 className="text-sm font-medium text-foreground">
            {isAr ? "التقرير الذكي عن المطور" : "Smart Developer Report"}
          </h4>
        </div>
        {report && (
          <Badge variant="outline" className={`text-[10px] ${reportStatusColors[report.status]}`}>
            {isAr ? reportStatusLabels[report.status].ar : reportStatusLabels[report.status].en}
          </Badge>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasReport ? (
          /* No report yet */
          <div className="text-center py-6 space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">
              {report?.status === "failed"
                ? (isAr ? "فشل توليد التقرير — يمكنك إعادة المحاولة" : "Report generation failed — you can retry")
                : report?.status === "generating"
                  ? (isAr ? "جاري توليد التقرير..." : "Generating report...")
                  : (isAr ? "لم يتم إنشاء تقرير بعد" : "No report generated yet")}
            </p>
            {report?.error && (
              <p className="text-xs text-destructive">{report.error}</p>
            )}
            {canGenerate && report?.status !== "generating" && (
              <Button
                size="sm"
                className="gap-2"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />}
                {isAr ? "إنشاء التقرير الذكي" : "Generate Smart Report"}
              </Button>
            )}
          </div>
        ) : (
          /* Report content */
          <div className="space-y-4">
            {/* Reliability badge */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-xs font-medium ${reliabilityColors[data.reliability_score]}`}>
                {data.reliability_score === "high" ? <TrendingUp className="h-3.5 w-3.5" /> :
                 data.reliability_score === "low" ? <TrendingDown className="h-3.5 w-3.5" /> :
                 <Minus className="h-3.5 w-3.5" />}
                {isAr ? reliabilityLabels[data.reliability_score].ar : reliabilityLabels[data.reliability_score].en}
              </Badge>
              {canGenerate && (
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {isAr ? "تحديث" : "Refresh"}
                </Button>
              )}
            </div>

            {/* Company info card */}
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{data.company_name}</span>
              </div>
              {data.brand_name && (
                <p className="text-xs text-muted-foreground ms-6">{isAr ? "العلامة:" : "Brand:"} {data.brand_name}</p>
              )}
              <div className="grid grid-cols-2 gap-2 ms-6">
                {data.cr_number && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" /> {data.cr_number}
                  </span>
                )}
                {data.email && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {data.email}
                  </span>
                )}
                {data.phone && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {data.phone}
                  </span>
                )}
                {data.website && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <a href={safeUrl(data.website)} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[140px]">{data.website}</a>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${data.website_status === "active" ? "bg-emerald-500" : data.website_status === "inactive" ? "bg-red-500" : "bg-gray-400"}`} />
                  </span>
                )}
              </div>
            </div>

            {/* Verification + Registration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">{isAr ? "حالة التحقق" : "Verification"}</p>
                <div className="flex items-center gap-1.5">
                  {data.verification_status === "verified"
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                  <span className={`text-xs font-medium ${data.verification_status === "verified" ? "text-emerald-600" : "text-amber-600"}`}>
                    {data.verification_status === "verified" ? (isAr ? "تم التحقق" : "Verified") : (isAr ? "غير متحقق" : "Unverified")}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">{isAr ? "تاريخ التسجيل" : "Registered"}</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground" dir="ltr">
                    {new Date(data.registered_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Request stats */}
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {isAr ? "إحصائيات الطلبات" : "Request Statistics"}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: isAr ? "إجمالي" : "Total", value: data.total_requests, color: "text-foreground" },
                  { label: isAr ? "مقبولة" : "Accepted", value: data.accepted_requests, color: "text-emerald-600" },
                  { label: isAr ? "مرفوضة" : "Rejected", value: data.rejected_requests, color: "text-destructive" },
                  { label: isAr ? "معلقة" : "Pending", value: data.pending_requests, color: "text-amber-600" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reliability factors */}
            {data.reliability_factors.length > 0 && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {isAr ? "عوامل الموثوقية" : "Reliability Factors"}
                </p>
                <ul className="space-y-1">
                  {data.reliability_factors.map((f, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <Shield className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Professional summary */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1.5">
                {isAr ? "الملخص المهني" : "Professional Summary"}
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {isAr ? data.professional_summary_ar : data.professional_summary_en}
              </p>
            </div>

            {/* Generated timestamp */}
            <p className="text-[10px] text-muted-foreground/60 text-center" dir="ltr">
              {isAr ? "تم التوليد:" : "Generated:"} {new Date(data.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperReportPanel;
