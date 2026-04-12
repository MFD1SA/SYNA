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
    getOfferBySlug(id).then(data => { setOffer(data); setLoading(false); });
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
    <div className="min-h-screen bg-white" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      <InnerHero
        title={isAr ? offer.title.ar : offer.title.en}
        subtitle={isAr ? `${offer.city.ar} | ${offer.district.ar}` : `${offer.city.en} | ${offer.district.en}`}
        isAr={isAr}
        image={headerPartnershipsImg}
      />

      {/* Breadcrumb */}
      <div className="py-4 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <Link to="/" className="hover:text-gray-600 transition-colors">{isAr ? "الرئيسية" : "Home"}</Link>
            <span>/</span>
            <Link to="/offers" className="hover:text-gray-600 transition-colors">{isAr ? "العروض العقارية" : "Offers"}</Link>
            <span>/</span>
            <span className="text-gray-600 font-medium truncate max-w-[200px]">{isAr ? offer.city.ar : offer.city.en}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="relative rounded-2xl overflow-hidden h-[360px] md:h-[440px]">
                <img src={offer.imageUrl} alt={isAr ? offer.title.ar : offer.title.en} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-5 start-5 end-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${
                      offer.type === "partnership" ? "bg-[#2B4C66] text-white" : "bg-emerald-500 text-white"
                    }`}>
                      {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-sm text-white">
                      {isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en}
                    </span>
                  </div>
                  <h1 className="text-[22px] md:text-[28px] font-bold text-white leading-tight">
                    {isAr ? offer.title.ar : offer.title.en}
                  </h1>
                </div>
              </div>

              <div>
                <h2 className="text-[18px] font-bold text-gray-900 mb-4">{isAr ? "وصف الفرصة" : "Description"}</h2>
                <div className="text-[15px] text-gray-600 leading-[1.9] whitespace-pre-line">
                  {isAr ? offer.detailedDescription.ar : offer.detailedDescription.en}
                </div>
              </div>

              <div>
                <h2 className="text-[18px] font-bold text-gray-900 mb-4">{isAr ? "المميزات" : "Key Features"}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offer.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={1.5} />
                      <span className="text-[14px] text-gray-700 font-medium">{isAr ? f.ar : f.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:hidden">
                <Link to="/auth/register" className="flex w-full items-center justify-center gap-2.5 h-[52px] bg-[#2B4C66] text-white text-[15px] font-semibold rounded-xl hover:bg-[#1E374B] transition-colors">
                  <Building2 className="h-4 w-4" strokeWidth={1.5} />
                  {isAr ? "تقدم كمطور" : "Apply as Developer"}
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06)] overflow-hidden">
                  <div className="p-6 space-y-5">
                    <h3 className="text-[16px] font-bold text-gray-900">{isAr ? "ملخص العرض" : "Offer Summary"}</h3>
                    <div className="space-y-4">
                      {[
                        { label: isAr ? "نوع العرض" : "Type", value: isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en, color: offer.type === "partnership" ? "text-[#2B4C66]" : "text-emerald-600" },
                        { label: isAr ? "المدينة" : "City", value: isAr ? offer.city.ar : offer.city.en },
                        { label: isAr ? "الحي" : "District", value: isAr ? offer.district.ar : offer.district.en },
                        { label: isAr ? "الاستخدام" : "Usage", value: isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en },
                        { label: isAr ? "المساحة" : "Area", value: `${offer.area_sqm.toLocaleString("en-US")} ${isAr ? "م²" : "sqm"}` },
                      ].map((row, i) => (
                        <div key={i} className={`flex items-center justify-between py-2.5 ${i < 4 ? "border-b border-gray-50" : ""}`}>
                          <span className="text-[12px] text-gray-400 uppercase tracking-wider font-semibold">{row.label}</span>
                          <span className={`text-[13px] font-semibold ${row.color || "text-gray-800"}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Link to="/auth/register" className="flex w-full items-center justify-center gap-2.5 h-[48px] bg-[#2B4C66] text-white text-[14px] font-semibold rounded-xl hover:bg-[#1E374B] transition-colors">
                      <Building2 className="h-4 w-4" strokeWidth={1.5} />
                      {isAr ? "تقدم كمطور" : "Apply as Developer"}
                    </Link>
                    <p className="text-center text-[11px] text-gray-400 mt-3">
                      {isAr ? "سجّل كمطور للتقديم على هذه الفرصة" : "Register as developer to apply"}
                    </p>
                  </div>
                </div>

                <Link to="/offers" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
                  {isAr ? <ArrowRight className="h-4 w-4" strokeWidth={1.5} /> : <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />}
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
