import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  SlidersHorizontal, Menu, Gauge, Compass, Send, HandCoins,
} from "lucide-react";
import CrmSidebar from "./CrmSidebar";
import NotificationDropdown from "./NotificationDropdown";
import UserAvatarMenu from "@/components/shared/UserAvatarMenu";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import CommandPalette from "@/components/dashboard/CommandPalette";
import MobileNavOverlay from "@/components/dashboard/MobileNavOverlay";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { isImpersonationSession } from "@/integrations/supabase/impersonateClient";
import logoImg from "@/assets/logo.png";

const CrmLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const { fullName, avatarUrl } = useUserProfile();
  const { isAdmin: isAdminUser } = useAdminRole();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isAr = lang === "ar";
  const isImpersonating = isImpersonationSession();

  const navItems = [
    { label: { ar: "لوحة التحكم", en: "Dashboard" }, href: "/crm/dashboard", icon: Gauge },
    { label: { ar: "استعراض الفرص", en: "Opportunities" }, href: "/crm/browse", icon: Compass },
    { label: { ar: "طلباتي", en: "My Requests" }, href: "/crm/my-requests", icon: Send },
    { label: { ar: "الصفقات", en: "Deals" }, href: "/crm/deals", icon: HandCoins },
    { label: { ar: "الإعدادات", en: "Settings" }, href: "/crm/settings", icon: SlidersHorizontal },
  ];

  return (
    <div
      className="flex min-h-screen bg-[#F7F8FA] dark:bg-[#0B1623] text-slate-900 dark:text-slate-100"
      dir={isAr ? "rtl" : "ltr"}
    >
      <CommandPalette role="developer" onSignOut={signOut} />
      <CrmSidebar />

      {/* Mobile drawer */}
      <MobileNavOverlay
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        accent="blue"
        userLabel={fullName || "Developer"}
        roleLabel={isAr ? "مطور عقاري" : "Developer"}
        avatarUrl={avatarUrl}
        onSignOut={signOut}
        onBackToAdmin={isImpersonating ? () => window.close() : undefined}
        showAdminBack={isImpersonating}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — glass */}
        <header className="sticky top-0 z-30 flex h-[56px] lg:h-[62px] items-center justify-between bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-white/10 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden h-9 w-9 rounded-xl bg-[#2B4C66]/5 hover:bg-[#2B4C66]/10 text-[#1E374B] dark:bg-white/5 dark:text-white flex items-center justify-center transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" strokeWidth={2} />
            </button>
            {/* Mobile logo */}
            <Link to="/crm/dashboard" className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt="SINA" className="h-7 w-auto object-contain dark:brightness-0 dark:invert" />
            </Link>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2">
            <ThemeToggle />
            <Link
              to="/crm/settings"
              className="hidden sm:flex h-9 w-9 rounded-full items-center justify-center text-slate-400 hover:text-[#2B4C66] hover:bg-[#2B4C66]/10 dark:hover:bg-white/5 transition-colors"
              title={isAr ? "الإعدادات" : "Settings"}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <NotificationDropdown />
            <UserAvatarMenu variant="blue" settingsPath="/crm/settings" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6 py-4 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CrmLayout;
