import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { Building2, Target, Users } from "lucide-react";

const AboutPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-xs font-light text-primary">{t.about.version}</span>
            </div>
            <h1 className="mb-4 text-3xl font-medium text-foreground">{t.about.title}</h1>
            <p className="text-base font-light leading-relaxed text-muted-foreground">
              {t.about.description}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-3">
            {[
              { icon: Building2, label: isAr ? "إدارة المشاريع" : "Project Management", desc: isAr ? "إدارة شاملة لجميع مشاريعك العقارية" : "Comprehensive management for all your real estate projects" },
              { icon: Target, label: isAr ? "تحليلات دقيقة" : "Precise Analytics", desc: isAr ? "تقارير ومؤشرات لاتخاذ قرارات أفضل" : "Reports and indicators for better decision making" },
              { icon: Users, label: isAr ? "تواصل ذكي" : "Smart Communication", desc: isAr ? "ربط الجهات المناسبة بفرص التأجير" : "Connecting suitable entities with leasing opportunities" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="doma-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">{label}</h3>
                <p className="text-sm font-light text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
