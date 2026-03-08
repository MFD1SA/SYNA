import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Search, FileText, Handshake,
  Settings, Globe, LogOut, ChevronLeft, ChevronRight, HardHat,
} from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import logoImg from "@/assets/logo.png";

interface NavItem {
  label: { ar: string; en: string };
  href: string;
  icon: React.ElementType;
}

const CrmSidebar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
  const { tenantName } = useTenant();
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
    { label: { ar: "لوحة التحكم", en: "Dashboard" }, href: "/crm/dashboard", icon: LayoutDashboard },
    { label: { ar: "استعراض الفرص", en: "Browse Opportunities" }, href: "/crm/browse", icon: Search },
    { label: { ar: "طلباتي", en: "My Requests" }, href: "/crm/my-requests", icon: FileText },
    { label: { ar: "الصفقات", en: "Deals" }, href: "/crm/deals", icon: Handshake },
    { label: { ar: "الإعدادات", en: "Settings" }, href: "/crm/settings", icon: Settings },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-e border-border/60 bg-card transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-3">
        <Link to="/crm/dashboard" className="flex items-center gap-1.5">
          <img src={logoImg} alt="SYNA" className="h-11 w-11 object-contain" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-medium text-foreground">SYNA</span>
              {tenantName && (
                <span className="truncate text-[10px] font-light text-muted-foreground">
                  {tenantName}
                </span>
              )}
            </div>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-7 w-7 shrink-0 text-muted-foreground">
              <CollapseIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-lg border border-border/40 px-3 py-1.5">
          <HardHat className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-light text-muted-foreground">
            {isAr ? "مطور عقاري" : "Developer"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary syna-shadow"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                {!collapsed && (
                  <span className="font-light">{isAr ? item.label.ar : item.label.en}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-border/60 p-3">
        {!collapsed && (
          <p className="truncate px-3 py-1 text-xs font-light text-muted-foreground">
            {user?.email}
          </p>
        )}
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "English" : "العربية")}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "خروج" : "Logout")}
        </button>
      </div>
    </aside>
  );
};

export default CrmSidebar;
