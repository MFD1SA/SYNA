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
    <section className="relative bg-background py-32 overflow-hidden border-y border-border/40">
      <div className="container relative mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="border-s-2 border-accent ps-8"
        >
          <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            {isAr ? "الفرص الاستثمارية الحالية" : "Current Investment Opportunities"}
          </span>
          <h2 className="text-4xl font-medium tracking-tight text-primary md:text-5xl uppercase leading-tight">
            {isAr ? "أصول عقارية استراتيجية جاهزة للتطوير" : "Strategic Real Estate Assets Ready for Development"}
          </h2>
        </motion.div>
      </div>

      <div ref={scrollRef} className="flex gap-px overflow-hidden px-0 bg-border/40 border-y border-border/40" style={{ scrollBehavior: "auto" }}>
        {items.map((land, i) => {
          const imgSrc = land.image_url || placeholders[i % placeholders.length];
          return (
            <div
              key={`${land.id}-${i}`}
              className="group min-w-[400px] max-w-[400px] shrink-0 bg-background transition-colors hover:bg-muted/30"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={imgSrc} alt={isAr ? cityNameAr[land.city] || land.city : land.city} className="h-full w-full object-cover grayscale opacity-90 transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                <div className="absolute top-6 start-6 flex gap-2">
                  <span className="bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? (goalLabels[land.partnership_goal]?.ar || "للشراكة") : (goalLabels[land.partnership_goal]?.en || "Partnership")}
                  </span>
                  <span className="bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                  </span>
                </div>
              </div>
              <div className="p-10">
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-primary uppercase tracking-tight">{isAr ? (cityNameAr[land.city] || land.city) : land.city}</h3>
                  {land.district && (
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-accent">{isAr ? `حي ${districtNameAr[land.district] || land.district}` : land.district}</p>
                  )}
                </div>
                
                <div className="mb-10 grid grid-cols-2 gap-8 border-y border-border/40 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="flex flex-col gap-2">
                    <span className="opacity-40">{isAr ? "المساحة" : "Area"}</span>
                    <span className="text-primary tracking-normal" dir="ltr">{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="opacity-40">{isAr ? "الموقع" : "Location"}</span>
                    <span className="text-primary">{isAr ? (cityNameAr[land.city] || land.city) : land.city}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/opportunity/${land.id}`)}
                  className="w-full h-14 border border-primary text-[10px] font-bold uppercase tracking-[0.3em] text-primary transition-all hover:bg-primary hover:text-white"
                >
                  {isAr ? "عرض الملف الاستثماري" : "View Investment Brief"}
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
