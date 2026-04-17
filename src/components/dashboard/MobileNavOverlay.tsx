import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Globe, LogOut, Sun, Moon, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface NavItem {
  label: { ar: string; en: string };
  href: string;
  icon: React.ElementType;
}

interface Props {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  accent?: "blue" | "gold";
  userLabel?: string;
  roleLabel?: string;
  onSignOut?: () => void;
  onBackToAdmin?: () => void;
  showAdminBack?: boolean;
}

/**
 * Full-screen mobile navigation drawer for dashboard layouts.
 * Animated slide-in from the start (RTL-aware), scroll lock when open.
 */
export const MobileNavOverlay: React.FC<Props> = ({
  open,
  onClose,
  navItems,
  accent = "blue",
  userLabel,
  roleLabel,
  onSignOut,
  onBackToAdmin,
  showAdminBack,
}) => {
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isAr = lang === "ar";
  const isGold = accent === "gold";

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "lg:hidden fixed inset-0 z-[70] transition-all duration-300",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-[86%] max-w-[340px] bg-white dark:bg-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.35)] transition-transform duration-300 overflow-y-auto",
          isAr ? "end-0" : "start-0",
          open
            ? "translate-x-0"
            : isAr ? "translate-x-full" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn(
          "relative px-5 py-6 overflow-hidden",
          isGold
            ? "bg-gradient-to-br from-[#C2A86B] via-[#A88A4A] to-[#8A6F3B]"
            : "bg-gradient-to-br from-[#2B4C66] via-[#1E374B] to-[#0F1F2E]"
        )}>
          {/* Decorative blob */}
          <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 start-0 w-48 h-48 rounded-full bg-white/5 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 end-4 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* User */}
          <div className="relative flex items-center gap-3 mt-1">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white text-[18px] font-bold">
              {userLabel?.slice(0, 1).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-white truncate">
                {userLabel || (isAr ? "المستخدم" : "User")}
              </p>
              <p className="text-[11px] text-white/70 font-medium">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="px-4 py-4">
          <p className="px-2 mb-2 text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 dark:text-slate-500">
            {isAr ? "التنقل" : "Navigation"}
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                    isActive
                      ? isGold
                        ? "bg-gradient-to-r from-[#C2A86B]/20 to-[#C2A86B]/5 text-[#A88A4A] dark:text-[#D7C084] font-bold"
                        : "bg-gradient-to-r from-[#2B4C66]/15 to-[#2B4C66]/5 text-[#1E374B] dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <span className={cn(
                      "absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full",
                      isGold ? "bg-[#C2A86B]" : "bg-[#2B4C66]"
                    )} />
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl",
                      isActive
                        ? isGold
                          ? "bg-gradient-to-br from-[#C2A86B] to-[#A88A4A] text-white"
                          : "bg-gradient-to-br from-[#2B4C66] to-[#1E374B] text-white"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <item.icon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <span className="text-[14px] flex-1">
                    {isAr ? item.label.ar : item.label.en}
                  </span>
                  {isActive && (
                    <div className={cn("w-1.5 h-1.5 rounded-full", isGold ? "bg-[#C2A86B]" : "bg-[#2B4C66]")} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

        {/* Preferences */}
        <div className="px-4 py-4">
          <p className="px-2 mb-2 text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 dark:text-slate-500">
            {isAr ? "التفضيلات" : "Preferences"}
          </p>
          <div className="space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5">
                {theme === "dark"
                  ? <Sun className="w-4 h-4 text-[#C2A86B]" strokeWidth={1.8} />
                  : <Moon className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.8} />}
              </div>
              <span className="text-[13.5px]">
                {theme === "dark"
                  ? (isAr ? "الوضع الفاتح" : "Light mode")
                  : (isAr ? "الوضع الداكن" : "Dark mode")}
              </span>
            </button>
            <button
              onClick={toggleLang}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5">
                <Globe className="w-4 h-4 text-[#2B4C66] dark:text-[#7FA7C4]" strokeWidth={1.8} />
              </div>
              <span className="text-[13.5px]">
                {isAr ? "English" : "العربية"}
              </span>
            </button>
          </div>
        </div>

        {showAdminBack && onBackToAdmin && (
          <>
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
            <div className="px-4 py-4">
              <button
                onClick={onBackToAdmin}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white">
                  <ShieldCheck className="w-4 h-4 text-amber-600" strokeWidth={1.8} />
                </div>
                <span className="text-[13px] flex-1 text-start">
                  {isAr ? "العودة للوحة الإدمن" : "Back to Admin Panel"}
                </span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </>
        )}

        {onSignOut && (
          <div className="px-4 py-4 mt-auto">
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-rose-500/90 font-semibold hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10">
                <LogOut className="w-4 h-4 text-rose-500" strokeWidth={1.8} />
              </div>
              <span className="text-[13.5px]">
                {isAr ? "تسجيل الخروج" : "Sign out"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNavOverlay;
