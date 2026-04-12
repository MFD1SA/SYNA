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
      className={`sticky top-0 flex h-screen flex-col bg-[#FCFCFD] border-e border-gray-200/60 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex h-[64px] items-center border-b border-gray-200/40 ${collapsed ? "justify-center px-2" : "justify-between px-6"}`}>
        <Link to="/admincp/overview" className="flex items-center gap-2.5">
          <img src={logoImg} alt="SINA" className={`${collapsed ? "h-5" : "h-7"} w-auto object-contain`} />
        </Link>
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

      {/* User info */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#2B4C66]/[0.04] to-[#C2A86B]/[0.04] border border-[#2B4C66]/[0.06] px-3.5 py-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2B4C66] to-[#1E374B] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[11px] font-semibold text-white">
              {initial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-[#1E374B] truncate">{fullName || "Admin"}</p>
            <p className="text-[10px] text-[#C2A86B] font-medium">{isAr ? "مدير النظام" : "Administrator"}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-6" : ""}>
            {!collapsed && gi > 0 && (
              <div className="mx-3 mb-3 h-px bg-gradient-to-e from-gray-200/60 via-gray-200/30 to-transparent" />
            )}
            {!collapsed && (
              <p className="px-3 mb-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400/80">
                {isAr ? group.label.ar : group.label.en}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-2 mb-2 h-px bg-gray-200/40" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={collapsed ? (isAr ? item.label.ar : item.label.en) : undefined}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 ${
                      isActive
                        ? "bg-[#2B4C66]/[0.07] text-[#2B4C66] font-semibold shadow-[0_1px_2px_rgba(43,76,102,0.04)]"
                        : "text-gray-500 hover:bg-[#2B4C66]/[0.03] hover:text-[#1E374B]"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    {isActive && (
                      <span className="absolute start-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-e-full bg-[#C2A86B]" />
                    )}
                    <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${isActive ? "text-[#2B4C66]" : ""}`} strokeWidth={1.5} />
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
        <div className="border-t border-gray-200/40 mx-3 px-1 pt-3 pb-1">
          <p className="px-3 mb-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400/80">
            {isAr ? "البوابات" : "PORTALS"}
          </p>
          <Link to="/crm/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12.5px] text-gray-500 transition-all duration-200 hover:bg-[#C2A86B]/[0.06] hover:text-[#1E374B] group">
            <HardHat className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 truncate">{isAr ? "لوحة المطور" : "Developer"}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-gray-300 group-hover:text-[#C2A86B] transition-colors" strokeWidth={1.5} />
          </Link>
          <Link to="/owner/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12.5px] text-gray-500 transition-all duration-200 hover:bg-[#C2A86B]/[0.06] hover:text-[#1E374B] group">
            <Landmark className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 truncate">{isAr ? "لوحة المالك" : "Owner"}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-gray-300 group-hover:text-[#C2A86B] transition-colors" strokeWidth={1.5} />
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-0.5 border-t border-gray-200/40 p-3">
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-gray-500 transition-all duration-200 hover:bg-[#2B4C66]/[0.04] hover:text-[#1E374B]"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "English" : "العربية")}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-gray-400 transition-all duration-200 hover:bg-red-50/60 hover:text-red-500"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "خروج" : "Logout")}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
