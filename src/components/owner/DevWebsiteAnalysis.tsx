import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, Building2, ExternalLink, AreaChart, X, CheckCircle2, XCircle,
  Share2, FileText, ShieldCheck, Gauge, Image as ImageIcon,
} from "lucide-react";

/**
 * Factual website snapshot — data pulled directly from the developer's
 * public HTML (meta tags, Open Graph, schema.org JSON-LD, social links,
 * heading counts, response time). Zero AI opinions, zero recommendations.
 */
interface Snapshot {
  page_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical_url: string;
  html_lang: string;
  heading_counts: { h1: number; h2: number; h3: number };
  image_count: number;
  script_count: number;
}
interface Signal { label_ar: string; label_en: string; weight: number; passed: boolean; value?: string }
interface AnalysisResult {
  website: string;
  developer_name?: string;
  fetched_at: string;
  reachable: boolean;
  status: number;
  https: boolean;
  latency_ms: number;
  size_bytes: number;
  snapshot: Snapshot;
  organization_ld: Record<string, unknown> | null;
  social_links: { platform: string; url: string }[];
  score: number;
  score_band: "weak" | "fair" | "strong" | "excellent";
  score_signals: Signal[];
}

interface Props { developerName: string; developerId: string; isAr: boolean; autoUrl?: string; }

const bandStyles: Record<AnalysisResult["score_band"], { ar: string; en: string; cls: string }> = {
  weak:      { ar: "ضعيف",  en: "Weak",     cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30" },
  fair:      { ar: "مقبول", en: "Fair",     cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30" },
  strong:    { ar: "قوي",   en: "Strong",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30" },
  excellent: { ar: "ممتاز", en: "Excellent", cls: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/40" },
};

const DevWebsiteAnalysis: React.FC<Props> = ({ developerName, developerId, isAr, autoUrl }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState(autoUrl || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Mounted flag — this component is rendered inside an expandable
  // panel in OwnerDashboard. If the owner collapses the panel (or
  // navigates away) before the fetch / edge-function call returns,
  // the `.then(setUrl)` / `setResult(...)` would hit an unmounted
  // component and React logs a warning. The flag short-circuits the
  // set calls.
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

  /* Normalise the URL the user typed before sending it to the edge
   * function. Accepts forms like:
   *   "waheejs.com"           → "https://waheejs.com"
   *   "www.waheejs.com"       → "https://www.waheejs.com"
   *   "http://waheejs.com"    → unchanged (user explicitly chose http)
   *   "https://waheejs.com/"  → "https://waheejs.com" (trailing slash dropped)
   * Returns null if the value can't be parsed into a valid URL. */
  const normaliseUrl = (raw: string): string | null => {
    let v = raw.trim();
    if (!v) return null;
    // Strip wrapping quotes a user might paste from a CSV
    v = v.replace(/^['"]+|['"]+$/g, "");
    // Auto-prefix protocol if missing
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try {
      const u = new URL(v);
      // Reject obviously invalid hostnames (no dot)
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
    // Reflect the cleaned URL back to the input so the user sees the
    // exact value being analysed (and the next click won't keep
    // re-prefixing).
    if (cleaned !== url) setUrl(cleaned);

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-developer-website", {
        body: { website: cleaned, developer_id: developerId },
      });
      if (error) throw error;
      if (!data?.success) {
        // Surface the edge-function's `details` string so the user
        // can tell DNS failure from TLS handshake from 404, etc.
        const detailLine = (data?.details && String(data.details).slice(0, 220)) || "";
        const errMsg = data?.error || "Analysis failed";
        throw new Error(detailLine ? `${errMsg} — ${detailLine}` : errMsg);
      }
      if (!mountedRef.current) return;
      setResult(data.result as AnalysisResult);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      toast({ variant: "destructive", title: isAr ? "خطأ في التحليل" : "Analysis Error", description: msg });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const orgName = (result?.organization_ld?.name as string) || result?.snapshot.og_title || result?.snapshot.page_title || developerName;
  const orgDesc = (result?.organization_ld?.description as string) || result?.snapshot.meta_description || result?.snapshot.og_description || "";
  const orgLogo = (result?.organization_ld?.logo as string) || result?.snapshot.og_image || "";

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      {/* URL input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            // type="text" so the browser does not pop the native
            // "please enter a URL" tooltip when the user types a bare
            // domain like "waheejs.com". We do our own validation +
            // protocol auto-prefix in `normaliseUrl`.
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
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-border/50 bg-card/60">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{isAr ? "جاري تحليل الموقع..." : "Analyzing website..."}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 h-11 w-11 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden">
                {orgLogo ? (
                  <img src={orgLogo} alt={orgName} className="h-full w-full object-contain p-1.5"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-semibold text-foreground truncate">{orgName || developerName}</h4>
                <a href={result.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 mt-0.5 truncate">
                  {result.website} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-end">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{isAr ? "درجة الأداء" : "Performance Score"}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground tabular-nums" dir="ltr">{result.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${bandStyles[result.score_band].cls}`}>
                {isAr ? bandStyles[result.score_band].ar : bandStyles[result.score_band].en}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-5 md:p-6 space-y-6">
            {/* Factual snapshot from HTML */}
            <section>
              <h5 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> {isAr ? "لقطة من الموقع" : "Site Snapshot"}
              </h5>
              {orgDesc && (
                <p className="text-[13px] text-foreground leading-relaxed mb-4">{orgDesc}</p>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Fact label={isAr ? "حالة الاتصال" : "Connection"} value={`HTTP ${result.status}`} icon={<ShieldCheck className="h-3.5 w-3.5" />} good={result.https && result.status < 400} />
                <Fact label={isAr ? "زمن الاستجابة" : "Response Time"} value={`${result.latency_ms}ms`} icon={<Gauge className="h-3.5 w-3.5" />} good={result.latency_ms < 3500} />
                <Fact label={isAr ? "حجم الصفحة" : "Page Size"} value={`${(result.size_bytes / 1024).toFixed(0)} KB`} icon={<FileText className="h-3.5 w-3.5" />} good={result.size_bytes > 2000} />
                <Fact label={isAr ? "الصور" : "Images"} value={String(result.snapshot.image_count)} icon={<ImageIcon className="h-3.5 w-3.5" />} good={result.snapshot.image_count > 0} />
                <Fact label="Title" value={result.snapshot.page_title || "—"} />
                <Fact label="H1 / H2 / H3" value={`${result.snapshot.heading_counts.h1} / ${result.snapshot.heading_counts.h2} / ${result.snapshot.heading_counts.h3}`} good={result.snapshot.heading_counts.h1 >= 1} />
                <Fact label="Canonical" value={result.snapshot.canonical_url || (isAr ? "غير موجود" : "not set")} good={!!result.snapshot.canonical_url} />
                <Fact label="Lang" value={result.snapshot.html_lang || "—"} good={!!result.snapshot.html_lang} />
              </div>
            </section>

            {/* Score breakdown */}
            <section>
              <h5 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5" /> {isAr ? "تفاصيل قياس الأداء" : "Score Breakdown"}
              </h5>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.score_signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2">
                    {s.passed
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      : <XCircle className="h-4 w-4 text-muted-foreground/60 shrink-0" />}
                    <span className="text-[12.5px] text-foreground flex-1">{isAr ? s.label_ar : s.label_en}</span>
                    {s.value && <span className="text-[10px] text-muted-foreground tabular-nums" dir="ltr">{s.value}</span>}
                    <span className="text-[10px] text-muted-foreground tabular-nums" dir="ltr">{s.passed ? `+${s.weight}` : "0"}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Social presence detected in the HTML */}
            {result.social_links.length > 0 && (
              <section>
                <h5 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5" /> {isAr ? "حسابات التواصل المرصودة" : "Detected Social Links"}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {result.social_links.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted px-2.5 py-1.5 transition-colors">
                      <Share2 className="h-3 w-3 text-primary" />
                      <span className="font-medium capitalize">{s.platform}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Organization from schema.org JSON-LD — only if present */}
            {result.organization_ld && (
              <section>
                <h5 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> {isAr ? "بيانات الشركة من JSON-LD" : "Organization (JSON-LD)"}
                </h5>
                <pre className="text-[11px] font-mono bg-muted/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto" dir="ltr">
                  {JSON.stringify(result.organization_ld, null, 2)}
                </pre>
              </section>
            )}

            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              {isAr
                ? `تم التحليل في ${new Date(result.fetched_at).toLocaleString("ar-SA-u-nu-latn")} • لا توصيات، معلومات حقيقية فقط من HTML الصفحة`
                : `Analyzed at ${new Date(result.fetched_at).toLocaleString("en-US")} • Facts only, no recommendations`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const Fact: React.FC<{ label: string; value: string; icon?: React.ReactNode; good?: boolean }> = ({ label, value, icon, good }) => (
  <div className="rounded-lg border border-border/40 bg-background/50 p-3">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
      {icon}
      {label}
    </div>
    <p className={`text-[13px] font-medium truncate ${good === false ? "text-muted-foreground" : "text-foreground"}`} title={value}>{value}</p>
  </div>
);

export default DevWebsiteAnalysis;
