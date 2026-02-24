import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, Building2, TrendingUp, AlertTriangle,
  CheckCircle2, Star, ExternalLink, BarChart3, X,
  Share2, Newspaper, ThumbsUp, ThumbsDown, Minus,
} from "lucide-react";

interface SocialPlatform { platform: string; url: string; summary_ar: string; }
interface SocialPresence { overall_strength: string; platforms_found: SocialPlatform[]; analysis_ar: string; }
interface NewsArticle { title_ar: string; url?: string; sentiment: string; summary_ar: string; }
interface NewsIntelligence { coverage_level: string; articles: NewsArticle[]; analysis_ar: string; }

interface WebsiteAnalysis {
  company_overview_ar: string;
  projects_count: number;
  projects_summary_ar: string;
  website_quality_score: number;
  financial_strength_indicators_ar?: string;
  overall_score: number;
  strengths_ar: string[];
  weaknesses_ar: string[];
  recommendation_ar: string;
  recommendation_level: "strong" | "moderate" | "weak";
  notable_projects_ar?: string[];
  social_media_presence?: SocialPresence;
  news_intelligence?: NewsIntelligence;
}

interface Props { developerName: string; developerId: string; isAr: boolean; }

const recStyles: Record<string, { ar: string; en: string; color: string }> = {
  strong: { ar: "حضور قوي", en: "Strong Presence", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  moderate: { ar: "حضور متوسط", en: "Moderate Presence", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  weak: { ar: "حضور ضعيف", en: "Weak Presence", color: "bg-red-500/10 text-red-700 border-red-500/20" },
};

const socialStrengthStyles: Record<string, { ar: string; color: string }> = {
  strong: { ar: "حضور قوي", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  moderate: { ar: "حضور متوسط", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  weak: { ar: "حضور ضعيف", color: "bg-red-500/10 text-red-700 border-red-500/20" },
  absent: { ar: "غير موجود", color: "bg-muted text-muted-foreground border-border" },
};

const coverageStyles: Record<string, { ar: string; color: string }> = {
  high: { ar: "تغطية عالية", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  moderate: { ar: "تغطية متوسطة", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  low: { ar: "تغطية محدودة", color: "bg-red-500/10 text-red-700 border-red-500/20" },
  none: { ar: "لا تغطية", color: "bg-muted text-muted-foreground border-border" },
};

const sentimentIcon = { positive: ThumbsUp, negative: ThumbsDown, neutral: Minus };
const sentimentColor = { positive: "text-emerald-600", negative: "text-red-600", neutral: "text-muted-foreground" };

const DevWebsiteAnalysis: React.FC<Props> = ({ developerName, developerId, isAr }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebsiteAnalysis | null>(null);
  const [scrapedUrl, setScrapedUrl] = useState("");

  const analyze = async () => {
    if (!url.trim()) { toast({ variant: "destructive", title: isAr ? "أدخل رابط الموقع" : "Enter website URL" }); return; }
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-developer-website", {
        body: { website_url: url, developer_name: developerName, developer_id: developerId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Analysis failed");
      setResult(data.analysis); setScrapedUrl(data.website_url);
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: isAr ? "خطأ في التحليل" : "Analysis Error", description: e.message });
    } finally { setLoading(false); }
  };

  const getScoreColor = (s: number) => s >= 75 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="url" placeholder={isAr ? "أدخل رابط موقع المطور..." : "Enter developer website URL..."} value={url} onChange={(e) => setUrl(e.target.value)} className="ps-9 text-sm" dir="ltr" onKeyDown={(e) => e.key === "Enter" && analyze()} />
        </div>
        <Button onClick={analyze} disabled={loading} size="sm" className="gap-1.5 shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />}
          {isAr ? "تحليل شامل" : "Full Analysis"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-6 gap-3 rounded-xl border border-border/40 bg-muted/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{isAr ? "جاري التحليل الشامل..." : "Running comprehensive analysis..."}</p>
            <p className="text-xs font-light text-muted-foreground mt-1">{isAr ? "جلب الموقع + السوشيال ميديا + الأخبار (30-60 ثانية)" : "Website + Social Media + News (30-60s)"}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-sm font-medium text-foreground">{isAr ? "التحليل الشامل للمطور" : "Comprehensive Developer Analysis"}</h4>
                <a href={scrapedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  {scrapedUrl} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`relative h-14 w-14 rounded-full border-4 flex items-center justify-center ${result.overall_score >= 75 ? "border-emerald-500" : result.overall_score >= 50 ? "border-amber-500" : "border-red-500"}`}>
                <span className="text-base font-bold text-foreground">{result.overall_score}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setResult(null)}><X className="h-3 w-3" /></Button>
            </div>
          </div>

          <Badge variant="outline" className={`text-xs ${(recStyles[result.recommendation_level] || recStyles.moderate).color}`}>
            {isAr ? (recStyles[result.recommendation_level] || recStyles.moderate).ar : (recStyles[result.recommendation_level] || recStyles.moderate).en}
          </Badge>

          <p className="text-sm font-light text-foreground leading-relaxed">{result.company_overview_ar}</p>

          {/* Score bars */}
          <div className="space-y-2">
            {[
              { label: isAr ? "جودة الموقع" : "Website Quality", score: result.website_quality_score },
              { label: isAr ? "التقييم العام" : "Overall Score", score: result.overall_score },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-light text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.score}/100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className={`h-2 rounded-full ${getScoreColor(s.score)} transition-all duration-700`} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">{isAr ? `المشاريع (${result.projects_count} مشروع تقريباً)` : `Projects (~${result.projects_count})`}</span>
            </div>
            <p className="text-xs font-light text-muted-foreground">{result.projects_summary_ar}</p>
            {result.notable_projects_ar && result.notable_projects_ar.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {result.notable_projects_ar.map((p, i) => (<Badge key={i} variant="secondary" className="text-[10px] font-light"><Star className="h-2.5 w-2.5 me-1" />{p}</Badge>))}
              </div>
            )}
          </div>

          {/* Financial indicators */}
          {result.financial_strength_indicators_ar && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <span className="text-xs font-medium text-foreground block mb-1">{isAr ? "مؤشرات القوة المالية" : "Financial Indicators"}</span>
              <p className="text-xs font-light text-muted-foreground">{result.financial_strength_indicators_ar}</p>
            </div>
          )}

          {/* === Social Media Section === */}
          {result.social_media_presence && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{isAr ? "السوشيال ميديا" : "Social Media"}</span>
                </div>
                {(() => {
                  const s = socialStrengthStyles[result.social_media_presence!.overall_strength] || socialStrengthStyles.absent;
                  return <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.ar}</Badge>;
                })()}
              </div>
              <p className="text-xs font-light text-muted-foreground">{result.social_media_presence.analysis_ar}</p>
              {result.social_media_presence.platforms_found.length > 0 && (
                <div className="space-y-1.5">
                  {result.social_media_presence.platforms_found.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Badge variant="secondary" className="text-[10px] shrink-0">{p.platform}</Badge>
                      <span className="font-light text-muted-foreground flex-1">{p.summary_ar}</span>
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 text-primary shrink-0" /></a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === News Section === */}
          {result.news_intelligence && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Newspaper className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{isAr ? "الأخبار والتغطية الإعلامية" : "News Coverage"}</span>
                </div>
                {(() => {
                  const c = coverageStyles[result.news_intelligence!.coverage_level] || coverageStyles.none;
                  return <Badge variant="outline" className={`text-[10px] ${c.color}`}>{c.ar}</Badge>;
                })()}
              </div>
              <p className="text-xs font-light text-muted-foreground">{result.news_intelligence.analysis_ar}</p>
              {result.news_intelligence.articles.length > 0 && (
                <div className="space-y-2">
                  {result.news_intelligence.articles.slice(0, 5).map((a, i) => {
                    const SIcon = sentimentIcon[a.sentiment as keyof typeof sentimentIcon] || Minus;
                    const sColor = sentimentColor[a.sentiment as keyof typeof sentimentColor] || sentimentColor.neutral;
                    return (
                      <div key={i} className="rounded-md border border-border/30 bg-card p-2 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <SIcon className={`h-3 w-3 shrink-0 ${sColor}`} />
                          <span className="text-xs font-medium text-foreground flex-1">{a.title_ar}</span>
                          {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 text-primary shrink-0" /></a>}
                        </div>
                        <p className="text-[11px] font-light text-muted-foreground ps-4">{a.summary_ar}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-emerald-700">{isAr ? "نقاط القوة" : "Strengths"}</span>
              {result.strengths_ar?.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs font-light text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /><span>{s}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-red-700">{isAr ? "نقاط الضعف" : "Weaknesses"}</span>
              {result.weaknesses_ar?.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs font-light text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" /><span>{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <span className="text-xs font-medium text-primary block mb-1">{isAr ? "توصية للمالك" : "Owner Recommendation"}</span>
            <p className="text-xs font-light text-foreground">{result.recommendation_ar}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevWebsiteAnalysis;
