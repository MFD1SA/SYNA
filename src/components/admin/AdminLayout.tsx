import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Search, X, Check, Loader2 } from "lucide-react";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === "ar";

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

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const q = searchQuery.toLowerCase();
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
  const fetchNotifs = async () => {
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
  };

  useEffect(() => { fetchNotifs(); }, [user]);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchNotifs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifs();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    fetchNotifs();
  };

  const typeLabels: Record<string, { icon: string; color: string }> = {
    new_owner: { icon: "👤", color: "text-blue-600" },
    new_developer: { icon: "🏗️", color: "text-violet-600" },
    deal_stage: { icon: "📋", color: "text-amber-600" },
    deal_request: { icon: "📩", color: "text-primary" },
    system: { icon: "⚙️", color: "text-muted-foreground" },
  };

  const searchTypeLabels: Record<string, { ar: string; en: string; color: string }> = {
    land: { ar: "أرض", en: "Land", color: "bg-emerald-500/10 text-emerald-700" },
    owner: { ar: "مالك", en: "Owner", color: "bg-blue-500/10 text-blue-700" },
    developer: { ar: "مطور", en: "Developer", color: "bg-violet-500/10 text-violet-700" },
    deal: { ar: "صفقة", en: "Deal", color: "bg-amber-500/10 text-amber-700" },
  };

  return (
    <div className="flex min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 w-64 rounded-lg bg-muted/30 ps-9 text-xs"
                placeholder={isAr ? "بحث سريع..." : "Quick search..."}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => searchQuery && setShowSearch(true)}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {showSearch && searchQuery && (
                <div className="absolute top-full mt-1 start-0 w-80 max-h-80 overflow-auto rounded-xl border border-border bg-card shadow-lg z-50">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : searchResults.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results"}</p>
                  ) : (
                    searchResults.map((r, i) => (
                      <button
                        key={i}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-muted/50 transition-colors"
                        onClick={() => { navigate(r.href); setShowSearch(false); setSearchQuery(""); }}
                      >
                        <Badge variant="outline" className={`shrink-0 text-[9px] ${searchTypeLabels[r.type]?.color}`}>
                          {isAr ? searchTypeLabels[r.type]?.ar : searchTypeLabels[r.type]?.en}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{r.sub}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground relative"
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) fetchNotifs(); }}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {showNotifs && (
                <div className="absolute top-full mt-1 end-0 w-80 max-h-96 overflow-auto rounded-xl border border-border bg-card shadow-lg z-50">
                  <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                    <span className="text-xs font-medium text-foreground">{isAr ? "الإشعارات" : "Notifications"}</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                        {isAr ? "قراءة الكل" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-start hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-primary/3" : ""}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <span className="text-sm mt-0.5">{typeLabels[n.type]?.icon || "📌"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                            {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                            {new Date(n.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex h-8 items-center gap-2 rounded-lg bg-muted/30 px-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-medium text-primary">
                  {(user?.email?.[0] || "A").toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-light text-muted-foreground hidden sm:inline" dir="ltr">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
