import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu, LayoutDashboard, Landmark, FileText, Handshake, Settings,
} from "lucide-react";
import OwnerSidebar from "./OwnerSidebar";
import NotificationDropdown from "@/components/crm/NotificationDropdown";
import UserAvatarMenu from "@/components/shared/UserAvatarMenu";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import CommandPalette from "@/components/dashboard/CommandPalette";
import MobileNavOverlay from "@/components/dashboard/MobileNavOverlay";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { isImpersonationSession } from "@/integrations/supabase/impersonateClient";
import logoImg from "@/assets/logo.png";

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const { fullName } = useUserProfile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isAr = lang === "ar";
  const isImpersonating = isImpersonationSession();

  const navItems = [
    { label: { ar: "لوحة التحكم", en: "Dashboard" }, href: "/owner/dashboard", icon: LayoutDashboard },
    { label: { ar: "أراضيي", en: "My Lands" }, href: "/owner/lands", icon: Landmark },
    { label: { ar: "طلبات الشراكة", en: "Requests" }, href: "/owner/requests", icon: FileText },
    { label: { ar: "صفقاتي", en: "My Deals" }, href: "/owner/deals", icon: Handshake },
    { label: { ar: "الإعدادات", en: "Settings" }, href: "/owner/settings", icon: Settings },
  ];

  return (
    <div
      className="flex min-h-screen bg-[#F7F8FA] dark:bg-[#0B1623] text-slate-900 dark:text-slate-100"
      dir={isAr ? "rtl" : "ltr"}
    >
      <CommandPalette role="owner" onSignOut={signOut} />
      <OwnerSidebar />

      {/* Mobile drawer */}
      <MobileNavOverlay
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        accent="gold"
        userLabel={fullName || "Owner"}
        roleLabel={isAr ? "مالك أرض" : "Land Owner"}
        onSignOut={signOut}
        onBackToAdmin={isImpersonating ? () => window.close() : undefined}
        showAdminBack={isImpersonating}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — glass */}
        <header className="sticky top-0 z-30 flex h-[56px] lg:h-[62px] items-center justify-between bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-white/10 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden h-9 w-9 rounded-xl bg-[#C2A86B]/10 hover:bg-[#C2A86B]/20 text-[#A88A4A] dark:text-[#D7C084] flex items-center justify-center transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" strokeWidth={2} />
            </button>
            <Link to="/owner/dashboard" className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt="SINA" className="h-7 w-auto object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2.5">
            <ThemeToggle />
            <NotificationDropdown />
            <UserAvatarMenu variant="gold" settingsPath="/owner/settings" />
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

export default OwnerLayout;
