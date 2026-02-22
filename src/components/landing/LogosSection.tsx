import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronLeft, ChevronRight, Building2, ShoppingBag, Wifi, GraduationCap, Heart, Cpu, Landmark, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectorIcons = [Building2, ShoppingBag, Wifi, GraduationCap, Heart, Cpu, Landmark, Home];

const LogosSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const sectors = lang === "ar"
    ? ["التجزئة", "المطاعم", "الاتصالات", "التعليم", "الصحة", "التقنية", "البنوك", "العقارات"]
    : ["Retail", "Restaurants", "Telecom", "Education", "Healthcare", "Technology", "Banking", "Real Estate"];

  const itemsPerView = 4;
  const maxIndex = Math.max(0, sectors.length - itemsPerView);

  const scrollPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const scrollNext = () => setActiveIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <section className="border-t border-border py-16">
      <div className="container">
        <h2 className="mb-8 text-center text-2xl font-medium text-foreground">
          {t.logos.title}
        </h2>

        <div className="relative mx-auto max-w-4xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            disabled={activeIndex === 0}
            className="absolute -start-12 top-1/2 z-10 hidden -translate-y-1/2 rounded-full md:flex"
          >
            {lang === "ar" ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>

          <div className="overflow-hidden">
            <div
              className="flex gap-4 transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${lang === "ar" ? activeIndex * (100 / itemsPerView) : -(activeIndex * (100 / itemsPerView))}%)`,
              }}
            >
              {sectors.map((sector, idx) => {
                const Icon = sectorIcons[idx];
                return (
                  <div
                    key={sector}
                    className="flex min-w-[calc(25%-12px)] flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/5">
                      <Icon className="h-8 w-8 text-primary" strokeWidth={1.2} />
                    </div>
                    <span className="text-sm font-light text-foreground">{sector}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            disabled={activeIndex >= maxIndex}
            className="absolute -end-12 top-1/2 z-10 hidden -translate-y-1/2 rounded-full md:flex"
          >
            {lang === "ar" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all ${i === activeIndex ? "w-6 bg-primary" : "w-2 bg-border"}`}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-xs font-light text-muted-foreground">
          {t.logos.disclaimer}
        </p>
      </div>
    </section>
  );
};

export default LogosSection;
