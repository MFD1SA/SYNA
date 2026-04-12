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
    getActiveOffers().then(data => { setOffers(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-white" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      <InnerHero
        title={isAr ? "العروض العقارية" : "Real Estate Offers"}
        subtitle={isAr
          ? "اكتشف أبرز الفرص العقارية في المملكة العربية السعودية وشراكات التطوير والمساهمات في مواقع استراتيجية"
          : "Discover premier real estate opportunities across Saudi Arabia with development partnerships and contributions in strategic locations"
        }
        isAr={isAr}
        image={headerFeaturesImg}
      />

      {/* Offers grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-[380px] animate-pulse rounded-2xl bg-gray-100" />)}
            </div>
          ) : offers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">{isAr ? "لا توجد عروض متاحة حاليًا" : "No offers available at this time"}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  to={`/offers/${offer.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] hover:border-gray-200"
                >
                  {/* Image */}
                  <div className="relative h-[200px] overflow-hidden">
                    <img
                      src={offer.imageUrl}
                      alt={isAr ? offer.title.ar : offer.title.en}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 start-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                        offer.type === "partnership" ? "bg-[#2B4C66]/80 text-white" : "bg-emerald-500/80 text-white"
                      }`}>
                        {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                      </span>
                    </div>
                    <div className="absolute bottom-3 start-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-white/90" strokeWidth={1.5} />
                      <span className="text-[13px] font-semibold text-white">
                        {isAr ? offer.city.ar : offer.city.en} | {isAr ? offer.district.ar : offer.district.en}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en}
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Ruler className="h-3 w-3" strokeWidth={1.5} />
                        {offer.area_sqm.toLocaleString("en-US")} {isAr ? "م²" : "sqm"}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900 mb-2.5 leading-snug line-clamp-2 group-hover:text-[#2B4C66] transition-colors">
                      {isAr ? offer.title.ar : offer.title.en}
                    </h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
                      {isAr ? offer.description.ar : offer.description.en}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="text-[13px] font-semibold text-[#2B4C66] group-hover:underline">
                        {isAr ? "عرض التفاصيل" : "View Details"}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:text-[#2B4C66] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
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
