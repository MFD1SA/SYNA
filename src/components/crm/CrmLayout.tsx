import React from "react";
import CrmSidebar from "./CrmSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Search } from "lucide-react";

const CrmLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { initial } = useUserProfile();
  const isAr = lang === "ar";

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={isAr ? "rtl" : "ltr"}>
      <CrmSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 px-6">
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
              <input
                className="h-9 w-64 rounded-lg bg-gray-50/80 border border-gray-200/40 ps-10 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#2B4C66]/30 focus:ring-1 focus:ring-[#2B4C66]/20 transition-all"
                placeholder={isAr ? "بحث..." : "Search..."}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#2B4C66]/10 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-[#2B4C66]">
                {initial}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default CrmLayout;
