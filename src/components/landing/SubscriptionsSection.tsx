import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { User, Building2, Store, Landmark, Building } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  { key: "individuals" as const, icon: User },
  { key: "brokerage" as const, icon: Building2 },
  { key: "brands" as const, icon: Store },
  { key: "management" as const, icon: Building },
  { key: "banks" as const, icon: Landmark },
];

const SubscriptionsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="subscriptions" className="bg-primary/[0.03] py-20 md:py-28">
      <div className="container">
        <h2 className="mb-3 text-center text-3xl font-medium text-foreground">
          {t.subscriptions.title}
        </h2>
        <p className="mb-14 text-center text-base font-light text-muted-foreground">
          {t.subscriptions.subtitle}
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <Icon className="mb-4 h-6 w-6 text-primary" strokeWidth={1.5} />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                {t.subscriptions[key]}
              </h3>
              <p className="mb-6 flex-1 text-sm font-light leading-relaxed text-muted-foreground">
                {t.subscriptions[`${key}Desc`]}
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/register">{t.subscriptions.contactUs}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionsSection;
