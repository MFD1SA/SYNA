import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Ruler, Layers } from "lucide-react";

interface FeaturedLand {
  id: string;
  city: string;
  district: string | null;
  land_area_sqm: number;
  usage_type: string;
  project_type: string | null;
}

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

const OpportunitiesSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<FeaturedLand[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("lands")
      .select("id, city, district, land_area_sqm, usage_type, project_type")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setLands(data || []));
  }, []);

  // Auto-scroll RTL
  useEffect(() => {
    if (!scrollRef.current || lands.length === 0) return;
    const el = scrollRef.current;
    let animId: number;
    let pos = 0;
    const speed = 0.5;

    const animate = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = isAr ? -pos : pos;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const pause = () => cancelAnimationFrame(animId);
    const resume = () => { animId = requestAnimationFrame(animate); };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, [lands, isAr]);

  if (lands.length === 0) return null;

  // Duplicate for infinite scroll
  const items = [...lands, ...lands];

  return (
    <section className="py-12 overflow-hidden">
      <div className="container mb-8">
        <h2 className="text-2xl font-medium text-foreground text-center">
          {isAr ? "فرص التطوير المتاحة" : "Available Development Opportunities"}
        </h2>
        <p className="mt-2 text-sm font-light text-muted-foreground text-center">
          {isAr ? "أراضٍ مختارة جاهزة للشراكات التطويرية عبر مدن المملكة" : "Selected lands ready for development partnerships across Saudi cities"}
        </p>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-hidden px-4" style={{ scrollBehavior: "auto" }}>
        {items.map((land, i) => (
          <div
            key={`${land.id}-${i}`}
            className="min-w-[280px] shrink-0 rounded-xl border border-border/60 bg-card p-5 transition-all hover:doma-shadow hover:border-primary/20"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{land.city}</p>
                {land.district && <p className="text-xs text-muted-foreground">{land.district}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
              </span>
            </div>

            {land.project_type && (
              <p className="mt-2 text-xs text-primary">{land.project_type}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default OpportunitiesSection;
