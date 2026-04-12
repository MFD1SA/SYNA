import { supabase } from "@/integrations/supabase/client";

export interface HeroImageSetting {
  url: string;
  alt_ar: string;
  alt_en: string;
}

export async function getHeroImage(): Promise<HeroImageSetting | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero_image")
    .maybeSingle();

  if (error || !data) return null;
  const val = data.value as unknown as HeroImageSetting;
  if (!val?.url) return null;
  return val;
}

export async function updateHeroImage(setting: HeroImageSetting): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({ value: setting as any, updated_by: (await supabase.auth.getUser()).data.user?.id })
    .eq("key", "hero_image");

  if (error) throw error;
}

export async function uploadHeroImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `hero-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filename, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("site-assets").getPublicUrl(filename);
  return data.publicUrl;
}
