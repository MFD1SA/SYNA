import React, { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";
import LogosSection from "@/components/landing/LogosSection";
import Footer from "@/components/landing/Footer";
import type { BrandVariant } from "@/components/landing/BrandToggle";

const Index: React.FC = () => {
  const [variant, setVariant] = useState<BrandVariant>("portfolio");

  const toggleVariant = () => {
    setVariant((v) => (v === "portfolio" ? "doma" : "portfolio"));
  };

  return (
    <div className="min-h-screen">
      <Navbar variant={variant} onToggleVariant={toggleVariant} />
      <main>
        <HeroSection variant={variant} />
        <FeaturesSection />
        <SubscriptionsSection />
        <LogosSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
