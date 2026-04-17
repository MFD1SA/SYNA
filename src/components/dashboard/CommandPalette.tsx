import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Gauge, Compass, Send, HandCoins, SlidersHorizontal,
  MapPinned, Inbox, Sun, Moon, Globe, LogOut, Plus,
} from "lucide-react";

interface Props {
  /** "developer" shows dev routes, "owner" shows owner routes */
  role?: "developer" | "owner";
  onSignOut?: () => void;
}

/**
 * ⌘K / Ctrl+K command palette — navigation + quick actions.
 * Pairs with the Bento dashboards. No new deps; uses shadcn CommandDialog.
 */
export const CommandPalette: React.FC<Props> = ({ role = "developer", onSignOut }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = lang === "ar";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const devNav = [
    { label: isAr ? "لوحة التحكم" : "Dashboard", icon: Gauge, href: "/crm/dashboard" },
    { label: isAr ? "استعراض الفرص" : "Browse Opportunities", icon: Compass, href: "/crm/browse" },
    { label: isAr ? "طلباتي" : "My Requests", icon: Send, href: "/crm/my-requests" },
    { label: isAr ? "الصفقات" : "Deals", icon: HandCoins, href: "/crm/deals" },
    { label: isAr ? "الإعدادات" : "Settings", icon: SlidersHorizontal, href: "/crm/settings" },
  ];

  const ownerNav = [
    { label: isAr ? "لوحة التحكم" : "Dashboard", icon: Gauge, href: "/owner/dashboard" },
    { label: isAr ? "أراضيي" : "My Lands", icon: MapPinned, href: "/owner/lands" },
    { label: isAr ? "الطلبات" : "Requests", icon: Inbox, href: "/owner/requests" },
    { label: isAr ? "الصفقات" : "Deals", icon: HandCoins, href: "/owner/deals" },
    { label: isAr ? "الإعدادات" : "Settings", icon: SlidersHorizontal, href: "/owner/settings" },
  ];

  const nav = role === "owner" ? ownerNav : devNav;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={isAr ? "ابحث عن صفحة أو إجراء..." : "Search pages or actions..."} />
      <CommandList>
        <CommandEmpty>{isAr ? "لا توجد نتائج" : "No results found"}</CommandEmpty>

        <CommandGroup heading={isAr ? "التنقل" : "Navigation"}>
          {nav.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon className="me-2 h-4 w-4" strokeWidth={1.6} />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {role === "owner" && (
          <CommandGroup heading={isAr ? "إجراءات" : "Actions"}>
            <CommandItem onSelect={() => go("/owner/lands")}>
              <Plus className="me-2 h-4 w-4" strokeWidth={1.6} />
              {isAr ? "إدراج أرض جديدة" : "Add new land"}
            </CommandItem>
          </CommandGroup>
        )}

        {role === "developer" && (
          <CommandGroup heading={isAr ? "إجراءات" : "Actions"}>
            <CommandItem onSelect={() => go("/crm/browse")}>
              <Compass className="me-2 h-4 w-4" strokeWidth={1.6} />
              {isAr ? "تصفح الفرص الجديدة" : "Browse new opportunities"}
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading={isAr ? "التفضيلات" : "Preferences"}>
          <CommandItem onSelect={() => { setOpen(false); toggleTheme(); }}>
            {theme === "dark"
              ? <Sun className="me-2 h-4 w-4" strokeWidth={1.6} />
              : <Moon className="me-2 h-4 w-4" strokeWidth={1.6} />}
            {theme === "dark"
              ? (isAr ? "الوضع الفاتح" : "Light mode")
              : (isAr ? "الوضع الداكن" : "Dark mode")}
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); toggleLang(); }}>
            <Globe className="me-2 h-4 w-4" strokeWidth={1.6} />
            {isAr ? "English" : "العربية"}
          </CommandItem>
          {onSignOut && (
            <CommandItem onSelect={() => { setOpen(false); onSignOut(); }}>
              <LogOut className="me-2 h-4 w-4" strokeWidth={1.6} />
              {isAr ? "تسجيل الخروج" : "Sign out"}
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
