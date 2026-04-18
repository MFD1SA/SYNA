import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import { Link } from "react-router-dom";
import { MapPin, Ruler, Loader2 } from "lucide-react";
import headerFeaturesImg from "@/assets/header-features.jpg";

interface Land {
  id: string;
  city: string;
  district: string | null;
  land_area_sqm: number;
  land_type: string | null;
  status: string;
}

const Opportunities: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الفرص المتاحة" : "Available Opportunities");

  useMetaTags({
    title: isAr
      ? "سينا | الفرص العقارية المتاحة — أراضٍ جاهزة للشراكة في السعودية"
      : "SINA | Available Opportunities — Partnership-Ready Saudi Lands",
    description: isAr
      ? "تصفّح الفرص العقارية المتاحة في سينا: أراضٍ في مدن المملكة جاهزة لشراكات التطوير مع بيانات كافية لاتخاذ قرار استثماري مدروس."
      : "Browse SINA real-estate opportunities — partnership-ready lands across Saudi cities with enough data to make informed development investment decisions.",
    canonical: isAr ? "https://cidoma.com/opportunities" : "https://cidoma.com/en/opportunities",
    ogTitle: isAr ? "سينا | الفرص العقارية المتاحة" : "SINA | Available Opportunities",
    ogDescription: isAr
      ? "أراضٍ في مدن المملكة جاهزة للشراكة التطويرية."
      : "Lands across Saudi cities ready for development partnership.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/opportunities" : "https://cidoma.com/opportunities" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "الفرص" : "Opportunities", item: isAr ? "https://cidoma.com/opportunities" : "https://cidoma.com/en/opportunities" },
        ],
      },
    ],
  });

  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("lands")
        .select("id, city, district, land_area_sqm, land_type, status")
        .in("status", ["active", "active_approved"])
        .order("created_at", { ascending: false });
      if (data) {
        setLands(data);
        const uniqueCities = [...new Set(data.map((l) => l.city))].filter(Boolean);
        setCities(uniqueCities);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = cityFilter ? lands.filter((l) => l.city === cityFilter) : lands;

  return (
    <PageShell>
      <InnerHero title={t.opportunities.title} subtitle={t.opportunities.subtitle} isAr={isAr} image={headerFeaturesImg} />

      <section className="py-16 lg:py-24 bg-[#F7F9FB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          {/* Filter */}
          <div className="flex flex-wrap gap-3 mb-10">
            <button
              onClick={() => setCityFilter("")}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                !cityFilter ? "bg-sina-blue text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.opportunities.allCities}
            </button>
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCityFilter(c)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  cityFilter === c ? "bg-sina-blue text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-sina-blue" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-[14px]">
              {t.opportunities.noResults}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((land) => (
                <Link
                  key={land.id}
                  to={`/opportunity/${land.id}`}
                  className="bg-white rounded-xl border border-gray-100 hover:border-sina-blue/20 hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="h-36 bg-gradient-to-br from-sina-blue/10 to-sina-blue/5 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-sina-blue/25" strokeWidth={1} />
                  </div>
                  <div className="p-6">
                    <h3 className="text-[16px] font-semibold text-sina-charcoal mb-2">
                      {land.city}{land.district ? ` — ${land.district}` : ""}
                    </h3>
                    <div className="flex items-center gap-4 text-[13px] text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5" />
                        {Number(land.land_area_sqm).toLocaleString()} {t.opportunities.sqm}
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
          )}
        </div>
      </section>
    </PageShell>
  );
};

export default Opportunities;
