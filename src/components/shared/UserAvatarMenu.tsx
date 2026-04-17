import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { isImpersonationSession } from "@/integrations/supabase/impersonateClient";
import { User, Settings, LogOut, Shield } from "lucide-react";

interface Props {
  /** Color scheme: "blue" for CRM, "gold" for Owner */
  variant?: "blue" | "gold";
  settingsPath?: string;
}

const UserAvatarMenu: React.FC<Props> = ({ variant = "blue", settingsPath }) => {
  const { signOut } = useAuth();
  const { fullName, email, initial } = useUserProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isImpersonating = isImpersonationSession();

  const colors = variant === "gold"
    ? { bg: "bg-[#C2A86B]/15", bgHover: "hover:bg-[#C2A86B]/25", text: "text-[#C2A86B]" }
    : { bg: "bg-[#2B4C66]/10", bgHover: "hover:bg-[#2B4C66]/15", text: "text-[#2B4C66]" };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSignOut = async () => {
    if (isImpersonating) {
      // Just close the tab for impersonation sessions
      window.close();
      return;
    }
    await signOut();
    navigate("/auth/login", { replace: true });
  };

  const handleBackToAdmin = () => {
    // Close the impersonation tab — admin is still logged in on the original tab
    window.close();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className={`h-8 w-8 rounded-full ${colors.bg} flex items-center justify-center transition-colors ${colors.bgHover} cursor-pointer`}
      >
        <span className={`text-[11px] font-semibold ${colors.text}`}>{initial}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 end-0 w-64 rounded-xl border border-gray-200/80 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-sm font-semibold text-gray-800 truncate">{fullName}</p>
            <p className="text-[11px] text-gray-400 truncate" dir="ltr">{email}</p>
            {isImpersonating && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-medium text-amber-600">
                  {isAr ? "جلسة مراقبة من الأدمن" : "Admin impersonation session"}
                </span>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {settingsPath && !isImpersonating && (
              <button
                onClick={() => { setOpen(false); navigate(settingsPath); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Settings className="h-4 w-4" strokeWidth={1.5} />
                {isAr ? "الإعدادات" : "Settings"}
              </button>
            )}

            {isImpersonating && (
              <button
                onClick={handleBackToAdmin}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2B4C66] hover:bg-[#2B4C66]/5 transition-colors font-medium"
              >
                <Shield className="h-4 w-4" strokeWidth={1.5} />
                {isAr ? "العودة للوحة الأدمن" : "Back to Admin Panel"}
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              {isImpersonating
                ? (isAr ? "إغلاق هذا التبويب" : "Close this tab")
                : (isAr ? "تسجيل الخروج" : "Sign Out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatarMenu;
