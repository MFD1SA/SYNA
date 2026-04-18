import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getActiveOffers, usageTypeLabels, offerTypeLabels, type RealEstateOffer } from "@/data/offers";
import { MapPin, Ruler, Handshake, Gem, Sparkles, ArrowUpRight } from "lucide-react";
import InnerHero from "@/components/landing/InnerHero";

const OffersPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "العروض العقارية" : "Real Estate Offers");

  const [offers, setOffers] = useState<RealEstateOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChip, setActiveChip] = useState<"all" | "partnership" | "investment">("all");

  useEffect(() => {
    getActiveOffers().then(data => { setOffers(data); setLoading(false); }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFC] relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 end-[-10%] w-[520px] h-[520px] rounded-full bg-[#C2A86B]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] start-[-8%] w-[560px] h-[560px] rounded-full bg-[#2B4C66]/10 blur-[130px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFBFC] via-white to-[#FAFBFC]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <InnerHero
          pageSlug="offers"
          title={isAr ? "العروض العقارية" : "Real Estate Offers"}
          subtitle={isAr
            ? "اكتشف أبرز الفرص العقارية في المملكة العربية السعودية وشراكات التطوير والمساهمات في مواقع استراتيجية"
            : "Discover premier real estate opportunities across Saudi Arabia with development partnerships and contributions in strategic locations"
          }
          isAr={isAr}
          image="https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1920&q=85&auto=format&fit=crop"
        />

        {/* Filter bar + Offers grid */}
        <section className="-mt-10 relative z-10 pb-24">
          <div className="max-w-7xl mx-auto px-6">

            {/* Premium filter / count card */}
            {!loading && offers.length > 0 && (
              <div className="mb-10 rounded-3xl bg-white ring-1 ring-slate-200/70 shadow-[0_8px_30px_-12px_rgba(15,31,46,0.08)] px-6 md:px-8 py-6 md:py-7 relative overflow-hidden">
                {/* subtle gradient accent */}
                <div className="absolute top-0 start-0 w-full h-0.5 bg-gradient-to-r from-[#C2A86B]/60 via-[#2B4C66]/40 to-[#C2A86B]/60" />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  {/* Count block */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2B4C66] to-[#1E374B] flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(43,76,102,0.5)]">
                      <Sparkles className="w-6 h-6 text-[#D7C084]" strokeWidth={1.7} />
                    </div>
                    <div>
                      <p className="text-[28px] md:text-[32px] font-bold text-[#1E374B] leading-none tracking-tight" dir="ltr">
                        {offers.length}
                      </p>
                      <p className="text-[12px] md:text-[13px] text-gray-500 font-semibold mt-1 tracking-wide">
                        {isAr ? "عروض نشطة" : "Active offers"}
                      </p>
                    </div>
                  </div>

                  {/* Quick filter chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {([
                      { id: "all", labelAr: "الكل", labelEn: "All" },
                      { id: "partnership", labelAr: "شراكات", labelEn: "Partnerships" },
                      { id: "investment", labelAr: "استثمارات", labelEn: "Investments" },
                    ] as const).map((chip) => {
                      const active = activeChip === chip.id;
                      return (
                        <button
                          key={chip.id}
                          onClick={() => setActiveChip(chip.id)}
                          className={`inline-flex items-center h-9 px-4 rounded-full text-[12.5px] font-bold transition-all ${
                            active
                              ? "bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white shadow-[0_6px_16px_-6px_rgba(43,76,102,0.5)]"
                              : "bg-slate-50 text-gray-500 hover:bg-slate-100 hover:text-[#1E374B] ring-1 ring-slate-200/70"
                          }`}
                        >
                          {isAr ? chip.labelAr : chip.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <div key={i} className="h-[460px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/60" />)}
              </div>
            ) : offers.length === 0 ? (
              <div className="py-28 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#2B4C66] to-[#C2A86B] flex items-center justify-center shadow-[0_12px_30px_-10px_rgba(43,76,102,0.4)]">
                  <MapPin className="h-8 w-8 text-white" strokeWidth={1.6} />
                </div>
                <h3 className="text-[18px] md:text-[20px] font-bold text-[#1E374B] mb-2">
                  {isAr ? "لا توجد عروض نشطة حالياً" : "No active offers right now"}
                </h3>
                <p className="text-[13px] md:text-[14px] text-gray-500 max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? "نعمل باستمرار على إضافة فرص جديدة. عُد قريباً لاستكشاف آخر عروض الشراكة والاستثمار."
                    : "We're constantly curating new opportunities. Check back soon for fresh partnership and investment offers."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => {
                  const isPartnership = offer.type === "partnership";
                  return (
                    <Link
                      key={offer.id}
                      to={`/offers/${offer.id}`}
                      className="group bg-white rounded-3xl overflow-hidden transition-all duration-300 ring-1 ring-slate-200/70 hover:ring-slate-300/80 shadow-[0_4px_18px_-8px_rgba(15,31,46,0.08)] hover:shadow-[0_18px_48px_-16px_rgba(15,31,46,0.22)] hover:-translate-y-1 flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative h-[240px] md:h-[260px] overflow-hidden">
                        <img
                          src={offer.imageUrl}
                          alt={isAr ? offer.title.ar : offer.title.en}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                        {/* Type badge — start */}
                        <div className="absolute top-4 start-4">
                          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md text-white ${
                            isPartnership ? "bg-[#2B4C66]/85" : "bg-emerald-600/85"
                          }`}>
                            {isPartnership ? <Handshake className="w-3 h-3" strokeWidth={2} /> : <Gem className="w-3 h-3" strokeWidth={2} />}
                            {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                          </span>
                        </div>

                        {/* Gold partnership badge — end */}
                        {isPartnership && (
                          <div className="absolute top-4 end-4">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#C2A86B] to-[#A88A4A] shadow-[0_4px_14px_-4px_rgba(194,168,107,0.6)]">
                              <Handshake className="w-4 h-4 text-white" strokeWidth={1.8} />
                            </span>
                          </div>
                        )}

                        {/* City | District */}
                        <div className="absolute bottom-4 start-4 end-4 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-white/90 shrink-0" strokeWidth={2} />
                          <span className="text-[13px] font-semibold text-white drop-shadow-sm">
                            {isAr ? offer.city.ar : offer.city.en} | {isAr ? offer.district.ar : offer.district.en}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 md:p-6 flex flex-col flex-1">
                        <h3 className="text-[16.5px] md:text-[17px] font-bold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-[#2B4C66] transition-colors duration-200">
                          {isAr ? offer.title.ar : offer.title.en}
                        </h3>
                        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-5">
                          {isAr ? offer.description.ar : offer.description.en}
                        </p>

                        {/* Info pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2B4C66]/[0.06] text-[11px] font-bold text-[#2B4C66] tracking-wide">
                            {isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en}
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 text-[11px] font-bold text-gray-600 tracking-wide">
                            <Ruler className="h-3 w-3" strokeWidth={1.8} />
                            {offer.area_sqm.toLocaleString("en-US")} {isAr ? "م²" : "sqm"}
                          </span>
                        </div>

                        {/* Full-width CTA */}
                        <div className="mt-auto">
                          <span className="group/cta flex w-full items-center justify-center gap-2 h-[46px] rounded-xl bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_rgba(43,76,102,0.45)] group-hover:shadow-[0_10px_24px_-8px_rgba(43,76,102,0.55)] transition-all">
                            {isAr ? "عرض التفاصيل" : "View Details"}
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default OffersPage;
