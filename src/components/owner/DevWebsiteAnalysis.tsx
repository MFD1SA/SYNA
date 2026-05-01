import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, Building2, ExternalLink, AreaChart, X, AlertTriangle,
  Briefcase, Newspaper, CalendarDays, Languages as LanguagesIcon, MapPin,
  Calendar, Image as ImageIcon, Trophy, Share2, Hash, Layers,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   v9 — project-centric report.
   The analysis is strictly limited to the developer's PROJECT
   PORTFOLIO and the supporting content the developer publishes
   themselves (news, events, office locations, social channels).
   No domain/hosting/SEO analytics, no scoring, no recommendations.
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
   Response shape — must mirror v9 edge function exactly.
   ─────────────────────────────────────────────────────────────────── */

interface ProjectCard {
  title: string;
  summary: string;
  image_url: string;
  location: string;
  status: string;
  project_type: string;
  url: string;
}

interface NewsArticle {
  title: string;
  date?: string;
  summary: string;
  image_url: string;
  url: string;
}

interface SocialLink {
  platform: string;
  url: string;
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
    listing_pages_found: number;
    listing_url: string;
    items: ProjectCard[];
    status_breakdown: Record<string, number>;
    type_breakdown: Record<string, number>;
  };

  news: {
    listing_url: string;
    recent_in_last_year: number;
    articles: NewsArticle[];
  };

  events: {
    listing_url: string;
    sample_titles: string[];
  };

  social_links: SocialLink[];

  locations: {
    offices: AddressRow[];
    languages: string[];
  };
}

interface Props { developerName: string; developerId: string; isAr: boolean; autoUrl?: string; }

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

// Per-platform brand tint for the social link chip.
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

// Status colour tone — purely visual, NOT a quality judgement.
// "completed" gets emerald, "under construction" amber, etc.
const statusTone = (statusKey: string): string => {
  const k = statusKey.toLowerCase();
  if (/complete|delivered|handed|مكتمل|منجز/i.test(k)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (/construction|progress|قيد/i.test(k)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (/coming|planned|upcoming|قريب/i.test(k)) return "bg-violet-50 text-violet-700 border-violet-200";
  if (/selling|sale|بيع/i.test(k)) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
};

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
      // Defensive normalisation — if any expected branch is missing
      // from the response (e.g. a stale edge-function version, or a
      // future shape change), substitute a safe default rather than
      // letting render-time `.length` reads on undefined throw and
      // bubble up to the global ErrorBoundary.
      const raw = (data.result || {}) as Partial<AnalysisResult>;
      const normalised: AnalysisResult = {
        website: raw.website || cleaned,
        developer_name: raw.developer_name,
        fetched_at: raw.fetched_at || new Date().toISOString(),
        company: {
          name: raw.company?.name || developerName || "",
          legal_name: raw.company?.legal_name || "",
          tagline: raw.company?.tagline || "",
          description: raw.company?.description || "",
          logo_url: raw.company?.logo_url || "",
          founded: raw.company?.founded || "",
          industry: raw.company?.industry || "",
          headquarters: raw.company?.headquarters || "",
        },
        projects: {
          listing_pages_found: raw.projects?.listing_pages_found ?? 0,
          listing_url: raw.projects?.listing_url || "",
          items: Array.isArray(raw.projects?.items) ? raw.projects!.items : [],
          status_breakdown: raw.projects?.status_breakdown || {},
          type_breakdown: raw.projects?.type_breakdown || {},
        },
        news: {
          listing_url: raw.news?.listing_url || "",
          recent_in_last_year: raw.news?.recent_in_last_year ?? 0,
          articles: Array.isArray(raw.news?.articles) ? raw.news!.articles : [],
        },
        events: {
          listing_url: raw.events?.listing_url || "",
          sample_titles: Array.isArray(raw.events?.sample_titles) ? raw.events!.sample_titles : [],
        },
        social_links: Array.isArray(raw.social_links) ? raw.social_links : [],
        locations: {
          offices: Array.isArray(raw.locations?.offices) ? raw.locations!.offices : [],
          languages: Array.isArray(raw.locations?.languages) ? raw.locations!.languages : [],
        },
      };
      setResult(normalised);
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
          {isAr ? "تحليل المشاريع" : "Analyze Projects"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-border/50 bg-card/60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            {isAr ? "نُحلِّل مشاريع المطور..." : "Analyzing the developer's projects..."}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-sm text-center">
            {isAr
              ? "نزور صفحات المشاريع ونستخرج تفاصيل كل مشروع منشور — قد يستغرق ذلك حتى ٢٠ ثانية."
              : "Visiting project pages and extracting per-project detail — may take up to 20s."}
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
          {/* Header — company identity, no score */}
          <div className="relative p-5 md:p-6 border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="absolute top-3 end-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pe-10">
              <div className="shrink-0 h-16 w-16 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden">
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
            </div>
          </div>

          {/* Quick numbers — pure factual counts of what was extracted. */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border/40 border-b border-border/50">
            <Kpi
              icon={<Briefcase className="h-4 w-4" />}
              label={isAr ? "المشاريع" : "Projects"}
              value={result.projects.items.length}
              sub={result.projects.listing_pages_found > 0
                ? (isAr ? `${result.projects.listing_pages_found} قسم` : `${result.projects.listing_pages_found} section${result.projects.listing_pages_found === 1 ? "" : "s"}`)
                : (isAr ? "—" : "—")}
            />
            <Kpi
              icon={<Newspaper className="h-4 w-4" />}
              label={isAr ? "الأخبار" : "News"}
              value={result.news.articles.length}
              sub={result.news.recent_in_last_year > 0
                ? (isAr ? `${result.news.recent_in_last_year} حديثة` : `${result.news.recent_in_last_year} recent`)
                : (isAr ? "—" : "—")}
            />
            <Kpi
              icon={<Share2 className="h-4 w-4" />}
              label={isAr ? "السوشيال" : "Social"}
              value={result.social_links.length}
              sub={result.social_links.length > 0
                ? result.social_links.slice(0, 3).map((s) => platformLabel[s.platform]?.[isAr ? "ar" : "en"] || s.platform).join(" · ")
                : (isAr ? "—" : "—")}
            />
            <Kpi
              icon={<MapPin className="h-4 w-4" />}
              label={isAr ? "المكاتب" : "Offices"}
              value={result.locations.offices.length}
              sub={result.locations.offices[0]?.country || result.locations.offices[0]?.city || (isAr ? "—" : "—")}
            />
            <Kpi
              icon={<LanguagesIcon className="h-4 w-4" />}
              label={isAr ? "اللغات" : "Languages"}
              value={result.locations.languages.length}
              sub={result.locations.languages.slice(0, 3).join(" / ").toUpperCase() || "—"}
            />
          </div>

          <div className="p-5 md:p-6 space-y-6">
            {/* Projects — the centerpiece. */}
            <Section
              title={isAr ? "محفظة المشاريع" : "Project Portfolio"}
              icon={<Briefcase className="h-3.5 w-3.5" />}
              badge={result.projects.items.length > 0 ? `${result.projects.items.length}` : undefined}
              action={result.projects.listing_url ? (
                <a href={result.projects.listing_url} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                  {isAr ? "زيارة قسم المشاريع" : "Visit projects"} <ExternalLink className="h-3 w-3" />
                </a>
              ) : undefined}
            >
              {/* Status & type breakdown — factual counts, no judgment. */}
              {(Object.keys(result.projects.status_breakdown).length > 0 || Object.keys(result.projects.type_breakdown).length > 0) && (
                <div className="mb-4 grid sm:grid-cols-2 gap-3">
                  {Object.keys(result.projects.status_breakdown).length > 0 && (
                    <BreakdownStrip
                      icon={<Layers className="h-3 w-3" />}
                      label={isAr ? "حالة المشاريع" : "Project Status"}
                      entries={Object.entries(result.projects.status_breakdown)}
                      isAr={isAr}
                      tonePicker={statusTone}
                    />
                  )}
                  {Object.keys(result.projects.type_breakdown).length > 0 && (
                    <BreakdownStrip
                      icon={<Hash className="h-3 w-3" />}
                      label={isAr ? "نوع المشروع" : "Project Type"}
                      entries={Object.entries(result.projects.type_breakdown)}
                      isAr={isAr}
                      tonePicker={() => "bg-gray-50 text-gray-700 border-gray-200"}
                    />
                  )}
                </div>
              )}

              {result.projects.items.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.projects.items.map((p, i) => (
                    <ProjectCardView key={i} project={p} isAr={isAr} />
                  ))}
                </div>
              ) : result.projects.listing_pages_found > 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  {isAr
                    ? "وُجد قسم مشاريع لكن لم نتمكن من قراءة تفاصيل المشاريع الفردية آلياً."
                    : "Portfolio section detected but per-project details could not be machine-read."}
                </p>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">
                  {isAr
                    ? "لم نعثر على قسم مشاريع منشور على الموقع."
                    : "No published projects section was found on the website."}
                </p>
              )}
            </Section>

            {/* About — factual company information from JSON-LD / about page. */}
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

            {/* News */}
            {result.news.articles.length > 0 && (
              <Section
                title={isAr ? "الأخبار والإعلانات" : "News & Announcements"}
                icon={<Newspaper className="h-3.5 w-3.5" />}
                badge={`${result.news.articles.length}`}
                action={result.news.listing_url ? (
                  <a href={result.news.listing_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? "قسم الأخبار" : "Newsroom"} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : undefined}
              >
                <div className="space-y-2">
                  {result.news.articles.slice(0, 8).map((a, i) => (
                    <NewsCardView key={i} article={a} isAr={isAr} />
                  ))}
                </div>
              </Section>
            )}

            {/* Events */}
            {result.events.sample_titles.length > 0 && (
              <Section
                title={isAr ? "الفعاليات" : "Events"}
                icon={<CalendarDays className="h-3.5 w-3.5" />}
                badge={`${result.events.sample_titles.length}`}
                action={result.events.listing_url ? (
                  <a href={result.events.listing_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? "زيارة الفعاليات" : "Visit events"} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : undefined}
              >
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {result.events.sample_titles.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-foreground rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{t}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Social channels — links only, no enrichment. */}
            {result.social_links.length > 0 && (
              <Section
                title={isAr ? "قنوات التواصل الاجتماعي" : "Social Channels"}
                icon={<Share2 className="h-3.5 w-3.5" />}
                badge={`${result.social_links.length}`}
              >
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.social_links.map((s, i) => (
                    <SocialLinkChip key={i} link={s} isAr={isAr} />
                  ))}
                </div>
              </Section>
            )}

            {/* Office locations & languages — factual list, zero recommendation language. */}
            {(result.locations.offices.length > 0 || result.locations.languages.length > 0) && (
              <Section title={isAr ? "المواقع واللغات" : "Locations & Languages"} icon={<MapPin className="h-3.5 w-3.5" />}>
                <div className="grid md:grid-cols-2 gap-3">
                  {result.locations.offices.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {isAr ? `المكاتب (${result.locations.offices.length})` : `Offices (${result.locations.offices.length})`}
                      </div>
                      <ul className="space-y-1">
                        {result.locations.offices.map((a, i) => (
                          <li key={i} className="text-[12.5px] text-foreground flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                            <span>{a.full || [a.city, a.country].filter(Boolean).join(", ") || "—"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.locations.languages.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">
                        <LanguagesIcon className="h-3 w-3" />
                        {isAr ? "اللغات المنشورة" : "Published Languages"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.locations.languages.map((l, i) => (
                          <span key={i} className="text-[11px] font-mono uppercase rounded-md border border-border bg-background px-2 py-0.5">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            <p className="text-[10.5px] text-muted-foreground text-center pt-3 border-t border-border/30">
              {isAr
                ? `تمّ التحليل في ${new Date(result.fetched_at).toLocaleString("ar-SA-u-nu-latn")} • محتوى مستخرج مباشرةً من صفحات المطور — بلا ذكاء اصطناعي وبلا توصيات`
                : `Analyzed at ${new Date(result.fetched_at).toLocaleString("en-US")} • Content extracted directly from the developer's pages — no AI, no recommendations`}
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
}> = ({ icon, label, value, sub }) => (
  <div className="bg-card p-3 md:p-4 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none mt-1" dir="ltr">{value}</p>
    {sub && <p className="text-[10.5px] text-muted-foreground line-clamp-1">{sub}</p>}
  </div>
);

const DataRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2 min-w-0">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
      {icon}
      {label}
    </div>
    <p className="text-[13px] font-medium text-foreground truncate" title={value}>{value}</p>
  </div>
);

// Renders a "Status: 5 completed · 3 under construction" style chip strip.
// Pure facts, never editorialized.
const BreakdownStrip: React.FC<{
  icon: React.ReactNode;
  label: string;
  entries: [string, number][];
  isAr: boolean;
  tonePicker: (key: string) => string;
}> = ({ icon, label, entries, tonePicker }) => (
  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">
      {icon}
      {label}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, count], i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${tonePicker(key)}`}
        >
          <span>{key}</span>
          <span className="tabular-nums font-bold" dir="ltr">{count}</span>
        </span>
      ))}
    </div>
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
        {/* Status chip overlay — only when present in source. */}
        {project.status && (
          <span className={`absolute top-2 start-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${statusTone(project.status)}`}>
            {project.status}
          </span>
        )}
      </div>
    ) : (
      <div className="relative h-36 w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <Trophy className="h-9 w-9 text-amber-500/60" />
        {project.status && (
          <span className={`absolute top-2 start-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${statusTone(project.status)}`}>
            {project.status}
          </span>
        )}
      </div>
    )}
    <div className="p-3 flex-1 flex flex-col gap-1.5">
      <h6 className="text-[13.5px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {project.title}
      </h6>
      <div className="flex flex-wrap items-center gap-1.5">
        {project.project_type && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 border border-border/40 px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
            <Hash className="h-2.5 w-2.5" />
            {project.project_type}
          </span>
        )}
        {project.location && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 border border-border/40 px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {project.location}
          </span>
        )}
      </div>
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

const SocialLinkChip: React.FC<{ link: SocialLink; isAr: boolean }> = ({ link, isAr }) => {
  const lbl = platformLabel[link.platform] || { ar: link.platform, en: link.platform };
  const tint = platformTint[link.platform] || "bg-primary/10 text-primary";
  const handle = link.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 hover:border-primary/30 overflow-hidden transition-colors"
    >
      <div className={`shrink-0 h-11 w-11 flex items-center justify-center ${tint}`}>
        <Share2 className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 pe-3 py-1">
        <p className="text-[12.5px] font-semibold text-foreground truncate">{isAr ? lbl.ar : lbl.en}</p>
        <p className="text-[10.5px] text-muted-foreground truncate" dir="ltr">{handle}</p>
      </div>
      <ExternalLink className="h-3 w-3 me-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
    </a>
  );
};

export default DevWebsiteAnalysis;
