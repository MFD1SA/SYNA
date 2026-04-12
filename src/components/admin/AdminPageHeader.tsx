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
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <h1 className="text-[20px] font-semibold text-gray-900">
            {isAr ? titleAr : titleEn}
          </h1>
        </div>
        {(descAr || descEn) && (
          <p className="mt-1 text-[13px] text-gray-400 ms-[30px]">
            {isAr ? descAr : descEn}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;
