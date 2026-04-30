import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";
import { transitionDealPhase } from "./dealPhase.service";

export interface DealMeeting {
  id: string;
  deal_request_id: string;
  proposed_by: string;
  proposed_date: string;
  proposed_time: string;
  duration_minutes: number;
  timezone: string;
  meeting_link: string | null;
  room_id: string | null;
  status: MeetingStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  reschedule_count: number;
  reschedule_reason: string | null;
  cancel_reason: string | null;
  cancelled_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus =
  | "proposed"
  | "confirmed"
  | "reschedule_requested"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "no_show";

/** Fetch meetings for a deal request */
export async function getMeetings(requestId: string): Promise<DealMeeting[]> {
  const { data, error } = await supabase
    .from("deal_request_meetings" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as DealMeeting[];
}

/** Get latest active meeting for a request */
export async function getActiveMeeting(requestId: string): Promise<DealMeeting | null> {
  const { data, error } = await supabase
    .from("deal_request_meetings" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .not("status", "in", '("cancelled","no_show")')
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as DealMeeting | null;
}

/** Propose a meeting (owner/admin) */
export async function proposeMeeting(params: {
  requestId: string;
  date: string;
  time: string;
  durationMinutes?: number;
  meetingLink?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; meeting?: DealMeeting }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: meeting, error: insertErr } = await supabase
      .from("deal_request_meetings" as any)
      .insert({
        deal_request_id: params.requestId,
        proposed_by: user.id,
        proposed_date: params.date,
        proposed_time: params.time,
        duration_minutes: params.durationMinutes || 60,
        meeting_link: params.meetingLink || null,
        notes: params.notes || null,
        status: "proposed",
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);

    // Transition deal phase to meeting_proposed
    const result = await transitionDealPhase(params.requestId, "meeting_proposed");
    if (!result.success) {
      // Phase might already be meeting_proposed (reschedule case)
      log.warn("Phase transition note:", result.error);
    }

    return { success: true, meeting: meeting as unknown as DealMeeting };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Developer confirms a meeting */
export async function confirmMeeting(params: {
  meetingId: string;
  requestId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error: updateErr } = await supabase
      .from("deal_request_meetings" as any)
      .update({
        status: "confirmed",
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.meetingId);
    if (updateErr) throw new Error(updateErr.message);

    const result = await transitionDealPhase(params.requestId, "meeting_confirmed");
    if (!result.success) throw new Error(result.error || "Transition failed");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Request reschedule (developer) */
export async function requestReschedule(params: {
  meetingId: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: meeting } = await supabase
      .from("deal_request_meetings" as any)
      .select("reschedule_count")
      .eq("id", params.meetingId)
      .single() as unknown as { data: { reschedule_count: number } | null };

    const { error: updateErr } = await supabase
      .from("deal_request_meetings" as any)
      .update({
        status: "reschedule_requested",
        reschedule_reason: params.reason || null,
        reschedule_count: (meeting?.reschedule_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.meetingId);
    if (updateErr) throw new Error(updateErr.message);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Cancel a meeting */
export async function cancelMeeting(params: {
  meetingId: string;
  requestId: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error: updateErr } = await supabase
      .from("deal_request_meetings" as any)
      .update({
        status: "cancelled",
        cancelled_by: user.id,
        cancel_reason: params.reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.meetingId);
    if (updateErr) throw new Error(updateErr.message);

    // Transition deal to cancelled
    await transitionDealPhase(params.requestId, "cancelled", params.reason);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Mark meeting as completed */
export async function completeMeeting(params: {
  meetingId: string;
  requestId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error: updateErr } = await supabase
      .from("deal_request_meetings" as any)
      .update({
        status: "completed",
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.meetingId);
    if (updateErr) throw new Error(updateErr.message);

    const result = await transitionDealPhase(params.requestId, "meeting_completed");
    if (!result.success) throw new Error(result.error || "Transition failed");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Mark meeting as no-show */
export async function markNoShow(params: {
  meetingId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: updateErr } = await supabase
      .from("deal_request_meetings" as any)
      .update({
        status: "no_show",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.meetingId);
    if (updateErr) throw new Error(updateErr.message);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Meeting status labels */
export const meetingStatusLabels: Record<MeetingStatus, { ar: string; en: string }> = {
  proposed: { ar: "مقترح", en: "Proposed" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  reschedule_requested: { ar: "طلب إعادة جدولة", en: "Reschedule Requested" },
  rescheduled: { ar: "أعيدت جدولته", en: "Rescheduled" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
  completed: { ar: "مكتمل", en: "Completed" },
  no_show: { ar: "لم يحضر", en: "No Show" },
};

export const meetingStatusColors: Record<MeetingStatus, string> = {
  proposed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  reschedule_requested: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  rescheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
};
