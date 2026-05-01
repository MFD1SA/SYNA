import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeError } from "@/lib/edgeError";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Radar, RefreshCw, MapPin, Building2, Home, ShoppingBag, Loader2 } from "lucide-react";

interface LandPulse900Props {
  landId: string;
  lat: number | null;
  lng: number | null;
}

const LandPulse900: React.FC<LandPulse900Props> = ({ landId, lat, lng }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = useCallback(async (forceRefresh = false) => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("radius900", {
        body: { land_id: landId, lat, lng, force_refresh: forceRefresh },
      });

      if (fnError) {
        // Surface the real server-side message instead of the generic
        // "Edge Function returned a non-2xx status code" wrapper.
        const detail = await extractEdgeError(fnError);
        throw new Error(detail);
      }
      setData(result);
    } catch (e: any) {
      setError(e.message || "Error fetching pulse data");
    }
    setLoading(false);
  }, [lat, lng, landId]);

  useEffect(() => {
    if (lat && lng) fetchPulse();
  }, [fetchPulse, lat, lng]);

  if (!lat || !lng) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 p-6 text-center">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-light text-muted-foreground">
          {isAr ? "يرجى تحديد موقع الأرض لتفعيل تحليل نبض الموقع" : "Please set land location to enable pulse analysis"}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 p-8 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-light text-muted-foreground">
          {isAr ? "جاري تحليل محيط الأرض..." : "Analyzing surrounding area..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchPulse()}>
          {isAr ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const summary = data.summary_json;
  const character = summary?.area_character;
  const topPois = summary?.top_pois || [];
  const categories = summary?.categories || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            {isAr ? "نبض الموقع — 900 متر" : "Location Pulse — 900m"}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchPulse(true)} className="gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {data.cached && (
        <p className="text-[10px] text-muted-foreground">
          {isAr ? "نتائج مخزنة مؤقتاً — آخر تحديث: " : "Cached results — last update: "}
          {new Date(data.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
        </p>
      )}

      {/* Area Character */}
      {character && (
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h4 className="mb-3 text-xs font-medium text-foreground">{isAr ? "طابع المنطقة" : "Area Character"}</h4>
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-center">
              <Home className="mx-auto mb-1 h-4 w-4 text-blue-600" />
              <p className="text-lg font-medium text-blue-700">{character.residential_pct}%</p>
              <p className="text-[10px] text-blue-600">{isAr ? "سكني" : "Residential"}</p>
            </div>
            <div className="flex-1 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-center">
              <Building2 className="mx-auto mb-1 h-4 w-4 text-amber-600" />
              <p className="text-lg font-medium text-amber-700">{character.commercial_pct}%</p>
              <p className="text-[10px] text-amber-600">{isAr ? "تجاري" : "Commercial"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top POIs */}
      {topPois.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h4 className="mb-3 text-xs font-medium text-foreground">
            {isAr ? `أبرز المعالم (${summary.total_pois} نقطة)` : `Top POIs (${summary.total_pois} points)`}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {topPois.map((poi: any, idx: number) => (
              <span key={idx} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-[10px] font-light text-muted-foreground">
                {poi.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Counts */}
      {Object.keys(categories).length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h4 className="mb-3 text-xs font-medium text-foreground">{isAr ? "التصنيفات" : "Categories"}</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(categories).slice(0, 9).map(([cat, count]) => (
              <div key={cat} className="rounded-lg bg-muted/30 px-2 py-1.5 text-center">
                <p className="text-sm font-medium text-foreground">{count as number}</p>
                <p className="text-[9px] text-muted-foreground truncate">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Report */}
      {data.ai_report_ar && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="mb-2 text-xs font-medium text-primary">{isAr ? "تقرير الذكاء الاصطناعي" : "AI Report"}</h4>
          <p className="text-sm font-light text-foreground leading-relaxed whitespace-pre-line">{data.ai_report_ar}</p>
        </div>
      )}
    </div>
  );
};

export default LandPulse900;
