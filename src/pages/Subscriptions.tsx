import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";

const SubscriptionsPage: React.FC = () => {
  const { lang } = useLanguage();
  usePageTitle(lang === "ar" ? "الاشتراكات" : "Subscriptions");

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
