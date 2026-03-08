import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Brain, MapPin, School, ShoppingCart, Building, Trees, Loader2 } from "lucide-react";

interface Props {
  landId: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  education: School,
  commercial: ShoppingCart,
  healthcare: Building,
  recreation: Trees,
};

const LandAIInsights: React.FC<Props> = ({ landId }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("land_pulse_snapshots")
        .select("*")
        .eq("land_id", landId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSnapshot(data);
      setLoading(false);
    };
    fetch();
  }, [landId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
        <Brain className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {isAr ? "لا تتوفر تحليلات ذكية لهذه الأرض حالياً" : "No AI insights available for this land yet"}
        </p>
      </div>
    );
  }

  const summary = snapshot.summary_json || {};
  const pois = snapshot.pois_list || [];
  const report = isAr ? snapshot.ai_report_ar : snapshot.ai_report_en;

  // Group POIs by category
  const grouped: Record<string, any[]> = {};
  (pois as any[]).forEach((p: any) => {
    const cat = p.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">{isAr ? "تحليل ذكي للموقع" : "AI Location Analysis"}</h4>
        <Badge variant="secondary" className="text-[10px]">{snapshot.radius_m}m</Badge>
      </div>

      {/* Summary stats */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(summary).map(([key, val]: [string, any]) => (
            <div key={key} className="rounded-lg border border-border/40 p-2.5 text-center">
              <p className="text-lg font-semibold text-foreground">{typeof val === "number" ? val : String(val)}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
            </div>
          ))}
        </div>
      )}

      {/* POIs by category */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-2">
          {Object.entries(grouped).slice(0, 4).map(([cat, items]) => {
            const Icon = categoryIcons[cat] || MapPin;
            return (
              <div key={cat} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium capitalize">{cat.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="text-[9px] ms-auto">{items.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.slice(0, 5).map((p: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{p.name || p.tags?.name || "—"}</Badge>
                  ))}
                  {items.length > 5 && <Badge variant="outline" className="text-[9px]">+{items.length - 5}</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Report */}
      {report && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h5 className="text-xs font-medium mb-2">{isAr ? "تقرير الذكاء الاصطناعي" : "AI Report"}</h5>
          <p className="text-xs font-light text-muted-foreground leading-relaxed whitespace-pre-line">{report}</p>
        </div>
      )}
    </div>
  );
};

export default LandAIInsights;
