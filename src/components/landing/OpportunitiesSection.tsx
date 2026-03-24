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
    <section className="relative bg-muted/20 py-20 overflow-hidden border-y border-border/40">
      <div className="container relative mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-sm">
            {isAr ? "الفرص الحالية" : "Current Opportunities"}
          </span>
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {isAr ? "فرص التطوير المتاحة" : "Available Development Opportunities"}
          </h2>
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
            {isAr 
              ? "أراضي مختارة بعناية تغطي أهم النطاقات الجغرافية، وهي معتمدة وجاهزة للشراكات الاستراتيجية مع المطورين والمستثمرين." 
              : "Carefully selected lands covering prime geographical zones, verified and ready for strategic partnerships with developers and investors."}
          </p>
        </motion.div>
      </div>

      <div ref={scrollRef} className="flex gap-6 overflow-hidden px-6" style={{ scrollBehavior: "auto" }}>
        {items.map((land, i) => {
          const imgSrc = land.image_url || placeholders[i % placeholders.length];
          return (
            <div
              key={`${land.id}-${i}`}
              className="group min-w-[360px] max-w-[360px] shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={imgSrc} alt={isAr ? cityNameAr[land.city] || land.city : land.city} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 start-4 flex gap-2">
                  <span className="rounded-sm bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-md">
                    {isAr ? (goalLabels[land.partnership_goal]?.ar || "للشراكة") : (goalLabels[land.partnership_goal]?.en || "Partnership")}
                  </span>
                  <span className="rounded-sm bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                    {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                  </span>
                </div>
                <div className="absolute bottom-4 start-4">
                  <h3 className="text-xl font-semibold text-white">{isAr ? (cityNameAr[land.city] || land.city) : land.city}</h3>
                  {land.district && (
                    <p className="mt-1 text-sm font-light text-white/80">{isAr ? `حي ${districtNameAr[land.district] || land.district}` : land.district}</p>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{isAr ? (cityNameAr[land.city] || land.city) : land.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary" />
                    <span className="font-medium" dir="ltr">{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/opportunity/${land.id}`)}
                  className="w-full rounded-md border border-border bg-transparent py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {isAr ? "عرض التفاصيل" : "View Details"}
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
