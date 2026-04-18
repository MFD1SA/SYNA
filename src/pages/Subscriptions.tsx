import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Handshake } from "lucide-react";
import headerPartnershipsImg from "@/assets/header-partnerships.jpg";

const SubscriptionsPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الشراكات" : "Partnerships");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <PageHeader icon={Handshake} title={isAr ? "الشراكات" : "Partnerships"} description={isAr ? "كيف تعمل شراكات التطوير العقاري عبر سينا للاستثمارات العقارية" : "How real estate development partnerships work through the SINA platform"} backgroundImage={headerPartnershipsImg} />
      <main className="flex-1">
        <SubscriptionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionsPage;
