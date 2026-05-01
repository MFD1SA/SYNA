// ═══════════════════════════════════════════════════════════════════════
// SINA — Developer Business Intelligence Analyzer (v8)
// ═══════════════════════════════════════════════════════════════════════
// Goal: business intelligence on a real-estate developer — what projects
// they ship, what news they publish, what social channels they're active
// on. NOT a website/SEO audit.
//
// v8 (this version) shifts the focus to CONTENT:
//   • Score is 100% content-driven (no HTTPS / Schema / Mobile checks)
//   • Visits individual project pages to extract per-project detail
//     (title, image, summary, location)
//   • Parses news listings into article cards (image, date, summary)
//   • Visits each social-media profile to enrich with display name,
//     avatar, bio, and (where the platform allows public read) follower
//     count and recent posts. No API keys needed.
//
// What we DO NOT do:
//   • No external AI inference (no hallucinated "facts")
//   • No third-party news/SEO API
//   • No paid social-platform API — public anonymous fetches only
//
// History:
//   v6: BI overhaul — projects/news/events/about sub-page crawl
//   v7: dedupe social platforms by network (instagram only once)
//   v8: deep project pages + news cards + social profile enrichment +
//       content-only scoring (this version)
//
// Response shape is consumed by `src/components/owner/DevWebsiteAnalysis.tsx`.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

// ── CORS: allow only cidoma.com + subdomains (and localhost for dev). ──
// This function is JWT-protected so the JWT itself is the access gate,
// but locking CORS adds defence-in-depth so a malicious page elsewhere
// can't pop a popup, smuggle a logged-in user's session, and use the
// browser to call this function on the user's behalf.
function buildCors(origin: string | null): Record<string, string> {
  let allow = publicSiteUrl;
  if (origin) {
    try {
      const h = new URL(origin).hostname.toLowerCase();
      if (h === allowedRootDomain || h.endsWith(`.${allowedRootDomain}`) || h === "localhost") {
        allow = origin;
      }
    } catch {
      /* keep default */
    }
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

// ─── SSRF guard ──────────────────────────────────────────────────────
// Reject any URL whose host resolves into:
//   • non-HTTP(S) scheme (file://, gopher://, ftp://, etc.)
//   • IPv4 literal in private/link-local/loopback/cloud-metadata ranges
//     (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8,
//      169.254.0.0/16, 100.64.0.0/10, 0.0.0.0/8, multicast, broadcast)
//   • IPv6 literal in loopback/link-local/ULA ranges
//   • Bare hostnames that look like internal LAN names (no dot)
// This prevents a caller from steering the function's own outbound
// fetch at the cloud-metadata endpoint or an internal service.
function isPubliclyResolvableHost(u: URL): boolean {
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (!host) return false;
  // Internal-network hostname forms (no dot, *.internal, *.local).
  if (!host.includes(".")) return false;
  if (host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".lan")) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  // IPv4 literal check.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const parts = ipv4.slice(1).map((n) => parseInt(n, 10));
    if (parts.some((p) => p < 0 || p > 255)) return false;
    const [a, b] = parts;
    if (a === 10) return false;                                    // 10.0.0.0/8
    if (a === 127) return false;                                   // loopback
    if (a === 0) return false;                                     // 0.0.0.0/8
    if (a === 169 && b === 254) return false;                      // link-local + AWS metadata
    if (a === 172 && b >= 16 && b <= 31) return false;             // 172.16.0.0/12
    if (a === 192 && b === 168) return false;                      // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return false;            // CGN 100.64.0.0/10
    if (a >= 224) return false;                                    // multicast / broadcast
  }
  // IPv6 literal: just block the obvious internal forms.
  if (host.startsWith("[")) {
    if (host.startsWith("[::1") || host.startsWith("[fe80") || host.startsWith("[fc") || host.startsWith("[fd")) return false;
  }
  return true;
}

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

// ─── Generic helpers ────────────────────────────────────────────────
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
  const seenPlatform = new Set<string>();
  for (const [platform, re] of patterns) {
    const ms = html.match(re);
    if (!ms) continue;
    for (const u of ms) {
      if (seenPlatform.has(platform)) break;
      const clean = u.replace(/[).,;]+$/, "");
      if (/\b(share|sharer|intent|dialog\b)/i.test(clean)) continue;
      seenPlatform.add(platform);
      out.push({ platform, url: clean });
      if (out.length >= 9) return out;
      break;
    }
  }
  return out;
}

// ─── Google Business profile detection ───────────────────────────────
// Companies link to their Google Maps / Google Business listing in many
// shapes:
//   https://maps.google.com/?cid=12345
//   https://www.google.com/maps/place/Name/@lat,lng
//   https://goo.gl/maps/abc123
//   https://maps.app.goo.gl/abc
//   https://g.page/some-handle
// We can't fetch reviews from Google directly without an API key (heavy
// bot blocking + ToS), but we surface the URL so the user can click
// through, and we score "has Google Business presence" as a content
// signal.
function detectGoogleBusinessUrl(html: string): string | null {
  const patterns: RegExp[] = [
    /https?:\/\/(?:www\.|maps\.)?google\.com\/maps\/place\/[^\s"'<>]+/i,
    /https?:\/\/maps\.google\.com\/\?cid=\d+/i,
    /https?:\/\/maps\.google\.com\/maps\?[^\s"'<>]+/i,
    /https?:\/\/goo\.gl\/maps\/[A-Za-z0-9_-]+/i,
    /https?:\/\/maps\.app\.goo\.gl\/[A-Za-z0-9_-]+/i,
    /https?:\/\/g\.page\/[A-Za-z0-9_.-]+/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[0].replace(/[).,;'"]+$/, "");
  }
  return null;
}

// ─── Reviews extraction ──────────────────────────────────────────────
// Reads schema.org AggregateRating + Review nodes from JSON-LD and
// returns a normalised structure. Many real-estate developer sites
// embed an aggregate rating from Google reviews this way (e.g. via
// the Trustindex or ReviewSnipping plugin). We never inflate values
// — if the site doesn't publish reviews in machine-readable form we
// return nothing.
interface ReviewItem {
  author?: string;
  rating?: number;
  date?: string;
  body?: string;
}
interface ReviewsBlock {
  aggregate: { rating: number; count: number; best: number } | null;
  items: ReviewItem[];
}

function extractReviews(blocks: unknown[]): ReviewsBlock {
  const all = blocks.flatMap(flattenLd);
  let aggregate: ReviewsBlock["aggregate"] = null;
  const items: ReviewItem[] = [];
  const seenBodies = new Set<string>();

  // Pull AggregateRating from the org / org.aggregateRating
  for (const node of all) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    const t = n["@type"];
    const tArr = Array.isArray(t) ? t : [t];
    const isAgg = tArr.some((x) => typeof x === "string" && x.toLowerCase() === "aggregaterating");
    const aggNode = isAgg ? n : (n.aggregateRating as Record<string, unknown> | undefined);
    if (aggNode && typeof aggNode === "object") {
      const rv = parseFloat(String((aggNode as Record<string, unknown>).ratingValue ?? ""));
      const cv = parseInt(String((aggNode as Record<string, unknown>).reviewCount ?? (aggNode as Record<string, unknown>).ratingCount ?? ""), 10);
      const bv = parseFloat(String((aggNode as Record<string, unknown>).bestRating ?? "5"));
      if (Number.isFinite(rv) && rv > 0) {
        aggregate = {
          rating: Math.round(rv * 10) / 10,
          count: Number.isFinite(cv) ? cv : 0,
          best: Number.isFinite(bv) && bv > 0 ? bv : 5,
        };
        if (aggregate) break;
      }
    }
  }

  // Pull individual Review nodes
  for (const node of all) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    const t = n["@type"];
    const tArr = Array.isArray(t) ? t : [t];
    const isReview = tArr.some((x) => typeof x === "string" && x.toLowerCase() === "review");
    if (!isReview) continue;
    const author = (() => {
      const a = n.author;
      if (typeof a === "string") return a.slice(0, 80);
      if (a && typeof a === "object") {
        const name = (a as Record<string, unknown>).name;
        if (typeof name === "string") return name.slice(0, 80);
      }
      return undefined;
    })();
    const rating = (() => {
      const r = n.reviewRating;
      if (r && typeof r === "object") {
        const v = parseFloat(String((r as Record<string, unknown>).ratingValue ?? ""));
        if (Number.isFinite(v)) return v;
      }
      const ratingDirect = parseFloat(String(n.rating ?? ""));
      if (Number.isFinite(ratingDirect)) return ratingDirect;
      return undefined;
    })();
    const dateRaw = n.datePublished ?? n.dateCreated;
    const date = typeof dateRaw === "string" ? dateRaw.slice(0, 10) : undefined;
    const body = typeof n.reviewBody === "string" ? n.reviewBody.slice(0, 400)
      : typeof n.description === "string" ? n.description.slice(0, 400) : undefined;
    if (body && seenBodies.has(body.slice(0, 120))) continue;
    if (body) seenBodies.add(body.slice(0, 120));
    items.push({ author, rating, date, body });
    if (items.length >= 8) break;
  }

  return { aggregate, items };
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

// ─── Project deep-extraction ─────────────────────────────────────────
// Given the projects-listing page HTML, find candidate sub-page URLs
// that look like individual project pages.
//
// Strategy: prefer same-host links that are CHILDREN of the listing
// path (e.g. /projects/X under /projects/). If that yields nothing —
// common on SPAs that mount their grid under a different language
// prefix or move to a different "developments/properties" root —
// fall back to scanning all same-host links for paths matching a
// project-noun + slug shape.
const PROJECT_NOUNS = "projects?|portfolio|portfolios|works?|properties|developments?|residences?|communities|listings?|estates?";
const PROJECT_NOUN_RE = new RegExp(`^/(?:[a-z]{2}/)?(?:${PROJECT_NOUNS})/[a-z0-9\\-_%]{4,80}/?$`, "i");

function extractProjectSubpageUrls(html: string, listingUrl: string, originHost: string): string[] {
  const links = extractLinks(html, listingUrl);
  const listingPath = new URL(listingUrl).pathname.replace(/\/+$/, "");
  const out: string[] = [];
  const seen = new Set<string>();

  const accept = (u: URL): string | null => {
    if (u.host !== originHost) return null;
    const path = u.pathname.replace(/\/+$/, "");
    // Skip pagination / category / filter / search / non-html
    if (/\/(page|category|tag|filter|search)(\/|$)/i.test(path)) return null;
    if (u.search && /[?&](page|sort|filter|category)=/i.test(u.search)) return null;
    if (/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx|xls|xlsx|svg|webp)$/i.test(path)) return null;
    const clean = u.origin + path;
    if (seen.has(clean)) return null;
    return clean;
  };

  // Pass 1: children of the listing path (preferred)
  for (const l of links) {
    try {
      const u = new URL(l);
      const clean = accept(u);
      if (!clean) continue;
      const path = u.pathname.replace(/\/+$/, "");
      if (!path.startsWith(listingPath + "/") || path === listingPath) continue;
      const listingDepth = listingPath.split("/").filter(Boolean).length;
      const pathDepth = path.split("/").filter(Boolean).length;
      if (pathDepth <= listingDepth) continue;
      seen.add(clean);
      out.push(clean);
      if (out.length >= 8) return out;
    } catch { /* */ }
  }

  // Pass 2: noun + slug shape anywhere on same host
  if (out.length === 0) {
    for (const l of links) {
      try {
        const u = new URL(l);
        const clean = accept(u);
        if (!clean) continue;
        if (!PROJECT_NOUN_RE.test(u.pathname)) continue;
        seen.add(clean);
        out.push(clean);
        if (out.length >= 8) break;
      } catch { /* */ }
    }
  }

  return out;
}

interface ProjectCard {
  title: string;
  summary: string;
  image_url: string;
  location: string;
  url: string;
}

function parseProjectPage(html: string, pageUrl: string): ProjectCard | null {
  const ogTitle = extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const metaDesc = extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const docTitle = extractMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = extractHeadings(html, 1, 1)[0] || "";

  let title = h1 || stripTags(ogTitle) || stripTags(docTitle) || "";
  // Strip site-name suffixes: "Project X | Acme" → "Project X"
  title = title.replace(/\s*[|\-–—]\s*[^|\-–—]{2,80}$/, "").trim().slice(0, 180);
  if (!title || title.length < 4) return null;

  let summary = stripTags(ogDesc) || stripTags(metaDesc) || "";
  if (!summary || summary.length < 60) {
    const m = html.match(/<p\b[^>]*>([\s\S]{60,800}?)<\/p>/i);
    if (m) summary = stripTags(m[1]);
  }
  summary = summary.slice(0, 280);

  let image_url = "";
  if (ogImage && !ogImage.startsWith("data:")) {
    try { image_url = new URL(ogImage, pageUrl).toString(); } catch { /* */ }
  }
  if (!image_url) {
    const imgs = extractImages(html, pageUrl, 1);
    image_url = imgs[0] || "";
  }

  // Best-effort location extraction from the page text
  let location = "";
  const locMatch =
    html.match(/(?:located in|location\s*[:-]\s*|في\s+مدينة\s+|بحي\s+|بمدينة\s+)\s*([\u0600-\u06FFa-zA-Z\s,]{3,60})/i);
  if (locMatch) {
    location = stripTags(locMatch[1]).replace(/[,.\s]+$/, "").slice(0, 80);
  }

  return { title, summary, image_url, location, url: pageUrl };
}

// ─── Textual date parsing (English + Arabic month names) ────────────
// Recognizes shapes like:
//   "September 24, 2025"    → 2025-09-24
//   "24 September 2025"     → 2025-09-24
//   "سبتمبر 24, 2025"        → 2025-09-24
//   "24 سبتمبر 2025"         → 2025-09-24
// Returns YYYY-MM-DD or undefined.
const MONTH_INDEX: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  const en: [string[], number][] = [
    [["jan", "january"], 1], [["feb", "february"], 2], [["mar", "march"], 3],
    [["apr", "april"], 4], [["may"], 5], [["jun", "june"], 6],
    [["jul", "july"], 7], [["aug", "august"], 8], [["sep", "sept", "september"], 9],
    [["oct", "october"], 10], [["nov", "november"], 11], [["dec", "december"], 12],
  ];
  for (const [keys, idx] of en) for (const k of keys) m[k] = idx;
  // Arabic Gregorian (Levant + Gulf forms)
  const ar: [string[], number][] = [
    [["يناير", "كانون الثاني"], 1],
    [["فبراير", "شباط"], 2],
    [["مارس", "آذار", "اذار"], 3],
    [["أبريل", "ابريل", "نيسان"], 4],
    [["مايو", "أيار", "ايار"], 5],
    [["يونيو", "حزيران"], 6],
    [["يوليو", "تموز"], 7],
    [["أغسطس", "اغسطس", "آب"], 8],
    [["سبتمبر", "أيلول", "ايلول"], 9],
    [["أكتوبر", "اكتوبر", "تشرين الأول", "تشرين الاول"], 10],
    [["نوفمبر", "تشرين الثاني"], 11],
    [["ديسمبر", "كانون الأول", "كانون الاول"], 12],
  ];
  for (const [keys, idx] of ar) for (const k of keys) m[k] = idx;
  return m;
})();

function parseTextualDate(text: string): string | undefined {
  const lc = text.toLowerCase();
  // Build alternation of all month names (sorted longest-first to avoid prefix issues)
  const names = Object.keys(MONTH_INDEX).sort((a, b) => b.length - a.length);
  // Pattern A: MonthName DD, YYYY  (e.g. "September 24, 2025" / "سبتمبر 24, 2025")
  for (const name of names) {
    const idx = MONTH_INDEX[name];
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reA = new RegExp(`${escaped}\\s+(\\d{1,2})\\s*[,،]?\\s*(20\\d{2})`, "i");
    const ma = lc.match(reA);
    if (ma) {
      const day = parseInt(ma[1], 10);
      const yr = parseInt(ma[2], 10);
      if (day >= 1 && day <= 31) return `${yr}-${String(idx).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    const reB = new RegExp(`(\\d{1,2})\\s+${escaped}\\s+(20\\d{2})`, "i");
    const mb = lc.match(reB);
    if (mb) {
      const day = parseInt(mb[1], 10);
      const yr = parseInt(mb[2], 10);
      if (day >= 1 && day <= 31) return `${yr}-${String(idx).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return undefined;
}

// ─── News card extraction ────────────────────────────────────────────
interface NewsCard {
  title: string;
  date?: string;
  summary: string;
  image_url: string;
  url: string;
}

// Parse a news listing page for article cards. Strategy: locate <article>
// blocks first (most reliable), then fall back to divs/lis/sections with
// post|news|article|card|blog|entry in their class name.
function extractNewsCards(html: string, listingUrl: string, originHost: string): NewsCard[] {
  const out: NewsCard[] = [];
  const seenUrls = new Set<string>();

  const collect = (re: RegExp) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && out.length < 10) {
      const card = parseCardBlock(m[1], listingUrl, originHost);
      if (card && !seenUrls.has(card.url)) {
        seenUrls.add(card.url);
        out.push(card);
      }
    }
  };

  // 1) <article> blocks
  collect(/<article\b[^>]*>([\s\S]{50,8000}?)<\/article>/gi);

  // 2) div/li/section with post|news|article|card|blog|entry class
  if (out.length < 4) {
    collect(/<(?:div|li|section)\b[^>]*class=["'][^"']*(?:post|news|article|card|blog|entry|item)[^"']*["'][^>]*>([\s\S]{100,5000}?)<\/(?:div|li|section)>/gi);
  }

  return out;
}

function parseCardBlock(block: string, baseUrl: string, originHost: string): NewsCard | null {
  // Title: first heading
  const titleM = block.match(/<h[1-4]\b[^>]*>([\s\S]{4,400}?)<\/h[1-4]>/i);
  const title = titleM ? stripTags(titleM[1]).slice(0, 200) : "";
  if (!title || title.length < 6) return null;

  // URL: first internal <a>
  let url = "";
  const aRe = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let am: RegExpExecArray | null;
  while ((am = aRe.exec(block)) !== null) {
    if (am[1].startsWith("#") || am[1].startsWith("mailto:") || am[1].startsWith("tel:")) continue;
    try {
      const u = new URL(am[1], baseUrl);
      if (u.host === originHost) {
        url = u.toString();
        break;
      }
    } catch { /* */ }
  }
  if (!url) return null;

  // Image: first img, skipping logos/icons
  let image_url = "";
  const imgRe = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(block)) !== null) {
    const src = im[1];
    if (!src || src.startsWith("data:")) continue;
    if (/(?:logo|icon|favicon|sprite|placeholder|pixel|spinner|loader)/i.test(src)) continue;
    try {
      image_url = new URL(src, baseUrl).toString();
      break;
    } catch { /* */ }
  }

  // Date: <time datetime>, then body text patterns
  let date: string | undefined;
  const timeM = block.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (timeM) date = timeM[1].slice(0, 10);
  if (!date) {
    const txt = stripTags(block);
    const isoM = txt.match(/\b(20\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/);
    if (isoM) {
      date = `${isoM[1]}-${isoM[2].padStart(2, "0")}-${isoM[3].padStart(2, "0")}`;
    }
    if (!date) {
      const dmyM = txt.match(/\b(\d{1,2})[-./](\d{1,2})[-./](20\d{2})\b/);
      if (dmyM) date = `${dmyM[3]}-${dmyM[2].padStart(2, "0")}-${dmyM[1].padStart(2, "0")}`;
    }
    if (!date) date = parseTextualDate(txt);
  }

  // Summary: first <p>
  let summary = "";
  const pM = block.match(/<p\b[^>]*>([\s\S]{20,800}?)<\/p>/i);
  if (pM) summary = stripTags(pM[1]).slice(0, 220);

  return { title, url, image_url, date, summary };
}

// ─── Social profile enrichment ───────────────────────────────────────
interface SocialProfile {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followers?: number;
  followers_text?: string;
  videos_count?: number;
  recent_items?: Array<{ title: string; thumbnail_url?: string; published_at?: string }>;
}

interface EnrichedSocial {
  platform: string;
  url: string;
  accessible: boolean;
  profile: SocialProfile | null;
}

function parseAbbreviatedNumber(s: string): number | null {
  const m = s.replace(/[, ]/g, "").match(/^(\d+(?:\.\d+)?)\s*([KMB])?$/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  const unit = (m[2] || "").toUpperCase();
  if (!isFinite(v)) return null;
  const mul = unit === "K" ? 1000 : unit === "M" ? 1_000_000 : unit === "B" ? 1_000_000_000 : 1;
  return Math.round(v * mul);
}

async function enrichSocialProfile(item: { platform: string; url: string }): Promise<EnrichedSocial> {
  // wa.me / WhatsApp doesn't have a profile page worth fetching — it
  // immediately bounces to a chat-start screen. Just record the link.
  if (item.platform === "whatsapp") {
    return { platform: item.platform, url: item.url, accessible: false, profile: null };
  }

  let html = "";
  let ok = false;
  try {
    const r = await tryFetch(item.url, 5_000, 250_000);
    if (r.status >= 200 && r.status < 400 && r.html.length > 1000) {
      html = r.html;
      ok = true;
    }
  } catch { /* swallow */ }

  if (!ok || !html) {
    return { platform: item.platform, url: item.url, accessible: false, profile: null };
  }

  const profile: SocialProfile = {};

  // Universal: og:title / og:image / og:description
  const ogTitle = extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitle) profile.display_name = stripTags(ogTitle).slice(0, 120).replace(/\s*[|\-–—]\s*(youtube|facebook|tiktok|instagram|linkedin|twitter|x|pinterest|snapchat).*$/i, "").trim();
  if (ogImage && !ogImage.startsWith("data:")) profile.avatar_url = ogImage;
  if (ogDesc) profile.bio = stripTags(ogDesc).slice(0, 280);

  // ── Platform-specific enrichments ────────────────────────────────
  if (item.platform === "youtube") {
    // Subscribers (e.g. "1.2M subscribers", "1,234 subscribers")
    const patterns = [
      /"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/,
      /"subscriberCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/,
      /"subscriberCountText"\s*:\s*\{\s*"accessibility"[\s\S]{0,200}?"simpleText"\s*:\s*"([^"]+)"/,
    ];
    for (const pat of patterns) {
      const sm = html.match(pat);
      if (sm) {
        const txt = sm[1];
        profile.followers_text = txt;
        const nm = txt.match(/(\d+(?:[.,]\d+)?\s*[KMB]?)/i);
        if (nm) {
          const n = parseAbbreviatedNumber(nm[1].replace(",", "."));
          if (n !== null) profile.followers = n;
        }
        break;
      }
    }
    // Recent video titles via ytInitialData (best effort)
    const recent: Array<{ title: string; thumbnail_url?: string }> = [];
    const tRe = /"videoRenderer"\s*:\s*\{[\s\S]{0,600}?"title"\s*:\s*\{\s*(?:"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]{4,180})"|"simpleText"\s*:\s*"([^"]{4,180})")/g;
    let tm: RegExpExecArray | null;
    while ((tm = tRe.exec(html)) !== null && recent.length < 5) {
      const title = (tm[1] || tm[2] || "").trim();
      if (title) recent.push({ title: title.slice(0, 180) });
    }
    if (recent.length > 0) profile.recent_items = recent;
    // Total video count
    const vm = html.match(/"videosCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([\d,.]+)"/);
    if (vm) {
      const n = parseInt(vm[1].replace(/[,.]/g, ""), 10);
      if (isFinite(n)) profile.videos_count = n;
    }
  }

  if (item.platform === "tiktok") {
    // TikTok SSRs SIGI_STATE with followerCount
    const fM = html.match(/"followerCount"\s*:\s*(\d+)/);
    if (fM) profile.followers = parseInt(fM[1], 10);
  }

  if (item.platform === "pinterest") {
    const fM = html.match(/"follower_count"\s*:\s*(\d+)/);
    if (fM) profile.followers = parseInt(fM[1], 10);
  }

  if (item.platform === "linkedin") {
    // LinkedIn occasionally exposes follower count in body text
    const fM = html.match(/(\d+(?:,\d+)*)\s+followers/i);
    if (fM) {
      const n = parseInt(fM[1].replace(/,/g, ""), 10);
      if (isFinite(n)) profile.followers = n;
    }
  }

  // Accessibility: at least one of (display_name, avatar_url, bio, followers)
  const accessible = !!(profile.display_name || profile.avatar_url || profile.bio || profile.followers);
  return {
    platform: item.platform,
    url: item.url,
    accessible,
    profile: accessible ? profile : null,
  };
}

// ─── Fetch helpers ───────────────────────────────────────────────────
async function tryFetch(targetUrl: string, timeoutMs: number, byteCap: number):
  Promise<{ status: number; html: string; latency_ms: number; finalUrl: string }> {
  // SSRF backstop on every outbound fetch — even though sub-page URLs
  // are derived from the developer's own homepage HTML (already
  // host-gated), a redirect could in theory land us on a private IP
  // before we re-check. Cheap + idempotent; fail-closed if URL is
  // malformed.
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`Invalid URL: ${targetUrl}`);
  }
  if (!isPubliclyResolvableHost(parsed)) {
    throw new Error(`Refusing fetch on non-public host: ${parsed.hostname}`);
  }
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

// ─── Content scoring (100% content, NO technical signals) ────────────
interface ScoreSignal {
  label_ar: string;
  label_en: string;
  weight: number;
  passed: boolean;
  value?: string;
}

function computeContentScore(input: {
  projectsCount: number;
  detailedProjectsCount: number;
  newsCount: number;
  recentNewsCount: number;
  socialsCount: number;
  accessibleSocialCount: number;
  hasLogo: boolean;
  hasDescription: boolean;
  hasAboutPage: boolean;
  hasOrgLd: boolean;
  eventsCount: number;
  hasCareers: boolean;
  officeCount: number;
  languagesCount: number;
}): { score: number; band: "weak" | "fair" | "strong" | "excellent"; signals: ScoreSignal[] } {
  const signals: ScoreSignal[] = [
    // Projects (25 pts)
    { label_ar: "محفظة مشاريع منشورة", label_en: "Published project portfolio",
      weight: 14, passed: input.projectsCount > 0, value: String(input.projectsCount) },
    { label_ar: "تفاصيل ≥ ٣ مشاريع موثَّقة", label_en: "Detail on 3+ projects",
      weight: 11, passed: input.detailedProjectsCount >= 3, value: String(input.detailedProjectsCount) },

    // News (20 pts)
    { label_ar: "نشاط إعلامي وأخبار", label_en: "Active newsroom",
      weight: 10, passed: input.newsCount > 0, value: String(input.newsCount) },
    { label_ar: "≥ خبران في آخر ١٢ شهر", label_en: "2+ news items in last 12 months",
      weight: 10, passed: input.recentNewsCount >= 2, value: String(input.recentNewsCount) },

    // Social (20 pts)
    { label_ar: "حضور قوي في التواصل (≥ ٣ منصات)", label_en: "Strong social presence (≥3 platforms)",
      weight: 12, passed: input.socialsCount >= 3, value: String(input.socialsCount) },
    { label_ar: "حسابات سوشيال متاحة للقراءة", label_en: "Public-readable social accounts",
      weight: 8, passed: input.accessibleSocialCount >= 2, value: String(input.accessibleSocialCount) },

    // Narrative (15 pts)
    { label_ar: "هوية موثَّقة (شعار + وصف)", label_en: "Verified identity (logo + description)",
      weight: 8, passed: input.hasLogo && input.hasDescription },
    { label_ar: "صفحة من نحن", label_en: "About page",
      weight: 4, passed: input.hasAboutPage },
    { label_ar: "بيانات منظَّمة عن المنشأة", label_en: "Structured organization data",
      weight: 3, passed: input.hasOrgLd },

    // Events / Growth (10 pts)
    { label_ar: "فعاليات / مؤتمرات", label_en: "Events / conferences",
      weight: 5, passed: input.eventsCount > 0, value: String(input.eventsCount) },
    { label_ar: "صفحة وظائف نشطة", label_en: "Active careers page",
      weight: 5, passed: input.hasCareers },

    // Expansion (10 pts)
    { label_ar: "مكاتب أو فروع متعدِّدة", label_en: "Multiple offices",
      weight: 5, passed: input.officeCount >= 2, value: String(input.officeCount) },
    { label_ar: "حضور دولي (متعدد اللغات)", label_en: "International (multi-language)",
      weight: 5, passed: input.languagesCount >= 2, value: String(input.languagesCount) },
  ];
  const earned = signals.filter((s) => s.passed).reduce((a, s) => a + s.weight, 0);
  const max = signals.reduce((a, s) => a + s.weight, 0);
  const score = Math.round((earned / max) * 100);
  const band = score >= 85 ? "excellent" : score >= 70 ? "strong" : score >= 50 ? "fair" : "weak";
  return { score, band, signals };
}

// ─── Handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const CORS = buildCors(req.headers.get("origin"));
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

    // ── Resolve target website ───────────────────────────────────────
    // SECURITY: When `developer_id` is provided we ALWAYS use the DB-
    // backed website for that developer. We do NOT allow a caller-
    // supplied `body.website` to override it — otherwise an attacker
    // could pass `developer_id: <victim>` + `website: <attacker.com>`
    // and the audit/log surface would attribute the analysis to the
    // victim while actually fetching attacker-controlled content.
    // Free-form analysis (admin "analyze any URL" flow) uses ONLY
    // `body.website` with NO `developer_id`.
    let website: string | undefined;
    let developerName = "";
    if (developerId) {
      const { data: d } = await admin.from("developers").select("website, company_name").eq("id", developerId).maybeSingle();
      website = (d as { website?: string } | null)?.website ?? undefined;
      developerName = (d as { company_name?: string } | null)?.company_name ?? "";
    } else {
      website = rawUrl;
    }
    if (!website || !website.trim()) {
      return new Response(JSON.stringify({ error: "Developer has no website on file" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const normalized = normalizeUrl(website);
    const urlObj = new URL(normalized);
    const https = urlObj.protocol === "https:";

    // ── SSRF guard ───────────────────────────────────────────────────
    // Refuse hostnames that resolve to private / link-local / loopback
    // ranges, cloud metadata IPs, or non-public schemes. Without this,
    // a caller could send `body.website: "http://169.254.169.254/..."`
    // and exfiltrate the function's own cloud-metadata credentials.
    if (!isPubliclyResolvableHost(urlObj)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Refusing to fetch a non-public host",
        details: `host=${urlObj.hostname} is in a blocked range`,
      }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

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

    // ── Step 2: parse homepage ──────────────────────────────────────
    const title = extractMeta(homeHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractMeta(homeHtml, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || extractMeta(homeHtml, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogTitle = extractMeta(homeHtml, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDescription = extractMeta(homeHtml, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = extractMeta(homeHtml, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const langMatch = homeHtml.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const htmlLang = langMatch ? langMatch[1] : "";

    const homeLinks = extractLinks(homeHtml, homeUrl);
    const socials = detectSocials(homeHtml);
    const ldBlocks = parseJsonLdBlocks(homeHtml);
    const orgNodes = ldNodesByType(ldBlocks, ["Organization", "Corporation", "LocalBusiness", "RealEstateAgent"]);
    const organization = orgNodes[0] ?? null;

    // ── Step 3: classify links ─────────────────────────────────────
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

    // ── Step 4: fetch top-priority sub-pages in parallel ────────────
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
    // Per-category byte caps. Listing pages for projects and news are
    // often heavy (lots of cards, lazy-loaded media). On real-estate
    // sites the first <article> can sit past 300 KB into the document
    // (e.g. retal.com.sa/blog), so cap them at 800 KB. About / contact
    // / careers / events stay tight.
    const SUBPAGE_CAP: Partial<Record<Category, number>> = {
      projects: 800_000,
      news: 800_000,
      events: 400_000,
      about: 350_000,
      contact: 250_000,
      careers: 250_000,
    };

    const subResults: SubPage[] = await Promise.all(
      subPicks.map(async (p): Promise<SubPage> => {
        try {
          const cap = SUBPAGE_CAP[p.category] ?? 300_000;
          const r = await tryFetch(p.url, 7_000, cap);
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

    // ── Step 4.5: deep extraction (projects + socials in parallel) ──
    // 4.5a: walk into individual project sub-pages for per-project detail
    const projectSubpageUrls = subByCat.projects?.html
      ? extractProjectSubpageUrls(subByCat.projects.html, subByCat.projects.url, originHost)
      : [];
    const projectPicks = projectSubpageUrls.slice(0, 4);

    const [projectFetches, enrichedSocials] = await Promise.all([
      Promise.all(projectPicks.map(async (u): Promise<ProjectCard | null> => {
        try {
          const r = await tryFetch(u, 4_000, 200_000);
          if (r.status >= 200 && r.status < 400 && r.html) {
            return parseProjectPage(r.html, u);
          }
        } catch { /* */ }
        return null;
      })),
      Promise.all(socials.slice(0, 6).map(enrichSocialProfile)),
    ]);

    const detailedProjects: ProjectCard[] = projectFetches.filter((p): p is ProjectCard => !!p);

    // 4.5b: parse news listing into article cards
    const newsArticles: NewsCard[] = subByCat.news?.html
      ? extractNewsCards(subByCat.news.html, subByCat.news.url, originHost)
      : [];

    // ── Step 5: derive higher-level signals ─────────────────────────
    // News dates → "recent in last 12 months" count
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    let recentCount = 0;
    for (const a of newsArticles) {
      if (!a.date) continue;
      const t = Date.parse(a.date);
      if (Number.isFinite(t) && t >= cutoff) recentCount += 1;
    }
    // Fallback: also count JSON-LD news articles with recent dates
    if (newsArticles.length === 0 && subByCat.news?.html) {
      const newsLd = ldNodesByType(parseJsonLdBlocks(subByCat.news.html), ["NewsArticle", "BlogPosting", "Article"]);
      for (const n of newsLd) {
        const date = (n as { datePublished?: string; dateCreated?: string }).datePublished
          || (n as { datePublished?: string; dateCreated?: string }).dateCreated;
        const headline = (n as { headline?: string; name?: string }).headline
          || (n as { headline?: string; name?: string }).name;
        if (typeof headline === "string" && headline.length > 4) {
          const dateStr = typeof date === "string" ? date.slice(0, 10) : undefined;
          newsArticles.push({
            title: headline.slice(0, 200),
            date: dateStr,
            summary: "",
            image_url: "",
            url: subByCat.news!.url,
          });
          if (dateStr) {
            const t = Date.parse(dateStr);
            if (Number.isFinite(t) && t >= cutoff) recentCount += 1;
          }
        }
        if (newsArticles.length >= 6) break;
      }
    }

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

    // About page
    const aboutPage = subByCat.about;
    const aboutDescription = aboutPage
      ? extractMeta(aboutPage.html!, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || (() => {
            const m = aboutPage.html!.match(/<p\b[^>]*>([\s\S]{60,1200}?)<\/p>/i);
            return m ? stripTags(m[1]).slice(0, 600) : "";
          })()
      : "";

    // Organization data
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

    // Addresses / multi-office
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

    // ── Step 6: trust signals (CONTENT-relevant only) ───────────────
    const trust = {
      has_about_page: buckets.about.length > 0,
      has_contact_page: buckets.contact.length > 0,
      has_organization_schema: !!organization,
      has_logo: !!orgLogo,
      has_clear_description: !!orgDescription && orgDescription.length >= 60,
    };

    // ── Step 7: composite content score ─────────────────────────────
    const accessibleSocialCount = enrichedSocials.filter((s) => s.accessible).length;
    const scoring = computeContentScore({
      projectsCount: buckets.projects.length,
      detailedProjectsCount: detailedProjects.length,
      newsCount: buckets.news.length,
      recentNewsCount: recentCount,
      socialsCount: socials.length,
      accessibleSocialCount,
      hasLogo: !!orgLogo,
      hasDescription: !!orgDescription,
      hasAboutPage: buckets.about.length > 0,
      hasOrgLd: !!organization,
      eventsCount: buckets.events.length,
      hasCareers: buckets.careers.length > 0,
      officeCount: uniqueAddresses.length,
      languagesCount: languages.length,
    });

    // ── Step 8: response shape (content-first) ──────────────────────
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

      projects: {
        pages_found: buckets.projects.length,
        has_dedicated_section: buckets.projects.length > 0,
        listing_url: buckets.projects[0] || "",
        detailed_items: detailedProjects,
      },

      news: {
        pages_found: buckets.news.length,
        has_section: buckets.news.length > 0,
        listing_url: buckets.news[0] || "",
        recent_in_last_year: recentCount,
        articles: newsArticles,
      },

      events: {
        pages_found: buckets.events.length,
        sample_titles: eventTitles,
        listing_url: buckets.events[0] || "",
      },

      careers: {
        has_careers_page: buckets.careers.length > 0,
        listing_url: buckets.careers[0] || "",
      },

      social_presence: {
        count: socials.length,
        accessible_count: accessibleSocialCount,
        platforms: enrichedSocials,
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

      // Internal-only diagnostics — not rendered in the UI by default.
      _debug: {
        https,
        page_size_bytes: homeHtml.length,
        home_latency_ms: home.latency_ms,
        http_status: home.status,
        page_title: stripTags(title),
        meta_description: description,
        html_lang: htmlLang,
        crawled_pages: subResults.map((r) => ({
          url: r.url, status: r.status ?? 0, category: r.category, ok: r.ok, latency_ms: r.latency_ms ?? 0,
        })),
        project_subpages_attempted: projectPicks.length,
      },
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
