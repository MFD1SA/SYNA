import React from "react";
import OwnerSidebar from "./OwnerSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { initial } = useUserProfile();
  const isAr = lang === "ar";

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={isAr ? "rtl" : "ltr"}>
      <OwnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-end bg-white/90 backdrop-blur-xl border-b border-gray-200/40 px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#C2A86B]/15 flex items-center justify-center transition-colors hover:bg-[#C2A86B]/25">
              <span className="text-[11px] font-semibold text-[#C2A86B]">
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

export default OwnerLayout;
