import { supabase } from "@/integrations/supabase/client";

export type NDAActorRole = "developer" | "owner";

export interface NDAConsent {
  id: string;
  user_id: string;
  land_id: string;
  actor_role: NDAActorRole;
  nda_version: string;
  nda_text_ar: string;
  nda_text_en: string;
  status: "pending" | "accepted" | "rejected";
  accepted_at: string | null;
  rejected_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Get NDA consent status for a specific user + land + role
 */
export async function getNDAForLand(userId: string, landId: string, actorRole: NDAActorRole = "developer"): Promise<NDAConsent | null> {
  const { data, error } = await supabase
    .from("nda_consents")
    .select("*")
    .eq("user_id", userId)
    .eq("land_id", landId)
    .eq("actor_role", actorRole)
    .maybeSingle();

  if (error) {
    console.error("Error fetching NDA consent:", error);
    return null;
  }
  return data as NDAConsent | null;
}

/**
 * Check if user has accepted NDA for a specific land
 */
export async function hasAcceptedNDA(userId: string, landId: string, actorRole: NDAActorRole = "developer"): Promise<boolean> {
  const nda = await getNDAForLand(userId, landId, actorRole);
  return nda?.status === "accepted";
}

/**
 * Check if user has rejected NDA for a specific land (terminal)
 */
export async function hasRejectedNDA(userId: string, landId: string, actorRole: NDAActorRole = "developer"): Promise<boolean> {
  const nda = await getNDAForLand(userId, landId, actorRole);
  return nda?.status === "rejected";
}

/**
 * Get all NDA consents for a user filtered by role (to batch-check across lands)
 */
export async function getNDAConsentsForUser(userId: string, actorRole?: NDAActorRole): Promise<NDAConsent[]> {
  let query = supabase
    .from("nda_consents")
    .select("*")
    .eq("user_id", userId);

  if (actorRole) {
    query = query.eq("actor_role", actorRole);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching NDA consents:", error);
    return [];
  }
  return (data || []) as NDAConsent[];
}

/**
 * Submit NDA decision via Edge Function (server-side IP capture)
 */
export async function submitNDADecision(landId: string, action: "accept" | "reject", actorRole: NDAActorRole = "developer"): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("accept-nda", {
    body: { land_id: landId, action, actor_role: actorRole },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  if (data?.error) {
    return { success: false, error: data.error };
  }
  return { success: true };
}
