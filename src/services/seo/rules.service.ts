import { supabase } from "@/integrations/supabase/client";
import type { SeoGenerationRule } from "@/types/seo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = () => supabase.from("seo_generation_rules" as any);

export async function listSeoRules(): Promise<SeoGenerationRule[]> {
  const { data, error } = await t()
    .select("*")
    .order("priority", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoGenerationRule[];
}

export async function updateSeoRule(id: string, patch: Partial<SeoGenerationRule>): Promise<SeoGenerationRule> {
  const { data, error } = await t().update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoGenerationRule;
}

export async function createSeoRule(input: Partial<SeoGenerationRule>): Promise<SeoGenerationRule> {
  const { data, error } = await t().insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoGenerationRule;
}

export async function deleteSeoRule(id: string): Promise<void> {
  const { error } = await t().delete().eq("id", id);
  if (error) throw new Error(error.message);
}
