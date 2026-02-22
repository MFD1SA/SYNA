import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";

const SubscriptionsPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <SubscriptionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionsPage;
