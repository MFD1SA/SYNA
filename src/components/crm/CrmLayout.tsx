import React from "react";
import CrmSidebar from "./CrmSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import UserAvatarMenu from "@/components/shared/UserAvatarMenu";

const CrmLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div
      className="flex min-h-screen bg-[#F7F8FA] dark:bg-[#0B1623] text-slate-900 dark:text-slate-100"
      dir={isAr ? "rtl" : "ltr"}
    >
      <CrmSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — glass */}
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/60 dark:border-white/10 px-6">
          <div className="flex items-center gap-3" />
          <div className="flex items-center gap-2">
            <Link
              to="/crm/settings"
              className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2B4C66] hover:bg-[#2B4C66]/10 dark:hover:bg-white/5 transition-colors"
              title={isAr ? "الإعدادات" : "Settings"}
            >
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <NotificationDropdown />
            <UserAvatarMenu variant="blue" settingsPath="/crm/settings" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default CrmLayout;
