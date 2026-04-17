import { useEffect, useState } from "react";
import { getResolvedHeroImage } from "@/services/heroImages.service";

interface ResolvedHero {
  desktop: string | null;
  mobile: string | null;
  alt_ar: string;
  alt_en: string;
}

/**
 * Hook to fetch the resolved hero image for a given page slug.
 * Implements fallback: page-specific → default → null (static fallback in component).
 */
export function useHeroImage(pageSlug: string | undefined) {
  const [heroImage, setHeroImage] = useState<ResolvedHero | null>(null);
  const [loading, setLoading] = useState(!!pageSlug);

  useEffect(() => {
    if (!pageSlug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getResolvedHeroImage(pageSlug).then((result) => {
      if (!cancelled) {
        setHeroImage(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [pageSlug]);

  return { heroImage, loading };
}
