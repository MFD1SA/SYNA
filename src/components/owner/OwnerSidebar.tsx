import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  LayoutDashboard, Landmark, FileText, Handshake, Settings,
  Globe, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
      className={`sticky top-0 flex h-screen flex-col bg-white border-e border-gray-200/80 transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-[250px]"
      }`}
    >
      {/* Header */}
      <div className={`flex h-[60px] items-center border-b border-gray-100 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <Link to="/owner/dashboard" className="flex items-center gap-2">
          <img src={logoImg} alt="SINA" className={`${collapsed ? "h-5" : "h-6"} w-auto object-contain`} />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <CollapseIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -end-3 top-[22px] h-6 w-6 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <CollapseIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* User info + Role badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-2 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Landmark className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-gray-700 truncate">{fullName || "Owner"}</p>
            <p className="text-[10px] text-gray-400">{isAr ? "مالك أرض" : "Land Owner"}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 mt-1">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={collapsed ? (isAr ? item.label.ar : item.label.en) : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all ${
                  isActive
                    ? "bg-[#2B4C66]/[0.08] text-[#2B4C66] font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-[#2B4C66]" : ""}`} strokeWidth={1.5} />
                {!collapsed && (
                  <span className="truncate">{isAr ? item.label.ar : item.label.en}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin back link */}
      {isAdminUser && !collapsed && (
        <div className="border-t border-gray-100 mx-3 px-3 pt-2">
          <Link to="/admincp/overview" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-[#2B4C66] transition-colors hover:bg-[#2B4C66]/5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span>{isAr ? "العودة للإدارة" : "Back to Admin"}</span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-0.5 border-t border-gray-100 p-3">
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "English" : "العربية")}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "خروج" : "Logout")}
        </button>
      </div>
    </aside>
  );
};

export default OwnerSidebar;
