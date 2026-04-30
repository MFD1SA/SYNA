import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

export interface BrokerageContract {
  id: string;
  land_id: string;
  owner_id: string;
  contract_number: string;
  contract_file_url: string | null;
  contract_date: string | null;
  contract_expiry: string | null;
  commission_rate: number;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/**
 * Get brokerage contract for a specific land (admin or owner)
 */
export async function getContractByLandId(landId: string): Promise<BrokerageContract | null> {
  const { data, error } = await supabase
    .from("brokerage_contracts")
    .select("*")
    .eq("land_id", landId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log.error("Error fetching brokerage contract:", error);
    return null;
  }
  return data as BrokerageContract | null;
}

/**
 * Batch version of getContractByLandId — one round trip for N lands.
 * Returns a map of land_id → latest contract row.
 *
 * Replaces the N+1 pattern where OwnerLands.tsx called
 * `getContractByLandId` once per land in a Promise.all loop.
 */
export async function getContractsByLandIds(
  landIds: string[],
): Promise<Record<string, BrokerageContract>> {
  if (landIds.length === 0) return {};

  const uniqueIds = Array.from(new Set(landIds));

  const { data, error } = await supabase
    .from("brokerage_contracts")
    .select("*")
    .in("land_id", uniqueIds)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Error batch-fetching brokerage contracts:", error);
    return {};
  }

  // Rows arrive newest-first per land_id; keep only the first per land.
  const map: Record<string, BrokerageContract> = {};
  for (const row of (data || []) as BrokerageContract[]) {
    if (!map[row.land_id]) {
      map[row.land_id] = row;
    }
  }
  return map;
}

/**
 * Get all brokerage contracts for an owner
 */
export async function getContractsByOwnerId(ownerId: string): Promise<BrokerageContract[]> {
  const { data, error } = await supabase
    .from("brokerage_contracts")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Error fetching brokerage contracts:", error);
    return [];
  }
  return (data || []) as BrokerageContract[];
}

/**
 * Create a new brokerage contract (admin only — RLS enforced)
 */
export async function createBrokerageContract(contract: {
  land_id: string;
  owner_id: string;
  contract_number: string;
  contract_file_url?: string;
  contract_date?: string;
  contract_expiry?: string;
  commission_rate?: number;
  status?: string;
  notes?: string;
  created_by?: string;
}): Promise<BrokerageContract | null> {
  const { data, error } = await supabase
    .from("brokerage_contracts")
    .insert(contract)
    .select()
    .single();

  if (error) {
    log.error("Error creating brokerage contract:", error);
    throw error;
  }
  return data as BrokerageContract;
}

/**
 * Update a brokerage contract (admin only — RLS enforced)
 */
export async function updateBrokerageContract(
  id: string,
  updates: Partial<Omit<BrokerageContract, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase
    .from("brokerage_contracts")
    .update(updates)
    .eq("id", id);

  if (error) {
    log.error("Error updating brokerage contract:", error);
    throw error;
  }
}

/**
 * Get a signed URL for contract file (admin + owner via RLS)
 */
export async function getContractFileUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;

  const { data, error } = await supabase.storage
    .from("brokerage-docs")
    .createSignedUrl(filePath, 3600);

  if (error) {
    log.error("Error getting contract file URL:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}
