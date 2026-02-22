import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Building2, DoorOpen, FileText, Receipt,
  Wrench, BarChart3, Settings, Globe, LogOut,
  ChevronLeft, ChevronRight,
} from "lucide-react";

interface NavItem {
  labelKey: "dashboard" | "properties" | "units" | "leases" | "receivables" | "maintenance" | "reports" | "settings";
  href: string;
  icon: React.ElementType;
}

const navGroups: { items: NavItem[] }[] = [
  {
    items: [
      { labelKey: "dashboard", href: "/crm/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    items: [
      { labelKey: "properties", href: "/crm/properties", icon: Building2 },
      { labelKey: "units", href: "/crm/units", icon: DoorOpen },
      { labelKey: "leases", href: "/crm/leases", icon: FileText },
    ],
  },
  {
    items: [
      { labelKey: "receivables", href: "/crm/receivables", icon: Receipt },
      { labelKey: "maintenance", href: "/crm/maintenance", icon: Wrench },
    ],
  },
  {
    items: [
      { labelKey: "reports", href: "/crm/reports", icon: BarChart3 },
      { labelKey: "settings", href: "/crm/settings", icon: Settings },
    ],
  },
];

const CrmSidebar: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
  const { tenantName } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const CollapseIcon = lang === "ar"
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-e border-border/60 bg-card transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
        {!collapsed && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg doma-gradient">
                <span className="text-xs font-medium text-primary-foreground">D</span>
              </div>
              <span className="text-lg font-medium text-foreground">DOMA</span>
            </div>
            {tenantName && (
              <span className="mt-0.5 truncate text-[11px] font-light text-muted-foreground ps-9">
                {tenantName}
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 shrink-0 text-muted-foreground">
          <CollapseIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-2 h-px bg-border/40" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
                    {!collapsed && (
                      <span className="font-light">{t.crm.nav[item.labelKey]}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-border/60 p-3">
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
          {!collapsed && t.nav.language}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && t.nav.logout}
        </button>
      </div>
    </aside>
  );
};

export default CrmSidebar;
