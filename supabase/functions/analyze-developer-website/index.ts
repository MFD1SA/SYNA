// ═══════════════════════════════════════════════════════════════════════
// SINA — Developer Website Analyzer (site-only, no external AI)
// ═══════════════════════════════════════════════════════════════════════
// Fetches the developer's public website and derives a factual snapshot
// from the HTML itself (meta tags, Open Graph, schema.org JSON-LD,
// detected social links, heading counts, security signals, etc).
// NO external AI call. NO hallucinated content. If a signal isn't in the
// HTML we say so explicitly.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Helpers ─────────────────────────────────────────────────────────
function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

function extractMeta(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  return m ? m[1].trim().replace(/\s+/g, " ").slice(0, 400) : "";
}

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

function detectSocials(html: string): { platform: string; url: string }[] {
  const patterns: Array<[string, RegExp]> = [
    ["twitter",    /https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]{1,40}/gi],
    ["linkedin",   /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9-]{1,100}/gi],
    ["instagram",  /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]{1,40}/gi],
    ["facebook",   /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|dialog)[A-Za-z0-9.]{1,70}/gi],
    ["youtube",    /https?:\/\/(?:www\.)?youtube\.com\/(?:@[A-Za-z0-9-_]{1,50}|channel\/[A-Za-z0-9-_]{1,30})/gi],
    ["tiktok",     /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._-]{1,40}/gi],
  ];
  const out: { platform: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const [platform, re] of patterns) {
    const ms = html.match(re);
    if (!ms) continue;
    for (const u of ms) {
      if (seen.has(u)) continue;
      seen.add(u);
      out.push({ platform, url: u });
      if (out.length >= 12) break;
    }
  }
  return out;
}

function parseJsonLdBlocks(html: string): unknown[] {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const trimmed = m[1].trim();
      if (!trimmed) continue;
      blocks.push(JSON.parse(trimmed));
      if (blocks.length >= 5) break;
    } catch { /* malformed JSON-LD — ignore */ }
  }
  return blocks;
}

function extractOrganizationFromLd(blocks: unknown[]): Record<string, unknown> | null {
  const flatten = (x: unknown): unknown[] =>
    Array.isArray(x) ? x.flatMap(flatten) :
    (x && typeof x === "object" && Array.isArray((x as { "@graph"?: unknown[] })["@graph"])) ? flatten((x as { "@graph": unknown[] })["@graph"]) :
    [x];
  const all = blocks.flatMap(flatten);
  const org = all.find((n) => {
    const t = (n as { "@type"?: unknown })?.["@type"];
    const types = Array.isArray(t) ? t : [t];
    return types.includes("Organization") || types.includes("Corporation") || types.includes("LocalBusiness");
  });
  return (org as Record<string, unknown>) || null;
}

// ─── Scoring ────────────────────────────────────────────────────────
interface ScoreBreakdown {
  score: number;
  band: "weak" | "fair" | "strong" | "excellent";
  signals: Array<{ label_ar: string; label_en: string; weight: number; passed: boolean; value?: string }>;
}

function computeScore(input: {
  reachable: boolean;
  https: boolean;
  status: number;
  contentLength: number;
  hasTitle: boolean;
  hasDescription: boolean;
  hasOgImage: boolean;
  hasViewport: boolean;
  hasLang: boolean;
  h1Count: number;
  socialsCount: number;
  hasStructuredData: boolean;
  hasCanonical: boolean;
  latencyMs: number;
}): ScoreBreakdown {
  const signals: ScoreBreakdown["signals"] = [
    { label_ar: "الموقع يستجيب",             label_en: "Site is reachable",          weight: 20, passed: input.reachable && input.status >= 200 && input.status < 400 },
    { label_ar: "اتصال مشفّر (HTTPS)",        label_en: "Secure connection (HTTPS)",  weight: 10, passed: input.https },
    { label_ar: "عنوان صفحة واضح",            label_en: "Clear page <title>",         weight: 8,  passed: input.hasTitle },
    { label_ar: "وصف meta مُعرَّف",            label_en: "Meta description set",       weight: 8,  passed: input.hasDescription },
    { label_ar: "عنصر H1 واحد على الأقل",     label_en: "At least one H1",            weight: 6,  passed: input.h1Count >= 1, value: String(input.h1Count) },
    { label_ar: "متوافق مع الجوال (viewport)", label_en: "Mobile viewport tag",        weight: 8,  passed: input.hasViewport },
    { label_ar: "لغة الموقع محدّدة (lang)",    label_en: "HTML lang attribute",        weight: 4,  passed: input.hasLang },
    { label_ar: "Open Graph image",           label_en: "Open Graph image",           weight: 6,  passed: input.hasOgImage },
    { label_ar: "Canonical URL",              label_en: "Canonical URL",              weight: 4,  passed: input.hasCanonical },
    { label_ar: "بيانات منظَّمة (JSON-LD)",     label_en: "Structured data (JSON-LD)",  weight: 10, passed: input.hasStructuredData },
    { label_ar: "حجم محتوى معقول",             label_en: "Reasonable content size",    weight: 6,  passed: input.contentLength > 2000 },
    { label_ar: "حضور على منصات التواصل",     label_en: "Social presence detected",   weight: 6,  passed: input.socialsCount >= 2, value: String(input.socialsCount) },
    { label_ar: "سرعة استجابة مقبولة",         label_en: "Acceptable response time",   weight: 4,  passed: input.latencyMs < 3500, value: input.latencyMs + "ms" },
  ];
  const earned = signals.filter((s) => s.passed).reduce((a, s) => a + s.weight, 0);
  const max = signals.reduce((a, s) => a + s.weight, 0);
  const score = Math.round((earned / max) * 100);
  const band: ScoreBreakdown["band"] = score >= 85 ? "excellent" : score >= 70 ? "strong" : score >= 50 ? "fair" : "weak";
  return { score, band, signals };
}

// ─── Handler ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const started = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl: string | undefined = body.website;
    const developerId: string | undefined = body.developer_id;

    if (!rawUrl && !developerId) {
      return new Response(JSON.stringify({ error: "website or developer_id required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    let website = rawUrl;
    let developerName = "";
    if (developerId) {
      const { data: d } = await admin.from("developers").select("website, company_name").eq("id", developerId).maybeSingle();
      if (!website) website = (d as { website?: string } | null)?.website ?? undefined;
      developerName = (d as { company_name?: string } | null)?.company_name ?? "";
    }
    if (!website || !website.trim()) {
      return new Response(JSON.stringify({ error: "Developer has no website on file" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const normalized = normalizeUrl(website);
    const urlObj = new URL(normalized);
    const https = urlObj.protocol === "https:";

    // Fetch with a conservative 10s timeout per attempt. Many sites
    // refuse non-browser User-Agents (Cloudflare bot challenge, WAFs)
    // so we send a realistic Chrome UA + the headers a normal browser
    // would. We also retry once with `www.` prefix if the bare host
    // fails — many small business sites only resolve under www.
    const browserHeaders: HeadersInit = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "ar,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
    };

    /** Single fetch attempt — captures body up to 400 KB. */
    async function tryFetch(targetUrl: string): Promise<{ status: number; html: string }> {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10_000);
      try {
        const res = await fetch(targetUrl, {
          signal: ac.signal,
          redirect: "follow",
          headers: browserHeaders,
        });
        let body = "";
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let total = 0;
          while (total < 400_000) {
            const { done, value } = await reader.read();
            if (done) break;
            body += decoder.decode(value, { stream: true });
            total += value.byteLength;
          }
        }
        return { status: res.status, html: body };
      } finally {
        clearTimeout(timer);
      }
    }

    let status = 0;
    let html = "";
    let reachable = false;
    let lastErr: unknown = null;
    let finalUrl = normalized;

    // Build a list of candidate URLs to try in order: as-given, then
    // the same host with `www.` if not already present.
    const candidates: string[] = [normalized];
    if (!urlObj.hostname.startsWith("www.")) {
      const alt = new URL(normalized);
      alt.hostname = "www." + alt.hostname;
      candidates.push(alt.toString().replace(/\/+$/, ""));
    }

    for (const candidate of candidates) {
      try {
        const r = await tryFetch(candidate);
        status = r.status;
        html = r.html;
        reachable = true;
        finalUrl = candidate;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!reachable) {
      const errStr = lastErr instanceof Error
        ? `${lastErr.name}: ${lastErr.message}`
        : String(lastErr);
      return new Response(JSON.stringify({
        success: false,
        error: "Could not reach website",
        details: errStr,
        website: normalized,
        attempted: candidates,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const latencyMs = Date.now() - started;

    const title = extractMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || extractMeta(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogTitle = extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDescription = extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const canonical = extractMeta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const viewport = extractMeta(html, /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i);
    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const lang = langMatch ? langMatch[1] : "";
    const h1Count = countMatches(html, /<h1[\s>]/gi);
    const h2Count = countMatches(html, /<h2[\s>]/gi);
    const h3Count = countMatches(html, /<h3[\s>]/gi);
    const imgCount = countMatches(html, /<img[\s>]/gi);
    const scriptCount = countMatches(html, /<script[\s>]/gi);
    const socials = detectSocials(html);
    const ldBlocks = parseJsonLdBlocks(html);
    const organization = extractOrganizationFromLd(ldBlocks);
    const contentLength = html.length;

    const scoring = computeScore({
      reachable, https, status, contentLength,
      hasTitle: !!title,
      hasDescription: !!description,
      hasOgImage: !!ogImage,
      hasViewport: !!viewport,
      hasLang: !!lang,
      h1Count,
      socialsCount: socials.length,
      hasStructuredData: ldBlocks.length > 0,
      hasCanonical: !!canonical,
      latencyMs,
    });

    const result = {
      website: finalUrl,
      developer_name: developerName || undefined,
      fetched_at: new Date().toISOString(),
      reachable,
      status,
      https,
      latency_ms: latencyMs,
      size_bytes: contentLength,
      snapshot: {
        page_title: title,
        meta_description: description,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image: ogImage,
        canonical_url: canonical,
        html_lang: lang,
        heading_counts: { h1: h1Count, h2: h2Count, h3: h3Count },
        image_count: imgCount,
        script_count: scriptCount,
      },
      organization_ld: organization,
      social_links: socials,
      score: scoring.score,
      score_band: scoring.band,
      score_signals: scoring.signals,
    };

    if (developerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await admin.from("developers").update({
        website_analysis: result,
        website_analyzed_at: new Date().toISOString(),
      } as any).eq("id", developerId).then(() => {}, () => {});
    }

    return new Response(JSON.stringify({ success: true, result }),
      { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: "Analysis failed",
      details: String(err),
    }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
