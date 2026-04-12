import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, Building2, TrendingUp, AlertTriangle,
  CheckCircle2, Star, ExternalLink, BarChart3, X,
  Share2, Newspaper, ThumbsUp, ThumbsDown, Minus, AreaChart
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

interface Props { developerName: string; developerId: string; isAr: boolean; autoUrl?: string; }

// Enterprise muted colors replacing generic colors
const recStyles: Record<string, { ar: string; en: string; color: string }> = {
  strong: { ar: "حضور قوي", en: "Strong Presence", color: "bg-primary/5 text-primary border-primary/20" },
  moderate: { ar: "حضور متوسط", en: "Moderate Presence", color: "bg-muted text-foreground border-border" },
  weak: { ar: "حضور ضعيف", en: "Weak Presence", color: "bg-destructive/5 text-destructive border-destructive/20" },
};

const socialStrengthStyles: Record<string, { ar: string; color: string }> = {
  strong: { ar: "قيادي", color: "bg-primary/5 text-primary border-primary/20" },
  moderate: { ar: "مستقر", color: "bg-muted text-foreground border-border" },
  weak: { ar: "محدود", color: "bg-destructive/5 text-destructive border-destructive/20" },
  absent: { ar: "غير متوفر", color: "bg-transparent text-muted-foreground border-border/50" },
};

const coverageStyles: Record<string, { ar: string; color: string }> = {
  high: { ar: "تغطية بارزة", color: "bg-primary/5 text-primary border-primary/20" },
  moderate: { ar: "تغطية اعتيادية", color: "bg-muted text-foreground border-border" },
  low: { ar: "تغطية محدودة", color: "bg-destructive/5 text-destructive border-destructive/20" },
  none: { ar: "لا توجد تغطية", color: "bg-transparent text-muted-foreground border-border/50" },
};

const sentimentIcon = { positive: ThumbsUp, negative: ThumbsDown, neutral: Minus };

const DevWebsiteAnalysis: React.FC<Props> = ({ developerName, developerId, isAr, autoUrl }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState(autoUrl || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebsiteAnalysis | null>(null);
  const [scrapedUrl, setScrapedUrl] = useState("");

  useEffect(() => {
    if (autoUrl || url) return;
    const fetchWebsite = async () => {
      const { data } = await supabase.from("developers").select("website").eq("id", developerId).maybeSingle();
      if (data?.website) setUrl(data.website);
    };
    fetchWebsite();
  }, [developerId, autoUrl, url]);

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

  const getScoreColor = (s: number) => s >= 75 ? "bg-primary" : s >= 50 ? "bg-muted-foreground" : "bg-destructive";

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="url" 
            placeholder={isAr ? "أدخل رابط موقع المطور..." : "Enter developer website URL..."} 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            className="ps-9 text-sm rounded-xl h-11 bg-muted/30 border-border/60 focus-visible:ring-1 focus-visible:ring-primary shadow-inner-sm transition-all" 
            dir="ltr" 
            onKeyDown={(e) => e.key === "Enter" && analyze()} 
          />
        </div>
        <Button onClick={analyze} disabled={loading} size="sm" className="h-11 px-5 rounded-xl gap-2 shadow-sm font-medium">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AreaChart className="h-4 w-4" />}
          {isAr ? "تحليل شامل" : "Run Analysis"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-2xl border border-border/50 bg-card/50 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{isAr ? "جاري استخراج البيانات وتحليلها..." : "Extracting and analyzing data..."}</p>
            <p className="text-[11px] font-light text-muted-foreground mt-1">{isAr ? "الويب، السوشيال ميديا، والسجلات (30-60 ثانية)" : "Web, social, and records (30-60s)"}</p>
          </div>
        </div>
      )}

      {/* Result Card: Enterprise Level */}
      {result && !loading && (
        <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          
          {/* Header Section */}
          <div className="p-6 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-background border border-border shadow-sm">
                <Building2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-base font-medium text-foreground tracking-tight">{isAr ? "التقرير الاستخباري للشركة" : "Corporate Intelligence Report"}</h4>
                <a href={scrapedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-0.5">
                  {scrapedUrl} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-end">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{isAr ? "المؤشر الموحد" : "Composite Index"}</p>
                <div className="flex text-2xl font-semibold text-foreground items-baseline gap-1">
                  {result.overall_score} <span className="text-xs font-normal text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block"></div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Overview & Verdict */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h5 className="text-sm font-medium text-foreground">{isAr ? "الملخص التنفيذي" : "Executive Summary"}</h5>
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">{result.company_overview_ar}</p>
                
                {/* Score bars block */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                  {[
                    { label: isAr ? "مؤشر حضور الويب" : "Web Presence Index", score: result.website_quality_score },
                    { label: isAr ? "المؤشر الاستثماري الموحد" : "Unified Investment Index", score: result.overall_score },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-light text-muted-foreground">{s.label}</span>
                        <span className="font-medium text-foreground">{s.score}/100</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreColor(s.score)} transition-all duration-1000 ease-out`} style={{ width: `${s.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict Side Plate */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-5 flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">{isAr ? "قرار خوارزمية التحليل" : "Algorithmic Verdict"}</span>
                <Badge variant="outline" className={`w-fit text-xs font-medium px-3 py-1 bg-background shadow-sm border-border ${recStyles[result.recommendation_level]?.color || recStyles.moderate.color}`}>
                  {isAr ? recStyles[result.recommendation_level]?.ar : recStyles[result.recommendation_level]?.en}
                </Badge>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">{isAr ? "توصية الاستراتيجية" : "Strategic Rec."}</span>
                  <p className="text-xs font-light text-foreground leading-relaxed">{result.recommendation_ar}</p>
                </div>
              </div>
            </div>

            {/* Matrix Data */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Projects Subcard */}
              <div className="rounded-xl border border-border/40 p-5 space-y-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-foreground">{isAr ? `محفظة المشاريع` : `Project Portfolio`} <span className="text-muted-foreground font-normal">({result.projects_count})</span></span>
                </div>
                <p className="text-xs font-light text-muted-foreground leading-relaxed">{result.projects_summary_ar}</p>
                {result.notable_projects_ar && result.notable_projects_ar.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {result.notable_projects_ar.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] font-light bg-background border border-border rounded-md px-2 py-0.5">
                        <Star className="h-2.5 w-2.5 me-1.5 text-primary" />{p}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial & Strengths Subcard */}
              <div className="space-y-6">
                {result.financial_strength_indicators_ar && (
                  <div className="rounded-xl border border-border/40 p-5 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-foreground">{isAr ? "الملاءة المالية المتوقعة" : "Estimated Financial Strength"}</span>
                    </div>
                    <p className="text-xs font-light text-muted-foreground leading-relaxed">{result.financial_strength_indicators_ar}</p>
                  </div>
                )}
                
                {/* Pros & Cons Mini Matrix */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {isAr ? "المميزات التنافسية" : "Competitive Edges"}
                    </span>
                    <ul className="space-y-2">
                      {result.strengths_ar?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] font-light text-muted-foreground leading-snug">
                          <div className="h-1 w-1 rounded-full bg-primary shrink-0 mt-1.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" /> {isAr ? "نقاط التحوط" : "Hedging Points"}
                    </span>
                    <ul className="space-y-2">
                      {result.weaknesses_ar?.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] font-light text-muted-foreground leading-snug">
                          <div className="h-1 w-1 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Social & Intelligence Tracks */}
            {(result.social_media_presence || result.news_intelligence) && (
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
                
                {/* Social Media */}
                {result.social_media_presence && (
                  <div className="space-y-4 rounded-xl border border-border/40 p-5 bg-background">
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-foreground">{isAr ? "البصمة الرقمية" : "Digital Footprint"}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] uppercase font-medium ${(socialStrengthStyles[result.social_media_presence.overall_strength] || socialStrengthStyles.absent).color}`}>
                        {isAr ? socialStrengthStyles[result.social_media_presence.overall_strength]?.ar : socialStrengthStyles[result.social_media_presence.overall_strength]?.ar}
                      </Badge>
                    </div>
                    <p className="text-xs font-light text-muted-foreground leading-relaxed">{result.social_media_presence.analysis_ar}</p>
                    
                    {result.social_media_presence.platforms_found.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        {result.social_media_presence.platforms_found.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <Badge variant="secondary" className="text-[9px] font-medium tracking-wide uppercase bg-background border-border shrink-0">{p.platform}</Badge>
                            <span className="text-[11px] font-light text-muted-foreground leading-tight">{p.summary_ar}</span>
                            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0 ms-auto text-muted-foreground hover:text-primary mt-0.5"><ExternalLink className="h-3 w-3" /></a>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* News Intelligence */}
                {result.news_intelligence && (
                  <div className="space-y-4 rounded-xl border border-border/40 p-5 bg-background">
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-foreground">{isAr ? "الرصد الإعلامي" : "Media Tracking"}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] uppercase font-medium ${(coverageStyles[result.news_intelligence.coverage_level] || coverageStyles.none).color}`}>
                        {isAr ? coverageStyles[result.news_intelligence.coverage_level]?.ar : coverageStyles[result.news_intelligence.coverage_level]?.ar}
                      </Badge>
                    </div>
                    <p className="text-xs font-light text-muted-foreground leading-relaxed">{result.news_intelligence.analysis_ar}</p>
                    
                    {result.news_intelligence.articles.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        {result.news_intelligence.articles.slice(0, 3).map((a, i) => {
                          const SIcon = sentimentIcon[a.sentiment as keyof typeof sentimentIcon] || Minus;
                          return (
                            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-xs font-medium text-foreground line-clamp-1">{a.title_ar}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <SIcon className={`h-3 w-3 ${a.sentiment === 'positive' ? 'text-primary' : a.sentiment === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`} />
                                  {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" /></a>}
                                </div>
                              </div>
                              <p className="text-[10px] font-light text-muted-foreground line-clamp-2">{a.summary_ar}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevWebsiteAnalysis;
