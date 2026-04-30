import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Loader2, Trophy, FileText, Shield, Clock,
  Banknote, AlertTriangle, Lock,
} from "lucide-react";
import {
  getClosing, closeDealWon, closeDealLost,
  type DealClosing,
  outcomeLabels, outcomeColors, commissionTypeLabels,
} from "@/services/dealClosing.service";
import { log } from "@/lib/logger";

interface DealClosingPanelProps {
  requestId: string;
  currentPhase: string;
  viewerRole: "developer" | "owner" | "admin";
  isAr: boolean;
  onPhaseChange?: () => void;
}

const CLOSING_PHASES = ["final_approval", "closed_won", "closed_lost"];

const DealClosingPanel: React.FC<DealClosingPanelProps> = ({
  requestId, currentPhase, viewerRole, isAr, onPhaseChange,
}) => {
  const { toast } = useToast();
  const [closing, setClosing] = useState<DealClosing | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showWonDialog, setShowWonDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);

  // Won form
  const [commRate, setCommRate] = useState("2.5");
  const [commType, setCommType] = useState<"percentage" | "fixed" | "hybrid">("percentage");
  const [commRef, setCommRef] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  // Lost form
  const [lostReason, setLostReason] = useState("");
  const [lostNotes, setLostNotes] = useState("");

  const isClosingPhase = CLOSING_PHASES.includes(currentPhase);
  const canClose = (viewerRole === "owner" || viewerRole === "admin") && currentPhase === "final_approval";

  const fetchData = useCallback(async () => {
    if (!isClosingPhase && currentPhase !== "final_approval") { setLoading(false); return; }
    try {
      const c = await getClosing(requestId);
      setClosing(c);
    } catch (e) { log.error(e); }
    setLoading(false);
  }, [requestId, currentPhase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isClosingPhase && currentPhase !== "final_approval") return null;

  const handleCloseWon = async () => {
    if (!commRate) {
      toast({ variant: "destructive", title: isAr ? "يرجى تحديد نسبة العمولة" : "Please specify commission rate" });
      return;
    }
    setActionLoading(true);
    const result = await closeDealWon({
      requestId,
      commissionRate: parseFloat(commRate),
      commissionType: commType,
      commissionReference: commRef || undefined,
      closingNotes: closingNotes || undefined,
      legalNotes: legalNotes || undefined,
    });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم إغلاق الصفقة بنجاح!" : "Deal closed successfully!" });
      setShowWonDialog(false);
      await fetchData();
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleCloseLost = async () => {
    setActionLoading(true);
    const result = await closeDealLost({
      requestId,
      rejectionReason: lostReason || undefined,
      closingNotes: lostNotes || undefined,
    });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم إغلاق الصفقة" : "Deal closed" });
      setShowLostDialog(false);
      await fetchData();
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
          <h4 className="text-sm font-medium text-foreground">
            {isAr ? "إغلاق الصفقة" : "Deal Closing"}
          </h4>
        </div>
        {closing && (
          <Badge variant="outline" className={`text-[10px] ${outcomeColors[closing.outcome]}`}>
            {isAr ? outcomeLabels[closing.outcome].ar : outcomeLabels[closing.outcome].en}
          </Badge>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : closing ? (
          /* Show closing details */
          <div className="space-y-4">
            {/* Outcome banner */}
            <div className={`rounded-lg p-4 text-center ${
              closing.outcome === "closed_won"
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}>
              {closing.outcome === "closed_won" ? (
                <>
                  <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-700">{isAr ? "تم إغلاق الصفقة بنجاح!" : "Deal Closed Successfully!"}</p>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm font-medium text-destructive">{isAr ? "تم إغلاق الصفقة كخاسرة" : "Deal Closed as Lost"}</p>
                </>
              )}
            </div>

            {/* Commission details (closed_won only) */}
            {closing.outcome === "closed_won" && closing.commission_rate && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-foreground">{isAr ? "تفاصيل العمولة" : "Commission Details"}</span>
                  {closing.commission_approved && (
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 ms-auto">
                      <CheckCircle2 className="h-3 w-3 me-0.5" />
                      {isAr ? "معتمدة" : "Approved"}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 ms-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAr ? "النسبة" : "Rate"}</p>
                    <p className="text-sm font-semibold text-foreground">{closing.commission_rate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAr ? "النوع" : "Type"}</p>
                    <p className="text-sm font-medium text-foreground">
                      {closing.commission_type ? (isAr ? commissionTypeLabels[closing.commission_type]?.ar : commissionTypeLabels[closing.commission_type]?.en) : "—"}
                    </p>
                  </div>
                </div>
                {closing.commission_reference && (
                  <p className="text-[11px] text-muted-foreground ms-6">
                    {isAr ? "المرجع:" : "Ref:"} {closing.commission_reference}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {closing.closing_notes && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">{isAr ? "ملاحظات الإغلاق" : "Closing Notes"}</p>
                <p className="text-xs text-foreground">{closing.closing_notes}</p>
              </div>
            )}
            {closing.legal_notes && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">{isAr ? "الآثار القانونية" : "Legal Notes"}</p>
                <p className="text-xs text-foreground">{closing.legal_notes}</p>
              </div>
            )}
            {closing.rejection_reason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-[10px] font-medium text-destructive mb-1">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
                <p className="text-xs text-destructive">{closing.rejection_reason}</p>
              </div>
            )}

            {/* Terminal lock */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-2.5">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {isAr ? "هذا القرار نهائي ولا يمكن التراجع عنه." : "This decision is final and cannot be reversed."}
            </div>

            {/* Approval info */}
            {closing.approved_by && closing.approved_at && (
              <p className="text-[10px] text-muted-foreground/60 text-center" dir="ltr">
                {isAr ? "اعتمد بواسطة:" : "Approved by:"} {closing.approved_by.substring(0, 8)}... • {new Date(closing.approved_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
        ) : canClose ? (
          /* Action buttons for final_approval */
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-primary font-medium">
                {isAr ? "تم التوصل إلى اتفاق. يمكنك الآن إغلاق الصفقة رسميًا." : "Agreement reached. You can now officially close the deal."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowWonDialog(true)}>
                <Trophy className="h-3.5 w-3.5" />
                {isAr ? "إغلاق ناجح" : "Close as Won"}
              </Button>
              <Button variant="outline" className="gap-1.5 border-border hover:bg-destructive/5 hover:text-destructive" onClick={() => setShowLostDialog(true)}>
                <XCircle className="h-3.5 w-3.5" />
                {isAr ? "إغلاق خاسر" : "Close as Lost"}
              </Button>
            </div>
          </div>
        ) : currentPhase === "final_approval" ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "بانتظار إتمام عملية الإغلاق" : "Awaiting deal closure"}
            </p>
          </div>
        ) : null}
      </div>

      {/* Close Won Dialog */}
      <Dialog open={showWonDialog} onOpenChange={o => { if (!o) setShowWonDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" />
              {isAr ? "إغلاق الصفقة بنجاح" : "Close Deal as Won"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {isAr ? "هذا الإجراء نهائي ولا يمكن التراجع عنه." : "This action is final and cannot be reversed."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نسبة العمولة (%)" : "Commission Rate (%)"} *</Label>
                <Input type="number" step="0.1" min="0" max="100" value={commRate} onChange={e => setCommRate(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نوع العمولة" : "Commission Type"}</Label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={commType} onChange={e => setCommType(e.target.value as any)}>
                  <option value="percentage">{isAr ? "نسبة مئوية" : "Percentage"}</option>
                  <option value="fixed">{isAr ? "مبلغ ثابت" : "Fixed"}</option>
                  <option value="hybrid">{isAr ? "مختلط" : "Hybrid"}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "مرجع العمولة" : "Commission Reference"}</Label>
              <Input value={commRef} onChange={e => setCommRef(e.target.value)}
                placeholder={isAr ? "رقم العقد أو المرجع..." : "Contract or reference number..."} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "ملاحظات الإغلاق" : "Closing Notes"}</Label>
              <Textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الآثار القانونية" : "Legal Notes"}</Label>
              <Textarea value={legalNotes} onChange={e => setLegalNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWonDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleCloseWon} disabled={actionLoading} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {isAr ? "تأكيد الإغلاق الناجح" : "Confirm Close as Won"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Lost Dialog */}
      <Dialog open={showLostDialog} onOpenChange={o => { if (!o) setShowLostDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {isAr ? "إغلاق الصفقة كخاسرة" : "Close Deal as Lost"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {isAr ? "هذا الإجراء نهائي ولا يمكن التراجع عنه." : "This action is final and cannot be reversed."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "سبب الرفض (اختياري)" : "Rejection Reason (optional)"}</Label>
              <Textarea value={lostReason} onChange={e => setLostReason(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={lostNotes} onChange={e => setLostNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowLostDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleCloseLost} disabled={actionLoading} className="gap-1.5">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {isAr ? "تأكيد الإغلاق" : "Confirm Close as Lost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealClosingPanel;
