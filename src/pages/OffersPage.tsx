import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getActiveOffers, usageTypeLabels, offerTypeLabels, type RealEstateOffer } from "@/data/offers";
import { MapPin, Ruler, ArrowUpRight } from "lucide-react";
import InnerHero from "@/components/landing/InnerHero";
import headerFeaturesImg from "@/assets/header-features.jpg";

const OffersPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "العروض العقارية" : "Real Estate Offers");

  const [offers, setOffers] = useState<RealEstateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveOffers().then(data => { setOffers(data); setLoading(false); }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFC]" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      <InnerHero
        pageSlug="offers"
        title={isAr ? "العروض العقارية" : "Real Estate Offers"}
        subtitle={isAr
          ? "اكتشف أبرز الفرص العقارية في المملكة العربية السعودية وشراكات التطوير والمساهمات في مواقع استراتيجية"
          : "Discover premier real estate opportunities across Saudi Arabia with development partnerships and contributions in strategic locations"
        }
        isAr={isAr}
        image={headerFeaturesImg}
      />

      {/* Filter bar + Offers grid */}
      <section className="-mt-6 relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">

          {/* Filter / count bar */}
          {!loading && offers.length > 0 && (
            <div className="flex items-center justify-between mb-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-[#C2A86B]" />
                <span className="text-[15px] font-bold text-gray-900">
                  {offers.length} {isAr ? "عروض متاحة" : "Offers Available"}
                </span>
              </div>
              <span className="text-[12px] text-gray-400 font-medium tracking-wide">
                {isAr ? "جميع العروض النشطة" : "All active listings"}
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-white border border-gray-100" />)}
            </div>
          ) : offers.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-gray-400 text-sm">{isAr ? "لا توجد عروض متاحة حاليًا" : "No offers available at this time"}</p>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  to={`/offers/${offer.id}`}
                  className="group bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-100/80 hover:border-gray-200/60"
                >
                  {/* Image */}
                  <div className="relative h-[220px] overflow-hidden">
                    <img
                      src={offer.imageUrl}
                      alt={isAr ? offer.title.ar : offer.title.en}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-4 start-4">
                      <span className={`inline-block px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md ${
                        offer.type === "partnership" ? "bg-[#2B4C66]/85 text-white" : "bg-emerald-500/85 text-white"
                      }`}>
                        {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                      </span>
                    </div>
                    <div className="absolute bottom-4 start-4 end-4 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-white/90 shrink-0" strokeWidth={2} />
                      <span className="text-[13px] font-semibold text-white drop-shadow-sm">
                        {isAr ? offer.city.ar : offer.city.en} | {isAr ? offer.district.ar : offer.district.en}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 pb-6">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-[11px] font-bold text-[#2B4C66]/50 uppercase tracking-widest">
                        {isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                        <Ruler className="h-3 w-3" strokeWidth={1.5} />
                        {offer.area_sqm.toLocaleString("en-US")} {isAr ? "م²" : "sqm"}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-[#2B4C66] transition-colors duration-200">
                      {isAr ? offer.title.ar : offer.title.en}
                    </h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-5">
                      {isAr ? offer.description.ar : offer.description.en}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-[13px] font-bold text-[#2B4C66] group-hover:underline underline-offset-2">
                        {isAr ? "عرض التفاصيل" : "View Details"}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-[#2B4C66]/5 flex items-center justify-center transition-all group-hover:bg-[#2B4C66] group-hover:scale-105">
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#2B4C66] transition-all group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OffersPage;
