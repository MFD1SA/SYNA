import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Ruler, Layers, Calendar, LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface FeaturedLand {
  id: string;
  city: string;
  district: string | null;
  land_area_sqm: number;
  usage_type: string;
  project_type: string | null;
  partnership_goal: string;
  created_at: string;
}

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

const regionMap: Record<string, { ar: string; en: string }> = {
  Riyadh: { ar: "منطقة الرياض", en: "Riyadh Region" },
  Jeddah: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  Makkah: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  Madinah: { ar: "منطقة المدينة المنورة", en: "Madinah Region" },
  Dammam: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  Khobar: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  Dhahran: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  Jubail: { ar: "المنطقة الشرقية", en: "Eastern Province" },
  "Al Ahsa": { ar: "المنطقة الشرقية", en: "Eastern Province" },
  Taif: { ar: "منطقة مكة المكرمة", en: "Makkah Region" },
  Tabuk: { ar: "منطقة تبوك", en: "Tabuk Region" },
  Buraidah: { ar: "منطقة القصيم", en: "Qassim Region" },
  "Khamis Mushait": { ar: "منطقة عسير", en: "Asir Region" },
  Abha: { ar: "منطقة عسير", en: "Asir Region" },
  Hail: { ar: "منطقة حائل", en: "Hail Region" },
  Najran: { ar: "منطقة نجران", en: "Najran Region" },
  Jazan: { ar: "منطقة جازان", en: "Jazan Region" },
  Yanbu: { ar: "منطقة المدينة المنورة", en: "Madinah Region" },
};

const cityNameAr: Record<string, string> = {
  Riyadh: "الرياض", Jeddah: "جدة", Makkah: "مكة المكرمة", Madinah: "المدينة المنورة",
  Dammam: "الدمام", Khobar: "الخبر", Dhahran: "الظهران", Taif: "الطائف", Tabuk: "تبوك",
  Buraidah: "بريدة", "Khamis Mushait": "خميس مشيط", Abha: "أبها", Hail: "حائل",
  Najran: "نجران", Jazan: "جازان", Yanbu: "ينبع", Jubail: "الجبيل", "Al Ahsa": "الأحساء",
};

const OpportunitiesSection: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<FeaturedLand[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("lands")
      .select("id, city, district, land_area_sqm, usage_type, project_type, partnership_goal, created_at")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(20)
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

      <div ref={scrollRef} className="flex gap-5 overflow-hidden px-4" style={{ scrollBehavior: "auto" }}>
        {items.map((land, i) => {
          const region = regionMap[land.city];
          const dateStr = format(new Date(land.created_at), "yyyy/M/d");

          return (
            <div
              key={`${land.id}-${i}`}
              className="min-w-[300px] max-w-[300px] shrink-0 rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
            >
              {/* Dark header with region */}
              <div className="relative bg-[hsl(187,65%,15%)] p-4 pb-12 text-white">
                <div className="flex items-center justify-between text-xs">
                  <LinkIcon className="h-4 w-4 opacity-60" />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] opacity-80">{isAr ? "متاحة" : "Available"}</span>
                    <span className="text-[11px] opacity-60">{dateStr}</span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 translate-y-1/2 mx-auto w-fit">
                  <span className="rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    {isAr ? "للشراكة" : "Partnership"}
                  </span>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-lg font-medium">{isAr ? (region?.ar || land.city) : (region?.en || land.city)}</p>
                  <p className="text-[11px] uppercase tracking-wider opacity-60">
                    {isAr ? (region?.ar || "") : (region?.en || "SAUDI ARABIA")}
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 pt-8">
                <h3 className="text-sm font-medium text-foreground mb-3 line-clamp-2 text-center">
                  {isAr
                    ? `أرض ${land.district ? `حي ${land.district} ب` : ""}${cityNameAr[land.city] || land.city}`
                    : `Land${land.district ? ` in ${land.district},` : ""} ${land.city}`
                  }
                </h3>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>{isAr ? "نوع الأصل: أرض" : "Asset: Land"}</span>
                    <span className="ms-auto flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{isAr ? "المدينة:" : "City:"} {isAr ? (cityNameAr[land.city] || land.city) : land.city}</span>
                    <span className="ms-auto flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}
                    </span>
                  </div>
                </div>

                <button className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
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
