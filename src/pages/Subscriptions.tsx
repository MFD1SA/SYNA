import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import SubscriptionsSection from "@/components/landing/SubscriptionsSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import { Handshake } from "lucide-react";
import headerPartnershipsImg from "@/assets/header-partnerships.jpg";

const SubscriptionsPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الشراكات" : "Partnerships");

  useMetaTags({
    title: isAr
      ? "سينا | باقات الاشتراك لشراكات التطوير العقاري بالسعودية"
      : "SINA | Subscription Plans for Real-Estate Development Partnerships",
    description: isAr
      ? "اكتشف باقات الاشتراك في سينا للملاك والمطورين العقاريين، مع مستويات خدمة مرنة تناسب حجم الأرض، نوع الشراكة، ومتطلبات إدارة الصفقات."
      : "Explore SINA subscription plans for landowners and developers — flexible service tiers tailored to land size, partnership type, and deal-management needs.",
    canonical: isAr ? "https://cidoma.com/subscriptions" : "https://cidoma.com/en/subscriptions",
    ogTitle: isAr ? "سينا | باقات الاشتراك" : "SINA | Subscription Plans",
    ogDescription: isAr
      ? "باقات مرنة للملاك والمطورين داخل منصة سينا."
      : "Flexible plans for landowners and developers on SINA.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/subscriptions" : "https://cidoma.com/subscriptions" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "الاشتراكات" : "Subscriptions", item: isAr ? "https://cidoma.com/subscriptions" : "https://cidoma.com/en/subscriptions" },
        ],
      },
    ],
  });

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
