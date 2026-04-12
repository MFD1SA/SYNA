import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, CalendarCheck, Clock, CheckCircle2, XCircle, Loader2,
  Video, RefreshCcw, Ban, Users, Link2, Hash,
} from "lucide-react";
import {
  getMeetings, proposeMeeting, confirmMeeting, requestReschedule,
  cancelMeeting, completeMeeting, markNoShow,
  meetingStatusLabels, meetingStatusColors,
  type DealMeeting, type MeetingStatus,
} from "@/services/meeting.service";

const statusIcons: Record<MeetingStatus, React.ElementType> = {
  proposed: Calendar,
  confirmed: CalendarCheck,
  reschedule_requested: RefreshCcw,
  rescheduled: Calendar,
  cancelled: Ban,
  completed: CheckCircle2,
  no_show: XCircle,
};

interface MeetingPanelProps {
  requestId: string;
  currentPhase: string;
  viewerRole: "developer" | "owner" | "admin";
  isAr: boolean;
  onPhaseChange?: () => void;
}

const MeetingPanel: React.FC<MeetingPanelProps> = ({ requestId, currentPhase, viewerRole, isAr, onPhaseChange }) => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<DealMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<DealMeeting | null>(null);
  const [cancelDialog, setCancelDialog] = useState<DealMeeting | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Propose form
  const [propDate, setPropDate] = useState("");
  const [propTime, setPropTime] = useState("13:00");
  const [propDuration, setPropDuration] = useState("60");
  const [propLink, setPropLink] = useState("");
  const [propNotes, setPropNotes] = useState("");

  const isMeetingPhase = ["meeting_proposed", "meeting_confirmed", "meeting_completed", "study_approved", "under_review"].includes(currentPhase);
  const canPropose = (viewerRole === "owner" || viewerRole === "admin") && ["study_approved", "under_review", "meeting_proposed"].includes(currentPhase);
  const canConfirm = viewerRole === "developer" && currentPhase === "meeting_proposed";

  useEffect(() => {
    if (!isMeetingPhase) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const data = await getMeetings(requestId);
        setMeetings(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, [requestId, currentPhase]);

  if (!isMeetingPhase) return null;

  const activeMeeting = meetings.find(m => !["cancelled", "no_show"].includes(m.status));

  const handlePropose = async () => {
    if (!propDate || !propTime) {
      toast({ variant: "destructive", title: isAr ? "يرجى تحديد التاريخ والوقت" : "Please select date and time" });
      return;
    }
    setActionLoading(true);
    const result = await proposeMeeting({
      requestId,
      date: propDate,
      time: propTime,
      durationMinutes: parseInt(propDuration) || 60,
      meetingLink: propLink || undefined,
      notes: propNotes || undefined,
    });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم اقتراح الاجتماع" : "Meeting proposed" });
      setShowPropose(false);
      setPropDate(""); setPropTime("13:00"); setPropDuration("60"); setPropLink(""); setPropNotes("");
      const data = await getMeetings(requestId);
      setMeetings(data);
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleConfirm = async (meeting: DealMeeting) => {
    setActionLoading(true);
    const result = await confirmMeeting({ meetingId: meeting.id, requestId });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم تأكيد الاجتماع" : "Meeting confirmed" });
      const data = await getMeetings(requestId);
      setMeetings(data);
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog) return;
    setActionLoading(true);
    const result = await requestReschedule({ meetingId: rescheduleDialog.id, reason: rescheduleReason || undefined });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم طلب إعادة الجدولة" : "Reschedule requested" });
      setRescheduleDialog(null); setRescheduleReason("");
      const data = await getMeetings(requestId);
      setMeetings(data);
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setActionLoading(true);
    const result = await cancelMeeting({ meetingId: cancelDialog.id, requestId, reason: cancelReason || undefined });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم إلغاء الاجتماع" : "Meeting cancelled" });
      setCancelDialog(null); setCancelReason("");
      const data = await getMeetings(requestId);
      setMeetings(data);
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleComplete = async (meeting: DealMeeting) => {
    setActionLoading(true);
    const result = await completeMeeting({ meetingId: meeting.id, requestId });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم تسجيل انعقاد الاجتماع" : "Meeting marked as completed" });
      const data = await getMeetings(requestId);
      setMeetings(data);
      onPhaseChange?.();
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const handleNoShow = async (meeting: DealMeeting) => {
    setActionLoading(true);
    const result = await markNoShow({ meetingId: meeting.id });
    setActionLoading(false);
    if (result.success) {
      toast({ title: isAr ? "تم تسجيل عدم الحضور" : "No-show recorded" });
      const data = await getMeetings(requestId);
      setMeetings(data);
    } else {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: result.error });
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{isAr ? "الاجتماع" : "Meeting"}</span>
          {meetings.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{meetings.length}</span>
          )}
        </div>
        {canPropose && !activeMeeting && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowPropose(true)}>
            <Calendar className="h-3.5 w-3.5" /> {isAr ? "اقتراح اجتماع" : "Propose Meeting"}
          </Button>
        )}
        {canPropose && activeMeeting?.status === "reschedule_requested" && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowPropose(true)}>
            <RefreshCcw className="h-3.5 w-3.5" /> {isAr ? "إعادة جدولة" : "Reschedule"}
          </Button>
        )}
      </div>

      {/* Meetings list */}
      <div className="p-4">
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
        ) : meetings.length === 0 ? (
          <div className="py-8 text-center">
            <Video className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{isAr ? "لا يوجد اجتماع حالياً" : "No meetings yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map(m => {
              const StatusIcon = statusIcons[m.status] || Calendar;
              const sl = meetingStatusLabels[m.status];
              const sc = meetingStatusColors[m.status];
              return (
                <div key={m.id} className={`rounded-lg border p-4 ${m.status === "confirmed" ? "border-emerald-500/20 bg-emerald-500/5" : m.status === "completed" ? "border-primary/20 bg-primary/5" : "border-border/40 bg-background"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      {/* Date/Time */}
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {new Date(m.proposed_date + "T00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {m.proposed_time.slice(0, 5)}
                        </span>
                        <span className="text-xs text-muted-foreground">({m.duration_minutes} {isAr ? "دقيقة" : "min"})</span>
                      </div>

                      {/* Room ID / Link */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {m.room_id && (
                          <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {m.room_id}</span>
                        )}
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Link2 className="h-3 w-3" /> {isAr ? "رابط الاجتماع" : "Meeting Link"}
                          </a>
                        )}
                      </div>

                      {m.notes && <p className="text-xs text-muted-foreground/70">{m.notes}</p>}
                      {m.reschedule_reason && (
                        <p className="text-xs text-orange-600 bg-orange-500/5 rounded px-2 py-1 border border-orange-500/20">
                          {isAr ? "سبب إعادة الجدولة:" : "Reschedule reason:"} {m.reschedule_reason}
                        </p>
                      )}
                      {m.cancel_reason && (
                        <p className="text-xs text-destructive bg-destructive/5 rounded px-2 py-1 border border-destructive/20">
                          {isAr ? "سبب الإلغاء:" : "Cancel reason:"} {m.cancel_reason}
                        </p>
                      )}
                      {m.reschedule_count > 0 && (
                        <span className="text-[10px] text-muted-foreground/50">{isAr ? "أعيدت جدولته" : "Rescheduled"} {m.reschedule_count}x</span>
                      )}
                    </div>
                    <Badge variant="outline" className={`gap-1 shrink-0 text-[10px] ${sc}`}>
                      <StatusIcon className="h-3 w-3" />
                      {isAr ? sl.ar : sl.en}
                    </Badge>
                  </div>

                  {/* Actions */}
                  {!["cancelled", "completed", "no_show"].includes(m.status) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
                      {/* Developer: confirm or reschedule */}
                      {viewerRole === "developer" && m.status === "proposed" && (
                        <>
                          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleConfirm(m)} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {isAr ? "تأكيد الحضور" : "Confirm"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-500/5" onClick={() => setRescheduleDialog(m)} disabled={actionLoading}>
                            <RefreshCcw className="h-3.5 w-3.5" /> {isAr ? "طلب إعادة جدولة" : "Request Reschedule"}
                          </Button>
                        </>
                      )}

                      {/* Owner/Admin: complete, no-show, cancel */}
                      {(viewerRole === "owner" || viewerRole === "admin") && m.status === "confirmed" && (
                        <>
                          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleComplete(m)} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {isAr ? "تم الانعقاد" : "Mark Completed"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs hover:bg-destructive/5 hover:text-destructive" onClick={() => handleNoShow(m)} disabled={actionLoading}>
                            <XCircle className="h-3.5 w-3.5" /> {isAr ? "لم يحضر" : "No Show"}
                          </Button>
                        </>
                      )}

                      {/* Anyone can cancel (if not completed) */}
                      {m.status !== "completed" && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive" onClick={() => setCancelDialog(m)} disabled={actionLoading}>
                          <Ban className="h-3.5 w-3.5" /> {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Propose Meeting Dialog */}
      <Dialog open={showPropose} onOpenChange={o => { if (!o) setShowPropose(false); }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {isAr ? "اقتراح اجتماع" : "Propose Meeting"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "التاريخ *" : "Date *"}</Label>
                <Input type="date" dir="ltr" value={propDate} onChange={e => setPropDate(e.target.value)} min={minDate.toISOString().split("T")[0]} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "الوقت *" : "Time *"}</Label>
                <select className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" value={propTime} onChange={e => setPropTime(e.target.value)}>
                  {["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "المدة (دقيقة)" : "Duration (min)"}</Label>
              <select className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" value={propDuration} onChange={e => setPropDuration(e.target.value)}>
                <option value="30">30</option>
                <option value="60">60</option>
                <option value="90">90</option>
                <option value="120">120</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "رابط الاجتماع" : "Meeting Link"}</Label>
              <Input value={propLink} onChange={e => setPropLink(e.target.value)} placeholder="https://..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={propNotes} onChange={e => setPropNotes(e.target.value)} rows={2} className="resize-none" placeholder={isAr ? "أجندة أو ملاحظات..." : "Agenda or notes..."} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowPropose(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handlePropose} disabled={actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              {isAr ? "اقتراح الموعد" : "Propose Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleDialog} onOpenChange={o => { if (!o) { setRescheduleDialog(null); setRescheduleReason(""); } }}>
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-orange-600" />
              {isAr ? "طلب إعادة جدولة" : "Request Reschedule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "السبب" : "Reason"}</Label>
            <Textarea value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} rows={2} className="resize-none" />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setRescheduleDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleReschedule} disabled={actionLoading} className="gap-2 border-orange-500/30 text-orange-600" variant="outline">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              {isAr ? "إرسال الطلب" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={o => { if (!o) { setCancelDialog(null); setCancelReason(""); } }}>
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              {isAr ? "إلغاء الاجتماع" : "Cancel Meeting"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {isAr ? "إلغاء الاجتماع سيلغي الصفقة بالكامل." : "Cancelling the meeting will cancel the entire deal."}
            </p>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{isAr ? "السبب" : "Reason"}</Label>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2} className="resize-none" />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setCancelDialog(null)}>{isAr ? "تراجع" : "Go Back"}</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              {isAr ? "تأكيد الإلغاء" : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingPanel;
