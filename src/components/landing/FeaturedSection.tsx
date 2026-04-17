import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Ruler, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturedLand {
  id: string;
  city: string;
  district: string | null;
  land_area_sqm: number;
  land_type: string | null;
  status: string;
}

const FeaturedSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<FeaturedLand[]>([]);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchLands = async () => {
      const { data } = await supabase
        .from("lands")
        .select("id, city, district, land_area_sqm, land_type, status")
        .in("status", ["active", "active_approved"])
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setLands(data);
    };
    fetchLands();
  }, []);

  if (lands.length === 0) return null;

  return (
    <section className="py-14 lg:py-16 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E374B] mb-3 tracking-tight">
              {t.featured.title}
            </h2>
            <p className="text-[15px] text-gray-500">
              {t.featured.subtitle}
            </p>
          </div>
          <Link
            to="/opportunities"
            className="hidden md:inline-flex items-center gap-2 text-[13px] font-semibold text-[#2B4C66] hover:gap-3.5 transition-all duration-300"
          >
            {isAr ? "عرض الكل" : "View All"}
            <Arrow className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lands.map((land) => (
            <Link
              key={land.id}
              to={`/opportunity/${land.id}`}
              className="bg-white rounded-xl border border-gray-100 hover:shadow-xl hover:shadow-gray-100/60 hover:border-gray-200 transition-all duration-300 overflow-hidden group"
            >
              {/* Card visual header */}
              <div className="h-44 relative overflow-hidden bg-gradient-to-br from-[#2B4C66]/[0.08] via-[#2B4C66]/[0.04] to-transparent">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#2B4C66 1px, transparent 1px), linear-gradient(90deg, #2B4C66 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                {/* Centered icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-[#2B4C66]/40 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                </div>
                {/* Status badge */}
                <div className="absolute top-3 end-3">
                  <span className="inline-flex items-center px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-emerald-600 rounded-full shadow-sm">
                    {isAr ? "متاح" : "Available"}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-[16px] font-semibold text-[#1E374B] mb-3">
                  {land.city}{land.district ? ` | ${land.district}` : ""}
                </h3>
                <div className="flex items-center gap-4 text-[13px] text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    {Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                  </span>
                  {land.land_type && (
                    <span className="px-2.5 py-0.5 bg-[#2B4C66]/[0.06] text-[#2B4C66] text-[11px] font-medium rounded-md">
                      {land.land_type}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="md:hidden mt-8 text-center">
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#2B4C66]"
          >
            {isAr ? "عرض جميع الفرص" : "View All Opportunities"}
            <Arrow className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
