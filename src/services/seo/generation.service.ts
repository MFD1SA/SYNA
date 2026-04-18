import { supabase } from "@/integrations/supabase/client";
import type { SeoGenerationRun } from "@/types/seo";

export interface TriggerGenerationInput {
  ruleId?: string;           // if omitted, runs ALL active rules
  dryRun?: boolean;          // preview without persisting
}

export interface TriggerGenerationResult {
  runId: string;
  status: "completed" | "failed";
  pagesGenerated: number;
  pagesSkipped: number;
  skippedReasons: Array<{ entity: string; reason: string }>;
  errors: Array<Record<string, unknown>>;
}

/**
 * Trigger the seo-generate edge function.
 * The edge function is the single source of truth for generation logic
 * (so scheduled cron jobs + manual triggers share the same code path).
 */
export async function triggerSeoGeneration(
  input: TriggerGenerationInput = {}
): Promise<TriggerGenerationResult> {
  const { data, error } = await supabase.functions.invoke("seo-generate", {
    body: input,
  });
  if (error) throw new Error(error.message);
  return data as TriggerGenerationResult;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runsTable = () => supabase.from("seo_generation_runs" as any);

export async function listGenerationRuns(limit = 20): Promise<SeoGenerationRun[]> {
  const { data, error } = await runsTable()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoGenerationRun[];
}
