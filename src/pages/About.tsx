import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-16">
        <h1 className="mb-4 text-3xl font-medium text-foreground">{t.about.title}</h1>
        <p className="mb-2 text-sm font-light text-primary">{t.about.version}</p>
        <p className="max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
          {t.about.description}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
