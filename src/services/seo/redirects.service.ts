import { supabase } from "@/integrations/supabase/client";
import type { SeoRedirect } from "@/types/seo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = () => supabase.from("seo_redirects" as any);

export async function listSeoRedirects(): Promise<SeoRedirect[]> {
  const { data, error } = await t().select("*").order("source_path");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoRedirect[];
}

export async function createSeoRedirect(input: Partial<SeoRedirect>): Promise<SeoRedirect> {
  const { data, error } = await t().insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoRedirect;
}

export async function updateSeoRedirect(id: string, patch: Partial<SeoRedirect>): Promise<SeoRedirect> {
  const { data, error } = await t().update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoRedirect;
}

export async function deleteSeoRedirect(id: string): Promise<void> {
  const { error } = await t().delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Look up a redirect for a given path (used on the client to redirect 404s). */
export async function findActiveRedirect(sourcePath: string): Promise<SeoRedirect | null> {
  const { data, error } = await t()
    .select("*")
    .eq("source_path", sourcePath)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoRedirect) ?? null;
}
