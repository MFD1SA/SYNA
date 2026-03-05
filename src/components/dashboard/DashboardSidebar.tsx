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
  { label: "لوحة التحكم", labelEn: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
      className={`sticky top-0 flex h-screen flex-col border-e border-border/60 bg-card transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg syna-gradient">
              <span className="text-xs font-medium text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-medium text-foreground">SYNA</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 text-muted-foreground">
          <CollapseIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary doma-shadow"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="font-light">{lang === "ar" ? item.label : item.labelEn}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-border/60 p-3">
        {!collapsed && (
          <p className="truncate px-3 py-1 text-xs font-light text-muted-foreground">{user?.email}</p>
        )}
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && t.nav.language}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (lang === "ar" ? "خروج" : "Logout")}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
