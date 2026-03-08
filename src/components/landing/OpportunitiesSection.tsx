import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  high_density: { ar: "أبراج", en: "Towers" },
};

const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "مختلط", en: "Mixed" },
  develop_complex: { ar: "مجمع متكامل", en: "Integrated Complex" },
  sell_develop: { ar: "بيع وتطوير", en: "Sell & Develop" },
  partial_exit: { ar: "تخارج جزئي", en: "Partial Exit" },
  offplan_sell: { ar: "بيع على الخارطة", en: "Off-Plan" },
  real_estate_contribution: { ar: "مساهمة عقارية", en: "Contribution" },
};

const cityNameAr: Record<string, string> = {
  Riyadh: "الرياض", Jeddah: "جدة", Makkah: "مكة المكرمة", Madinah: "المدينة المنورة",
  Dammam: "الدمام", Khobar: "الخبر", Taif: "الطائف", Tabuk: "تبوك",
  Buraidah: "بريدة", Abha: "أبها",
};

const districtNameAr: Record<string, string> = {
  "Al Malqa": "الملقا", "Al Shati": "الشاطئ", "Al Olaya": "العليا",
  "Al Wurud": "الورود", "Al Nakheel": "النخيل",
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
      .from("lands_public" as any)
      .select("id, city, district, land_area_sqm, usage_type, project_type, partnership_goal, created_at, image_url")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }: { data: any }) => setLands((data as FeaturedLand[]) || []));
  }, []);

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
    return () => { cancelAnimationFrame(animId); el.removeEventListener("mouseenter", pause); el.removeEventListener("mouseleave", resume); };
  }, [lands, isAr]);

  if (lands.length === 0) return null;
  const items = [...lands, ...lands];

  return (
    <section className="relative bg-[hsl(210,30%,5%)] py-14 md:py-18 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.12)] to-transparent" />
        <div className="absolute top-1/2 end-[5%] h-[400px] w-[400px] rounded-full bg-[hsl(200,80%,40%,0.03)] blur-[120px]" />
      </div>

      <div className="container relative mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h2 className="mb-3 text-3xl font-medium text-white md:text-4xl lg:text-5xl">
            {isAr ? "فرص التطوير المتاحة" : "Available Development Opportunities"}
          </h2>
          <p className="mx-auto max-w-xl text-base font-light text-[hsl(210,15%,50%)]">
            {isAr ? "أراضي مختارة جاهزة للشراكات التطويرية والمساهمات العقارية عبر مدن المملكة" : "Selected lands ready for development partnerships and real estate contributions across Saudi cities"}
          </p>
        </motion.div>
      </div>

      <div ref={scrollRef} className="flex gap-5 overflow-hidden px-4" style={{ scrollBehavior: "auto" }}>
        {items.map((land, i) => {
          const imgSrc = land.image_url || placeholders[i % placeholders.length];
          return (
            <div
              key={`${land.id}-${i}`}
              className="group min-w-[340px] max-w-[340px] shrink-0 overflow-hidden rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] transition-all duration-500 hover:border-[hsl(200,80%,45%,0.25)] hover:shadow-[0_16px_50px_-12px_hsl(200,80%,50%,0.12)]"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={imgSrc} alt={isAr ? cityNameAr[land.city] || land.city : land.city} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,28%,7%)] via-black/30 to-transparent" />
                <div className="absolute top-3 start-3">
                  <span className="rounded-full syna-gradient px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                    {isAr ? (goalLabels[land.partnership_goal]?.ar || "للشراكة") : (goalLabels[land.partnership_goal]?.en || "Partnership")}
                  </span>
                </div>
                <div className="absolute top-3 end-3">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                  </span>
                </div>
                <div className="absolute bottom-4 start-4">
                  <h3 className="text-lg font-medium text-white">{isAr ? (cityNameAr[land.city] || land.city) : land.city}</h3>
                  {land.district && (
                    <p className="text-xs text-white/70">{isAr ? `حي ${districtNameAr[land.district] || land.district}` : land.district}</p>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between text-xs text-[hsl(210,15%,50%)]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[hsl(200,80%,55%)]" />
                    <span>{isAr ? (cityNameAr[land.city] || land.city) : land.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5 text-[hsl(200,80%,55%)]" />
                    <span>{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/opportunity/${land.id}`)}
                  className="w-full rounded-xl border border-[hsl(200,80%,45%,0.2)] bg-[hsl(200,80%,45%,0.06)] py-2.5 text-sm font-medium text-[hsl(200,80%,60%)] transition-all duration-300 hover:bg-[hsl(200,80%,45%,0.12)] hover:border-[hsl(200,80%,45%,0.35)] hover:text-white"
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
