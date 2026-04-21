import { supabase } from "@/integrations/supabase/client";
import { transitionDealPhase } from "./dealPhase.service";

/* ── Types ── */

export type ResponseDecision = "accepted" | "rejected" | "counter_offer";

export interface ProposedTerms {
  commission_rate?: number;
  commission_type?: string;
  project_type?: string;
  timeline?: string;
  revenue_share?: string;
  special_conditions?: string;
  custom_terms?: Array<{ key: string; value: string }>;
}

export interface NegotiationRound {
  id: string;
  deal_request_id: string;
  round_number: number;
  initiated_by: string;
  initiator_role: "owner" | "developer" | "admin";
  offer_summary: string;
  proposed_terms: ProposedTerms;
  attachments: Array<{ name: string; url: string }>;
  response_decision: ResponseDecision | null;
  response_notes: string | null;
  responded_by: string | null;
  responder_role: string | null;
  responded_at: string | null;
  created_at: string;
}

/* ── Labels ── */

export const responseLabels: Record<ResponseDecision, { ar: string; en: string }> = {
  accepted: { ar: "مقبول", en: "Accepted" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  counter_offer: { ar: "عرض مقابل", en: "Counter Offer" },
};

export const responseColors: Record<ResponseDecision, string> = {
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  counter_offer: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

/* ── API Functions ── */

/** Get all rounds for a deal request, ordered by round_number */
export async function getRounds(requestId: string): Promise<NegotiationRound[]> {
  const { data, error } = await supabase
    .from("negotiation_rounds" as any)
    .select("*")
    .eq("deal_request_id", requestId)
    .order("round_number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as NegotiationRound[];
}

/** Create a new negotiation round (offer or counter-offer) */
export async function createRound(params: {
  requestId: string;
  offerSummary: string;
  proposedTerms: ProposedTerms;
  attachments?: Array<{ name: string; url: string }>;
}): Promise<{ success: boolean; error?: string; round?: NegotiationRound }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Determine role
    const actorRole = await resolveRole(user.id, params.requestId);

    // Get current round count
    const { count } = await supabase
      .from("negotiation_rounds" as any)
      .select("id", { count: "exact", head: true })
      .eq("deal_request_id", params.requestId);

    const roundNumber = (count || 0) + 1;

    const { data: round, error: insertErr } = await supabase
      .from("negotiation_rounds" as any)
      .insert({
        deal_request_id: params.requestId,
        round_number: roundNumber,
        initiated_by: user.id,
        initiator_role: actorRole,
        offer_summary: params.offerSummary,
        proposed_terms: params.proposedTerms,
        attachments: params.attachments || [],
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);

    // If this is the first round, transition to negotiation_active
    if (roundNumber === 1) {
      const result = await transitionDealPhase(params.requestId, "negotiation_active" as any);
      if (!result.success) console.warn("Phase transition note:", result.error);
    }

    // Fire email notification
    try {
      await supabase.functions.invoke("send-platform-email", {
        body: {
          event_type: "negotiation_new_round",
          deal_request_id: params.requestId,
          round_number: roundNumber,
        },
      });
    } catch (e) { console.warn("Email notification failed:", e); }

    return { success: true, round: round as unknown as NegotiationRound };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Respond to a negotiation round */
export async function respondToRound(params: {
  roundId: string;
  requestId: string;
  decision: ResponseDecision;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const actorRole = await resolveRole(user.id, params.requestId);

    const { error: updateErr } = await supabase
      .from("negotiation_rounds" as any)
      .update({
        response_decision: params.decision,
        response_notes: params.notes || null,
        responded_by: user.id,
        responder_role: actorRole,
        responded_at: new Date().toISOString(),
      })
      .eq("id", params.roundId);
    if (updateErr) throw new Error(updateErr.message);

    // Handle decision outcomes
    if (params.decision === "accepted") {
      // Move to final_approval
      const result = await transitionDealPhase(params.requestId, "final_approval" as any);
      if (!result.success) console.warn("Phase transition note:", result.error);
    } else if (params.decision === "rejected") {
      // Negotiation failed → closed_lost
      const result = await transitionDealPhase(params.requestId, "closed_lost" as any, params.notes);
      if (!result.success) console.warn("Phase transition note:", result.error);
    }
    // counter_offer: phase stays at negotiation_active, a new round will be created

    // Fire email notification
    try {
      await supabase.functions.invoke("send-platform-email", {
        body: {
          event_type: `negotiation_${params.decision}`,
          deal_request_id: params.requestId,
        },
      });
    } catch (e) { console.warn("Email notification failed:", e); }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Helper to resolve user role for a deal request */
async function resolveRole(
  userId: string,
  requestId: string,
): Promise<"owner" | "developer" | "admin"> {
  // Check admin
  const { data: adminRows } = await supabase
    .from("user_roles" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);
  if (adminRows && adminRows.length > 0) return "admin";

  // Check owner or developer via deal request
  const { data: reqData } = await supabase
    .from("deal_requests")
    .select("land_id, developer_id")
    .eq("id", requestId)
    .single();

  if (reqData) {
    const { data: landData } = await supabase
      .from("lands")
      .select("owner_id")
      .eq("id", reqData.land_id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (landData) return "owner";

    const { data: devData } = await supabase
      .from("developers")
      .select("id")
      .eq("id", reqData.developer_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (devData) return "developer";
  }

  return "developer"; // fallback
}
