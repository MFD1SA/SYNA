import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { isImpersonationSession } from "@/integrations/supabase/impersonateClient";
import { Settings, LogOut, Shield } from "lucide-react";

interface Props {
  /** Color scheme: "blue" for CRM, "gold" for Owner */
  variant?: "blue" | "gold";
  settingsPath?: string;
}

const UserAvatarMenu: React.FC<Props> = ({ variant = "blue", settingsPath }) => {
  const { signOut } = useAuth();
  const { fullName, email, initial, avatarUrl, loading } = useUserProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isImpersonating = isImpersonationSession();

  // Reset image state when avatar URL changes
  useEffect(() => {
    setImgLoaded(false);
    setImgFailed(false);
  }, [avatarUrl]);

  const colors = variant === "gold"
    ? { bg: "bg-[#C2A86B]/15 dark:bg-[#C2A86B]/25", bgHover: "hover:bg-[#C2A86B]/25 dark:hover:bg-[#C2A86B]/35", text: "text-[#A88A4A] dark:text-[#D7C084]", ring: "ring-[#C2A86B]/30" }
    : { bg: "bg-[#2B4C66]/10 dark:bg-[#2B4C66]/30", bgHover: "hover:bg-[#2B4C66]/15 dark:hover:bg-[#2B4C66]/40", text: "text-[#2B4C66] dark:text-[#7FA7C4]", ring: "ring-[#2B4C66]/25" };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSignOut = async () => {
    if (isImpersonating) { window.close(); return; }
    await signOut();
    navigate("/auth/login", { replace: true });
  };

  const handleBackToAdmin = () => window.close();

  // Show the initial only when: loading is done AND (no avatar URL OR image failed to load)
  const shouldShowInitial = !loading && (!avatarUrl || imgFailed);
  // Show image when URL exists AND it loaded AND didn't fail
  const shouldShowImage = !!avatarUrl && imgLoaded && !imgFailed;

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative h-9 w-9 rounded-full ${colors.bg} ${colors.bgHover} ring-1 ${colors.ring} flex items-center justify-center transition-all cursor-pointer overflow-hidden`}
        aria-label="User menu"
      >
        {/* Avatar image (if available) */}
        {avatarUrl && !imgFailed && (
          <img
            src={avatarUrl}
            alt={fullName}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
          />
        )}

        {/* Loading shimmer (while we're checking profile OR while img is loading) */}
        {(loading || (avatarUrl && !imgLoaded && !imgFailed)) && (
          <div className={`absolute inset-0 ${colors.bg} animate-pulse`} />
        )}

        {/* Initial letter — only when no image */}
        {shouldShowInitial && (
          <span className={`text-[12px] font-bold ${colors.text}`}>{initial}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 end-0 w-64 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center gap-3">
            <div className={`relative shrink-0 h-10 w-10 rounded-full overflow-hidden ${colors.bg} flex items-center justify-center`}>
              {shouldShowImage ? (
                <img src={avatarUrl!} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <span className={`text-[13px] font-bold ${colors.text}`}>{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-gray-800 dark:text-white truncate">{fullName}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-400 truncate" dir="ltr">{email}</p>
              {isImpersonating && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-amber-600">
                    {isAr ? "جلسة مراقبة" : "Impersonation"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {settingsPath && !isImpersonating && (
              <button
                onClick={() => { setOpen(false); navigate(settingsPath); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" strokeWidth={1.7} />
                {isAr ? "الإعدادات" : "Settings"}
              </button>
            )}

            {isImpersonating && (
              <button
                onClick={handleBackToAdmin}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#2B4C66] dark:text-[#7FA7C4] hover:bg-[#2B4C66]/5 dark:hover:bg-white/5 transition-colors font-semibold"
              >
                <Shield className="h-4 w-4" strokeWidth={1.7} />
                {isAr ? "العودة للوحة الأدمن" : "Back to Admin Panel"}
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.7} />
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
