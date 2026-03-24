import React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import TopStrip from "@/components/landing/TopStrip";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/SubscriptionsSection";
import LogosSection from "@/components/landing/LogosSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import OpportunitiesSection from "@/components/landing/OpportunitiesSection";

const Index: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سينا للاستثمارات العقارية | الرئيسية" : "SYNA Real Estate Investments | Home");

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top strip */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 60 }}>
        <TopStrip />
      </div>

      {/* Navbar sits below TopStrip via its own top:40px */}
      <Navbar />

      {/* 
        main starts at top of page (position 0). 
        HeroSection is fullscreen (height: 100dvh) and handles its own offset.
        No paddingTop needed — the hero covers the entire viewport behind the fixed headers.
      */}
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection variant="portfolio" />
        <FeaturesSection />
        <OpportunitiesSection />
        <HowItWorksSection />

        {/* Governance & Trust Section */}
        <section className="py-32 bg-primary relative overflow-hidden">
          <div className="luxury-grid absolute inset-0 opacity-10" />
          <div className="container relative z-10 text-center">
            <h2 className="text-3xl font-medium text-white mb-12 uppercase tracking-[0.2em]">
              {isAr ? "نصنع قيمة تتجاوز الأرقام" : "Creating Value Beyond Numbers"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-12 grayscale opacity-40 max-w-lg mx-auto">
              <div className="flex items-center justify-center text-white font-bold text-2xl tracking-widest opacity-80">REGA</div>
              <div className="flex items-center justify-center text-white font-bold text-2xl tracking-widest opacity-80">MOMRAH</div>
            </div>
          </div>
        </section>

        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
