import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getOfferBySlug, usageTypeLabels, offerTypeLabels, type RealEstateOffer } from "@/data/offers";
import { MapPin, Ruler, CheckCircle2, ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import InnerHero from "@/components/landing/InnerHero";
import headerPartnershipsImg from "@/assets/header-partnerships.jpg";

const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [offer, setOffer] = useState<RealEstateOffer | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(offer ? (isAr ? offer.title.ar : offer.title.en) : (isAr ? "عرض عقاري" : "Offer"));

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getOfferBySlug(id).then(data => { setOffer(data); setLoading(false); }).catch(console.error);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-7 w-7 animate-spin rounded-full border-r-2 border-t-2 border-gray-300" />
      </div>
    );
  }

  if (!offer) return <Navigate to="/offers" replace />;

  return (
    <div className="min-h-screen bg-[#FAFBFC]" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      <InnerHero
        pageSlug="offers"
        title={isAr ? offer.title.ar : offer.title.en}
        subtitle={isAr ? `${offer.city.ar} | ${offer.district.ar}` : `${offer.city.en} | ${offer.district.en}`}
        isAr={isAr}
        image={headerPartnershipsImg}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center gap-2 text-[13px]">
            <Link to="/" className="text-gray-400 hover:text-[#2B4C66] transition-colors font-medium">{isAr ? "الرئيسية" : "Home"}</Link>
            <span className="text-gray-200 text-[10px]">{isAr ? "‹" : "›"}</span>
            <Link to="/offers" className="text-gray-400 hover:text-[#2B4C66] transition-colors font-medium">{isAr ? "العروض العقارية" : "Offers"}</Link>
            <span className="text-gray-200 text-[10px]">{isAr ? "‹" : "›"}</span>
            <span className="text-[#2B4C66] font-semibold truncate max-w-[220px]">{isAr ? offer.city.ar : offer.city.en}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-7">
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden h-[360px] md:h-[440px] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)]">
                <img src={offer.imageUrl} alt={isAr ? offer.title.ar : offer.title.en} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <div className="absolute bottom-6 start-6 end-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={`inline-block px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${
                      offer.type === "partnership" ? "bg-[#2B4C66] text-white" : "bg-emerald-500 text-white"
                    }`}>
                      {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                    </span>
                    <span className="inline-block px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white tracking-wide">
                      {isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en}
                    </span>
                  </div>
                  <h1 className="text-[24px] md:text-[30px] font-bold text-white leading-tight drop-shadow-sm">
                    {isAr ? offer.title.ar : offer.title.en}
                  </h1>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-gray-100 p-7">
                <h2 className="text-[18px] font-bold text-gray-900 mb-4">{isAr ? "وصف الفرصة" : "Description"}</h2>
                <div className="text-[15px] text-gray-600 leading-[1.9] whitespace-pre-line">
                  {isAr ? offer.detailedDescription.ar : offer.detailedDescription.en}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 px-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C2A86B]/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl border border-gray-100 p-7">
                <h2 className="text-[18px] font-bold text-gray-900 mb-5">{isAr ? "المميزات" : "Key Features"}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offer.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 px-4 py-3.5 transition-colors hover:bg-emerald-50">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                      </div>
                      <span className="text-[14px] text-gray-700 font-medium">{isAr ? f.ar : f.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="lg:hidden">
                <Link to="/auth/login" className="flex w-full items-center justify-center gap-3 h-[56px] bg-gradient-to-b from-[#2B4C66] to-[#1E374B] text-white text-[16px] font-bold rounded-xl hover:shadow-lg transition-all shadow-[0_4px_12px_-2px_rgba(43,76,102,0.35)]">
                  <Building2 className="h-5 w-5" strokeWidth={1.5} />
                  {isAr ? "دخول المطورين" : "Developer Login"}
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06)] overflow-hidden">
                  {/* Gold accent bar */}
                  <div className="h-1 bg-gradient-to-r from-[#C2A86B] via-[#D4BA7A] to-[#C2A86B]" />

                  <div className="p-6 space-y-5">
                    <h3 className="text-[17px] font-bold text-gray-900">{isAr ? "ملخص العرض" : "Offer Summary"}</h3>
                    <div className="space-y-0.5">
                      {[
                        { label: isAr ? "نوع العرض" : "Type", value: isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en, color: offer.type === "partnership" ? "text-[#2B4C66]" : "text-emerald-600" },
                        { label: isAr ? "المدينة" : "City", value: isAr ? offer.city.ar : offer.city.en },
                        { label: isAr ? "الحي" : "District", value: isAr ? offer.district.ar : offer.district.en },
                        { label: isAr ? "الاستخدام" : "Usage", value: isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en },
                        { label: isAr ? "المساحة" : "Area", value: `${offer.area_sqm.toLocaleString("en-US")} ${isAr ? "م²" : "sqm"}` },
                      ].map((row, i) => (
                        <div key={i} className={`flex items-center justify-between py-3 ${i < 4 ? "border-b border-gray-50" : ""}`}>
                          <span className="text-[12px] text-gray-400 uppercase tracking-wider font-semibold">{row.label}</span>
                          <span className={`text-[13px] font-bold ${row.color || "text-gray-800"}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Link to="/auth/login" className="flex w-full items-center justify-center gap-3 h-[52px] bg-gradient-to-b from-[#2B4C66] to-[#1E374B] text-white text-[15px] font-bold rounded-xl hover:shadow-lg transition-all shadow-[0_4px_12px_-2px_rgba(43,76,102,0.35)]">
                      <Building2 className="h-4.5 w-4.5" strokeWidth={1.5} />
                      {isAr ? "دخول المطورين" : "Developer Login"}
                    </Link>
                    <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">
                      {isAr ? "سجّل دخولك كمطور للتقديم على هذه الفرصة" : "Sign in as developer to apply"}
                    </p>
                  </div>
                </div>

                <Link to="/offers" className="flex items-center gap-2.5 text-[13px] text-gray-400 hover:text-[#2B4C66] transition-colors font-medium group">
                  {isAr ? <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} /> : <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />}
                  {isAr ? "العودة للعروض" : "Back to Offers"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OfferDetailPage;
