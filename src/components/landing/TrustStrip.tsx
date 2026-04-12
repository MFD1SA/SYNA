import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShieldCheck, Building, Scale } from "lucide-react";

const TrustStrip: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="bg-sina-soft-blue border-y border-gray-200" dir={isAr ? "rtl" : "ltr"}>
      <div className="container py-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-sina-blue" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-gray-600">
            {isAr ? "بيئة منظّمة وآمنة" : "Regulated & Secure"}
          </span>
        </div>
        <div className="hidden md:block w-px h-5 bg-gray-300" />
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-sina-blue" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-gray-600">
            {isAr ? "تحقق من الهوية والسجلات" : "Identity & Registry Verified"}
          </span>
        </div>
        <div className="hidden md:block w-px h-5 bg-gray-300" />
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-sina-blue" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-gray-600">
            {isAr ? "حوكمة وشفافية كاملة" : "Full Governance & Transparency"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustStrip;
