import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";
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

/** Create a new negotiation round (offer or counter-offer).
 *
 * Role resolution, round numbering, and the "previous round must
 * be responded-to" invariant all live in the
 * `create_negotiation_round` RPC — the client can't spoof its role
 * or race against concurrent offers. */
export async function createRound(params: {
  requestId: string;
  offerSummary: string;
  proposedTerms: ProposedTerms;
  attachments?: Array<{ name: string; url: string }>;
}): Promise<{ success: boolean; error?: string; round?: NegotiationRound }> {
  try {
    const { data, error: rpcErr } = await supabase.rpc(
      "create_negotiation_round" as any,
      {
        _deal_request_id: params.requestId,
        _offer_summary: params.offerSummary,
        _proposed_terms: params.proposedTerms || {},
        _attachments: params.attachments || [],
      },
    );
    if (rpcErr) throw new Error(rpcErr.message);

    const round = Array.isArray(data) ? data[0] : data;
    if (!round) throw new Error("Failed to create round");

    const roundNumber = (round as any).round_number as number;

    // If this is the first round, transition to negotiation_active
    if (roundNumber === 1) {
      const result = await transitionDealPhase(params.requestId, "negotiation_active" as any);
      if (!result.success) log.warn("Phase transition note:", result.error);
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
    } catch (e) { log.warn("Email notification failed:", e); }

    return { success: true, round: round as unknown as NegotiationRound };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Respond to a negotiation round.
 *
 * Role resolution, deadline check, and the "no double response"
 * invariant all enforced by the `respond_to_negotiation_round`
 * RPC under a row lock — this function is a thin wrapper. */
export async function respondToRound(params: {
  roundId: string;
  requestId: string;
  decision: ResponseDecision;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: rpcErr } = await supabase.rpc(
      "respond_to_negotiation_round" as any,
      {
        _round_id: params.roundId,
        _decision: params.decision,
        _notes: params.notes || "",
      },
    );
    if (rpcErr) throw new Error(rpcErr.message);

    // Handle decision outcomes
    if (params.decision === "accepted") {
      // Move to final_approval
      const result = await transitionDealPhase(params.requestId, "final_approval" as any);
      if (!result.success) log.warn("Phase transition note:", result.error);
    } else if (params.decision === "rejected") {
      // Negotiation failed → closed_lost
      const result = await transitionDealPhase(params.requestId, "closed_lost" as any, params.notes);
      if (!result.success) log.warn("Phase transition note:", result.error);
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
    } catch (e) { log.warn("Email notification failed:", e); }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
