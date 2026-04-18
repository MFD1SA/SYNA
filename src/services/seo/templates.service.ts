import { supabase } from "@/integrations/supabase/client";
import type { SeoPageType, SeoTemplate } from "@/types/seo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = () => supabase.from("seo_templates" as any);

export async function listSeoTemplates(): Promise<SeoTemplate[]> {
  const { data, error } = await t().select("*").order("page_type").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoTemplate[];
}

export async function getDefaultTemplate(pageType: SeoPageType): Promise<SeoTemplate | null> {
  const { data, error } = await t()
    .select("*")
    .eq("page_type", pageType)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoTemplate) ?? null;
}

export async function getSeoTemplate(id: string): Promise<SeoTemplate | null> {
  const { data, error } = await t().select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoTemplate) ?? null;
}

export async function updateSeoTemplate(id: string, patch: Partial<SeoTemplate>): Promise<SeoTemplate> {
  const { data, error } = await t().update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoTemplate;
}

export async function createSeoTemplate(input: Partial<SeoTemplate>): Promise<SeoTemplate> {
  const { data, error } = await t().insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoTemplate;
}

export async function deleteSeoTemplate(id: string): Promise<void> {
  const { error } = await t().delete().eq("id", id);
  if (error) throw new Error(error.message);
}
