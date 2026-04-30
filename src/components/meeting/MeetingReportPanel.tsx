import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Clock,
  ClipboardList, Plus, Trash2, Users, CalendarClock, Timer, Edit3,
} from "lucide-react";
import {
  getReport, getApprovals, createReport, submitApproval, getDeadlineInfo,
  type MeetingReport, type ReportApproval, type ReportOutcome, type ApprovalDecision,
  outcomeLabels, outcomeColors, reportStatusLabels, reportStatusColors,
} from "@/services/meetingReport.service";
import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

interface MeetingReportPanelProps {
  requestId: string;
  meetingId: string;
  currentPhase: string;
  viewerRole: "developer" | "owner" | "admin";
  isAr: boolean;
  onPhaseChange?: () => void;
}

const MeetingReportPanel: React.FC<MeetingReportPanelProps> = ({
  requestId, meetingId, currentPhase, viewerRole, isAr, onPhaseChange,
}) => {
  const { toast } = useToast();
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [approvals, setApprovals] = useState<ReportApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDecision | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [deadlineLabel, setDeadlineLabel] = useState<{ ar: string; en: string } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Create form state
  const [formSummary, setFormSummary] = useState("");
  const [formOutcome, setFormOutcome] = useState<ReportOutcome>("positive");
  const [formActionItems, setFormActionItems] = useState<Array<{ item: string; assignee?: string }>>([{ item: "" }]);
  const [formResponsibilities, setFormResponsibilities] = useState<Array<{ party: string; task: string }>>([{ party: "", task: "" }]);
  const [formDeadlines, setFormDeadlines] = useState<Array<{ item: string; due_date: string }>>([{ item: "", due_date: "" }]);
  const [formAdditional, setFormAdditional] = useState("");
  const [formNextSteps, setFormNextSteps] = useState("");

  const [resolvedMeetingId, setResolvedMeetingId] = useState(meetingId || "");

  const isReportPhase = ["meeting_completed", "report_pending_approval", "report_approved", "report_rejected", "report_changes_requested", "report_expired"].includes(currentPhase);
  const canCreate = (viewerRole === "owner" || viewerRole === "admin") && (currentPhase === "meeting_completed" || currentPhase === "report_changes_requested");
  const canApprove = report && ["pending_approval", "partially_approved"].includes(report.status) && !isExpired;

  // Auto-resolve meetingId from deal_request_meetings if not provided
  useEffect(() => {
    if (meetingId || !isReportPhase) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("deal_request_meetings" as any)
          .select("id")
          .eq("deal_request_id", requestId)
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) setResolvedMeetingId((data as any).id);
      } catch (e) { log.warn("Could not resolve meeting ID:", e); }
    })();
  }, [meetingId, requestId, isReportPhase]);

  const fetchData = useCallback(async () => {
    if (!isReportPhase) { setLoading(false); return; }
    try {
      const r = await getReport(requestId);
      setReport(r);
      if (r) {
        const a = await getApprovals(r.id);
        setApprovals(a);
      }
    } catch (e) { log.error(e); }
    setLoading(false);
  }, [requestId, currentPhase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Deadline ticker
  useEffect(() => {
    if (!report || !report.expires_at) return;
    const update = () => {
      const info = getDeadlineInfo(report.expires_at);
      setDeadlineLabel(info.remainingLabel);
      setIsExpired(info.isExpired);
    };
    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [report?.expires_at]);

  if (!isReportPhase) return null;

  const myApproval = approvals.find(a => {
    // This is approximate - in real use the user_id check would be needed
    // but we show all approvals and highlight the viewer's role
    return a.role === viewerRole;
  });

  const handleCreate = async () => {
    if (!formSummary.trim()) {
      toast({ variant: "destructive", title: isAr ? "يرجى كتابة ملخص الاجتماع" : "Please write the meeting summary" });
      return;
    }
    setActionLoading(true);
    const result = await createReport({
      requestId,
      meetingId: resolvedMeetingId || meetingId,
      summary: formSummary,
      outcome: formOutcome,
      actionItems: formActionItems.filter(i => i.item.trim()),
      responsibilities: formResponsibilities.filter(r => r.party.trim() || r.task.trim()),
      deadlines: formDeadlines.filter(d => d.item.trim()),
      additionalRequests: formAdditional || undefined,
      nextSteps: formNextSteps || undefined,
    });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم إنشاء تقرير الاجتماع" : "Meeting report created" });
      setShowCreate(false);
      await fetchData();
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleApproval = async () => {
    if (!approvalDialog || !report) return;
    setActionLoading(true);
    const result = await submitApproval({
      reportId: report.id,
      requestId,
      decision: approvalDialog,
      notes: approvalNotes || undefined,
    });
    setActionLoading(false);
    if (result.success) {
      const labels: Record<ApprovalDecision, { ar: string; en: string }> = {
        approved: { ar: "تم الاعتماد", en: "Approved" },
        rejected: { ar: "تم الرفض", en: "Rejected" },
        changes_requested: { ar: "تم طلب التعديل", en: "Changes requested" },
      };
      toast({ title: isAr ? labels[approvalDialog].ar : labels[approvalDialog].en });
      setApprovalDialog(null);
      setApprovalNotes("");
      await fetchData();
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const decisionIcons: Record<ApprovalDecision, React.ElementType> = {
    approved: CheckCircle2,
    rejected: XCircle,
    changes_requested: AlertCircle,
  };

  const decisionColors: Record<ApprovalDecision, string> = {
    approved: "text-emerald-600",
    rejected: "text-destructive",
    changes_requested: "text-amber-600",
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{isAr ? "تقرير الاجتماع" : "Meeting Report"}</span>
          {report && (
            <Badge variant="outline" className={`text-[10px] ${reportStatusColors[report.status]}`}>
              {isAr ? reportStatusLabels[report.status].ar : reportStatusLabels[report.status].en}
            </Badge>
          )}
        </div>
        {canCreate && !report && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowCreate(true)}>
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "إنشاء التقرير" : "Create Report"}
          </Button>
        )}
        {canCreate && report && report.status === "changes_requested" && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => {
            setFormSummary(report.summary);
            setFormOutcome(report.outcome);
            setFormActionItems(report.action_items.length > 0 ? report.action_items : [{ item: "" }]);
            setFormResponsibilities(report.responsibilities.length > 0 ? report.responsibilities : [{ party: "", task: "" }]);
            setFormDeadlines(report.deadlines.length > 0 ? report.deadlines : [{ item: "", due_date: "" }]);
            setFormAdditional(report.additional_requests || "");
            setFormNextSteps(report.next_steps || "");
            setShowCreate(true);
          }}>
            <Edit3 className="h-3.5 w-3.5" />
            {isAr ? "إعادة إصدار التقرير" : "Reissue Report"}
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
        ) : !report ? (
          <div className="py-8 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {canCreate
                ? (isAr ? "لم يُنشأ تقرير بعد — يمكنك إنشاؤه الآن" : "No report yet — you can create one now")
                : (isAr ? "بانتظار إنشاء تقرير الاجتماع" : "Waiting for the meeting report to be created")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Deadline bar */}
            {["pending_approval", "partially_approved"].includes(report.status) && deadlineLabel && (
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                isExpired
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-amber-500/20 bg-amber-500/5 text-amber-700"
              }`}>
                <Timer className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">{isAr ? "مهلة الاعتماد:" : "Approval deadline:"}</span>
                <span>{isAr ? deadlineLabel.ar : deadlineLabel.en}</span>
              </div>
            )}

            {/* Report content */}
            <div className="rounded-lg border border-border/40 p-4 space-y-3">
              {/* Outcome badge */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`gap-1 text-[10px] ${outcomeColors[report.outcome]}`}>
                  {isAr ? outcomeLabels[report.outcome].ar : outcomeLabels[report.outcome].en}
                </Badge>
                <span className="text-[10px] text-muted-foreground">v{report.version}</span>
              </div>

              {/* Summary */}
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "ملخص الاجتماع" : "Meeting Summary"}</Label>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap leading-relaxed">{report.summary}</p>
              </div>

              {/* Action items */}
              {report.action_items.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "البنود المطلوبة" : "Action Items"}</Label>
                  <ul className="mt-1 space-y-1">
                    {report.action_items.map((a, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span>{a.item}{a.assignee ? ` — ${a.assignee}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Responsibilities */}
              {report.responsibilities.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "المسؤوليات" : "Responsibilities"}</Label>
                  <ul className="mt-1 space-y-1">
                    {report.responsibilities.map((r, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <Users className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span><strong>{r.party}:</strong> {r.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deadlines */}
              {report.deadlines.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "المدد" : "Deadlines"}</Label>
                  <ul className="mt-1 space-y-1">
                    {report.deadlines.map((d, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <CalendarClock className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span>{d.item}{d.due_date ? ` — ${d.due_date}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional requests */}
              {report.additional_requests && (
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "طلبات إضافية" : "Additional Requests"}</Label>
                  <p className="text-xs text-foreground mt-1">{report.additional_requests}</p>
                </div>
              )}

              {/* Next steps */}
              {report.next_steps && (
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "الخطوات التالية" : "Next Steps"}</Label>
                  <p className="text-xs text-foreground mt-1">{report.next_steps}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 pt-2 border-t border-border/30">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Approvals section */}
            <div className="rounded-lg border border-border/40 p-4 space-y-3">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? "سجل الاعتمادات" : "Approval Log"}</Label>

              {approvals.length === 0 ? (
                <p className="text-xs text-muted-foreground">{isAr ? "لم يصدر أي اعتماد بعد" : "No approvals yet"}</p>
              ) : (
                <div className="space-y-2">
                  {approvals.map(a => {
                    const Icon = decisionIcons[a.decision];
                    const roleLabels: Record<string, { ar: string; en: string }> = {
                      owner: { ar: "المالك", en: "Owner" },
                      developer: { ar: "المطور", en: "Developer" },
                      admin: { ar: "الإدارة", en: "Admin" },
                    };
                    const decLabels: Record<ApprovalDecision, { ar: string; en: string }> = {
                      approved: { ar: "اعتمد", en: "Approved" },
                      rejected: { ar: "رفض", en: "Rejected" },
                      changes_requested: { ar: "طلب تعديل", en: "Requested Changes" },
                    };
                    return (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${decisionColors[a.decision]}`} />
                        <div>
                          <span className="font-medium text-foreground">
                            {isAr ? roleLabels[a.role]?.ar : roleLabels[a.role]?.en}
                          </span>
                          {" — "}
                          <span className={decisionColors[a.decision]}>
                            {isAr ? decLabels[a.decision].ar : decLabels[a.decision].en}
                          </span>
                          {a.notes && <p className="text-muted-foreground mt-0.5">{a.notes}</p>}
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {new Date(a.decided_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Approval actions (for owner/developer if not yet decided and report still open) */}
              {canApprove && viewerRole !== "admin" && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setApprovalDialog("approved")} disabled={actionLoading}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {isAr ? "اعتماد" : "Approve"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5" onClick={() => setApprovalDialog("changes_requested")} disabled={actionLoading}>
                    <AlertCircle className="h-3.5 w-3.5" /> {isAr ? "طلب تعديل" : "Request Changes"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30" onClick={() => setApprovalDialog("rejected")} disabled={actionLoading}>
                    <XCircle className="h-3.5 w-3.5" /> {isAr ? "رفض" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Report Dialog */}
      <Dialog open={showCreate} onOpenChange={o => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {isAr ? "إنشاء تقرير الاجتماع" : "Create Meeting Report"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Summary */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملخص الاجتماع *" : "Meeting Summary *"}</Label>
              <Textarea value={formSummary} onChange={e => setFormSummary(e.target.value)} rows={4} className="resize-none" placeholder={isAr ? "اكتب ملخصًا شاملًا للاجتماع..." : "Write a comprehensive meeting summary..."} />
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "نتيجة الاجتماع *" : "Meeting Outcome *"}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(outcomeLabels) as ReportOutcome[]).map(outcome => (
                  <button
                    key={outcome}
                    className={`rounded-lg border px-3 py-2 text-xs text-start transition-all ${
                      formOutcome === outcome
                        ? `${outcomeColors[outcome]} border-current`
                        : "border-border/40 text-muted-foreground hover:border-border"
                    }`}
                    onClick={() => setFormOutcome(outcome)}
                    type="button"
                  >
                    {isAr ? outcomeLabels[outcome].ar : outcomeLabels[outcome].en}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "البنود المطلوبة" : "Action Items"}</Label>
                <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setFormActionItems([...formActionItems, { item: "" }])}>
                  <Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
              {formActionItems.map((ai, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={ai.item} onChange={e => { const n = [...formActionItems]; n[i] = { ...ai, item: e.target.value }; setFormActionItems(n); }} placeholder={isAr ? "البند..." : "Action item..."} className="flex-1" />
                  <Input value={ai.assignee || ""} onChange={e => { const n = [...formActionItems]; n[i] = { ...ai, assignee: e.target.value }; setFormActionItems(n); }} placeholder={isAr ? "المسؤول" : "Assignee"} className="w-32" />
                  {formActionItems.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive" onClick={() => setFormActionItems(formActionItems.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "المسؤوليات" : "Responsibilities"}</Label>
                <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setFormResponsibilities([...formResponsibilities, { party: "", task: "" }])}>
                  <Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
              {formResponsibilities.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={r.party} onChange={e => { const n = [...formResponsibilities]; n[i] = { ...r, party: e.target.value }; setFormResponsibilities(n); }} placeholder={isAr ? "الجهة" : "Party"} className="w-32" />
                  <Input value={r.task} onChange={e => { const n = [...formResponsibilities]; n[i] = { ...r, task: e.target.value }; setFormResponsibilities(n); }} placeholder={isAr ? "المهمة" : "Task"} className="flex-1" />
                  {formResponsibilities.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive" onClick={() => setFormResponsibilities(formResponsibilities.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Deadlines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "المدد الزمنية" : "Deadlines"}</Label>
                <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setFormDeadlines([...formDeadlines, { item: "", due_date: "" }])}>
                  <Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
              {formDeadlines.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={d.item} onChange={e => { const n = [...formDeadlines]; n[i] = { ...d, item: e.target.value }; setFormDeadlines(n); }} placeholder={isAr ? "البند" : "Item"} className="flex-1" />
                  <Input type="date" dir="ltr" value={d.due_date} onChange={e => { const n = [...formDeadlines]; n[i] = { ...d, due_date: e.target.value }; setFormDeadlines(n); }} className="w-40" />
                  {formDeadlines.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive" onClick={() => setFormDeadlines(formDeadlines.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Additional requests */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "طلبات إضافية" : "Additional Requests"}</Label>
              <Textarea value={formAdditional} onChange={e => setFormAdditional(e.target.value)} rows={2} className="resize-none" />
            </div>

            {/* Next steps */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "الخطوات التالية" : "Next Steps"}</Label>
              <Textarea value={formNextSteps} onChange={e => setFormNextSteps(e.target.value)} rows={2} className="resize-none" />
            </div>

            {/* 24h notice */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 shrink-0" />
              {isAr ? "سيبدأ عداد 24 ساعة للاعتماد فور إنشاء التقرير" : "A 24-hour approval deadline starts immediately upon creation"}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleCreate} disabled={actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              {isAr ? "إنشاء التقرير" : "Create Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Decision Dialog */}
      <Dialog open={!!approvalDialog} onOpenChange={o => { if (!o) { setApprovalDialog(null); setApprovalNotes(""); } }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalDialog === "approved" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {approvalDialog === "rejected" && <XCircle className="h-5 w-5 text-destructive" />}
              {approvalDialog === "changes_requested" && <AlertCircle className="h-5 w-5 text-amber-600" />}
              {approvalDialog === "approved" ? (isAr ? "اعتماد التقرير" : "Approve Report")
                : approvalDialog === "rejected" ? (isAr ? "رفض التقرير" : "Reject Report")
                : (isAr ? "طلب تعديل التقرير" : "Request Report Changes")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {approvalDialog === "rejected" && (
              <p className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {isAr ? "رفض التقرير سيوقف مسار الاعتماد." : "Rejecting the report will halt the approval process."}
              </p>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} rows={3} className="resize-none" placeholder={isAr ? "أضف ملاحظاتك..." : "Add your notes..."} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setApprovalDialog(null); setApprovalNotes(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button
              variant={approvalDialog === "rejected" ? "destructive" : "default"}
              onClick={handleApproval}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {approvalDialog === "approved" ? (isAr ? "تأكيد الاعتماد" : "Confirm Approval")
                : approvalDialog === "rejected" ? (isAr ? "تأكيد الرفض" : "Confirm Rejection")
                : (isAr ? "إرسال طلب التعديل" : "Send Change Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingReportPanel;
