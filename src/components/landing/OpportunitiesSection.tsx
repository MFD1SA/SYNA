import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Ruler, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import landPlaceholder1 from "@/assets/land-placeholder-1.jpg";
import landPlaceholder2 from "@/assets/land-placeholder-2.jpg";
import landPlaceholder3 from "@/assets/land-placeholder-3.jpg";

interface FeaturedLand {
  id: string;
  city: string;
  district: string | null;
  land_area_sqm: number;
  usage_type: string;
  project_type: string | null;
  partnership_goal: string;
  created_at: string;
  image_url: string | null;
}

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed Use" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

const cityNameAr: Record<string, string> = {
  Riyadh: "الرياض", Jeddah: "جدة", Makkah: "مكة المكرمة", Madinah: "المدينة المنورة",
  Dammam: "الدمام", Khobar: "الخبر", Dhahran: "الظهران", Taif: "الطائف", Tabuk: "تبوك",
  Buraidah: "بريدة", "Khamis Mushait": "خميس مشيط", Abha: "أبها", Hail: "حائل",
  Najran: "نجران", Jazan: "جازان", Yanbu: "ينبع", Jubail: "الجبيل", "Al Ahsa": "الأحساء",
};

const placeholders = [landPlaceholder1, landPlaceholder2, landPlaceholder3];

const OpportunitiesSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [lands, setLands] = useState<FeaturedLand[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("lands")
      .select("id, city, district, land_area_sqm, usage_type, project_type, partnership_goal, created_at, image_url")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setLands(data || []));
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!scrollRef.current || lands.length === 0) return;
    const el = scrollRef.current;
    let animId: number;
    let pos = 0;
    const speed = 0.4;

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

  const items = [...lands, ...lands];

  return (
    <section className="py-16 overflow-hidden bg-muted/30">
      <div className="container mb-10">
        <h2 className="text-2xl md:text-3xl font-medium text-foreground text-center">
          {isAr ? "فرص التطوير المتاحة" : "Available Development Opportunities"}
        </h2>
        <p className="mt-2 text-sm font-light text-muted-foreground text-center max-w-xl mx-auto">
          {isAr ? "أراضٍ مختارة جاهزة للشراكات التطويرية عبر مدن المملكة" : "Selected lands ready for development partnerships across Saudi cities"}
        </p>
      </div>

      <div ref={scrollRef} className="flex gap-6 overflow-hidden px-4" style={{ scrollBehavior: "auto" }}>
        {items.map((land, i) => {
          const imgSrc = land.image_url || placeholders[i % placeholders.length];

          return (
            <div
              key={`${land.id}-${i}`}
              className="min-w-[320px] max-w-[320px] shrink-0 rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:shadow-xl hover:border-primary/30 group"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={imgSrc}
                  alt={`${isAr ? cityNameAr[land.city] || land.city : land.city} land`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-3 start-3">
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
                    {isAr ? "للشراكة" : "Partnership"}
                  </span>
                </div>
                
                {/* Usage badge */}
                <div className="absolute top-3 end-3">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
                    {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                  </span>
                </div>

                {/* City name overlay */}
                <div className="absolute bottom-3 start-4">
                  <h3 className="text-lg font-medium text-white">
                    {isAr ? (cityNameAr[land.city] || land.city) : land.city}
                  </h3>
                  {land.district && (
                    <p className="text-xs text-white/80">
                      {isAr ? `حي ${land.district}` : land.district}
                    </p>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{isAr ? "المدينة:" : "City:"} {isAr ? (cityNameAr[land.city] || land.city) : land.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5 text-primary" />
                    <span>{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                  </div>
                </div>

                {land.project_type && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    {isAr ? "نوع المشروع:" : "Project:"} {land.project_type}
                  </p>
                )}

                <button
                  onClick={() => navigate(`/opportunity/${land.id}`)}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {isAr ? "التفاصيل" : "Details"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default OpportunitiesSection;
