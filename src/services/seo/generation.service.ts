import { supabase } from "@/integrations/supabase/client";
import { extractEdgeError } from "@/lib/edgeError";
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
  if (error) {
    // Surface the real server-side error instead of the generic
    // "Edge Function returned a non-2xx status code" wrapper.
    const detail = await extractEdgeError(error);
    throw new Error(detail);
  }
  return data as TriggerGenerationResult;
}

const runsTable = () => supabase.from("seo_generation_runs" as never);

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
  // Refactored from `while (true)` to a deadline-driven loop so the
  // exit condition is intrinsic to the loop header rather than relying
  // on the inner `if` returns + an eslint-disable on no-constant-condition.
  while (Date.now() <= deadline) {
    const run = await getGenerationRun(runId);
    if (!run) throw new Error("Run not found");
    if (run.status === "completed" || run.status === "failed") return run;
    await new Promise((r) => setTimeout(r, pollInterval));
  }
  throw new Error("Poll timed out");
}
