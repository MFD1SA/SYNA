import { supabase } from "@/integrations/supabase/client";
import type { SeoGenerationRun } from "@/types/seo";

export interface TriggerGenerationInput {
  ruleId?: string;           // if omitted, runs ALL active rules
  dryRun?: boolean;          // preview without persisting
  /** Block until generation completes (only safe for small rules). */
  waitFor?: boolean;
}

export interface TriggerGenerationResult {
  runId: string;
  /** "started" = background task kicked off; poll run by runId to get results */
  /** "completed" = caller used waitFor=true and results are already final */
  status: "started" | "completed" | "failed";
  message?: string;
  pagesGenerated?: number;
  pagesSkipped?: number;
  skippedReasons?: Array<{ entity: string; reason: string }>;
  errors?: Array<Record<string, unknown>>;
}

/**
 * Trigger the seo-generate edge function.
 * Default is fire-and-forget: returns as soon as the function accepts the job.
 * Poll `waitForRun(runId)` to know when it's done.
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

export async function getGenerationRun(runId: string): Promise<SeoGenerationRun | null> {
  const { data, error } = await runsTable().select("*").eq("id", runId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoGenerationRun) ?? null;
}

/**
 * Poll a generation run until it completes or fails.
 * Returns the final run state.
 */
export async function waitForRun(
  runId: string,
  opts: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<SeoGenerationRun> {
  const pollInterval = opts.pollIntervalMs ?? 3000;
  const timeout = opts.timeoutMs ?? 10 * 60 * 1000; // 10 min cap
  const deadline = Date.now() + timeout;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const run = await getGenerationRun(runId);
    if (!run) throw new Error("Run not found");
    if (run.status === "completed" || run.status === "failed") return run;
    if (Date.now() > deadline) throw new Error("Poll timed out");
    await new Promise((r) => setTimeout(r, pollInterval));
  }
}
