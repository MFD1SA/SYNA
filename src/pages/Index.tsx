import React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/SubscriptionsSection";
import LogosSection from "@/components/landing/LogosSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import OpportunitiesSection from "@/components/landing/OpportunitiesSection";

const Index: React.FC = () => {
  usePageTitle();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection variant="portfolio" />
        <FeaturesSection />
        <OpportunitiesSection />
        <HowItWorksSection />
        <LogosSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
