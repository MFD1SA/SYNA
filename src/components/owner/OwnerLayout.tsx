import React from "react";
import OwnerSidebar from "./OwnerSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import NotificationDropdown from "@/components/crm/NotificationDropdown";
import UserAvatarMenu from "@/components/shared/UserAvatarMenu";
import ThemeToggle from "@/components/dashboard/ThemeToggle";

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div
      className="flex min-h-screen bg-[#F7F8FA] dark:bg-[#0B1623] text-slate-900 dark:text-slate-100"
      dir={isAr ? "rtl" : "ltr"}
    >
      <OwnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — glass */}
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-end bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/60 dark:border-white/10 px-6">
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <NotificationDropdown />
            <UserAvatarMenu variant="gold" settingsPath="/owner/settings" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
