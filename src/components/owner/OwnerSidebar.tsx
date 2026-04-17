import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { isImpersonationSession } from "@/integrations/supabase/impersonateClient";
import {
  LayoutDashboard, Landmark, FileText, Handshake, Settings,
  Globe, LogOut, ChevronLeft, ChevronRight, ShieldCheck, X,
} from "lucide-react";
import NotificationDropdown from "@/components/crm/NotificationDropdown";
import logoImg from "@/assets/logo.png";

interface NavItem {
  label: { ar: string; en: string };
  href: string;
  icon: React.ElementType;
}

const OwnerSidebar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
  const { fullName, initial } = useUserProfile();
  const { isAdmin: isAdminUser } = useAdminRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isAr = lang === "ar";
  const isImpersonating = isImpersonationSession();

  const handleSignOut = async () => {
    if (isImpersonating) {
      // Impersonation tab: just close it — admin is still logged in on the original tab
      window.close();
      return;
    }
    await signOut();
    navigate("/");
  };

  const handleBackToAdmin = () => {
    // Close this impersonation tab — admin session is preserved in the original tab
    window.close();
  };

  const CollapseIcon = isAr
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  const navItems: NavItem[] = [
    { label: { ar: "لوحة التحكم", en: "Dashboard" }, href: "/owner/dashboard", icon: LayoutDashboard },
    { label: { ar: "أراضيي", en: "My Lands" }, href: "/owner/lands", icon: Landmark },
    { label: { ar: "طلبات الشراكة", en: "Requests" }, href: "/owner/requests", icon: FileText },
    { label: { ar: "صفقاتي", en: "My Deals" }, href: "/owner/deals", icon: Handshake },
    { label: { ar: "الإعدادات", en: "Settings" }, href: "/owner/settings", icon: Settings },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-e border-white/70 dark:border-white/5 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div className={`flex h-[62px] items-center border-b border-white/60 dark:border-white/5 ${collapsed ? "justify-center px-2" : "justify-between px-6"}`}>
        <Link to="/owner/dashboard" className="flex items-center gap-2.5">
          <img src={logoImg} alt="SINA" className={`${collapsed ? "h-5" : "h-7"} w-auto object-contain`} />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-300 hover:text-[#2B4C66] hover:bg-[#2B4C66]/5 transition-all duration-200"
            >
              <CollapseIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -end-3 top-[26px] h-6 w-6 flex items-center justify-center rounded-full bg-white border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-gray-400 hover:text-[#2B4C66] hover:border-[#2B4C66]/20 transition-all duration-200 z-10"
            >
              <CollapseIcon className="h-3 w-3" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* User info + Role badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-3 flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#C2A86B]/[0.12] to-[#C2A86B]/[0.04] dark:from-[#C2A86B]/25 dark:to-[#C2A86B]/10 border border-[#C2A86B]/20 dark:border-[#C2A86B]/20 px-3 py-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#C2A86B]/20 dark:bg-[#C2A86B]/30 flex items-center justify-center shrink-0">
            <Landmark className="h-4 w-4 text-[#A88A4A] dark:text-[#D7C084]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[#1E374B] dark:text-white truncate">{fullName || "Owner"}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{isAr ? "مالك أرض" : "Land Owner"}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={collapsed ? (isAr ? item.label.ar : item.label.en) : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#C2A86B]/[0.18] to-[#C2A86B]/[0.05] text-[#A88A4A] dark:text-[#D7C084] dark:from-[#C2A86B]/30 dark:to-[#C2A86B]/10 font-semibold shadow-[0_2px_8px_-4px_rgba(194,168,107,0.25)]"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-[#1E374B] dark:hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {isActive && !collapsed && (
                  <span className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[#C2A86B]" />
                )}
                <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-[#A88A4A] dark:text-[#D7C084]" : ""}`} strokeWidth={1.5} />
                {!collapsed && (
                  <span className="truncate">{isAr ? item.label.ar : item.label.en}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Impersonation banner + Back to Admin button */}
      {isImpersonating && !collapsed && (
        <div className="border-t border-amber-200/60 mx-3 px-3 pt-3 pb-2 bg-amber-50/40 mt-2 rounded-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700">
              {isAr ? "جلسة مراقبة" : "IMPERSONATION"}
            </p>
          </div>
          <button
            onClick={handleBackToAdmin}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-[#2B4C66] font-medium bg-white border border-[#2B4C66]/20 transition-colors hover:bg-[#2B4C66]/5"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{isAr ? "العودة للوحة الأدمن" : "Back to Admin Panel"}</span>
          </button>
        </div>
      )}

      {/* Admin back link (for actual admins browsing owner pages directly) */}
      {isAdminUser && !isImpersonating && !collapsed && (
        <div className="border-t border-gray-200/60 mx-3 px-3 pt-3 pb-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            {isAr ? "البوابات" : "PORTALS"}
          </p>
          <Link to="/admincp/overview" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
            <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{isAr ? "العودة للإدارة" : "Back to Admin"}</span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-0.5 border-t border-white/60 dark:border-white/5 p-3">
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-500 dark:text-slate-400 transition-colors hover:bg-white/60 dark:hover:bg-white/5 hover:text-[#1E374B] dark:hover:text-white"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "English" : "العربية")}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-rose-500/80 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600"
          title={isImpersonating ? (isAr ? "إغلاق التبويب" : "Close tab") : undefined}
        >
          {isImpersonating ? <X className="h-4 w-4 shrink-0" strokeWidth={1.5} /> : <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />}
          {!collapsed && (isImpersonating
            ? (isAr ? "إغلاق التبويب" : "Close Tab")
            : (isAr ? "خروج" : "Logout"))}
        </button>
      </div>
    </aside>
  );
};

export default OwnerSidebar;
