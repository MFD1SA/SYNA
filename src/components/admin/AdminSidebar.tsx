import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  LayoutDashboard, Landmark, HardHat, Handshake,
  Globe, LogOut, ChevronLeft, ChevronRight, Gift,
  MapPin, History, Users, Settings, FileText, ExternalLink,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

interface NavGroup {
  label: { ar: string; en: string };
  items: { label: { ar: string; en: string }; href: string; icon: React.ElementType }[];
}

const AdminSidebar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
  const { fullName, initial } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isAr = lang === "ar";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const CollapseIcon = collapsed ? (isAr ? ChevronLeft : ChevronRight) : (isAr ? ChevronRight : ChevronLeft);

  const navGroups: NavGroup[] = [
    {
      label: { ar: "الرئيسية", en: "MAIN" },
      items: [
        { label: { ar: "نظرة عامة", en: "Overview" }, href: "/admincp/overview", icon: LayoutDashboard },
      ],
    },
    {
      label: { ar: "إدارة الأعمال", en: "OPERATIONS" },
      items: [
        { label: { ar: "الأراضي", en: "Lands" }, href: "/admincp/lands", icon: Landmark },
        { label: { ar: "الملاك", en: "Owners" }, href: "/admincp/owners", icon: MapPin },
        { label: { ar: "المطورون", en: "Developers" }, href: "/admincp/developers", icon: HardHat },
        { label: { ar: "الصفقات", en: "Deals" }, href: "/admincp/deals", icon: Handshake },
      ],
    },
    {
      label: { ar: "الأدوات", en: "TOOLS" },
      items: [
        { label: { ar: "العروض العقارية", en: "Offers" }, href: "/admincp/offers", icon: Gift },
        { label: { ar: "المحتوى", en: "Content" }, href: "/admincp/content", icon: FileText },
      ],
    },
    {
      label: { ar: "النظام", en: "SYSTEM" },
      items: [
        { label: { ar: "سجل العمليات", en: "Audit Log" }, href: "/admincp/audit", icon: History },
        { label: { ar: "فريق الإدارة", en: "Team" }, href: "/admincp/team", icon: Users },
        { label: { ar: "الإعدادات", en: "Settings" }, href: "/admincp/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col bg-white border-e border-gray-200/80 transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-[250px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex h-[60px] items-center border-b border-gray-200/60 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <Link to="/admincp/overview" className="flex items-center">
          <img src={logoImg} alt="SINA" className={`${collapsed ? "h-5" : "h-6"} w-auto object-contain`} />
        </Link>
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

      {/* User info */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-3 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-[#2B4C66]/10 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-[#2B4C66]">
              {initial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-gray-700 truncate">{fullName || "Admin"}</p>
            <p className="text-[10px] text-gray-400">{isAr ? "مدير النظام" : "Administrator"}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                {isAr ? group.label.ar : group.label.en}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
          </div>
        ))}
      </nav>

      {/* Portal shortcuts */}
      {!collapsed && (
        <div className="border-t border-gray-200/60 mx-3 px-3 pt-3 pb-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            {isAr ? "البوابات" : "PORTALS"}
          </p>
          <Link to="/crm/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
            <HardHat className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 truncate">{isAr ? "لوحة المطور" : "Developer"}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-gray-300" />
          </Link>
          <Link to="/owner/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
            <Landmark className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 truncate">{isAr ? "لوحة المالك" : "Owner"}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-gray-300" />
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-0.5 border-t border-gray-200/60 p-3">
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

export default AdminSidebar;
