import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Handshake } from "lucide-react";

const SubscriptionsPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الشراكات" : "Partnerships");

  return (
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <PageHeader icon={Handshake} title={isAr ? "الشراكات" : "Partnerships"} description={isAr ? "كيف تعمل شراكات التطوير العقاري عبر منصة سينا" : "How real estate development partnerships work through the SYNA platform"} />
      <main>
        <SubscriptionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionsPage;
