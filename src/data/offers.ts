import { supabase } from "@/integrations/supabase/client";

export interface RealEstateOffer {
  id: string;
  slug: string;
  type: "partnership" | "contribution";
  city: { ar: string; en: string };
  district: { ar: string; en: string };
  usageType: "residential" | "commercial" | "mixed" | "high_density";
  area_sqm: number;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  detailedDescription: { ar: string; en: string };
  imageUrl: string;
  features: { ar: string; en: string }[];
  isActive: boolean;
}

export const usageTypeLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  mixed: { ar: "سكني تجاري", en: "Mixed Use" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

export const offerTypeLabels: Record<string, { ar: string; en: string }> = {
  partnership: { ar: "شراكة تطوير", en: "Development Partnership" },
  contribution: { ar: "مساهمة عقارية", en: "Real Estate Contribution" },
};

/** Map a DB row to the front-end interface */
function mapRow(row: any): RealEstateOffer {
  const featuresAr: string[] = row.features_ar || [];
  const featuresEn: string[] = row.features_en || [];
  const features = featuresAr.map((ar: string, i: number) => ({
    ar,
    en: featuresEn[i] || ar,
  }));

  return {
    id: row.slug || row.id,
    slug: row.slug,
    type: row.type,
    city: { ar: row.city_ar, en: row.city_en },
    district: { ar: row.district_ar, en: row.district_en },
    usageType: row.usage_type,
    area_sqm: Number(row.area_sqm),
    title: { ar: row.title_ar, en: row.title_en },
    description: { ar: row.description_ar, en: row.description_en },
    detailedDescription: { ar: row.detailed_description_ar, en: row.detailed_description_en },
    imageUrl: row.image_url,
    features,
    isActive: row.is_active,
  };
}

/** Fetch active offers from the database (public) */
export async function getActiveOffers(): Promise<RealEstateOffer[]> {
  const { data, error } = await supabase
    .from("platform_offers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
  return (data || []).map(mapRow);
}

/** Fetch a single offer by slug */
export async function getOfferBySlug(slug: string): Promise<RealEstateOffer | null> {
  const { data, error } = await supabase
    .from("platform_offers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}

/** Fetch ALL offers (admin — includes inactive) */
export async function getAllOffers(): Promise<RealEstateOffer[]> {
  const { data, error } = await supabase
    .from("platform_offers")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching all offers:", error);
    return [];
  }
  return (data || []).map(mapRow);
}

// Legacy compatibility — keep synchronous exports for any old references
// These will be empty arrays; pages should use the async functions above
export const offers: RealEstateOffer[] = [];
export const getOfferById = (id: string) => offers.find(o => o.id === id);
