import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  LayoutDashboard, Landmark, HardHat, Handshake,
  Globe, ChevronLeft, ChevronRight, Gift,
  MapPin, History, Users, FileText, Search,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

const AdminSidebar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { fullName, initial, avatarUrl } = useUserProfile();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isAr = lang === "ar";

  const CollapseIcon = collapsed ? (isAr ? ChevronLeft : ChevronRight) : (isAr ? ChevronRight : ChevronLeft);

  const navItems = [
    { label: { ar: "نظرة عامة", en: "Overview" }, href: "/admincp/overview", icon: LayoutDashboard },
    { label: { ar: "الأراضي", en: "Lands" }, href: "/admincp/lands", icon: Landmark },
    { label: { ar: "الملاك", en: "Owners" }, href: "/admincp/owners", icon: MapPin },
    { label: { ar: "المطورون", en: "Developers" }, href: "/admincp/developers", icon: HardHat },
    { label: { ar: "الصفقات", en: "Deals" }, href: "/admincp/deals", icon: Handshake },
    { label: { ar: "العروض", en: "Offers" }, href: "/admincp/offers", icon: Gift },
    { label: { ar: "SEO", en: "SEO" }, href: "/admincp/seo", icon: Search },
    { label: { ar: "سجل العمليات", en: "Audit Log" }, href: "/admincp/audit", icon: History },
    { label: { ar: "فريق الإدارة", en: "Team" }, href: "/admincp/team", icon: Users },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col bg-[#1E374B] transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex h-[64px] items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-6"}`}>
        <Link to="/admincp/overview" className={`flex items-center ${collapsed ? "" : "flex-1 justify-center"}`}>
          <img src={logoImg} alt="SINA" className={`${collapsed ? "h-5" : "h-7"} w-auto object-contain brightness-0 invert`} />
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-all duration-200 shrink-0"
          >
            <CollapseIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -end-3 top-[26px] h-6 w-6 flex items-center justify-center rounded-full bg-[#1E374B] border border-white/20 shadow-md text-white/60 hover:text-white hover:border-white/40 transition-all duration-200 z-10"
          >
            <CollapseIcon className="h-3 w-3" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3.5 py-3">
          <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#C2A86B] flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white">{initial}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-white truncate">{fullName || "Admin"}</p>
            <p className="text-[10px] text-[#C2A86B] font-medium">{isAr ? "مدير النظام" : "Administrator"}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={collapsed ? (isAr ? item.label.ar : item.label.en) : undefined}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.12] text-white font-semibold"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <span className="absolute start-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-e-full bg-[#C2A86B]" />
                )}
                <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${isActive ? "text-white" : ""}`} strokeWidth={1.5} />
                {!collapsed && (
                  <span className="truncate">{isAr ? item.label.ar : item.label.en}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer — language toggle only */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={toggleLang}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
        >
          <Globe className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>{isAr ? "English" : "العربية"}</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
