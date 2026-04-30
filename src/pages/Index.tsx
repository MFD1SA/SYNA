import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustStrip from "@/components/landing/TrustStrip";
import WhySinaSection from "@/components/landing/WhySinaSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PreviewSection from "@/components/landing/PreviewSection";
import FeaturedSection from "@/components/landing/FeaturedSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { getActiveOffers, offerTypeLabels, usageTypeLabels } from "@/data/offers";
import { MapPin, Ruler, ArrowUpRight, ArrowLeft, ArrowRight as ArrowRightIcon, HelpCircle } from "lucide-react";
import { log } from "@/lib/logger";

const OffersPreview: React.FC<{ isAr: boolean }> = ({ isAr }) => {
  const [offers, setOffers] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    // On the landing page we deliberately don't surface a toast for this
    // failure — the rest of the page still paints and a partial hero with
    // missing "Latest Offers" is a softer degradation than a modal error
    // on first paint. We do log with a tagged prefix so the failure is
    // still greppable in Sentry / browser devtools instead of silently
    // swallowed.
    getActiveOffers()
      .then((data) => {
        if (cancelled) return;
        setOffers(data.slice(0, 3));
      })
      .catch((err) => {
        if (cancelled) return;
        log.error("Index.OffersPreview getActiveOffers error:", err);
      });
    return () => { cancelled = true; };
  }, []);
  return (
    <section className="py-16 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[12px] font-semibold text-[#2B2B2B] uppercase tracking-widest mb-2">
              {isAr ? "فرص حصرية" : "EXCLUSIVE OPPORTUNITIES"}
            </p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight">
              {isAr ? "أحدث العروض العقارية" : "Latest Real Estate Offers"}
            </h2>
          </div>
          <Link
            to="/offers"
            className="hidden md:flex items-center gap-2 text-[14px] font-semibold text-gray-600 hover:text-[#2B2B2B] transition-colors"
          >
            {isAr ? "عرض الكل" : "View All"}
            {isAr ? <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> : <ArrowRightIcon className="h-4 w-4" strokeWidth={1.5} />}
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              to={`/offers/${offer.id}`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] hover:border-gray-200"
            >
              <div className="relative h-[180px] overflow-hidden">
                <img
                  src={offer.imageUrl}
                  alt={isAr ? offer.title.ar : offer.title.en}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute top-3 start-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                    offer.type === "partnership" ? "bg-[#2B2B2B]/80 text-white" : "bg-emerald-500/80 text-white"
                  }`}>
                    {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                  </span>
                </div>
                <div className="absolute bottom-3 start-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-white/90" strokeWidth={1.5} />
                  <span className="text-[13px] font-semibold text-white">
                    {isAr ? offer.city.ar : offer.city.en}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {isAr ? usageTypeLabels[offer.usageType].ar : usageTypeLabels[offer.usageType].en}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Ruler className="h-3 w-3" strokeWidth={1.5} />
                    {offer.area_sqm.toLocaleString("en-US")} {isAr ? "م²" : "sqm"}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-[#2B2B2B] transition-colors">
                  {isAr ? offer.title.ar : offer.title.en}
                </h3>
                <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
                  {isAr ? offer.description.ar : offer.description.en}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#2B2B2B]">
                    {isAr ? "عرض التفاصيل" : "View Details"}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#2B2B2B] transition-colors" strokeWidth={1.5} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="md:hidden mt-6 text-center">
          <Link
            to="/offers"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#2B2B2B] hover:text-[#020202] transition-colors"
          >
            {isAr ? "عرض جميع العروض" : "View All Offers"}
            {isAr ? <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> : <ArrowRightIcon className="h-4 w-4" strokeWidth={1.5} />}
          </Link>
        </div>
      </div>
    </section>
  );
};

/* FAQ link banner replacing the full FAQ section */
const FAQBanner: React.FC<{ isAr: boolean }> = ({ isAr }) => {
  const Arrow = isAr ? ArrowLeft : ArrowRightIcon;
  return (
    <section className="py-14 bg-[#F7F9FB] border-y border-gray-100" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <HelpCircle className="w-7 h-7 text-sina-blue" strokeWidth={1.7} />
            <div>
              <h3 className="text-[18px] font-bold text-sina-charcoal">
                {isAr ? "لديك أسئلة؟" : "Have Questions?"}
              </h3>
              <p className="text-[13px] text-gray-500">
                {isAr ? "تصفح الأسئلة الشائعة واعثر على إجاباتك بسهولة" : "Browse our FAQ and find your answers easily"}
              </p>
            </div>
          </div>
          <Link
            to="/faq"
            className="inline-flex items-center gap-2.5 h-11 px-7 bg-sina-charcoal text-white text-[13px] font-semibold rounded-lg hover:bg-sina-charcoal/90 transition-colors"
          >
            {isAr ? "الأسئلة الشائعة" : "View FAQ"}
            <Arrow className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const Index: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سينا | الرئيسية" : "SINA | Home");

  useMetaTags({
    title: isAr
      ? "سينا | منصة شراكات التطوير العقاري في السعودية"
      : "SINA | Real Estate Development Partnerships in Saudi Arabia",
    description: isAr
      ? "سينا تربط ملاك الأراضي بالمطورين والمستثمرين في بيئة عقارية موثوقة — شراكات موثّقة، حوكمة متكاملة، وفرص استثمارية حصرية."
      : "SINA connects landowners with developers and investors in a trusted real-estate ecosystem — governed partnerships, exclusive opportunities, and end-to-end automation.",
    canonical: isAr ? "https://cidoma.com/" : "https://cidoma.com/en",
    ogTitle: isAr ? "سينا — الفرصة القادمة تبدأ هنا" : "SINA — Where your next opportunity begins",
    ogDescription: isAr
      ? "شراكات موثّقة بين ملاك الأراضي والمطورين في المملكة العربية السعودية."
      : "Governed development partnerships between landowners and developers in Saudi Arabia.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en" : "https://cidoma.com/" },
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <WhySinaSection />
        <CategoriesSection />
        <HowItWorksSection />
        <OffersPreview isAr={isAr} />
        <PreviewSection />
        <FeaturedSection />
        <FAQBanner isAr={isAr} />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
