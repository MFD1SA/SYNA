import { supabase } from "@/integrations/supabase/client";

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
    console.error("Error fetching agreement:", error);
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
    console.error("Error fetching agreement:", error);
    return null;
  }
  return data as DeveloperAgreement | null;
}
