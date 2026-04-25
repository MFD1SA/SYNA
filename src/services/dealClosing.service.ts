import { supabase } from "@/integrations/supabase/client";
import { transitionDealPhase } from "./dealPhase.service";
import { safeSendPlatformEmail } from "./emailDispatch.service";

/* ── Types ── */

export type ClosingOutcome = "closed_won" | "closed_lost";

export interface DealClosing {
  id: string;
  deal_request_id: string;
  outcome: ClosingOutcome;
  commission_rate: number | null;
  commission_type: "percentage" | "fixed" | "hybrid" | null;
  commission_reference: string | null;
  commission_approved: boolean;
  final_terms: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  closing_notes: string | null;
  legal_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Labels ── */
export const outcomeLabels: Record<ClosingOutcome, { ar: string; en: string }> = {
  closed_won: { ar: "صفقة ناجحة", en: "Deal Won" },
  closed_lost: { ar: "صفقة خاسرة", en: "Deal Lost" },
};

export const outcomeColors: Record<ClosingOutcome, string> = {
  closed_won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed_lost: "bg-destructive/10 text-destructive border-destructive/20",
};

export const commissionTypeLabels: Record<string, { ar: string; en: string }> = {
  percentage: { ar: "نسبة مئوية", en: "Percentage" },
  fixed: { ar: "مبلغ ثابت", en: "Fixed Amount" },
  hybrid: { ar: "مختلط", en: "Hybrid" },
};

/* ── API Functions ── */

/** Get closing record for a deal request */
export async function getClosing(requestId: string): Promise<DealClosing | null> {
  const { data, error } = await supabase
    .from("deal_closings" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as DealClosing | null;
}

/** Close deal as won (owner/admin) */
export async function closeDealWon(params: {
  requestId: string;
  commissionRate: number;
  commissionType: "percentage" | "fixed" | "hybrid";
  commissionReference?: string;
  finalTerms?: Record<string, unknown>;
  closingNotes?: string;
  legalNotes?: string;
}): Promise<{ success: boolean; error?: string; closing?: DealClosing }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: closing, error: insertErr } = await supabase
      .from("deal_closings" as any)
      .insert({
        deal_request_id: params.requestId,
        outcome: "closed_won",
        commission_rate: params.commissionRate,
        commission_type: params.commissionType,
        commission_reference: params.commissionReference || null,
        commission_approved: true,
        final_terms: params.finalTerms || {},
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        closing_notes: params.closingNotes || null,
        legal_notes: params.legalNotes || null,
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);

    // Transition to closed_won
    const result = await transitionDealPhase(params.requestId, "closed_won" as any);
    if (!result.success) console.warn("Phase transition note:", result.error);

    // Send notification — safeSendPlatformEmail never throws; on failure
    // it enqueues a retry row via RPC so the email-retry cron picks it up.
    const emailRes = await safeSendPlatformEmail({
      eventType: "deal_closed_won",
      dealRequestId: params.requestId,
    });
    if (!emailRes.sent && !emailRes.queued) {
      console.warn(
        "[dealClosing.closeDealWon] email neither sent nor queued:",
        emailRes.error,
      );
    }

    return { success: true, closing: closing as unknown as DealClosing };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Close deal as lost (owner/admin) */
export async function closeDealLost(params: {
  requestId: string;
  rejectionReason?: string;
  closingNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await supabase
      .from("deal_closings" as any)
      .insert({
        deal_request_id: params.requestId,
        outcome: "closed_lost",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: params.rejectionReason || null,
        closing_notes: params.closingNotes || null,
      });

    // Transition to closed_lost
    const result = await transitionDealPhase(
      params.requestId,
      "closed_lost" as any,
      params.rejectionReason,
    );
    if (!result.success) console.warn("Phase transition note:", result.error);

    // Send notification via safe wrapper — queues retry on failure.
    const emailRes = await safeSendPlatformEmail({
      eventType: "deal_closed_lost",
      dealRequestId: params.requestId,
    });
    if (!emailRes.sent && !emailRes.queued) {
      console.warn(
        "[dealClosing.closeDealLost] email neither sent nor queued:",
        emailRes.error,
      );
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Get all closings for admin view */
export async function getAllClosings(limit = 50): Promise<DealClosing[]> {
  const { data, error } = await supabase
    .from("deal_closings" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as unknown as DealClosing[];
}
