import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Palette } from "lucide-react";

export type BrandVariant = "doma" | "portfolio";

interface BrandToggleProps {
  variant: BrandVariant;
  onChange: (v: BrandVariant) => void;
}

const BrandToggle: React.FC<BrandToggleProps> = ({ variant, onChange }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur-md rtl:translate-x-1/2">
      <Palette className="mx-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      <button
        onClick={() => onChange("doma")}
        className={`rounded-full px-4 py-2 text-xs font-light transition-all duration-200 ${
          variant === "doma"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-surface"
        }`}
      >
        {isAr ? "تصميم DOMA" : "DOMA Brand"}
      </button>
      <button
        onClick={() => onChange("portfolio")}
        className={`rounded-full px-4 py-2 text-xs font-light transition-all duration-200 ${
          variant === "portfolio"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-surface"
        }`}
      >
        {isAr ? "قالب Portfolio" : "Portfolio Template"}
      </button>
    </div>
  );
};

export default BrandToggle;
