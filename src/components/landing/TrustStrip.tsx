import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShieldCheck, Fingerprint, Scale, Clock, BadgeCheck } from "lucide-react";

const TrustStrip: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const items = [
    {
      icon: ShieldCheck,
      label: isAr ? "بيئة منظّمة وآمنة" : "Regulated & Secure",
    },
    {
      icon: Fingerprint,
      label: isAr ? "تحقق من الهوية" : "Identity Verified",
    },
    {
      icon: Scale,
      label: isAr ? "حوكمة كاملة" : "Full Governance",
    },
    {
      icon: BadgeCheck,
      label: isAr ? "مرخّصة من REGA" : "REGA Licensed",
    },
    {
      icon: Clock,
      label: isAr ? "دعم 24/7" : "24/7 Support",
    },
  ];

  return (
    <div
      className="relative bg-white border-b border-gray-100"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Subtle top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C2A86B]/40 to-transparent" />

      <div className="container">
        <div className="py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {items.map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2.5 group">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#2B4C66]/[0.08] to-[#2B4C66]/[0.04] group-hover:from-[#C2A86B]/15 group-hover:to-[#C2A86B]/5 transition-all">
                  <item.icon className="w-3.5 h-3.5 text-[#2B4C66] group-hover:text-[#A88A4A] transition-colors" strokeWidth={1.8} />
                </div>
                <span className="text-[12.5px] font-semibold text-gray-700 tracking-wide">
                  {item.label}
                </span>
              </div>
              {i < items.length - 1 && (
                <div className="hidden md:block w-1 h-1 rounded-full bg-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustStrip;
