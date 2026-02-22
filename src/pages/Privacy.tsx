import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

const PrivacyPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-16">
        <h1 className="mb-8 text-3xl font-medium text-foreground">{t.privacy.title}</h1>
        <div className="prose max-w-3xl font-light text-muted-foreground">
          <p>محتوى سياسة الخصوصية سيُضاف لاحقاً.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
