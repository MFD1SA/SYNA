import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Landmark, HardHat, Handshake,
  Bot, Globe, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
  MapPin, History, Users, Settings, FileText,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

interface NavGroup {
  label: { ar: string; en: string };
  items: { label: { ar: string; en: string }; href: string; icon: React.ElementType; badge?: number }[];
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

  const navGroups: NavGroup[] = [
    {
      label: { ar: "الرئيسية", en: "Main" },
      items: [
        { label: { ar: "نظرة عامة", en: "Overview" }, href: "/admincp/overview", icon: LayoutDashboard },
      ],
    },
    {
      label: { ar: "إدارة الأعمال", en: "Operations" },
      items: [
        { label: { ar: "الأراضي", en: "Lands" }, href: "/admincp/lands", icon: Landmark },
        { label: { ar: "الملاك", en: "Owners" }, href: "/admincp/owners", icon: MapPin },
        { label: { ar: "المطورون", en: "Developers" }, href: "/admincp/developers", icon: HardHat },
        { label: { ar: "الصفقات", en: "Deals" }, href: "/admincp/deals", icon: Handshake },
      ],
    },
    {
      label: { ar: "الأدوات", en: "Tools" },
      items: [
        { label: { ar: "المساعد الذكي", en: "AI Assistant" }, href: "/admincp/ai", icon: Bot },
        { label: { ar: "المحتوى", en: "Content" }, href: "/admincp/content", icon: FileText },
      ],
    },
    {
      label: { ar: "النظام", en: "System" },
      items: [
        { label: { ar: "سجل العمليات", en: "Audit Log" }, href: "/admincp/audit", icon: History },
        { label: { ar: "فريق الإدارة", en: "Team" }, href: "/admincp/team", icon: Users },
        { label: { ar: "الإعدادات", en: "Settings" }, href: "/admincp/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-e border-border/60 bg-card transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-3">
        <Link to="/admincp/overview" className="flex items-center gap-1.5">
          <img src={logoImg} alt="SYNA" className="h-11 w-11 object-contain" />
          {!collapsed && <span className="text-sm font-medium text-foreground">SYNA</span>}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 shrink-0 text-muted-foreground"
          >
            <CollapseIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg bg-primary/8 px-2.5 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-[11px] font-medium text-primary">
            {isAr ? "مدير النظام" : "Super Admin"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {navGroups.flatMap(g => g.items).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={collapsed ? (isAr ? item.label.ar : item.label.en) : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                {!collapsed && (
                  <span className="truncate">{isAr ? item.label.ar : item.label.en}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-border/60 p-2">
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "English" : "العربية")}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && (isAr ? "خروج" : "Logout")}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
