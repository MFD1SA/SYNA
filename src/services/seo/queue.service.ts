import { supabase } from "@/integrations/supabase/client";
import type { SeoPageStatus } from "@/types/seo";

export interface SeoPublishQueueItem {
  id: string;
  page_id: string;
  target_status: SeoPageStatus;
  scheduled_for: string | null;
  processed_at: string | null;
  status: "queued" | "processing" | "done" | "failed";
  error_message: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = () => supabase.from("seo_publish_queue" as any);

export async function listPublishQueue(status?: "queued" | "processing" | "done" | "failed"): Promise<SeoPublishQueueItem[]> {
  let q = t().select("*").order("created_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoPublishQueueItem[];
}

/** Enqueue a page for publishing at a specific time (or immediately if scheduled_for is null). */
export async function enqueuePagePublish(
  pageId: string,
  targetStatus: SeoPageStatus = "published",
  scheduledFor: Date | null = null,
): Promise<void> {
  const { error } = await t().insert({
    page_id: pageId,
    target_status: targetStatus,
    scheduled_for: scheduledFor?.toISOString() ?? null,
    status: "queued",
  });
  if (error) throw new Error(error.message);
}

export async function removeFromQueue(id: string): Promise<void> {
  const { error } = await t().delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Process queued items whose scheduled_for is in the past (or null).
 * Client-side processor — moves each queued item's corresponding page
 * to the target status and marks the queue row as done.
 * For production, this can be migrated to a pg_cron job.
 */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const now = new Date().toISOString();
  const { data: items, error } = await t()
    .select("*")
    .eq("status", "queued")
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
  if (error) throw new Error(error.message);

  let processed = 0;
  let failed = 0;
  for (const item of (items ?? []) as unknown as SeoPublishQueueItem[]) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const patch: any = {
        status: item.target_status,
      };
      if (item.target_status === "published") patch.published_at = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: pErr } = await supabase.from("seo_pages" as any).update(patch).eq("id", item.page_id);
      if (pErr) throw new Error(pErr.message);

      await t().update({
        status: "done",
        processed_at: new Date().toISOString(),
      }).eq("id", item.id);
      processed++;
    } catch (err: unknown) {
      await t().update({
        status: "failed",
        processed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : String(err),
      }).eq("id", item.id);
      failed++;
    }
  }
  return { processed, failed };
}
