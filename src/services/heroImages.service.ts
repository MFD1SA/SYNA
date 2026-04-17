import { supabase } from "@/integrations/supabase/client";

export interface HeroImageRecord {
  id: string;
  page_slug: string;
  page_label_ar: string;
  page_label_en: string;
  desktop_url: string | null;
  mobile_url: string | null;
  alt_ar: string;
  alt_en: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/** Fetch all hero image records (admin use) */
export async function getAllHeroImages(): Promise<HeroImageRecord[]> {
  const { data, error } = await supabase
    .from("hero_images" as any)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as HeroImageRecord[]) || [];
}

/** Fetch a single hero image by page slug */
export async function getHeroImageBySlug(slug: string): Promise<HeroImageRecord | null> {
  const { data, error } = await supabase
    .from("hero_images" as any)
    .select("*")
    .eq("page_slug", slug)
    .maybeSingle();

  if (error) return null;
  return data as unknown as HeroImageRecord | null;
}

/**
 * Get the resolved hero image URL for a page with fallback logic:
 * 1. If page has its own active image → use it
 * 2. If not → use the 'default' active image
 * 3. If neither → return null (page keeps its static/code image)
 */
export async function getResolvedHeroImage(
  pageSlug: string
): Promise<{ desktop: string | null; mobile: string | null; alt_ar: string; alt_en: string } | null> {
  // Fetch both the page-specific and default images in one query
  const { data, error } = await supabase
    .from("hero_images" as any)
    .select("*")
    .in("page_slug", [pageSlug, "default"])
    .eq("is_active", true);

  if (error || !data || (data as any[]).length === 0) return null;

  const records = data as unknown as HeroImageRecord[];
  const pageRecord = records.find((r) => r.page_slug === pageSlug);
  const defaultRecord = records.find((r) => r.page_slug === "default");

  // Priority: page-specific with a URL, then default with a URL
  const chosen = pageRecord?.desktop_url ? pageRecord : defaultRecord?.desktop_url ? defaultRecord : null;

  if (!chosen) return null;

  return {
    desktop: chosen.desktop_url,
    mobile: chosen.mobile_url || chosen.desktop_url,
    alt_ar: chosen.alt_ar,
    alt_en: chosen.alt_en,
  };
}

/** Upload a hero image file to storage */
export async function uploadHeroFile(file: File, pageSlug: string, variant: "desktop" | "mobile"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `heroes/${pageSlug}-${variant}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filename, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("site-assets").getPublicUrl(filename);
  return data.publicUrl;
}

/** Update a hero image record */
export async function updateHeroImageRecord(
  id: string,
  updates: Partial<Pick<HeroImageRecord, "desktop_url" | "mobile_url" | "alt_ar" | "alt_en" | "is_active">>
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("hero_images" as any)
    .update({ ...updates, updated_by: userId } as any)
    .eq("id", id);

  if (error) throw error;
}

/** Remove image URL (set to null) */
export async function removeHeroImageUrl(id: string, variant: "desktop" | "mobile"): Promise<void> {
  const field = variant === "desktop" ? "desktop_url" : "mobile_url";
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("hero_images" as any)
    .update({ [field]: null, updated_by: userId } as any)
    .eq("id", id);

  if (error) throw error;
}

/** Add a new page slug entry */
export async function addHeroImagePage(pageSlug: string, labelAr: string, labelEn: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase
    .from("hero_images" as any)
    .insert({ page_slug: pageSlug, page_label_ar: labelAr, page_label_en: labelEn, updated_by: userId } as any);

  if (error) throw error;
}
