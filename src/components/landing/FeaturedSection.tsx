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
        .limit(6);
      if (data) setLands(data);
    };
    fetchLands();
  }, []);

  if (lands.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-3">
              {t.featured.title}
            </h2>
            <p className="text-[15px] text-gray-500">
              {t.featured.subtitle}
            </p>
          </div>
          <Link
            to="/opportunities"
            className="hidden md:inline-flex items-center gap-2 text-[13px] font-semibold text-sina-blue hover:gap-3 transition-all"
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
              className="bg-white rounded-xl border border-gray-100 hover:border-sina-blue/20 hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              {/* Card header */}
              <div className="h-40 bg-gradient-to-br from-sina-blue/10 to-sina-blue/5 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-sina-blue/30" strokeWidth={1} />
              </div>
              <div className="p-6">
                <h3 className="text-[16px] font-semibold text-sina-charcoal mb-2">
                  {land.city}{land.district ? ` | ${land.district}` : ""}
                </h3>
                <div className="flex items-center gap-4 text-[13px] text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    {Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                  </span>
                  {land.land_type && (
                    <span className="px-2 py-0.5 bg-sina-soft-blue text-sina-blue text-[11px] font-medium rounded">
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
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-sina-blue"
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
