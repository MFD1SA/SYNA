import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landmark, MapPin, Eye, Send, Bell, Globe, LogOut, CheckCircle2, Clock, AlertCircle, Radar } from "lucide-react";
import logoImg from "@/assets/logo.png";

const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  active_approved: { ar: "نشطة - مالك موافق", en: "Active - Owner Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  active: { ar: "نشطة", en: "Active", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  pending: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  draft: { ar: "مسودة", en: "Draft", color: "bg-muted text-muted-foreground border-border" },
};

const OwnerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة المالك" : "Owner Dashboard");
  const navigate = useNavigate();

  const [lands, setLands] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pulseSnapshots, setPulseSnapshots] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Fetch owner's lands
      const { data: landsData } = await supabase
        .from("lands")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      setLands(landsData || []);

      // Count requests per land
      if (landsData && landsData.length > 0) {
        const landIds = landsData.map(l => l.id);
        const { data: reqData } = await supabase
          .from("deal_requests")
          .select("land_id")
          .in("land_id", landIds);

        const counts: Record<string, number> = {};
        reqData?.forEach(r => { counts[r.land_id] = (counts[r.land_id] || 0) + 1; });
        setRequests(counts);

        // Fetch pulse snapshots
        const { data: pulseData } = await supabase
          .from("land_pulse_snapshots")
          .select("*")
          .in("land_id", landIds)
          .order("created_at", { ascending: false });

        const snapMap: Record<string, any> = {};
        pulseData?.forEach(s => {
          if (!snapMap[s.land_id]) snapMap[s.land_id] = s;
        });
        setPulseSnapshots(snapMap);
      }

      setLoading(false);
    };
    fetch();
  }, [user]);

  const getLandStatus = (land: any) => {
    if (land.is_active && land.owner_approved) return "active_approved";
    if (land.is_active) return "active";
    return "draft";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-60 flex-col border-e border-border/60 bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <img src={logoImg} alt="DOMA" className="h-6 w-6 rounded-lg object-contain" />
          <span className="text-base font-medium text-foreground">DOMA</span>
        </div>
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
          <Landmark className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-medium text-primary">{isAr ? "مالك أرض" : "Land Owner"}</span>
        </div>
        <nav className="flex-1 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            <Landmark className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-light">{isAr ? "أراضيي" : "My Lands"}</span>
          </div>
        </nav>
        <div className="space-y-0.5 border-t border-border/60 p-3">
          <p className="truncate px-3 py-1 text-xs font-light text-muted-foreground">{user?.email}</p>
          <button onClick={toggleLang} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-muted-foreground transition-colors hover:bg-muted/50">
            <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {isAr ? "English" : "العربية"}
          </button>
          <button onClick={async () => { await signOut(); navigate("/"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-destructive transition-colors hover:bg-destructive/5">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {isAr ? "خروج" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "أراضيي" : "My Lands"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "تابع حالة أراضيك ومؤشرات اهتمام المطورين" : "Track your lands status and developer interest"}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : lands.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Landmark className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
            <p className="text-sm font-light text-muted-foreground">
              {isAr ? "لا توجد أراضي مسجلة حالياً — تواصل مع مدير النظام لإضافة أرضك" : "No lands registered — contact admin to add your land"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lands.map(land => {
              const status = getLandStatus(land);
              const statusInfo = statusLabels[status] || statusLabels.draft;
              const reqCount = requests[land.id] || 0;
              const pulse = pulseSnapshots[land.id];

              return (
                <div key={land.id} className="doma-card p-5">
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      <h3 className="font-medium text-foreground">{land.city}</h3>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                      {isAr ? statusInfo.ar : statusInfo.en}
                    </Badge>
                  </div>

                  {land.district && <p className="mb-3 text-sm font-light text-muted-foreground">{land.district}</p>}

                  <div className="grid grid-cols-2 gap-2 text-xs font-light text-muted-foreground mb-4">
                    <span>{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                    {land.street_width_m && <span>{isAr ? "شارع:" : "Street:"} {land.street_width_m}{isAr ? "م" : "m"}</span>}
                  </div>

                  {/* Interest indicator */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-light text-muted-foreground">
                        {isAr ? `${reqCount} طلب شراكة` : `${reqCount} partnership requests`}
                      </span>
                    </div>
                    {land.owner_approved && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-light text-emerald-700">{isAr ? "مالك موافق" : "Owner Approved"}</span>
                      </div>
                    )}
                  </div>

                  {/* Pulse snapshot summary */}
                  {pulse && (
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Radar className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground">{isAr ? "نبض الموقع 900م" : "Location Pulse 900m"}</span>
                      </div>
                      <p className="text-xs font-light text-muted-foreground line-clamp-3">
                        {isAr ? pulse.ai_report_ar : pulse.ai_report_en || pulse.ai_report_ar}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerDashboard;
