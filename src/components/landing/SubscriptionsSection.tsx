import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { User, Building2, Store, Landmark, Building, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    key: "individuals" as const,
    icon: User,
    features: { ar: ["ملف شخصي", "تنبيهات", "بحث متقدم"], en: ["Personal profile", "Alerts", "Advanced search"] },
  },
  {
    key: "brokerage" as const,
    icon: Building2,
    features: { ar: ["إدارة الفريق", "Pipeline مبسط", "إدارة العملاء"], en: ["Team management", "Simple pipeline", "Client management"] },
  },
  {
    key: "brands" as const,
    icon: Store,
    features: { ar: ["متطلبات التوسع", "استقبال العروض", "إدارة الوثائق"], en: ["Expansion needs", "Receive offers", "Document management"] },
  },
  {
    key: "management" as const,
    icon: Building,
    popular: true,
    features: { ar: ["CRM متكامل", "إدارة العقود", "تقارير متقدمة", "صيانة"], en: ["Full CRM", "Contract mgmt", "Advanced reports", "Maintenance"] },
  },
  {
    key: "banks" as const,
    icon: Landmark,
    features: { ar: ["لوحة مالية", "مؤشرات السوق", "فرص التمويل"], en: ["Financial dashboard", "Market indicators", "Financing opportunities"] },
  },
];

const SubscriptionsSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section id="subscriptions" className="relative py-16 md:py-24">
      <div className="container relative">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="mb-2 text-3xl font-medium text-foreground md:text-4xl">
            {t.subscriptions.title}
          </h2>
          <p className="text-base font-light text-muted-foreground">
            {t.subscriptions.subtitle}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map(({ key, icon: Icon, popular, features }) => (
            <div
              key={key}
              className={`group relative flex flex-col doma-card p-5 ${popular ? "ring-2 ring-primary/30" : ""}`}
            >
              {popular && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full doma-gradient px-3 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {isAr ? "الأكثر طلباً" : "Most Popular"}
                </div>
              )}
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mb-1.5 text-base font-medium text-foreground">
                {t.subscriptions[key]}
              </h3>
              <p className="mb-4 text-sm font-light leading-relaxed text-muted-foreground">
                {t.subscriptions[`${key}Desc`]}
              </p>
              
              <ul className="mb-5 flex-1 space-y-2">
                {(isAr ? features.ar : features.en).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs font-light text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={popular ? "default" : "outline"}
                size="sm"
                asChild
                className={`w-full gap-1.5 ${popular ? "doma-gradient" : "border-border/60 transition-colors group-hover:border-primary/30 group-hover:text-primary"}`}
              >
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
