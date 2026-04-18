import { supabase } from "@/integrations/supabase/client";
import type { SeoIssue } from "@/types/seo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = () => supabase.from("seo_issues" as any);

export async function listSeoIssues(opts: { resolved?: boolean } = {}): Promise<SeoIssue[]> {
  let query = t().select("*").order("created_at", { ascending: false }).limit(200);
  if (opts.resolved !== undefined) query = query.eq("is_resolved", opts.resolved);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoIssue[];
}

export async function resolveSeoIssue(id: string, userId: string | null): Promise<void> {
  const { error } = await t()
    .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: userId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Bulk resolve: mark a set of issue ids as resolved atomically. */
export async function resolveSeoIssuesBulk(ids: string[], userId: string | null): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await t()
    .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: userId }, { count: "exact" })
    .in("id", ids);
  if (error) throw new Error(error.message);
  return count ?? ids.length;
}
