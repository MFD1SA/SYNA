import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShieldCheck, Fingerprint, Scale } from "lucide-react";

const TrustStrip: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div className="bg-white border-y border-gray-100" dir={isAr ? "rtl" : "ltr"}>
      <div className="container py-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-[18px] h-[18px] text-[#2B4C66]" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-gray-600 tracking-wide">
            {isAr ? "بيئة منظّمة وآمنة" : "Regulated & Secure"}
          </span>
        </div>
        <div className="hidden md:block w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2.5">
          <Fingerprint className="w-[18px] h-[18px] text-[#2B4C66]" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-gray-600 tracking-wide">
            {isAr ? "تحقق من الهوية والسجلات" : "Identity & Registry Verified"}
          </span>
        </div>
        <div className="hidden md:block w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2.5">
          <Scale className="w-[18px] h-[18px] text-[#2B4C66]" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-gray-600 tracking-wide">
            {isAr ? "حوكمة وشفافية كاملة" : "Full Governance & Transparency"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustStrip;
