import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, Building2, ExternalLink, AreaChart, X, CheckCircle2, XCircle,
  Share2, ShieldCheck, Gauge, AlertTriangle, Briefcase, Newspaper, CalendarDays,
  Languages as LanguagesIcon, MapPin, TrendingUp, Trophy, Users, Sparkles,
  Calendar, MessageCircle, PlayCircle, Lock, Image as ImageIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   v8 — content-focused business intelligence
   Renders projects/news/social/expansion data extracted directly from
   the developer's website. No domain/SEO technicals are shown.
   ─────────────────────────────────────────────────────────────────── */

type FailureKind = "dns" | "timeout" | "refused" | "http_error" | "other";
interface FailureDx {
  kind: FailureKind;
  title_ar: string; title_en: string;
  hint_ar: string;  hint_en: string;
  technical: string;
  attempted?: string[];
}

function classifyFailure(
  rawError: string | undefined,
  details: string | undefined,
  status: number | undefined,
  attempted: string[] | undefined,
): FailureDx {
  const blob = `${rawError ?? ""} ${details ?? ""}`.toLowerCase();
  const technical = (details && details.length > 0 ? details : (rawError || "")).slice(0, 300);

  if (status && status >= 400) {
    return {
      kind: "http_error",
      title_ar: `الموقع ردّ بخطأ (${status})`,
      title_en: `Site responded with error (${status})`,
      hint_ar: "الموقع موجود لكنه أعاد رمز خطأ — قد يكون رابطك يُعيد التوجيه إلى صفحة محذوفة أو محمية.",
      hint_en: "The site responded but with an error code — your URL may redirect to a deleted or protected page.",
      technical, attempted,
    };
  }
  if (blob.includes("dns error") || blob.includes("name or service not known") || blob.includes("could not resolve") || blob.includes("getaddrinfo")) {
    return {
      kind: "dns",
      title_ar: "هذا النطاق غير موجود",
      title_en: "Domain does not exist",
      hint_ar: "تحقّق من إملاء عنوان الموقع — يبدو أن النطاق غير مسجَّل في الإنترنت أصلاً.",
      hint_en: "Double-check the spelling — this domain is not registered.",
      technical, attempted,
    };
  }
  if (blob.includes("aborterror") || blob.includes("timeout") || blob.includes("timed out") || blob.includes("the signal has been aborted")) {
    return {
      kind: "timeout",
      title_ar: "انتهت مهلة الاتصال",
      title_en: "Connection timed out",
      hint_ar: "الموقع لم يستجب خلال ١٠ ثوانٍ — قد يكون بطيئاً أو يحجب الزيارات الآلية.",
      hint_en: "Site did not respond within 10 seconds — it may be slow or blocking automated requests.",
      technical, attempted,
    };
  }
  if (blob.includes("connection refused") || blob.includes("refused") || blob.includes("ssl") || blob.includes("tls") || blob.includes("certificate") || blob.includes("handshake")) {
    return {
      kind: "refused",
      title_ar: "الموقع رفض الاتصال",
      title_en: "Site refused connection",
      hint_ar: "ربما تكون شهادة الـ SSL منتهية أو غير صالحة. جرّب فتحه في المتصفّح.",
      hint_en: "The SSL certificate may be invalid. Try opening it in a browser first.",
      technical, attempted,
    };
  }
  return {
    kind: "other",
    title_ar: "تعذّر الوصول إلى الموقع",
    title_en: "Could not reach the website",
    hint_ar: "حدث خطأ غير متوقَّع. تواصل مع الدعم إذا تكرّر.",
    hint_en: "An unexpected error occurred. Contact support if this persists.",
    technical, attempted,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Response shape (matches v8 edge function)
   ─────────────────────────────────────────────────────────────────── */

interface ScoreSignal {
  label_ar: string;
  label_en: string;
  weight: number;
  passed: boolean;
  value?: string;
}

interface ProjectCard {
  title: string;
  summary: string;
  image_url: string;
  location: string;
  url: string;
}

interface NewsArticle {
  title: string;
  date?: string;
  summary: string;
  image_url: string;
  url: string;
}

interface SocialProfile {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followers?: number;
  followers_text?: string;
  videos_count?: number;
  recent_items?: Array<{ title: string; thumbnail_url?: string; published_at?: string }>;
}

interface SocialPlatform {
  platform: string;
  url: string;
  accessible: boolean;
  profile: SocialProfile | null;
}

interface AddressRow { country?: string; city?: string; full?: string }

interface AnalysisResult {
  website: string;
  developer_name?: string;
  fetched_at: string;

  company: {
    name: string;
    legal_name: string;
    tagline: string;
    description: string;
    logo_url: string;
    founded: string;
    industry: string;
    headquarters: string;
  };

  projects: {
    pages_found: number;
    has_dedicated_section: boolean;
    listing_url: string;
    detailed_items: ProjectCard[];
  };

  news: {
    pages_found: number;
    has_section: boolean;
    listing_url: string;
    recent_in_last_year: number;
    articles: NewsArticle[];
  };

  events: {
    pages_found: number;
    sample_titles: string[];
    listing_url: string;
  };

  careers: {
    has_careers_page: boolean;
    listing_url: string;
  };

  social_presence: {
    count: number;
    accessible_count: number;
    platforms: SocialPlatform[];
  };

  expansion: {
    office_locations_count: number;
    addresses: AddressRow[];
    languages_supported: string[];
    international: boolean;
  };

  trust_signals: {
    has_about_page: boolean;
    has_contact_page: boolean;
    has_organization_schema: boolean;
    has_logo: boolean;
    has_clear_description: boolean;
  };

  score: number;
  score_band: "weak" | "fair" | "strong" | "excellent";
  score_breakdown: ScoreSignal[];
}

interface Props { developerName: string; developerId: string; isAr: boolean; autoUrl?: string; }

const bandStyles: Record<AnalysisResult["score_band"], { ar: string; en: string; cls: string; ring: string }> = {
  weak:      { ar: "ضعيف",  en: "Weak",     cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30", ring: "ring-rose-300/40" },
  fair:      { ar: "مقبول", en: "Fair",     cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30", ring: "ring-amber-300/40" },
  strong:    { ar: "قوي",   en: "Strong",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30", ring: "ring-emerald-300/40" },
  excellent: { ar: "ممتاز", en: "Excellent", cls: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/40", ring: "ring-emerald-400/50" },
};

const platformLabel: Record<string, { ar: string; en: string }> = {
  twitter:   { ar: "تويتر / X",  en: "X (Twitter)" },
  linkedin:  { ar: "لينكدإن",    en: "LinkedIn" },
  instagram: { ar: "إنستغرام",    en: "Instagram" },
  facebook:  { ar: "فيسبوك",     en: "Facebook" },
  youtube:   { ar: "يوتيوب",     en: "YouTube" },
  tiktok:    { ar: "تيك توك",    en: "TikTok" },
  snapchat:  { ar: "سناب شات",   en: "Snapchat" },
  whatsapp:  { ar: "واتساب",     en: "WhatsApp" },
  pinterest: { ar: "بنترست",     en: "Pinterest" },
};

// Per-platform brand tint for the social card chrome.
const platformTint: Record<string, string> = {
  twitter:   "bg-black text-white",
  linkedin:  "bg-[#0A66C2] text-white",
  instagram: "bg-gradient-to-br from-[#FFDC80] via-[#E1306C] to-[#5851DB] text-white",
  facebook:  "bg-[#1877F2] text-white",
  youtube:   "bg-[#FF0000] text-white",
  tiktok:    "bg-black text-white",
  snapchat:  "bg-[#FFFC00] text-black",
  whatsapp:  "bg-[#25D366] text-white",
  pinterest: "bg-[#E60023] text-white",
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ═══════════════════════════════════════════════════════════════════
   Component
   ─────────────────────────────────────────────────────────────────── */

const DevWebsiteAnalysis: React.FC<Props> = ({ developerName, developerId, isAr, autoUrl }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState(autoUrl || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [failure, setFailure] = useState<FailureDx | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (autoUrl || url) return;
    supabase.from("developers").select("website").eq("id", developerId).maybeSingle()
      .then(({ data }) => {
        if (!mountedRef.current) return;
        if (data?.website) setUrl(data.website);
      });
  }, [developerId, autoUrl, url]);

  const normaliseUrl = (raw: string): string | null => {
    let v = raw.trim();
    if (!v) return null;
    v = v.replace(/^['"]+|['"]+$/g, "");
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try {
      const u = new URL(v);
      if (!u.hostname || !u.hostname.includes(".")) return null;
      return u.toString().replace(/\/+$/, "");
    } catch {
      return null;
    }
  };

  const analyze = async () => {
    const cleaned = normaliseUrl(url);
    if (!cleaned) {
      toast({
        variant: "destructive",
        title: isAr ? "رابط غير صالح" : "Invalid URL",
        description: isAr
          ? "يرجى إدخال رابط مثل example.com أو https://example.com"
          : "Enter a URL like example.com or https://example.com",
      });
      return;
    }
    if (cleaned !== url) setUrl(cleaned);

    setLoading(true);
    setResult(null);
    setFailure(null);
    setShowTechnical(false);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-developer-website", {
        body: { website: cleaned, developer_id: developerId },
      });

      if (error) {
        if (!mountedRef.current) return;
        const dx = classifyFailure(error.message || "Function invocation failed", undefined, undefined, undefined);
        setFailure(dx);
        toast({ variant: "destructive", title: isAr ? dx.title_ar : dx.title_en, description: isAr ? dx.hint_ar : dx.hint_en });
        return;
      }

      if (!data?.success) {
        if (!mountedRef.current) return;
        const dx = classifyFailure(
          data?.error,
          data?.details,
          typeof data?.status === "number" ? data.status : undefined,
          Array.isArray(data?.attempted) ? data.attempted : undefined,
        );
        setFailure(dx);
        toast({ variant: "destructive", title: isAr ? dx.title_ar : dx.title_en, description: isAr ? dx.hint_ar : dx.hint_en });
        return;
      }

      if (!mountedRef.current) return;
      setResult(data.result as AnalysisResult);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      const dx = classifyFailure(msg, undefined, undefined, undefined);
      setFailure(dx);
      toast({ variant: "destructive", title: isAr ? dx.title_ar : dx.title_en, description: isAr ? dx.hint_ar : dx.hint_en });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      {/* URL input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder={isAr ? "مثال: example.com أو https://example.com" : "e.g. example.com or https://example.com"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="ps-9 text-sm rounded-xl h-11"
            dir="ltr"
            onKeyDown={(e) => e.key === "Enter" && analyze()}
          />
        </div>
        <Button onClick={analyze} disabled={loading} size="sm" className="h-11 px-5 rounded-xl gap-2 font-medium">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AreaChart className="h-4 w-4" />}
          {isAr ? "تحليل شامل" : "Run Analysis"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-border/50 bg-card/60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            {isAr ? "نُحلِّل المحتوى..." : "Analysing content..."}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-sm text-center">
            {isAr
              ? "نزور صفحات المشاريع والأخبار، ونثري حسابات السوشيال ميديا — قد يستغرق ذلك حتى ٢٠ ثانية."
              : "Visiting project, news pages and enriching social profiles — may take up to 20s."}
          </p>
        </div>
      )}

      {/* Failure card */}
      {failure && !loading && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300/60 dark:border-amber-400/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {isAr ? failure.title_ar : failure.title_en}
              </h4>
              <p className="text-[13px] text-amber-800/90 dark:text-amber-100/80 mt-1 leading-relaxed">
                {isAr ? failure.hint_ar : failure.hint_en}
              </p>
              {failure.attempted && failure.attempted.length > 0 && (
                <div className="mt-3 text-[11px] text-amber-800/80 dark:text-amber-100/70" dir="ltr">
                  <span className="font-semibold">{isAr ? "الروابط التي تمّت تجربتها:" : "URLs attempted:"}</span>
                  <ul className="mt-1 space-y-0.5">
                    {failure.attempted.map((u, i) => (<li key={i} className="font-mono break-all">• {u}</li>))}
                  </ul>
                </div>
              )}
              <div className="mt-3 flex items-center gap-3">
                <Button type="button" variant="ghost" size="sm"
                  className="h-7 px-2 text-[11px] text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                  onClick={() => setShowTechnical((v) => !v)}>
                  {showTechnical ? (isAr ? "إخفاء التفاصيل التقنية" : "Hide technical detail") : (isAr ? "عرض التفاصيل التقنية" : "Show technical detail")}
                </Button>
                <Button type="button" variant="ghost" size="sm"
                  className="h-7 px-2 text-[11px] text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                  onClick={() => setFailure(null)}>
                  {isAr ? "إغلاق" : "Dismiss"}
                </Button>
              </div>
              {showTechnical && failure.technical && (
                <pre className="mt-2 text-[10.5px] font-mono bg-amber-100/60 dark:bg-amber-500/15 border border-amber-300/40 dark:border-amber-400/20 rounded-lg p-2.5 whitespace-pre-wrap break-all text-amber-900/90 dark:text-amber-100/90 max-h-32 overflow-y-auto" dir="ltr">
                  {failure.technical}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Hero band */}
          <div className="relative p-5 md:p-6 border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="absolute top-3 end-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pe-10">
              <div className={`shrink-0 h-16 w-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-offset-background ${bandStyles[result.score_band].ring}`}>
                {result.company.logo_url ? (
                  <img src={result.company.logo_url} alt={result.company.name} className="h-full w-full object-contain p-2"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <Building2 className="h-7 w-7 text-primary" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg md:text-xl font-bold text-foreground truncate">
                  {result.company.name || result.developer_name || developerName}
                </h3>
                {result.company.legal_name && result.company.legal_name !== result.company.name && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{result.company.legal_name}</p>
                )}
                {result.company.tagline && (
                  <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2 leading-snug">{result.company.tagline}</p>
                )}
                <a href={result.website} target="_blank" rel="noopener noreferrer"
                  className="text-[11.5px] text-primary hover:underline inline-flex items-center gap-1.5 mt-1.5" dir="ltr">
                  {result.website} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <div className={`flex items-baseline gap-0.5 px-3 py-2 rounded-xl border ${bandStyles[result.score_band].cls}`} dir="ltr">
                  <span className="text-3xl font-extrabold tabular-nums">{result.score}</span>
                  <span className="text-xs opacity-70">/100</span>
                </div>
                <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 ${bandStyles[result.score_band].cls}`}>
                  {isAr ? bandStyles[result.score_band].ar : bandStyles[result.score_band].en}
                </Badge>
              </div>
            </div>
          </div>

          {/* KPIs (5 content metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border/40 border-b border-border/50">
            <Kpi
              icon={<Briefcase className="h-4 w-4" />}
              label={isAr ? "المشاريع" : "Projects"}
              value={result.projects.pages_found}
              sub={result.projects.detailed_items.length > 0
                ? (isAr ? `${result.projects.detailed_items.length} موثَّق` : `${result.projects.detailed_items.length} documented`)
                : (isAr ? "غير منشور" : "not published")}
              tone={result.projects.detailed_items.length >= 3 ? "good" : result.projects.pages_found > 0 ? "fair" : "muted"}
            />
            <Kpi
              icon={<Newspaper className="h-4 w-4" />}
              label={isAr ? "الأخبار" : "News"}
              value={result.news.articles.length}
              sub={result.news.recent_in_last_year > 0
                ? (isAr ? `${result.news.recent_in_last_year} حديثة` : `${result.news.recent_in_last_year} recent`)
                : (isAr ? "—" : "—")}
              tone={result.news.recent_in_last_year >= 2 ? "good" : result.news.articles.length > 0 ? "fair" : "muted"}
            />
            <Kpi
              icon={<Share2 className="h-4 w-4" />}
              label={isAr ? "السوشيال" : "Social"}
              value={result.social_presence.count}
              sub={result.social_presence.accessible_count > 0
                ? (isAr ? `${result.social_presence.accessible_count} متاحة` : `${result.social_presence.accessible_count} readable`)
                : (isAr ? "روابط فقط" : "links only")}
              tone={result.social_presence.count >= 3 ? "good" : result.social_presence.count > 0 ? "fair" : "muted"}
            />
            <Kpi
              icon={<MapPin className="h-4 w-4" />}
              label={isAr ? "المكاتب" : "Offices"}
              value={result.expansion.office_locations_count}
              sub={result.expansion.international ? (isAr ? "دولي" : "International") : (isAr ? "محلي" : "Domestic")}
              tone={result.expansion.office_locations_count >= 2 ? "good" : "muted"}
            />
            <Kpi
              icon={<LanguagesIcon className="h-4 w-4" />}
              label={isAr ? "اللغات" : "Languages"}
              value={result.expansion.languages_supported.length}
              sub={result.expansion.languages_supported.slice(0, 3).join(" / ").toUpperCase() || "—"}
              tone={result.expansion.languages_supported.length >= 2 ? "good" : "muted"}
            />
          </div>

          <div className="p-5 md:p-6 space-y-6">
            {/* About */}
            {(result.company.description || result.company.founded || result.company.headquarters || result.company.industry) && (
              <Section title={isAr ? "نبذة عن الشركة" : "About the Company"} icon={<Building2 className="h-3.5 w-3.5" />}>
                {result.company.description && (
                  <p className="text-[13.5px] text-foreground leading-relaxed mb-3">{result.company.description}</p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.company.founded && (
                    <DataRow icon={<Calendar className="h-3.5 w-3.5" />} label={isAr ? "سنة التأسيس" : "Founded"} value={result.company.founded} />
                  )}
                  {result.company.headquarters && (
                    <DataRow icon={<MapPin className="h-3.5 w-3.5" />} label={isAr ? "المقر الرئيسي" : "Headquarters"} value={result.company.headquarters} />
                  )}
                  {result.company.industry && (
                    <DataRow icon={<Briefcase className="h-3.5 w-3.5" />} label={isAr ? "المجال" : "Industry"} value={result.company.industry} />
                  )}
                </div>
              </Section>
            )}

            {/* Projects — detailed cards */}
            {(result.projects.has_dedicated_section || result.projects.detailed_items.length > 0) && (
              <Section
                title={isAr ? "محفظة المشاريع" : "Project Portfolio"}
                icon={<Briefcase className="h-3.5 w-3.5" />}
                badge={result.projects.pages_found > 0 ? `${result.projects.pages_found}` : undefined}
                action={result.projects.listing_url ? (
                  <a href={result.projects.listing_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? "زيارة قسم المشاريع" : "Visit projects"} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : undefined}
              >
                {result.projects.detailed_items.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.projects.detailed_items.map((p, i) => (
                      <ProjectCardView key={i} project={p} isAr={isAr} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-muted-foreground">
                    {isAr
                      ? "وُجد قسم مشاريع لكن لم نتمكن من قراءة تفاصيل المشاريع الفردية آلياً."
                      : "Portfolio section detected but per-project details could not be machine-read."}
                  </p>
                )}
              </Section>
            )}

            {/* News — detailed cards */}
            {(result.news.has_section || result.news.articles.length > 0) && (
              <Section
                title={isAr ? "الأخبار والنشاط الإعلامي" : "News & Press Activity"}
                icon={<Newspaper className="h-3.5 w-3.5" />}
                badge={result.news.pages_found > 0 ? `${result.news.pages_found}` : undefined}
                action={result.news.listing_url ? (
                  <a href={result.news.listing_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? "قسم الأخبار" : "Newsroom"} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : undefined}
              >
                {result.news.recent_in_last_year > 0 && (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-400/30 px-3 py-1 text-[11.5px] text-emerald-700 dark:text-emerald-200 font-medium">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {isAr
                      ? `${result.news.recent_in_last_year} خبر منشور خلال آخر ١٢ شهر`
                      : `${result.news.recent_in_last_year} item${result.news.recent_in_last_year === 1 ? "" : "s"} published in last 12 months`}
                  </div>
                )}
                {result.news.articles.length > 0 ? (
                  <div className="space-y-2">
                    {result.news.articles.slice(0, 8).map((a, i) => (
                      <NewsCardView key={i} article={a} isAr={isAr} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-muted-foreground">
                    {isAr ? "وُجد قسم الأخبار لكن لم نستخرج عناوين جاهزة." : "News section found but headlines could not be extracted."}
                  </p>
                )}
              </Section>
            )}

            {/* Events */}
            {(result.events.pages_found > 0 || result.events.sample_titles.length > 0) && (
              <Section
                title={isAr ? "الفعاليات والاجتماعات" : "Events & Meetings"}
                icon={<CalendarDays className="h-3.5 w-3.5" />}
                badge={result.events.pages_found > 0 ? `${result.events.pages_found}` : undefined}
                action={result.events.listing_url ? (
                  <a href={result.events.listing_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? "زيارة الفعاليات" : "Visit events"} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : undefined}
              >
                {result.events.sample_titles.length > 0 ? (
                  <ul className="grid sm:grid-cols-2 gap-1.5">
                    {result.events.sample_titles.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-foreground rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{t}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12.5px] text-muted-foreground">
                    {isAr ? "وُجد قسم فعاليات لكن العناوين غير قابلة للقراءة آلياً." : "Events section detected but titles not machine-readable."}
                  </p>
                )}
              </Section>
            )}

            {/* Social — enriched cards */}
            {result.social_presence.platforms.length > 0 && (
              <Section
                title={isAr ? "حسابات التواصل الاجتماعي" : "Social Media Accounts"}
                icon={<Share2 className="h-3.5 w-3.5" />}
                badge={`${result.social_presence.count}`}
              >
                {result.social_presence.accessible_count < result.social_presence.count && (
                  <p className="text-[11.5px] text-muted-foreground mb-3 flex items-start gap-1.5">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      {isAr
                        ? "بعض المنصّات (مثل تويتر/X وإنستغرام وفيسبوك) تحجب القراءة الآلية للزوّار غير المسجَّلين، فيظهر الرابط فقط."
                        : "Some platforms (e.g. X/Twitter, Instagram, Facebook) block anonymous bots, so we show the link only."}
                    </span>
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.social_presence.platforms.map((s, i) => (
                    <SocialCard key={i} platform={s} isAr={isAr} />
                  ))}
                </div>
              </Section>
            )}

            {/* Expansion */}
            {(result.expansion.addresses.length > 0
              || result.expansion.languages_supported.length > 0
              || result.careers.has_careers_page
              || result.expansion.international) && (
              <Section title={isAr ? "التوسُّع والنمو" : "Expansion & Growth"} icon={<TrendingUp className="h-3.5 w-3.5" />}>
                <div className="grid md:grid-cols-2 gap-3">
                  {result.expansion.addresses.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {isAr ? `المواقع (${result.expansion.office_locations_count})` : `Locations (${result.expansion.office_locations_count})`}
                      </div>
                      <ul className="space-y-1">
                        {result.expansion.addresses.map((a, i) => (
                          <li key={i} className="text-[12.5px] text-foreground flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                            <span>{a.full || [a.city, a.country].filter(Boolean).join(", ") || "—"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.expansion.languages_supported.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">
                        <LanguagesIcon className="h-3 w-3" />
                        {isAr ? "اللغات المدعومة" : "Supported Languages"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.expansion.languages_supported.map((l, i) => (
                          <span key={i} className="text-[11px] font-mono uppercase rounded-md border border-border bg-background px-2 py-0.5">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.careers.has_careers_page && (
                    <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-400/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">
                        <Users className="h-3 w-3" />
                        {isAr ? "صفحة وظائف نشطة" : "Active careers page"}
                      </div>
                      <p className="text-[12px] text-emerald-800/90 dark:text-emerald-100/80">
                        {isAr ? "مؤشِّر إيجابي على نمو الفريق والشركة." : "Positive signal of team & company growth."}
                      </p>
                      {result.careers.listing_url && (
                        <a href={result.careers.listing_url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 dark:text-emerald-200 hover:underline inline-flex items-center gap-1 mt-1">
                          {isAr ? "عرض صفحة الوظائف" : "View careers page"} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                  {result.expansion.international && (
                    <div className="rounded-xl border border-blue-200/60 dark:border-blue-400/30 bg-blue-50/60 dark:bg-blue-500/10 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">
                        <Sparkles className="h-3 w-3" />
                        {isAr ? "حضور دولي" : "International presence"}
                      </div>
                      <p className="text-[12px] text-blue-800/90 dark:text-blue-100/80">
                        {isAr ? "الموقع متاح بأكثر من لغة، مما يوحي بسوق دولي." : "Site published in 2+ languages — suggests international market reach."}
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Trust signals (content-relevant only) */}
            <Section title={isAr ? "مؤشِّرات الثقة" : "Trust Signals"} icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Trust label={isAr ? "شعار الشركة" : "Company logo"} ok={result.trust_signals.has_logo} />
                <Trust label={isAr ? "وصف واضح للشركة" : "Clear company description"} ok={result.trust_signals.has_clear_description} />
                <Trust label={isAr ? "صفحة من نحن" : "About page"} ok={result.trust_signals.has_about_page} />
                <Trust label={isAr ? "صفحة اتصال" : "Contact page"} ok={result.trust_signals.has_contact_page} />
                <Trust label={isAr ? "بيانات منظَّمة موثَّقة" : "Verified structured data"} ok={result.trust_signals.has_organization_schema} />
              </div>
            </Section>

            {/* Score breakdown */}
            <Section title={isAr ? "كيف احتُسبت الدرجة؟" : "How the score was computed"} icon={<Gauge className="h-3.5 w-3.5" />}>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {result.score_breakdown.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    s.passed
                      ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-500/5"
                      : "border-border/40 bg-background/40"
                  }`}>
                    {s.passed
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      : <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
                    <span className={`text-[12.5px] flex-1 ${s.passed ? "text-foreground" : "text-muted-foreground"}`}>
                      {isAr ? s.label_ar : s.label_en}
                    </span>
                    {s.value && (
                      <span className="text-[10.5px] tabular-nums font-mono text-muted-foreground" dir="ltr">{s.value}</span>
                    )}
                    <span className={`text-[10.5px] tabular-nums font-bold shrink-0 ${
                      s.passed ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground/60"
                    }`} dir="ltr">{s.passed ? `+${s.weight}` : `0/${s.weight}`}</span>
                  </div>
                ))}
              </div>
            </Section>

            <p className="text-[10.5px] text-muted-foreground text-center pt-3 border-t border-border/30">
              {isAr
                ? `تمّ التحليل في ${new Date(result.fetched_at).toLocaleString("ar-SA-u-nu-latn")} • محتوى مستخرج مباشرةً من الموقع وحسابات السوشيال ميديا — بلا ذكاء اصطناعي`
                : `Analysed at ${new Date(result.fetched_at).toLocaleString("en-US")} • Content extracted directly from the website & social profiles — no AI`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Sub-components
   ─────────────────────────────────────────────────────────────────── */

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, badge, action, children }) => (
  <section>
    <div className="flex items-center justify-between gap-3 mb-3">
      <h5 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {icon}
        {title}
        {badge && (
          <span className="ms-1 text-[10.5px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 tabular-nums" dir="ltr">
            {badge}
          </span>
        )}
      </h5>
      {action}
    </div>
    {children}
  </section>
);

const Kpi: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  tone: "good" | "fair" | "muted";
}> = ({ icon, label, value, sub, tone }) => {
  const toneCls =
    tone === "good"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "fair"
        ? "text-amber-700 dark:text-amber-300"
        : "text-muted-foreground";
  return (
    <div className="bg-card p-3 md:p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <span className={toneCls}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none mt-1" dir="ltr">{value}</p>
      {sub && <p className="text-[10.5px] text-muted-foreground line-clamp-1">{sub}</p>}
    </div>
  );
};

const DataRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2 min-w-0">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
      {icon}
      {label}
    </div>
    <p className="text-[13px] font-medium text-foreground truncate" title={value}>{value}</p>
  </div>
);

const Trust: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
    ok
      ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-500/5"
      : "border-border/40 bg-background/40"
  }`}>
    {ok
      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
    <span className={`text-[12px] line-clamp-2 leading-tight ${ok ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
  </div>
);

const ProjectCardView: React.FC<{ project: ProjectCard; isAr: boolean }> = ({ project, isAr }) => (
  <a
    href={project.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex flex-col rounded-xl border border-border/40 bg-background/50 hover:bg-primary/5 hover:border-primary/30 overflow-hidden transition-colors"
  >
    {project.image_url ? (
      <div className="relative h-36 w-full bg-muted overflow-hidden">
        <img
          src={project.image_url}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.style.display = "none";
            const sib = img.nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = "flex";
          }}
        />
        <div className="hidden absolute inset-0 items-center justify-center bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>
    ) : (
      <div className="h-36 w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <Trophy className="h-9 w-9 text-amber-500/60" />
      </div>
    )}
    <div className="p-3 flex-1 flex flex-col gap-1.5">
      <h6 className="text-[13.5px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {project.title}
      </h6>
      {project.location && (
        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {project.location}
        </p>
      )}
      {project.summary && (
        <p className="text-[12px] text-muted-foreground line-clamp-3 leading-snug">{project.summary}</p>
      )}
      <span className="mt-auto text-[10.5px] text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isAr ? "زيارة المشروع" : "Visit project"} <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  </a>
);

const NewsCardView: React.FC<{ article: NewsArticle; isAr: boolean }> = ({ article, isAr }) => (
  <a
    href={article.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-stretch gap-3 rounded-lg border border-border/40 bg-background/50 hover:bg-primary/5 hover:border-primary/30 overflow-hidden transition-colors"
  >
    {article.image_url ? (
      <div className="shrink-0 w-24 sm:w-32 bg-muted overflow-hidden">
        <img
          src={article.image_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
        />
      </div>
    ) : (
      <div className="shrink-0 w-12 sm:w-14 bg-primary/10 flex items-center justify-center">
        <Newspaper className="h-5 w-5 text-primary" />
      </div>
    )}
    <div className="py-2 pe-3 flex-1 min-w-0 flex flex-col gap-1">
      <p className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {article.title}
      </p>
      {article.summary && (
        <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-snug">{article.summary}</p>
      )}
      <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
        {article.date && (
          <span className="tabular-nums" dir="ltr">{article.date}</span>
        )}
        {article.date && <span className="opacity-40">•</span>}
        <span className="inline-flex items-center gap-1">
          {isAr ? "قراءة الخبر" : "Read"} <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </div>
  </a>
);

const SocialCard: React.FC<{ platform: SocialPlatform; isAr: boolean }> = ({ platform, isAr }) => {
  const lbl = platformLabel[platform.platform] || { ar: platform.platform, en: platform.platform };
  const tint = platformTint[platform.platform] || "bg-primary/10 text-primary";
  const profile = platform.profile;

  return (
    <a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border/40 bg-background/50 hover:border-primary/30 overflow-hidden transition-colors"
    >
      {/* Header strip with platform color */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2 ${tint}`}>
        <span className="inline-flex items-center gap-2 text-[12.5px] font-bold">
          <Share2 className="h-3.5 w-3.5" />
          {isAr ? lbl.ar : lbl.en}
        </span>
        {!platform.accessible && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium opacity-90">
            <Lock className="h-3 w-3" />
            {isAr ? "محمي" : "Protected"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex items-start gap-3 p-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            loading="lazy"
            className="shrink-0 h-12 w-12 rounded-full object-cover bg-muted border border-border/40"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="shrink-0 h-12 w-12 rounded-full bg-muted/60 border border-border/40 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {profile?.display_name ? (
            <p className="text-[13px] font-semibold text-foreground truncate">{profile.display_name}</p>
          ) : (
            <p className="text-[13px] font-semibold text-foreground truncate" dir="ltr">{platform.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
          )}
          {profile?.bio && (
            <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">{profile.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-[10.5px] text-muted-foreground">
            {profile?.followers && (
              <span className="inline-flex items-center gap-1 font-semibold text-foreground tabular-nums" dir="ltr">
                <Users className="h-3 w-3" />
                {profile.followers_text || formatFollowers(profile.followers)}
                <span className="font-normal text-muted-foreground">{isAr ? " متابع" : " followers"}</span>
              </span>
            )}
            {profile?.videos_count && (
              <span className="inline-flex items-center gap-1 tabular-nums" dir="ltr">
                <PlayCircle className="h-3 w-3" />
                {profile.videos_count}
                <span>{isAr ? " فيديو" : " videos"}</span>
              </span>
            )}
            {!profile && (
              <span className="inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {isAr ? "زيارة الحساب" : "Visit profile"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent items (e.g. YouTube videos) */}
      {profile?.recent_items && profile.recent_items.length > 0 && (
        <div className="border-t border-border/30 px-3 py-2 bg-muted/20">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-bold">
            {isAr ? "آخر المنشورات" : "Recent posts"}
          </p>
          <ul className="space-y-1">
            {profile.recent_items.slice(0, 3).map((it, i) => (
              <li key={i} className="text-[11.5px] text-foreground/90 line-clamp-1 flex items-start gap-1.5">
                <MessageCircle className="h-3 w-3 text-muted-foreground/60 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{it.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </a>
  );
};

export default DevWebsiteAnalysis;
