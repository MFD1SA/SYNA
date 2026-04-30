import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

export interface DeveloperAgreement {
  id: string;
  user_id: string;
  developer_id: string | null;
  agreement_type: string;
  agreement_version: string;
  agreement_text_ar: string;
  agreement_text_en: string;
  commission_brokerage: number;
  commission_operational: number;
  commission_total: number;
  accepted: boolean;
  accepted_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Get commission agreement for the current logged-in developer
 */
export async function getMyCommissionAgreement(): Promise<DeveloperAgreement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("developer_agreements")
    .select("*")
    .eq("user_id", user.id)
    .eq("agreement_type", "commission_agreement")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log.error("Error fetching agreement:", error);
    return null;
  }
  return data as DeveloperAgreement | null;
}

/**
 * Get commission agreement for a specific user (admin use)
 */
export async function getAgreementByUserId(userId: string): Promise<DeveloperAgreement | null> {
  const { data, error } = await supabase
    .from("developer_agreements")
    .select("*")
    .eq("user_id", userId)
    .eq("agreement_type", "commission_agreement")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log.error("Error fetching agreement:", error);
    return null;
  }
  return data as DeveloperAgreement | null;
}

/**
 * Batch version of getAgreementByUserId — one round trip for N users.
 * Returns a map of user_id → latest commission_agreement row.
 *
 * This replaces the admin-panel N+1 pattern of calling
 * `getAgreementByUserId` in a Promise.all over every developer
 * (100 developers → 100 queries, 2-5s TTFB on cold caches).
 * One IN-query + client-side dedup to the latest row per user = O(1)
 * round trips regardless of developer count.
 */
export async function getAgreementsByUserIds(
  userIds: string[],
): Promise<Record<string, DeveloperAgreement>> {
  if (userIds.length === 0) return {};

  // Dedup — accidental duplicates in the input shouldn't blow up the query.
  const uniqueIds = Array.from(new Set(userIds));

  const { data, error } = await supabase
    .from("developer_agreements")
    .select("*")
    .in("user_id", uniqueIds)
    .eq("agreement_type", "commission_agreement")
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Error batch-fetching agreements:", error);
    return {};
  }

  // Keep only the latest row per user_id. Rows arrive in created_at DESC
  // order, so the first row we see for a given user_id is the newest.
  const map: Record<string, DeveloperAgreement> = {};
  for (const row of (data || []) as DeveloperAgreement[]) {
    if (!map[row.user_id]) {
      map[row.user_id] = row;
    }
  }
  return map;
}
