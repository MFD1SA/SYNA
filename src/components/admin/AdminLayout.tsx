import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Search, X, Check, Loader2, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  type: "land" | "owner" | "developer" | "deal";
  label: string;
  sub: string;
  href: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string;
}

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { user, signOut } = useAuth();
  const { initial, fullName, avatarUrl } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const isAr = lang === "ar";

  // Page title mapping for breadcrumb
  const pageTitles: Record<string, { ar: string; en: string }> = {
    "/admincp/overview": { ar: "نظرة عامة", en: "Overview" },
    "/admincp/lands": { ar: "الأراضي", en: "Lands" },
    "/admincp/owners": { ar: "الملاك", en: "Owners" },
    "/admincp/developers": { ar: "المطورون", en: "Developers" },
    "/admincp/deals": { ar: "الصفقات", en: "Deals" },
    "/admincp/offers": { ar: "العروض العقارية", en: "Offers" },
    "/admincp/content": { ar: "المحتوى", en: "Content" },
    "/admincp/audit": { ar: "سجل العمليات", en: "Audit Log" },
    "/admincp/team": { ar: "فريق الإدارة", en: "Team" },
    "/admincp/settings": { ar: "الإعدادات", en: "Settings" },
  };
  const currentPage = pageTitles[location.pathname];

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // User menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const raw = searchQuery.toLowerCase();
      /** Escape characters that could break PostgREST .or()/.ilike() filter syntax */
      const q = raw.replace(/[%_(),.\\]/g, (ch) => `\\${ch}`);
      const results: SearchResult[] = [];

      const [landsRes, devsRes, dealsRes, profilesRes] = await Promise.all([
        supabase.from("lands").select("id, city, district, owner_name, land_area_sqm").or(`city.ilike.%${q}%,district.ilike.%${q}%,owner_name.ilike.%${q}%`).limit(5),
        supabase.from("developers").select("id, company_name, marketing_brand_name, email").or(`company_name.ilike.%${q}%,marketing_brand_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
        supabase.from("deals").select("id, current_stage, developers(company_name), lands(city)").limit(5),
        supabase.from("profiles").select("user_id, full_name, email").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
      ]);

      landsRes.data?.forEach(l => results.push({
        type: "land",
        label: `${l.city}${l.district ? ` - ${l.district}` : ""}`,
        sub: `${l.owner_name || ""} • ${Number(l.land_area_sqm).toLocaleString()} ${isAr ? "م²" : "sqm"}`,
        href: "/admincp/lands",
      }));

      devsRes.data?.forEach(d => results.push({
        type: "developer",
        label: d.marketing_brand_name || d.company_name,
        sub: d.email || "",
        href: "/admincp/developers",
      }));

      const dealQ = q;
      dealsRes.data?.filter(d =>
        (d.developers as any)?.company_name?.toLowerCase().includes(dealQ) ||
        (d.lands as any)?.city?.toLowerCase().includes(dealQ)
      ).forEach(d => results.push({
        type: "deal",
        label: `${(d.developers as any)?.company_name || "—"} → ${(d.lands as any)?.city || ""}`,
        sub: d.current_stage?.replace(/_/g, " ") || "",
        href: "/admincp/deals",
      }));

      profilesRes.data?.forEach(p => results.push({
        type: "owner",
        label: p.full_name || p.email || "",
        sub: p.email || "",
        href: "/admincp/owners",
      }));

      setSearchResults(results.slice(0, 10));
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, isAr]);

  // Fetch notifications
  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title_ar, title_en, message_ar, message_en, created_at, is_read, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const mapped = (data || []).map(n => ({
      id: n.id,
      title: isAr ? n.title_ar : n.title_en,
      message: isAr ? n.message_ar : n.message_en,
      created_at: n.created_at,
      is_read: n.is_read,
      type: n.type,
    }));
    setNotifications(mapped);
    setUnreadCount(mapped.filter(n => !n.is_read).length);
  }, [user, isAr]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchNotifs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifs]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifs();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    fetchNotifs();
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate("/");
  };

  const typeLabels: Record<string, { icon: string; color: string }> = {
    new_owner: { icon: "👤", color: "text-blue-600" },
    new_developer: { icon: "🏗️", color: "text-violet-600" },
    deal_stage: { icon: "📋", color: "text-amber-600" },
    deal_request: { icon: "📩", color: "text-primary" },
    system: { icon: "⚙️", color: "text-muted-foreground" },
  };

  const searchTypeLabels: Record<string, { ar: string; en: string; color: string }> = {
    land: { ar: "أرض", en: "Land", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    owner: { ar: "مالك", en: "Owner", color: "bg-blue-50 text-blue-600 border-blue-200" },
    developer: { ar: "مطور", en: "Developer", color: "bg-violet-50 text-violet-600 border-violet-200" },
    deal: { ar: "صفقة", en: "Deal", color: "bg-amber-50 text-amber-600 border-amber-200" },
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]" dir={isAr ? "rtl" : "ltr"}>
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-white/90 backdrop-blur-xl border-b border-gray-100/80 px-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            {/* Page title / breadcrumb */}
            {currentPage && (
              <div className="hidden sm:flex items-center gap-2 me-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{isAr ? "لوحة الإدارة" : "Admin"}</span>
                <span className="text-gray-300 text-[10px]">/</span>
                <span className="text-[13px] font-semibold text-[#1E374B]">{isAr ? currentPage.ar : currentPage.en}</span>
              </div>
            )}

            {/* Search */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
              <Input
                className="h-9 w-72 rounded-lg bg-gray-50/60 border-gray-200/30 ps-10 text-[13px] text-gray-700 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#2B4C66]/20 focus-visible:border-[#2B4C66]/20 transition-all duration-200"
                placeholder={isAr ? "بحث سريع..." : "Quick search..."}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => searchQuery && setShowSearch(true)}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
              {showSearch && searchQuery && (
                <div className="absolute top-full mt-2 start-0 w-[340px] max-h-80 overflow-auto rounded-xl border border-gray-200/60 bg-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] z-50">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="h-4 w-4 animate-spin text-[#2B4C66]/40" strokeWidth={1.5} /></div>
                  ) : searchResults.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-gray-400">{isAr ? "لا توجد نتائج" : "No results"}</p>
                  ) : (
                    <div className="py-1">
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-[#2B4C66]/[0.03] transition-all duration-150 border-b border-gray-100/60 last:border-0"
                          onClick={() => { navigate(r.href); setShowSearch(false); setSearchQuery(""); }}
                        >
                          <Badge variant="outline" className={`shrink-0 text-[9px] font-semibold ${searchTypeLabels[r.type]?.color}`}>
                            {isAr ? searchTypeLabels[r.type]?.ar : searchTypeLabels[r.type]?.en}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-gray-800 truncate">{r.label}</p>
                            <p className="text-[11px] text-gray-400 truncate">{r.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#2B4C66] hover:bg-[#2B4C66]/[0.04] transition-all duration-200 relative"
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) fetchNotifs(); }}
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C2A86B] text-[8px] font-bold text-white shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute top-full mt-2 end-0 w-[340px] max-h-[420px] overflow-auto rounded-xl border border-gray-200/60 bg-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] z-50">
                  <div className="flex items-center justify-between border-b border-gray-100/80 px-5 py-3.5">
                    <span className="text-[13px] font-semibold text-[#1E374B]">{isAr ? "الإشعارات" : "Notifications"}</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] font-medium text-[#C2A86B] hover:text-[#2B4C66] transition-colors">
                        {isAr ? "قراءة الكل" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="py-12 text-center text-[13px] text-gray-400">{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        className={`flex w-full items-start gap-3 px-5 py-3.5 text-start hover:bg-[#2B4C66]/[0.02] transition-all duration-150 border-b border-gray-50 last:border-0 ${!n.is_read ? "bg-[#2B4C66]/[0.02]" : ""}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <span className="text-sm mt-0.5">{typeLabels[n.type]?.icon || "📌"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-medium text-gray-800 truncate">{n.title}</p>
                            {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#C2A86B] shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200/60 mx-1" />

            {/* User avatar with dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-[#2B4C66]/20 transition-all duration-200"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#2B4C66] to-[#1E374B] flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-white">{initial}</span>
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute top-full mt-2 end-0 w-52 rounded-xl border border-gray-200/60 bg-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100/80">
                    <p className="text-[13px] font-semibold text-[#1E374B] truncate">{fullName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate("/admincp/settings"); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 hover:bg-[#2B4C66]/[0.04] hover:text-[#1E374B] transition-all"
                    >
                      <Settings className="h-4 w-4" strokeWidth={1.5} />
                      {isAr ? "الإعدادات" : "Settings"}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50/60 transition-all"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      {isAr ? "تسجيل الخروج" : "Logout"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-6 py-7">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
