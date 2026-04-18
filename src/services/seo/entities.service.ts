import { supabase } from "@/integrations/supabase/client";
import type { SeoEntity, SeoEntityType } from "@/types/seo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = () => supabase.from("seo_entities" as any);

export async function listSeoEntities(type?: SeoEntityType): Promise<SeoEntity[]> {
  let query = t().select("*").order("sort_order", { ascending: true }).order("name_ar");
  if (type) query = query.eq("entity_type", type);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoEntity[];
}

export async function getSeoEntityBySlug(
  type: SeoEntityType,
  slug: string
): Promise<SeoEntity | null> {
  const { data, error } = await t()
    .select("*")
    .eq("entity_type", type)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoEntity) ?? null;
}

export async function createSeoEntity(input: Partial<SeoEntity>): Promise<SeoEntity> {
  const { data, error } = await t().insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoEntity;
}

export async function updateSeoEntity(id: string, patch: Partial<SeoEntity>): Promise<SeoEntity> {
  const { data, error } = await t().update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoEntity;
}

export async function deleteSeoEntity(id: string): Promise<void> {
  const { error } = await t().delete().eq("id", id);
  if (error) throw new Error(error.message);
}
