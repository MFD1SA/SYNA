import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AdminPageHeaderProps {
  icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  actions?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  icon: Icon,
  titleAr,
  titleEn,
  descAr,
  descEn,
  actions,
}) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-foreground">
            {isAr ? titleAr : titleEn}
          </h1>
          {(descAr || descEn) && (
            <p className="mt-0.5 text-sm font-light text-muted-foreground">
              {isAr ? descAr : descEn}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;
