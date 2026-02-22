import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { User, Building2, Store, Landmark, Building, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  { key: "individuals" as const, icon: User },
  { key: "brokerage" as const, icon: Building2 },
  { key: "brands" as const, icon: Store },
  { key: "management" as const, icon: Building },
  { key: "banks" as const, icon: Landmark },
];

const SubscriptionsSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section id="subscriptions" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-surface/40" />
      <div className="container relative">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-medium text-foreground">
            {t.subscriptions.title}
          </h2>
          <p className="text-base font-light text-muted-foreground">
            {t.subscriptions.subtitle}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full doma-gradient" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map(({ key, icon: Icon }, idx) => (
            <div
              key={key}
              className="group flex flex-col doma-card p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 transition-colors group-hover:bg-primary/10">
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                {t.subscriptions[key]}
              </h3>
              <p className="mb-6 flex-1 text-sm font-light leading-relaxed text-muted-foreground">
                {t.subscriptions[`${key}Desc`]}
              </p>
              <Button variant="outline" size="sm" asChild className="w-full gap-1.5 border-border/60 transition-colors group-hover:border-primary/30 group-hover:text-primary">
                <Link to="/register">
                  {t.subscriptions.contactUs}
                  <Arrow className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionsSection;
