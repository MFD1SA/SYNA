import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";
import LogosSection from "@/components/landing/LogosSection";
import Footer from "@/components/landing/Footer";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SubscriptionsSection />
        <LogosSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
