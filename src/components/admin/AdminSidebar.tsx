import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Landmark, HardHat, Handshake, FileText,
  Bot, Globe, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
  MapPin, History,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

interface NavItem {
  label: { ar: string; en: string };
  href: string;
  icon: React.ElementType;
}

const AdminSidebar: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
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
    { label: { ar: "نظرة عامة", en: "Overview" }, href: "/admincp/overview", icon: LayoutDashboard },
    { label: { ar: "إدارة الأراضي", en: "Manage Lands" }, href: "/admincp/lands", icon: Landmark },
    { label: { ar: "إدارة الملاك", en: "Manage Owners" }, href: "/admincp/owners", icon: MapPin },
    { label: { ar: "إدارة المطورين", en: "Manage Developers" }, href: "/admincp/developers", icon: HardHat },
    { label: { ar: "الطلبات والصفقات", en: "Requests & Deals" }, href: "/admincp/deals", icon: Handshake },
    { label: { ar: "المساعد الذكي", en: "AI Assistant" }, href: "/admincp/ai", icon: Bot },
    { label: { ar: "إدارة المحتوى", en: "Content" }, href: "/admincp/content", icon: FileText },
    { label: { ar: "سجل العمليات", en: "Audit Log" }, href: "/admincp/audit", icon: History },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-e border-border/60 bg-card transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="DOMA" className="h-6 w-6 rounded-lg object-contain" />
            <span className="text-base font-medium text-foreground">DOMA</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-7 w-7 shrink-0 text-muted-foreground">
          <CollapseIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-medium text-primary">
            {isAr ? "مدير النظام" : "Super Admin"}
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
                    ? "bg-primary/10 text-primary doma-shadow"
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

export default AdminSidebar;
