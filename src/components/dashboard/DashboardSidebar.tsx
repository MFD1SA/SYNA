import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  FileText,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface NavItem {
  label: string;
  labelEn: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "نظرة عامة", labelEn: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "المشاريع", labelEn: "Projects", href: "/dashboard/projects", icon: Building2 },
  { label: "الوحدات", labelEn: "Units", href: "/dashboard/units", icon: DoorOpen },
  { label: "العقود", labelEn: "Leases", href: "/dashboard/leases", icon: FileText },
];

const DashboardSidebar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const CollapseIcon = lang === "ar" ? (collapsed ? ChevronLeft : ChevronRight) : (collapsed ? ChevronRight : ChevronLeft);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-e border-border bg-sidebar-background transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <span className="text-lg font-medium text-sidebar-primary">DOMA</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          <CollapseIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="font-light">{lang === "ar" ? item.label : item.labelEn}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-sidebar-border p-2">
        {!collapsed && (
          <p className="truncate px-3 py-1 text-xs font-light text-muted-foreground">{user?.email}</p>
        )}
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && t.nav.language}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-destructive hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (lang === "ar" ? "خروج" : "Logout")}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
