import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Loader2, Plus, CheckCircle2, XCircle, ArrowRight,
  Clock, Users, FileText, Send, Repeat,
} from "lucide-react";
import {
  getRounds, createRound, respondToRound,
  type NegotiationRound, type ResponseDecision, type ProposedTerms,
  responseLabels, responseColors,
} from "@/services/negotiation.service";
import { log } from "@/lib/logger";

interface NegotiationPanelProps {
  requestId: string;
  currentPhase: string;
  viewerRole: "developer" | "owner" | "admin";
  isAr: boolean;
  onPhaseChange?: () => void;
}

const NEGOTIATION_PHASES = [
  "report_approved", "negotiation_active", "final_approval", "closed_won",
];

const NegotiationPanel: React.FC<NegotiationPanelProps> = ({
  requestId, currentPhase, viewerRole, isAr, onPhaseChange,
}) => {
  const { toast } = useToast();
  const [rounds, setRounds] = useState<NegotiationRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [responseDialog, setResponseDialog] = useState<{ roundId: string; decision: ResponseDecision } | null>(null);
  const [responseNotes, setResponseNotes] = useState("");

  // Create form
  const [formSummary, setFormSummary] = useState("");
  const [formCommRate, setFormCommRate] = useState("2.5");
  const [formCommType, setFormCommType] = useState("percentage");
  const [formTimeline, setFormTimeline] = useState("");
  const [formConditions, setFormConditions] = useState("");

  const isNegotiationPhase = NEGOTIATION_PHASES.includes(currentPhase);
  const canCreateRound =
    isNegotiationPhase &&
    (currentPhase === "report_approved" || currentPhase === "negotiation_active") &&
    (viewerRole === "owner" || viewerRole === "developer" || viewerRole === "admin");
  const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const canRespond =
    latestRound &&
    !latestRound.response_decision &&
    currentPhase === "negotiation_active" &&
    latestRound.initiator_role !== viewerRole;

  const fetchData = useCallback(async () => {
    if (!isNegotiationPhase) { setLoading(false); return; }
    try {
      const r = await getRounds(requestId);
      setRounds(r);
    } catch (e) { log.error(e); }
    setLoading(false);
  }, [requestId, isNegotiationPhase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isNegotiationPhase) return null;

  const handleCreate = async () => {
    if (!formSummary.trim()) {
      toast({ variant: "destructive", title: isAr ? "يرجى كتابة ملخص العرض" : "Please write an offer summary" });
      return;
    }
    setActionLoading(true);
    const terms: ProposedTerms = {
      commission_rate: parseFloat(formCommRate) || 2.5,
      commission_type: formCommType,
      timeline: formTimeline || undefined,
      special_conditions: formConditions || undefined,
    };
    const result = await createRound({
      requestId,
      offerSummary: formSummary,
      proposedTerms: terms,
    });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم إرسال العرض" : "Offer submitted" });
      setShowCreate(false);
      setFormSummary(""); setFormCommRate("2.5"); setFormTimeline(""); setFormConditions("");
      await fetchData();
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleResponse = async () => {
    if (!responseDialog) return;
    setActionLoading(true);
    const result = await respondToRound({
      roundId: responseDialog.roundId,
      requestId,
      decision: responseDialog.decision,
      notes: responseNotes || undefined,
    });
    setActionLoading(false);
    if (result.success) {
      const lbl = responseLabels[responseDialog.decision];
      toast({ title: isAr ? lbl.ar : lbl.en });
      setResponseDialog(null);
      setResponseNotes("");
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
          <MessageSquare className="h-4 w-4 text-indigo-600" strokeWidth={1.5} />
          <h4 className="text-sm font-medium text-foreground">
            {isAr ? "التفاوض" : "Negotiation"}
          </h4>
          {rounds.length > 0 && (
            <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
              {rounds.length} {isAr ? "جولات" : "rounds"}
            </Badge>
          )}
        </div>
        {canCreateRound && !latestRound?.response_decision && latestRound?.initiator_role === viewerRole ? null : canCreateRound && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="h-3 w-3" />
            {isAr ? "عرض جديد" : "New Offer"}
          </Button>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لم تبدأ جولات التفاوض بعد" : "No negotiation rounds yet"}
            </p>
            {canCreateRound && (
              <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
                <Send className="h-3.5 w-3.5" />
                {isAr ? "بدء التفاوض" : "Start Negotiation"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {rounds.map((round) => (
              <div key={round.id} className="rounded-lg border border-border/40 overflow-hidden">
                {/* Round header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                      #{round.round_number}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {isAr ? (round.initiator_role === "owner" ? "من المالك" : round.initiator_role === "developer" ? "من المطور" : "من الإدارة")
                             : `By ${round.initiator_role}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {round.response_decision ? (
                      <Badge variant="outline" className={`text-[10px] ${responseColors[round.response_decision]}`}>
                        {isAr ? responseLabels[round.response_decision].ar : responseLabels[round.response_decision].en}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Clock className="h-3 w-3 me-1" />
                        {isAr ? "بانتظار الرد" : "Awaiting Response"}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Round body */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-foreground leading-relaxed">{round.offer_summary}</p>
                  {/* Terms */}
                  {round.proposed_terms && Object.keys(round.proposed_terms).length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {(round.proposed_terms as ProposedTerms).commission_rate && (
                        <span className="text-[11px] text-muted-foreground">
                          {isAr ? "العمولة:" : "Commission:"} {(round.proposed_terms as ProposedTerms).commission_rate}%
                        </span>
                      )}
                      {(round.proposed_terms as ProposedTerms).timeline && (
                        <span className="text-[11px] text-muted-foreground">
                          {isAr ? "الجدول:" : "Timeline:"} {(round.proposed_terms as ProposedTerms).timeline}
                        </span>
                      )}
                      {(round.proposed_terms as ProposedTerms).special_conditions && (
                        <span className="text-[11px] text-muted-foreground col-span-2">
                          {isAr ? "شروط خاصة:" : "Conditions:"} {(round.proposed_terms as ProposedTerms).special_conditions}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Response notes */}
                  {round.response_notes && (
                    <div className="mt-2 rounded-md border border-border/30 bg-muted/10 px-2.5 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{isAr ? "ملاحظات الرد:" : "Response notes:"}</p>
                      <p className="text-xs text-foreground">{round.response_notes}</p>
                    </div>
                  )}
                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground/60" dir="ltr">
                    {new Date(round.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Response actions for latest unanswered round */}
            {canRespond && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/40">
                <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setResponseDialog({ roundId: latestRound!.id, decision: "accepted" })}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAr ? "قبول العرض" : "Accept Offer"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5"
                  onClick={() => { setResponseDialog({ roundId: latestRound!.id, decision: "counter_offer" }); setShowCreate(true); }}>
                  <Repeat className="h-3.5 w-3.5" />
                  {isAr ? "عرض مقابل" : "Counter Offer"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs border-border hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => setResponseDialog({ roundId: latestRound!.id, decision: "rejected" })}>
                  <XCircle className="h-3.5 w-3.5" />
                  {isAr ? "رفض" : "Reject"}
                </Button>
              </div>
            )}

            {/* Create new round if responded with counter */}
            {latestRound?.response_decision === "counter_offer" && canCreateRound && (
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs mt-2" onClick={() => setShowCreate(true)}>
                <Send className="h-3.5 w-3.5" />
                {isAr ? "إرسال عرض جديد" : "Submit New Offer"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Offer Dialog */}
      <Dialog open={showCreate} onOpenChange={o => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              {isAr ? "تقديم عرض" : "Submit Offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "ملخص العرض" : "Offer Summary"} *</Label>
              <Textarea value={formSummary} onChange={e => setFormSummary(e.target.value)} rows={3}
                placeholder={isAr ? "وصف العرض والشروط الأساسية..." : "Describe the offer and key terms..."} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نسبة العمولة (%)" : "Commission Rate (%)"}</Label>
                <Input type="number" step="0.1" min="0" max="100" value={formCommRate} onChange={e => setFormCommRate(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نوع العمولة" : "Commission Type"}</Label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formCommType} onChange={e => setFormCommType(e.target.value)}>
                  <option value="percentage">{isAr ? "نسبة مئوية" : "Percentage"}</option>
                  <option value="fixed">{isAr ? "مبلغ ثابت" : "Fixed"}</option>
                  <option value="hybrid">{isAr ? "مختلط" : "Hybrid"}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الجدول الزمني" : "Timeline"}</Label>
              <Input value={formTimeline} onChange={e => setFormTimeline(e.target.value)}
                placeholder={isAr ? "مثال: 18 شهر" : "e.g., 18 months"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "شروط خاصة" : "Special Conditions"}</Label>
              <Textarea value={formConditions} onChange={e => setFormConditions(e.target.value)} rows={2}
                placeholder={isAr ? "أي شروط إضافية..." : "Any additional conditions..."} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleCreate} disabled={actionLoading} className="gap-1.5">
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {isAr ? "إرسال العرض" : "Submit Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog (accept/reject) */}
      <Dialog open={!!responseDialog && !showCreate} onOpenChange={o => { if (!o) { setResponseDialog(null); setResponseNotes(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {responseDialog?.decision === "accepted" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
               responseDialog?.decision === "rejected" ? <XCircle className="h-5 w-5 text-destructive" /> :
               <Repeat className="h-5 w-5 text-amber-600" />}
              {responseDialog ? (isAr ? responseLabels[responseDialog.decision].ar : responseLabels[responseDialog.decision].en) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {responseDialog?.decision === "rejected" && (
              <p className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {isAr ? "سيؤدي الرفض إلى إغلاق الصفقة كخاسرة. هذا الإجراء نهائي." : "Rejection will close the deal as lost. This action is final."}
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Textarea value={responseNotes} onChange={e => setResponseNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResponseDialog(null); setResponseNotes(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleResponse} disabled={actionLoading}
              className={responseDialog?.decision === "accepted" ? "bg-emerald-600 hover:bg-emerald-700" : responseDialog?.decision === "rejected" ? "bg-destructive hover:bg-destructive/90" : ""}>
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isAr ? "تأكيد" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NegotiationPanel;
