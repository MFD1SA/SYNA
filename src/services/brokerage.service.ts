import { supabase } from "@/integrations/supabase/client";

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
    console.error("Error fetching brokerage contract:", error);
    return null;
  }
  return data as BrokerageContract | null;
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
    console.error("Error fetching brokerage contracts:", error);
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
    console.error("Error creating brokerage contract:", error);
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
    console.error("Error updating brokerage contract:", error);
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
    console.error("Error getting contract file URL:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}
