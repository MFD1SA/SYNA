import { supabase } from "@/integrations/supabase/client";
import { extractEdgeError } from "@/lib/edgeError";

/* ── Reveal levels ── */
export type RevealLevel = "anonymous" | "brand_visible" | "full";

/* ── What the API returns per request ── */
export interface PartyIdentity {
  reveal_level_for_developer: RevealLevel;
  reveal_level_for_owner: RevealLevel;
  developer: Record<string, unknown>;
  owner: Record<string, unknown>;
}

export interface ResolveResult {
  identities: Record<string, PartyIdentity>;
  viewer_role: "developer" | "owner" | "admin";
}

/**
 * Resolve identity data for a batch of deal request IDs.
 * Returns only the fields the caller is allowed to see, based on phase + role.
 */
export async function resolvePartyIdentities(
  requestIds: string[],
): Promise<ResolveResult> {
  if (requestIds.length === 0) return { identities: {}, viewer_role: "developer" };

  const { data, error } = await supabase.functions.invoke("resolve-party-identity", {
    body: { request_ids: requestIds },
  });

  if (error) {
    // Surface the real server-side error instead of the generic
    // "Edge Function returned a non-2xx status code" wrapper.
    const detail = await extractEdgeError(error);
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);

  return {
    identities: data.identities || {},
    viewer_role: data.viewer_role || "developer",
  };
}

/* ── Pure client-side reveal level computation (for UI decisions only) ── */
export type DealPhase =
  | "nda_pending"
  | "nda_developer_accepted"
  | "nda_both_accepted"
  | "under_review"
  | "study_required"
  | "study_submitted"
  | "study_under_review"
  | "study_changes_requested"
  | "study_resubmitted"
  | "study_approved"
  | "study_rejected"
  | "meeting_proposed"
  | "meeting_confirmed"
  | "meeting_completed"
  | "report_pending_approval"
  | "report_approved"
  | "report_rejected"
  | "report_changes_requested"
  | "report_expired"
  | "negotiation_active"
  | "final_approval"
  | "closed_won"
  | "closed_lost"
  | "cancelled";

/**
 * Compute reveal level locally (for UI display logic).
 * The actual data filtering MUST happen server-side via resolvePartyIdentities.
 */
export function getRevealLevel(
  phase: DealPhase,
  viewerRole: "developer" | "owner" | "admin",
  viewingParty: "developer" | "owner",
): RevealLevel {
  if (phase === "closed_lost" || phase === "cancelled") return "anonymous";
  if (viewerRole === "admin") return "full";

  // Full reveal phases (negotiation onward — both parties see each other)
  const FULL_REVEAL_PHASES = ["negotiation_active", "final_approval", "closed_won"];

  if (viewerRole === "owner" && viewingParty === "developer") {
    if (FULL_REVEAL_PHASES.includes(phase)) return "full";
    if (phase === "nda_pending" || phase === "nda_developer_accepted") return "anonymous";
    if (["nda_both_accepted", "under_review", "study_required",
         "study_submitted", "study_under_review", "study_changes_requested",
         "study_resubmitted", "study_approved",
         "meeting_proposed", "meeting_confirmed", "meeting_completed",
         "report_pending_approval", "report_approved", "report_changes_requested",
         "report_expired", "report_rejected"].includes(phase)) return "brand_visible";
    return "anonymous";
  }

  // Developer viewing owner: full reveal during negotiation/closing
  if (viewerRole === "developer" && viewingParty === "owner") {
    if (FULL_REVEAL_PHASES.includes(phase)) return "full";
    return "anonymous";
  }

  return "anonymous";
}

/**
 * Build display label for a developer based on reveal level.
 */
export function getDeveloperDisplayName(
  identity: PartyIdentity | undefined,
  fallbackIndex: number,
  isAr: boolean,
): string {
  if (!identity) return isAr ? `مطور مهتم #${fallbackIndex}` : `Interested Developer #${fallbackIndex}`;

  const level = identity.reveal_level_for_developer;
  const dev = identity.developer;

  if (level === "anonymous" || !dev) {
    return isAr ? `مطور مهتم #${fallbackIndex}` : `Interested Developer #${fallbackIndex}`;
  }

  // brand_visible or full
  const brand = dev.marketing_brand_name as string | null;
  const company = dev.company_name as string | null;
  return brand || company || (isAr ? "مطور" : "Developer");
}

/**
 * Build display label for an owner based on reveal level.
 */
export function getOwnerDisplayName(
  identity: PartyIdentity | undefined,
  isAr: boolean,
): string {
  if (!identity) return isAr ? "مالك الأرض" : "Land Owner";

  const level = identity.reveal_level_for_owner;
  const owner = identity.owner;

  if (level === "anonymous" || level === "brand_visible" || !owner) {
    return isAr ? "مالك الأرض" : "Land Owner";
  }

  // full
  const name = (owner.full_name as string) || (owner.owner_name as string);
  return name || (isAr ? "مالك الأرض" : "Land Owner");
}

/**
 * Get the reveal level badge config for UI.
 */
export function getRevealBadge(level: RevealLevel): {
  labelAr: string;
  labelEn: string;
  color: string;
} {
  switch (level) {
    case "anonymous":
      return { labelAr: "هوية مجهولة", labelEn: "Anonymous", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
    case "brand_visible":
      return { labelAr: "كشف جزئي", labelEn: "Partial Reveal", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    case "full":
      return { labelAr: "كشف كامل", labelEn: "Full Reveal", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  }
}
