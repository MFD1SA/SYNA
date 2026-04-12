import React, { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Upload, Eye, CheckCircle2, XCircle, AlertCircle, Loader2,
  Download, Clock, FileUp, MessageSquare, History,
} from "lucide-react";
import { getStudies, uploadStudy, reviewStudy, startStudyReview, type DealStudy } from "@/services/study.service";

const studyStatusLabels: Record<string, { ar: string; en: string }> = {
  submitted: { ar: "مرفوعة", en: "Submitted" },
  under_review: { ar: "قيد المراجعة", en: "Under Review" },
  changes_requested: { ar: "تعديلات مطلوبة", en: "Changes Requested" },
  approved: { ar: "مقبولة", en: "Approved" },
  rejected: { ar: "مرفوضة", en: "Rejected" },
};

const studyStatusColors: Record<string, string> = {
  submitted: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  under_review: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  changes_requested: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const studyStatusIcons: Record<string, React.ElementType> = {
  submitted: FileUp,
  under_review: Eye,
  changes_requested: AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
};

interface StudyPanelProps {
  requestId: string;
  currentPhase: string;
  viewerRole: "developer" | "owner" | "admin";
  isAr: boolean;
  onPhaseChange?: () => void;
}

const StudyPanel: React.FC<StudyPanelProps> = ({ requestId, currentPhase, viewerRole, isAr, onPhaseChange }) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [studies, setStudies] = useState<DealStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<{ study: DealStudy; action: "approve" | "reject" | "changes_requested" } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Upload form
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const canUpload = viewerRole === "developer" && ["study_required", "study_changes_requested"].includes(currentPhase);
  const canReview = (viewerRole === "owner" || viewerRole === "admin") && ["study_submitted", "study_resubmitted"].includes(currentPhase);
  const canStartReview = (viewerRole === "owner" || viewerRole === "admin") && ["study_submitted", "study_resubmitted"].includes(currentPhase);
  const isStudyPhase = currentPhase.startsWith("study_") || currentPhase === "study_required";

  useEffect(() => {
    if (!isStudyPhase && !["meeting_proposed", "meeting_confirmed", "meeting_completed"].includes(currentPhase)) return;
    const fetch = async () => {
      try {
        const data = await getStudies(requestId);
        setStudies(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, [requestId, currentPhase]);

  if (!isStudyPhase && !["meeting_proposed", "meeting_confirmed", "meeting_completed", "study_approved"].includes(currentPhase)) return null;

  const latestStudy = studies[0];

  const handleUpload = async () => {
    if (!uploadTitle || !uploadFile) {
      toast({ variant: "destructive", title: isAr ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields" });
      return;
    }
    setUploading(true);
    const result = await uploadStudy({
      requestId,
      title: uploadTitle,
      summary: uploadSummary || undefined,
      file: uploadFile,
      notes: uploadNotes || undefined,
    });
    setUploading(false);
    if (result.success) {
      toast({ title: isAr ? "تم رفع الدراسة بنجاح" : "Study uploaded successfully" });
      setShowUpload(false);
      setUploadTitle(""); setUploadSummary(""); setUploadNotes(""); setUploadFile(null);
      const data = await getStudies(requestId);
      setStudies(data);
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleStartReview = async () => {
    setReviewing(true);
    const result = await startStudyReview(requestId);
    setReviewing(false);
    if (result.success) {
      toast({ title: isAr ? "بدأت المراجعة" : "Review started" });
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleReview = async () => {
    if (!reviewDialog) return;
    setReviewing(true);
    const result = await reviewStudy({
      studyId: reviewDialog.study.id,
      requestId,
      action: reviewDialog.action,
      notes: reviewNotes || undefined,
    });
    setReviewing(false);
    if (result.success) {
      const labels = {
        approve: isAr ? "تم قبول الدراسة" : "Study approved",
        reject: isAr ? "تم رفض الدراسة" : "Study rejected",
        changes_requested: isAr ? "تم طلب التعديلات" : "Changes requested",
      };
      toast({ title: labels[reviewDialog.action] });
      setReviewDialog(null); setReviewNotes("");
      const data = await getStudies(requestId);
      setStudies(data);
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{isAr ? "دراسة الجدوى" : "Feasibility Study"}</span>
          {studies.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{studies.length} {isAr ? "نسخة" : "ver."}</span>
          )}
        </div>
        {canUpload && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowUpload(true)}>
            <Upload className="h-3.5 w-3.5" />
            {currentPhase === "study_changes_requested" ? (isAr ? "إعادة رفع" : "Resubmit") : (isAr ? "رفع الدراسة" : "Upload Study")}
          </Button>
        )}
        {canStartReview && currentPhase !== "study_under_review" && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleStartReview} disabled={reviewing}>
            {reviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            {isAr ? "بدء المراجعة" : "Start Review"}
          </Button>
        )}
      </div>

      {/* Studies list */}
      <div className="p-4">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
        ) : studies.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{isAr ? "لم تُرفع أي دراسة بعد" : "No study uploaded yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studies.map((s) => {
              const StatusIcon = studyStatusIcons[s.status] || FileText;
              const sl = studyStatusLabels[s.status] || studyStatusLabels.submitted;
              const sc = studyStatusColors[s.status] || studyStatusColors.submitted;
              const isLatest = s.id === latestStudy?.id;
              return (
                <div key={s.id} className={`rounded-lg border p-4 transition-colors ${isLatest ? "border-primary/20 bg-primary/5" : "border-border/40 bg-background"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{s.version}</span>
                        <span className="text-sm font-medium text-foreground truncate">{s.title}</span>
                      </div>
                      {s.summary && <p className="text-xs text-muted-foreground line-clamp-2">{s.summary}</p>}
                      {s.notes && <p className="text-[11px] text-muted-foreground/70 italic">{s.notes}</p>}
                      {s.review_notes && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 mt-1.5">
                          <div className="flex items-center gap-1 mb-0.5">
                            <MessageSquare className="h-3 w-3 text-amber-600" />
                            <span className="text-[10px] font-medium text-amber-700">{isAr ? "ملاحظات المراجع" : "Reviewer Notes"}</span>
                          </div>
                          <p className="text-xs text-amber-700/80">{s.review_notes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {s.reviewed_at && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {isAr ? "روجعت" : "Reviewed"}: {new Date(s.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Badge variant="outline" className={`gap-1 text-[10px] ${sc}`}>
                        <StatusIcon className="h-3 w-3" />
                        {isAr ? sl.ar : sl.en}
                      </Badge>
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <Download className="h-3 w-3" /> {isAr ? "تحميل" : "Download"}
                      </a>
                    </div>
                  </div>
                  {/* Review actions for latest study */}
                  {isLatest && (viewerRole === "owner" || viewerRole === "admin") && ["under_review"].includes(s.status) && currentPhase === "study_under_review" && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
                      <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setReviewDialog({ study: s, action: "approve" })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> {isAr ? "قبول" : "Approve"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5" onClick={() => setReviewDialog({ study: s, action: "changes_requested" })}>
                        <AlertCircle className="h-3.5 w-3.5" /> {isAr ? "طلب تعديل" : "Request Changes"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30" onClick={() => setReviewDialog({ study: s, action: "reject" })}>
                        <XCircle className="h-3.5 w-3.5" /> {isAr ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={o => { if (!o) setShowUpload(false); }}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {isAr ? "رفع دراسة الجدوى" : "Upload Feasibility Study"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "عنوان الدراسة *" : "Study Title *"}</Label>
              <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder={isAr ? "مثال: دراسة جدوى مبدئية" : "e.g. Preliminary Feasibility Study"} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملخص" : "Summary"}</Label>
              <Textarea value={uploadSummary} onChange={e => setUploadSummary(e.target.value)} rows={2} placeholder={isAr ? "ملخص مختصر للدراسة..." : "Brief study summary..."} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملف الدراسة *" : "Study File *"}</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => fileRef.current?.click()}>
                  <FileUp className="h-4 w-4" /> {isAr ? "اختر ملف" : "Choose File"}
                </Button>
                <span className="text-xs text-muted-foreground truncate">{uploadFile?.name || (isAr ? "لم يتم اختيار ملف" : "No file selected")}</span>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} rows={2} placeholder={isAr ? "أي ملاحظات إضافية..." : "Any additional notes..."} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isAr ? "رفع الدراسة" : "Upload Study"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={o => { if (!o) { setReviewDialog(null); setReviewNotes(""); } }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDialog?.action === "approve" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {reviewDialog?.action === "reject" && <XCircle className="h-5 w-5 text-destructive" />}
              {reviewDialog?.action === "changes_requested" && <AlertCircle className="h-5 w-5 text-amber-600" />}
              {reviewDialog?.action === "approve" ? (isAr ? "قبول الدراسة" : "Approve Study")
                : reviewDialog?.action === "reject" ? (isAr ? "رفض الدراسة" : "Reject Study")
                : (isAr ? "طلب تعديلات" : "Request Changes")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {isAr ? `الدراسة: ${reviewDialog?.study.title} (v${reviewDialog?.study.version})` : `Study: ${reviewDialog?.study.title} (v${reviewDialog?.study.version})`}
            </p>
            {reviewDialog?.action === "reject" && (
              <p className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {isAr ? "رفض الدراسة قد يؤدي إلى إغلاق المسار." : "Rejecting the study may close this path."}
              </p>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملاحظات المراجعة" : "Review Notes"}</Label>
              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder={isAr ? "اكتب ملاحظاتك..." : "Write your review notes..."} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setReviewDialog(null); setReviewNotes(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button
              variant={reviewDialog?.action === "reject" ? "destructive" : "default"}
              onClick={handleReview}
              disabled={reviewing}
              className="gap-2"
            >
              {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {reviewDialog?.action === "approve" ? (isAr ? "تأكيد القبول" : "Confirm Approval")
                : reviewDialog?.action === "reject" ? (isAr ? "تأكيد الرفض" : "Confirm Rejection")
                : (isAr ? "إرسال طلب التعديل" : "Send Change Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyPanel;
