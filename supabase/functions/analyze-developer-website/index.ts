// ═══════════════════════════════════════════════════════════════════════
// SINA — Developer Business Intelligence Analyzer (v6)
// ═══════════════════════════════════════════════════════════════════════
// Builds an admin/owner-facing business intelligence report on a real-
// estate developer by crawling the developer's own website. We fetch
// the homepage, classify outbound links by category (projects, news,
// events, careers, about, contact, locations, languages) and then
// fetch the most relevant sub-page in each category to extract real
// titles, images and structured data.
//
// What we DO NOT do:
//   - No external AI inference (no hallucinated "facts")
//   - No third-party news/SEO API (cost + privacy)
//   - No social-platform scraping (terms-of-service hostile)
//
// Everything reported is grounded in HTML the developer themselves
// chose to publish.
//
// Response shape is consumed by `src/components/owner/DevWebsiteAnalysis.tsx`.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Browser-grade fetch headers (some sites block non-browser UAs) ──
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

// ─── Helpers ─────────────────────────────────────────────────────────
function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

function extractMeta(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  return m ? m[1].trim().replace(/\s+/g, " ").slice(0, 500) : "";
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

/** Extract every <a href="..."> from the HTML. Returns absolute URLs. */
function extractLinks(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(html)) !== null && out.length < 1500) {
    const href = m[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      const abs = new URL(href, baseUrl).toString();
      if (!seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    } catch { /* malformed */ }
  }
  return out;
}

/** Extract text content of every <h1>, <h2>, <h3> element. Up to `cap`. */
function extractHeadings(html: string, level: 1 | 2 | 3, cap = 25): string[] {
  const re = new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < cap) {
    const t = stripTags(m[1]).slice(0, 200);
    if (t && t.length > 2) out.push(t);
  }
  return out;
}

/** Extract <img src> URLs (absolute), capped at `cap`. */
function extractImages(html: string, baseUrl: string, cap = 10): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < cap) {
    const src = m[1].trim();
    if (!src || src.startsWith("data:")) continue;
    try {
      const abs = new URL(src, baseUrl).toString();
      if (seen.has(abs)) continue;
      // Skip tiny icons / pixels (best-effort heuristic on filename)
      if (/(?:logo|icon|favicon|sprite|placeholder|pixel|spinner|loader)/i.test(abs)) continue;
      seen.add(abs);
      out.push(abs);
    } catch { /* */ }
  }
  return out;
}

function detectSocials(html: string): { platform: string; url: string }[] {
  const patterns: Array<[string, RegExp]> = [
    ["twitter",   /https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]{1,40}(?![A-Za-z0-9_])/gi],
    ["linkedin",  /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[A-Za-z0-9-]{1,100}/gi],
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]{1,40}(?![A-Za-z0-9_.])/gi],
    ["facebook",  /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|dialog|tr\?)[A-Za-z0-9.]{1,70}/gi],
    ["youtube",   /https?:\/\/(?:www\.)?youtube\.com\/(?:@[A-Za-z0-9._-]{1,50}|channel\/[A-Za-z0-9_-]{1,30}|c\/[A-Za-z0-9_-]{1,50}|user\/[A-Za-z0-9_-]{1,50})/gi],
    ["tiktok",    /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._-]{1,40}/gi],
    ["snapchat",  /https?:\/\/(?:www\.)?snapchat\.com\/add\/[A-Za-z0-9._-]{1,40}/gi],
    ["whatsapp",  /https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send)[^\s"'<>]+/gi],
    ["pinterest", /https?:\/\/(?:www\.)?pinterest\.com\/[A-Za-z0-9_.-]{1,40}/gi],
  ];
  const out: { platform: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const [platform, re] of patterns) {
    const ms = html.match(re);
    if (!ms) continue;
    for (const u of ms) {
      const clean = u.replace(/[)\.,;]+$/, "");
      const key = `${platform}:${clean.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ platform, url: clean });
      if (out.length >= 16) return out;
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
      if (blocks.length >= 8) break;
    } catch { /* malformed JSON-LD — ignore */ }
  }
  return blocks;
}

function flattenLd(x: unknown): unknown[] {
  if (Array.isArray(x)) return x.flatMap(flattenLd);
  if (x && typeof x === "object") {
    const obj = x as { "@graph"?: unknown[] };
    if (Array.isArray(obj["@graph"])) return flattenLd(obj["@graph"]);
  }
  return [x];
}

function ldNodesByType(blocks: unknown[], types: string[]): Record<string, unknown>[] {
  const all = blocks.flatMap(flattenLd);
  const wanted = new Set(types.map((t) => t.toLowerCase()));
  return all.filter((n) => {
    const t = (n as { "@type"?: unknown })?.["@type"];
    const arr = Array.isArray(t) ? t : [t];
    return arr.some((tt) => typeof tt === "string" && wanted.has(tt.toLowerCase()));
  }) as Record<string, unknown>[];
}

// ─── Link categorization ─────────────────────────────────────────────
type Category = "projects" | "news" | "events" | "careers" | "about" | "contact" | "privacy";

const CATEGORY_PATTERNS: Record<Category, RegExp[]> = {
  projects: [
    /\/(projects?|portfolio|portfolios|works?|case[-_]?stud(y|ies)|properties|developments?|residences?|communities|listings?)(\/|$|\?|#)/i,
    /\/(مشاريع|أعمال|محفظة|عقارات|مجمعات|تطويرات)/i,
  ],
  news: [
    /\/(news|press|blog|blogs|articles?|insights?|stories|updates|releases?|media[-_]?center|newsroom|posts?)(\/|$|\?|#)/i,
    /\/(أخبار|مقالات|مدونة|بيانات[-_]صحفية|إعلانات)/i,
  ],
  events: [
    /\/(events?|webinars?|conferences?|meet[-_]?ups?|seminars?|exhibitions?|expo)(\/|$|\?|#)/i,
    /\/(فعاليات|أحداث|مؤتمرات|معارض|ندوات)/i,
  ],
  careers: [
    /\/(careers?|jobs?|hiring|vacanc(?:y|ies)|opportunit(?:y|ies)|join[-_]us|work[-_]with[-_]us|life[-_]at)(\/|$|\?|#)/i,
    /\/(وظائف|انضم|فرص[-_]عمل|توظيف)/i,
  ],
  about: [
    /\/(about|company|who[-_]we[-_]are|our[-_]story|history|leadership|team|management|chairman|ceo)(\/|$|\?|#)/i,
    /\/(عن|من-نحن|من_نحن|نبذة|تعريف|قيادة|الإدارة|تاريخ)/i,
  ],
  contact: [
    /\/(contact|get[-_]in[-_]touch|reach[-_]us|locations?|offices?|find[-_]us|branches?)(\/|$|\?|#)/i,
    /\/(اتصل|تواصل|فروع|مكاتب|عناوين)/i,
  ],
  privacy: [
    /\/(privacy|policy|terms|legal|cookies?|disclaimer)(\/|$|\?|#)/i,
    /\/(الخصوصية|الشروط|قانوني|أحكام)/i,
  ],
};

const LANG_CODES = ["en", "ar", "fr", "es", "de", "zh", "ru", "tr", "it", "ja", "ko", "pt"];

function categoriseLink(absUrl: string, originHost: string): Category | null {
  let path: string;
  try {
    const u = new URL(absUrl);
    if (u.host !== originHost) return null;
    path = u.pathname;
  } catch { return null; }
  for (const cat of Object.keys(CATEGORY_PATTERNS) as Category[]) {
    if (CATEGORY_PATTERNS[cat].some((re) => re.test(path))) return cat;
  }
  return null;
}

function detectLanguageLinks(links: string[], originHost: string): string[] {
  const langs = new Set<string>();
  for (const l of links) {
    try {
      const u = new URL(l);
      if (u.host !== originHost) continue;
      // Check for /lang/ or /lang at top level, or ?lang= query param.
      const seg = u.pathname.split("/").filter(Boolean)[0];
      if (seg && LANG_CODES.includes(seg.toLowerCase())) langs.add(seg.toLowerCase());
      const q = u.searchParams.get("lang") || u.searchParams.get("locale") || u.searchParams.get("hl");
      if (q) {
        const code = q.toLowerCase().slice(0, 2);
        if (LANG_CODES.includes(code)) langs.add(code);
      }
    } catch { /* */ }
  }
  return [...langs];
}

// ─── Fetch helpers ───────────────────────────────────────────────────
async function tryFetch(targetUrl: string, timeoutMs: number, byteCap: number):
  Promise<{ status: number; html: string; latency_ms: number; finalUrl: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const started = Date.now();
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
      while (total < byteCap) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
        total += value.byteLength;
      }
      try { reader.cancel(); } catch { /* */ }
    }
    return { status: res.status, html: body, latency_ms: Date.now() - started, finalUrl: res.url || targetUrl };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHomepage(normalized: string): Promise<{
  ok: boolean;
  status?: number;
  html?: string;
  latency_ms?: number;
  finalUrl?: string;
  attempted: string[];
  error?: string;
}> {
  const urlObj = new URL(normalized);
  const candidates = [normalized];
  if (!urlObj.hostname.startsWith("www.")) {
    const alt = new URL(normalized);
    alt.hostname = "www." + alt.hostname;
    candidates.push(alt.toString().replace(/\/+$/, ""));
  }
  let lastErr: unknown = null;
  for (const c of candidates) {
    try {
      const r = await tryFetch(c, 10_000, 500_000);
      if (r.status >= 200 && r.status < 400) {
        return { ok: true, status: r.status, html: r.html, latency_ms: r.latency_ms, finalUrl: r.finalUrl, attempted: candidates };
      }
      // Soft-failure HTTP — keep last but try next candidate too.
      lastErr = `HTTP ${r.status}`;
    } catch (e) {
      lastErr = e;
    }
  }
  return {
    ok: false,
    attempted: candidates,
    error: lastErr instanceof Error ? `${lastErr.name}: ${lastErr.message}` : String(lastErr),
  };
}

// ─── Scoring (business-focused, NOT SEO-focused) ─────────────────────
interface ScoreSignal {
  label_ar: string;
  label_en: string;
  weight: number;
  passed: boolean;
  value?: string;
}

function computeBusinessScore(input: {
  hasLogo: boolean;
  hasDescription: boolean;
  hasOrganizationLd: boolean;
  hasFoundedYear: boolean;
  projectsCount: number;
  newsCount: number;
  eventsCount: number;
  socialsCount: number;
  hasCareersPage: boolean;
  languagesCount: number;
  officeLocationsCount: number;
  hasContactPage: boolean;
  hasAboutPage: boolean;
  https: boolean;
  recentNewsCount: number;
}): { score: number; band: "weak" | "fair" | "strong" | "excellent"; signals: ScoreSignal[] } {
  const signals: ScoreSignal[] = [
    { label_ar: "هوية الشركة موثَّقة (شعار + وصف)", label_en: "Verified company identity (logo + description)", weight: 10, passed: input.hasLogo && input.hasDescription },
    { label_ar: "بيانات منظَّمة عن الشركة (Schema.org)", label_en: "Structured organization data", weight: 8, passed: input.hasOrganizationLd },
    { label_ar: "سنة تأسيس مُعلنة", label_en: "Founding year published", weight: 4, passed: input.hasFoundedYear },
    { label_ar: "محفظة مشاريع منشورة", label_en: "Published project portfolio", weight: 14, passed: input.projectsCount > 0, value: String(input.projectsCount) },
    { label_ar: "نشاط إعلامي وأخبار", label_en: "Active newsroom / press", weight: 12, passed: input.newsCount > 0, value: String(input.newsCount) },
    { label_ar: "أخبار حديثة (آخر 12 شهر)", label_en: "Recent news (last 12 months)", weight: 6, passed: input.recentNewsCount > 0, value: String(input.recentNewsCount) },
    { label_ar: "فعاليات أو مؤتمرات", label_en: "Events / conferences", weight: 4, passed: input.eventsCount > 0, value: String(input.eventsCount) },
    { label_ar: "حضور قوي في التواصل (≥3 منصات)", label_en: "Strong social presence (≥3 platforms)", weight: 10, passed: input.socialsCount >= 3, value: String(input.socialsCount) },
    { label_ar: "صفحة وظائف (مؤشر نمو)", label_en: "Careers page (growth signal)", weight: 6, passed: input.hasCareersPage },
    { label_ar: "تعدُّد لغات الموقع", label_en: "Multi-language site", weight: 6, passed: input.languagesCount >= 2, value: String(input.languagesCount) },
    { label_ar: "مكاتب أو عناوين متعدِّدة", label_en: "Multiple office locations", weight: 6, passed: input.officeLocationsCount >= 2, value: String(input.officeLocationsCount) },
    { label_ar: "صفحات اتصال + من نحن", label_en: "Contact + About pages", weight: 6, passed: input.hasContactPage && input.hasAboutPage },
    { label_ar: "اتصال مشفَّر (HTTPS)", label_en: "Secure connection (HTTPS)", weight: 8, passed: input.https },
  ];
  const earned = signals.filter((s) => s.passed).reduce((a, s) => a + s.weight, 0);
  const max = signals.reduce((a, s) => a + s.weight, 0);
  const score = Math.round((earned / max) * 100);
  const band = score >= 85 ? "excellent" : score >= 70 ? "strong" : score >= 50 ? "fair" : "weak";
  return { score, band, signals };
}

// ─── Handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const t0 = Date.now();

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

    // ── Step 1: fetch homepage ──────────────────────────────────────
    const home = await fetchHomepage(normalized);
    if (!home.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not reach website",
        details: home.error,
        website: normalized,
        attempted: home.attempted,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const homeHtml = home.html!;
    const homeUrl = home.finalUrl!;
    const originHost = new URL(homeUrl).host;

    // ── Step 2: parse homepage for structured signals ────────────────
    const title = extractMeta(homeHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractMeta(homeHtml, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || extractMeta(homeHtml, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogTitle = extractMeta(homeHtml, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDescription = extractMeta(homeHtml, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = extractMeta(homeHtml, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const canonical = extractMeta(homeHtml, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const viewport = extractMeta(homeHtml, /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i);
    const langMatch = homeHtml.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const htmlLang = langMatch ? langMatch[1] : "";
    const h1Count = countMatches(homeHtml, /<h1[\s>]/gi);
    const h2Count = countMatches(homeHtml, /<h2[\s>]/gi);
    const h3Count = countMatches(homeHtml, /<h3[\s>]/gi);

    const homeLinks = extractLinks(homeHtml, homeUrl);
    const homeImages = extractImages(homeHtml, homeUrl, 8);
    const socials = detectSocials(homeHtml);
    const ldBlocks = parseJsonLdBlocks(homeHtml);
    const orgNodes = ldNodesByType(ldBlocks, ["Organization", "Corporation", "LocalBusiness", "RealEstateAgent"]);
    const organization = orgNodes[0] ?? null;

    // ── Step 3: classify links into categories ───────────────────────
    const buckets: Record<Category, string[]> = {
      projects: [], news: [], events: [], careers: [], about: [], contact: [], privacy: [],
    };
    for (const l of homeLinks) {
      const c = categoriseLink(l, originHost);
      if (c) buckets[c].push(l);
    }
    const languages = detectLanguageLinks(homeLinks, originHost);
    if (htmlLang && !languages.includes(htmlLang.slice(0, 2).toLowerCase())) {
      languages.push(htmlLang.slice(0, 2).toLowerCase());
    }

    // ── Step 4: fetch top-priority sub-pages in parallel ─────────────
    // Pick the first link in each category as our representative page.
    // We keep this conservative (≤6 sub-pages, 6s timeout each) so the
    // total function execution stays under ~10s even when several sites
    // are sluggish.
    const subPickOrder: Category[] = ["projects", "news", "about", "contact", "events", "careers"];
    const subPicks: Array<{ category: Category; url: string }> = [];
    for (const cat of subPickOrder) {
      const url = buckets[cat][0];
      if (url) subPicks.push({ category: cat, url });
    }

    interface SubPage {
      category: Category;
      url: string;
      ok: boolean;
      status?: number;
      html?: string;
      latency_ms?: number;
      error?: string;
    }
    const subResults: SubPage[] = await Promise.all(
      subPicks.map(async (p): Promise<SubPage> => {
        try {
          const r = await tryFetch(p.url, 6_000, 250_000);
          return { ...p, ok: r.status >= 200 && r.status < 400, status: r.status, html: r.html, latency_ms: r.latency_ms };
        } catch (e) {
          return { ...p, ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );

    const subByCat: Partial<Record<Category, SubPage>> = {};
    for (const r of subResults) {
      if (r.ok && r.html) subByCat[r.category] = r;
    }

    // ── Step 5: derive business intelligence from each sub-page ──────
    // Projects
    const projectsPage = subByCat.projects;
    const projectTitlesFromPage = projectsPage ? [...extractHeadings(projectsPage.html!, 2, 12), ...extractHeadings(projectsPage.html!, 3, 12)] : [];
    const projectTitlesFromHome = [...extractHeadings(homeHtml, 2, 8), ...extractHeadings(homeHtml, 3, 8)];
    const projectImages = projectsPage ? extractImages(projectsPage.html!, projectsPage.url, 8) : [];
    // De-duplicate + first-letter-upper sample of 6
    const uniqueProjectTitles = Array.from(new Set([...projectTitlesFromPage, ...projectTitlesFromHome]))
      .filter((t) => t.length >= 4 && t.length <= 120)
      .slice(0, 8);

    // News
    const newsPage = subByCat.news;
    const newsLd = ldNodesByType(parseJsonLdBlocks(newsPage?.html ?? ""), ["NewsArticle", "BlogPosting", "Article"]);
    const newsHeadingsFromPage = newsPage ? [...extractHeadings(newsPage.html!, 2, 15), ...extractHeadings(newsPage.html!, 3, 15)] : [];
    interface NewsItem { title: string; date?: string }
    const recentTitles: NewsItem[] = [];
    for (const n of newsLd) {
      const headline = (n as { headline?: string; name?: string }).headline || (n as { headline?: string; name?: string }).name;
      const date = (n as { datePublished?: string; dateCreated?: string }).datePublished
        || (n as { datePublished?: string; dateCreated?: string }).dateCreated;
      if (typeof headline === "string" && headline.length > 4) {
        recentTitles.push({ title: headline.slice(0, 200), date: typeof date === "string" ? date.slice(0, 10) : undefined });
      }
      if (recentTitles.length >= 6) break;
    }
    if (recentTitles.length === 0) {
      // Fall back to extracting <time> tags adjacent to headings
      for (const h of newsHeadingsFromPage.slice(0, 6)) recentTitles.push({ title: h });
    }
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const recentCount = recentTitles.filter((n) => {
      if (!n.date) return false;
      const t = Date.parse(n.date);
      return Number.isFinite(t) && t >= cutoff;
    }).length;

    // Events
    const eventsPage = subByCat.events;
    const eventLd = ldNodesByType(parseJsonLdBlocks(eventsPage?.html ?? ""), ["Event"]);
    const eventTitles: string[] = [];
    for (const e of eventLd) {
      const name = (e as { name?: string }).name;
      if (typeof name === "string") eventTitles.push(name.slice(0, 200));
      if (eventTitles.length >= 5) break;
    }
    if (eventsPage && eventTitles.length === 0) {
      for (const h of extractHeadings(eventsPage.html!, 2, 8)) eventTitles.push(h);
    }

    // About / company
    const aboutPage = subByCat.about;
    const aboutDescription = aboutPage
      ? extractMeta(aboutPage.html!, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || (() => {
            // Pull the first sizeable <p> from the about page
            const m = aboutPage.html!.match(/<p\b[^>]*>([\s\S]{60,1200}?)<\/p>/i);
            return m ? stripTags(m[1]).slice(0, 600) : "";
          })()
      : "";

    // Organization data extraction
    const orgName = (organization?.name as string)
      ?? (organization?.legalName as string)
      ?? (developerName || stripTags(title) || originHost);
    const orgLogo = (organization?.logo as string)
      || ogImage
      || "";
    const orgDescription = description || ogDescription || aboutDescription || "";
    const orgFounded = ((organization?.foundingDate as string) || "").slice(0, 10);
    const orgIndustry = (organization?.industry as string) || (organization?.knowsAbout as string) || "";
    const orgLegalName = (organization?.legalName as string) || "";
    const orgTagline = ogTitle || stripTags(title);

    // Headquarters / multiple addresses
    interface AddrRow { country?: string; city?: string; full?: string }
    const addresses: AddrRow[] = [];
    const addrField = organization?.address;
    const flatAddresses = Array.isArray(addrField) ? addrField : (addrField ? [addrField] : []);
    for (const a of flatAddresses) {
      if (a && typeof a === "object") {
        const ao = a as Record<string, unknown>;
        addresses.push({
          country: typeof ao.addressCountry === "string" ? ao.addressCountry : undefined,
          city: typeof ao.addressLocality === "string" ? ao.addressLocality : undefined,
          full: [ao.streetAddress, ao.addressLocality, ao.addressCountry].filter(Boolean).join(", "),
        });
      } else if (typeof a === "string") {
        addresses.push({ full: a });
      }
    }
    // De-duplicate
    const seenAddr = new Set<string>();
    const uniqueAddresses = addresses.filter((a) => {
      const key = (a.full || `${a.city ?? ""}-${a.country ?? ""}`).toLowerCase();
      if (seenAddr.has(key)) return false;
      seenAddr.add(key);
      return true;
    });
    const headquarters = uniqueAddresses[0]?.full
      || [uniqueAddresses[0]?.city, uniqueAddresses[0]?.country].filter(Boolean).join(", ")
      || "";

    // ── Step 6: build trust signals ─────────────────────────────────
    const trust = {
      https,
      has_privacy_page: buckets.privacy.length > 0,
      has_about_page: buckets.about.length > 0,
      has_contact_page: buckets.contact.length > 0,
      has_organization_schema: !!organization,
      has_logo: !!orgLogo,
      has_clear_description: !!orgDescription && orgDescription.length >= 60,
      mobile_optimized: !!viewport,
    };

    // ── Step 7: composite score ─────────────────────────────────────
    const scoring = computeBusinessScore({
      hasLogo: !!orgLogo,
      hasDescription: !!orgDescription,
      hasOrganizationLd: !!organization,
      hasFoundedYear: !!orgFounded,
      projectsCount: buckets.projects.length,
      newsCount: buckets.news.length,
      eventsCount: buckets.events.length,
      socialsCount: socials.length,
      hasCareersPage: buckets.careers.length > 0,
      languagesCount: languages.length,
      officeLocationsCount: uniqueAddresses.length,
      hasContactPage: buckets.contact.length > 0,
      hasAboutPage: buckets.about.length > 0,
      https,
      recentNewsCount: recentCount,
    });

    // ── Step 8: build response ──────────────────────────────────────
    const result = {
      website: homeUrl,
      developer_name: developerName || undefined,
      fetched_at: new Date().toISOString(),
      total_latency_ms: Date.now() - t0,

      company: {
        name: orgName,
        legal_name: orgLegalName,
        tagline: orgTagline.slice(0, 200),
        description: orgDescription,
        logo_url: orgLogo,
        founded: orgFounded,
        industry: orgIndustry,
        headquarters,
      },

      portfolio: {
        pages_found: buckets.projects.length,
        sample_titles: uniqueProjectTitles,
        sample_images: projectImages.slice(0, 6),
        has_dedicated_section: buckets.projects.length > 0,
        first_page_url: buckets.projects[0] || "",
      },

      news: {
        pages_found: buckets.news.length,
        recent_items: recentTitles,
        recent_in_last_year: recentCount,
        has_section: buckets.news.length > 0,
        first_page_url: buckets.news[0] || "",
      },

      events: {
        pages_found: buckets.events.length,
        sample_titles: eventTitles,
        first_page_url: buckets.events[0] || "",
      },

      careers: {
        has_careers_page: buckets.careers.length > 0,
        first_page_url: buckets.careers[0] || "",
      },

      social_presence: {
        platforms: socials,
        count: socials.length,
      },

      expansion: {
        office_locations_count: uniqueAddresses.length,
        addresses: uniqueAddresses,
        languages_supported: languages,
        international: languages.length >= 2,
      },

      trust_signals: trust,

      score: scoring.score,
      score_band: scoring.band,
      score_breakdown: scoring.signals,

      technical: {
        https,
        page_size_bytes: homeHtml.length,
        latency_ms: home.latency_ms,
        http_status: home.status,
        page_title: stripTags(title),
        meta_description: description,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image: ogImage,
        canonical_url: canonical,
        html_lang: htmlLang,
        viewport,
        heading_counts: { h1: h1Count, h2: h2Count, h3: h3Count },
      },

      crawled_pages: subResults.map((r) => ({
        url: r.url, status: r.status ?? 0, category: r.category, ok: r.ok, latency_ms: r.latency_ms,
      })),

      organization_ld: organization,
      homepage_images: homeImages,
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
      details: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
