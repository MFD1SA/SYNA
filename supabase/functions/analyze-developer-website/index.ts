// ═══════════════════════════════════════════════════════════════════════
// SINA — Developer Project Portfolio Extractor (v9)
// ═══════════════════════════════════════════════════════════════════════
// Single, narrow purpose: extract the developer's PROJECTS from their
// website so an owner / admin / supervisor can see what the developer
// has actually built, what they're building now, and what supporting
// content (news / events / social channels / office locations) sits
// alongside the portfolio.
//
// What this function deliberately does NOT do:
//   • No HTTPS / SSL / domain / DNS / hosting / performance audit
//   • No SEO score, no trust score, no health grade
//   • No recommendations, no "positive signal" / "suggests" language
//   • No external AI inference (no hallucinated facts)
//   • No third-party SEO/news/social API
//   • No social-platform follower scraping (project focus, not vanity)
//
// History:
//   v6: BI overhaul — projects/news/events/about sub-page crawl
//   v7: dedupe social platforms by network
//   v8: deep project pages + news cards + social profile enrichment
//   v9: project-centric — score/trust/_debug/careers/social-enrichment
//       removed, project crawl deepened (12 vs 4), strictly factual.
//
// Response shape is consumed by `src/components/owner/DevWebsiteAnalysis.tsx`.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

// ── CORS: allow only cidoma.com + subdomains (and localhost for dev). ──
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
//   • IPv6 literal in loopback/link-local/ULA ranges
//   • Bare hostnames that look like internal LAN names (no dot)
function isPubliclyResolvableHost(u: URL): boolean {
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (!host) return false;
  if (!host.includes(".")) return false;
  if (host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".lan")) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return false;
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

// ─── Social link detection — links only, no profile enrichment.
// We surface the channels so the user can verify the developer exists
// elsewhere; we deliberately don't fetch/scrape follower counts because
// (a) it's noise relative to the project portfolio focus and
// (b) the platforms heavily rate-limit anonymous bots.
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

// ─── Link categorization — only categories we render in the report.
// `careers` and `privacy` are deliberately gone: careers is HR signal
// not project content, and privacy is a legal page that doesn't help
// an owner evaluate a developer's project track record.
type Category = "projects" | "news" | "events" | "about" | "contact";

const CATEGORY_PATTERNS: Record<Category, RegExp[]> = {
  projects: [
    /\/(projects?|portfolio|portfolios|works?|case[-_]?stud(y|ies)|properties|developments?|residences?|communities|listings?|estates?)(\/|$|\?|#)/i,
    /\/(مشاريع|أعمال|محفظة|عقارات|مجمعات|تطويرات|وحدات)/i,
  ],
  news: [
    /\/(news|press|blog|blogs|articles?|insights?|stories|updates|releases?|media[-_]?center|newsroom|posts?)(\/|$|\?|#)/i,
    /\/(أخبار|مقالات|مدونة|بيانات[-_]صحفية|إعلانات)/i,
  ],
  events: [
    /\/(events?|webinars?|conferences?|meet[-_]?ups?|seminars?|exhibitions?|expo)(\/|$|\?|#)/i,
    /\/(فعاليات|أحداث|مؤتمرات|معارض|ندوات)/i,
  ],
  about: [
    /\/(about|company|who[-_]we[-_]are|our[-_]story|history|leadership|team|management|chairman|ceo)(\/|$|\?|#)/i,
    /\/(عن|من-نحن|من_نحن|نبذة|تعريف|قيادة|الإدارة|تاريخ)/i,
  ],
  contact: [
    /\/(contact|get[-_]in[-_]touch|reach[-_]us|locations?|offices?|find[-_]us|branches?)(\/|$|\?|#)/i,
    /\/(اتصل|تواصل|فروع|مكاتب|عناوين)/i,
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
      if (out.length >= 16) return out;
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
        if (out.length >= 16) break;
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
  status: string;
  project_type: string;
  url: string;
}

// ─── Project status & type detection from page text ──────────────────
// We surface what the developer themselves PUBLISH about the project —
// we do not infer or guess. If the page doesn't contain one of these
// phrases, the field stays empty. No AI, no extrapolation.
const STATUS_PATTERNS: Array<{ key: string; ar: RegExp; en: RegExp }> = [
  { key: "completed",          ar: /(?:تم\s+(?:تسليم|إنجاز|اكتمال)|مكتمل|منجز|تم\s+التسليم)/i,
                               en: /\b(?:completed|delivered|handed[\s-]?over|finished)\b/i },
  { key: "under_construction", ar: /(?:قيد\s+(?:الإنشاء|التطوير|التنفيذ)|تحت\s+(?:الإنشاء|التطوير))/i,
                               en: /\b(?:under[\s-]?construction|in[\s-]?progress|being[\s-]?built|currently[\s-]?building)\b/i },
  { key: "planned",            ar: /(?:قريباً|قريبا|قيد\s+الإطلاق|قيد\s+التخطيط)/i,
                               en: /\b(?:coming[\s-]?soon|launching[\s-]?soon|planned|upcoming|pre[\s-]?launch)\b/i },
  { key: "selling",            ar: /(?:متاح\s+للبيع|متاحة\s+للبيع|للبيع\s+الآن|للحجز)/i,
                               en: /\b(?:now[\s-]?selling|available[\s-]?(?:for[\s-]?sale|now)|on[\s-]?sale)\b/i },
];

const TYPE_PATTERNS: Array<{ key_ar: string; key_en: string; ar: RegExp; en: RegExp }> = [
  { key_ar: "سكني",       key_en: "Residential",  ar: /\bسكن(?:ي|ية)\b/i,                       en: /\bresidential\b/i },
  { key_ar: "تجاري",      key_en: "Commercial",   ar: /\bتجاري(?:ة)?\b/i,                       en: /\bcommercial\b/i },
  { key_ar: "مكتبي",      key_en: "Offices",      ar: /\bمكتبي(?:ة)?\b|\bمكاتب\b/i,             en: /\boffices?\b|\boffice[\s-]?buildings?\b/i },
  { key_ar: "ضيافة",      key_en: "Hospitality",  ar: /\bضيافة\b|\bفنادق\b|\bفندقي\b/i,         en: /\bhospitality\b|\bhotels?\b/i },
  { key_ar: "متعدد الاستخدام", key_en: "Mixed-use", ar: /\bمتعدد(?:ة)?\s+الاستخدام(?:ات)?\b/i,    en: /\bmixed[\s-]?use\b/i },
  { key_ar: "صناعي",      key_en: "Industrial",   ar: /\bصناعي(?:ة)?\b|\bمستودعات\b/i,           en: /\bindustrial\b|\bwarehouses?\b/i },
  { key_ar: "تجزئة",      key_en: "Retail",       ar: /\bتجزئة\b|\bمولات\b|\bمراكز\s+تسوق\b/i,  en: /\bretail\b|\bmalls?\b|\bshopping[\s-]?centers?\b/i },
  { key_ar: "فلل",        key_en: "Villas",       ar: /\bفلل\b|\bفيلا\b/i,                       en: /\bvillas?\b/i },
  { key_ar: "شقق",        key_en: "Apartments",   ar: /\bشقق\b|\bشقة\b/i,                        en: /\bapartments?\b|\bcondos?\b|\bflats?\b/i },
];

function detectProjectStatus(text: string, isArabic: boolean): string {
  for (const p of STATUS_PATTERNS) {
    if ((p.ar.test(text)) || (p.en.test(text))) {
      // Map status key to display strings
      const mapAr: Record<string, string> = {
        completed: "مكتمل",
        under_construction: "قيد الإنشاء",
        planned: "قريباً",
        selling: "متاح للبيع",
      };
      const mapEn: Record<string, string> = {
        completed: "Completed",
        under_construction: "Under Construction",
        planned: "Coming Soon",
        selling: "Now Selling",
      };
      return isArabic ? mapAr[p.key] : mapEn[p.key];
    }
  }
  return "";
}

function detectProjectType(text: string, isArabic: boolean): string {
  // Return the first match (most specific takes priority via ordering above).
  for (const p of TYPE_PATTERNS) {
    if (p.ar.test(text) || p.en.test(text)) {
      return isArabic ? p.key_ar : p.key_en;
    }
  }
  return "";
}

function parseProjectPage(html: string, pageUrl: string): ProjectCard | null {
  const ogTitle = extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const metaDesc = extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const docTitle = extractMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  const isArabic = !!(langMatch && /^ar/i.test(langMatch[1]));
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
    html.match(/(?:located in|location\s*[:-]\s*|في\s+مدينة\s+|بحي\s+|بمدينة\s+|بمنطقة\s+)\s*([؀-ۿa-zA-Z\s,]{3,60})/i);
  if (locMatch) {
    location = stripTags(locMatch[1]).replace(/[,.\s]+$/, "").slice(0, 80);
  }

  // Status & type detection — strictly factual, only what the page publishes.
  const visibleText = stripTags(html).slice(0, 8_000);
  const status = detectProjectStatus(visibleText, isArabic);
  const project_type = detectProjectType(visibleText, isArabic);

  return { title, summary, image_url, location, status, project_type, url: pageUrl };
}

// ─── Textual date parsing (English + Arabic month names) ────────────
const MONTH_INDEX: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  const en: [string[], number][] = [
    [["jan", "january"], 1], [["feb", "february"], 2], [["mar", "march"], 3],
    [["apr", "april"], 4], [["may"], 5], [["jun", "june"], 6],
    [["jul", "july"], 7], [["aug", "august"], 8], [["sep", "sept", "september"], 9],
    [["oct", "october"], 10], [["nov", "november"], 11], [["dec", "december"], 12],
  ];
  for (const [keys, idx] of en) for (const k of keys) m[k] = idx;
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
  const names = Object.keys(MONTH_INDEX).sort((a, b) => b.length - a.length);
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

function extractNewsCards(html: string, listingUrl: string, originHost: string): NewsCard[] {
  const out: NewsCard[] = [];
  const seenUrls = new Set<string>();

  const collect = (re: RegExp) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && out.length < 8) {
      const card = parseCardBlock(m[1], listingUrl, originHost);
      if (card && !seenUrls.has(card.url)) {
        seenUrls.add(card.url);
        out.push(card);
      }
    }
  };

  collect(/<article\b[^>]*>([\s\S]{50,8000}?)<\/article>/gi);
  if (out.length < 4) {
    collect(/<(?:div|li|section)\b[^>]*class=["'][^"']*(?:post|news|article|card|blog|entry|item)[^"']*["'][^>]*>([\s\S]{100,5000}?)<\/(?:div|li|section)>/gi);
  }
  return out;
}

function parseCardBlock(block: string, baseUrl: string, originHost: string): NewsCard | null {
  const titleM = block.match(/<h[1-4]\b[^>]*>([\s\S]{4,400}?)<\/h[1-4]>/i);
  const title = titleM ? stripTags(titleM[1]).slice(0, 200) : "";
  if (!title || title.length < 6) return null;

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

  let summary = "";
  const pM = block.match(/<p\b[^>]*>([\s\S]{20,800}?)<\/p>/i);
  if (pM) summary = stripTags(pM[1]).slice(0, 220);

  return { title, url, image_url, date, summary };
}

// ─── Fetch helpers ───────────────────────────────────────────────────
async function tryFetch(targetUrl: string, timeoutMs: number, byteCap: number):
  Promise<{ status: number; html: string; latency_ms: number; finalUrl: string }> {
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
    // supplied `body.website` to override it.
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
    const socialLinks = detectSocials(homeHtml);
    const ldBlocks = parseJsonLdBlocks(homeHtml);
    const orgNodes = ldNodesByType(ldBlocks, ["Organization", "Corporation", "LocalBusiness", "RealEstateAgent"]);
    const organization = orgNodes[0] ?? null;

    // ── Step 3: classify links ─────────────────────────────────────
    const buckets: Record<Category, string[]> = {
      projects: [], news: [], events: [], about: [], contact: [],
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
    // Projects gets priority — that's the focus. We pull up to 2
    // candidate listing pages in case the developer has both /projects
    // and /developments, so we don't miss a fork in the structure.
    const projectListingUrls = buckets.projects.slice(0, 2);
    const subPicks: Array<{ category: Category; url: string }> = [];
    for (const url of projectListingUrls) subPicks.push({ category: "projects", url });
    for (const cat of ["news", "events", "about", "contact"] as Category[]) {
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
    const SUBPAGE_CAP: Partial<Record<Category, number>> = {
      projects: 1_000_000,
      news: 800_000,
      events: 400_000,
      about: 350_000,
      contact: 250_000,
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
      // For projects we may have two listing pages — keep the first that loaded.
      if (r.ok && r.html && !subByCat[r.category]) subByCat[r.category] = r;
    }
    // If primary projects listing failed, try the secondary one.
    const allProjectsListings = subResults.filter((r) => r.category === "projects" && r.ok && r.html);

    // ── Step 4.5: deep project extraction ───────────────────────────
    // Walk into individual project sub-pages from EVERY successful
    // listing to build a richer portfolio. We dedupe URLs across
    // listings so we don't re-fetch the same project twice.
    const projectSubpageUrls: string[] = [];
    const seenProjectUrls = new Set<string>();
    for (const listing of allProjectsListings) {
      const urls = extractProjectSubpageUrls(listing.html!, listing.url, originHost);
      for (const u of urls) {
        if (seenProjectUrls.has(u)) continue;
        seenProjectUrls.add(u);
        projectSubpageUrls.push(u);
        if (projectSubpageUrls.length >= 16) break;
      }
      if (projectSubpageUrls.length >= 16) break;
    }
    // Cap deep-fetch at 12 projects — balance between portfolio depth
    // and total request time. Pages run in parallel so the wall-clock
    // cost is roughly one page-fetch.
    const projectPicks = projectSubpageUrls.slice(0, 12);

    const projectFetches = await Promise.all(
      projectPicks.map(async (u): Promise<ProjectCard | null> => {
        try {
          const r = await tryFetch(u, 4_500, 220_000);
          if (r.status >= 200 && r.status < 400 && r.html) {
            return parseProjectPage(r.html, u);
          }
        } catch { /* */ }
        return null;
      }),
    );
    const detailedProjects: ProjectCard[] = projectFetches.filter((p): p is ProjectCard => !!p);

    // ── Step 4.6: news cards (supplementary, not the focus) ─────────
    const newsArticles: NewsCard[] = subByCat.news?.html
      ? extractNewsCards(subByCat.news.html, subByCat.news.url, originHost)
      : [];

    // News dates → "recent in last 12 months" count
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    let recentCount = 0;
    for (const a of newsArticles) {
      if (!a.date) continue;
      const t = Date.parse(a.date);
      if (Number.isFinite(t) && t >= cutoff) recentCount += 1;
    }
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

    // About page (only used to enrich company description fallback)
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

    // Addresses / multi-office (factual list only — no recommendations).
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

    // ── Project status & type rollups ──────────────────────────────
    // A factual breakdown of the developer's portfolio — counts only,
    // no judgment.
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    for (const p of detailedProjects) {
      if (p.status) statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
      if (p.project_type) typeCounts[p.project_type] = (typeCounts[p.project_type] ?? 0) + 1;
    }

    // ── Final response shape (project-centric, factual only) ────────
    // The CANONICAL fields below are what the v9 frontend reads.
    //
    // The "LEGACY ALIAS" fields after them are temporary backward-compat
    // for the old v8 frontend bundle that may still be live on the CDN
    // until the Vercel rebuild propagates. They mirror the same data
    // (where it overlaps) and stub-out fields the old UI tried to render
    // but we no longer compute (score, score_band, score_breakdown,
    // trust_signals, careers). Without these stubs the old UI would do
    // `bandStyles[result.score_band].cls` → crash → ErrorBoundary.
    //
    // SAFE TO REMOVE: once a frontend deploy is confirmed live and a few
    // days have passed (CDN/edge cache to flush), drop the LEGACY block.
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
        // CANONICAL (v9)
        listing_pages_found: buckets.projects.length,
        listing_url: buckets.projects[0] || "",
        items: detailedProjects,
        status_breakdown: statusCounts,
        type_breakdown: typeCounts,
        // LEGACY ALIASES (v8 frontend)
        pages_found: buckets.projects.length,
        has_dedicated_section: buckets.projects.length > 0,
        detailed_items: detailedProjects,
      },

      news: {
        // CANONICAL
        listing_url: buckets.news[0] || "",
        recent_in_last_year: recentCount,
        articles: newsArticles,
        // LEGACY ALIASES
        pages_found: buckets.news.length,
        has_section: buckets.news.length > 0,
      },

      events: {
        // CANONICAL
        listing_url: buckets.events[0] || "",
        sample_titles: eventTitles,
        // LEGACY ALIAS
        pages_found: buckets.events.length,
      },

      // CANONICAL — simple link list, no follower scraping.
      social_links: socialLinks,

      // CANONICAL — factual offices + languages.
      locations: {
        offices: uniqueAddresses,
        languages,
      },

      // ── LEGACY backward-compat fields (drop once frontend deploys) ──
      // social_presence — old shape with .count, .accessible_count, .platforms.
      social_presence: {
        count: socialLinks.length,
        accessible_count: 0, // we no longer enrich profiles
        platforms: socialLinks.map((s) => ({ ...s, accessible: false, profile: null })),
      },
      // expansion — old shape; the new frontend uses `locations`.
      expansion: {
        addresses: uniqueAddresses,
        languages_supported: languages,
        office_locations_count: uniqueAddresses.length,
        international: languages.length >= 2,
      },
      // careers — no longer computed; stub so old UI doesn't crash.
      careers: {
        has_careers_page: false,
        listing_url: "",
      },
      // trust_signals — old factual booleans; the new UI doesn't render
      // them but the old UI iterates them.
      trust_signals: {
        has_about_page: buckets.about.length > 0,
        has_contact_page: buckets.contact.length > 0,
        has_organization_schema: !!organization,
        has_logo: !!orgLogo,
        has_clear_description: !!orgDescription && orgDescription.length >= 60,
      },
      // score / band / breakdown — stubbed to neutral values. The old UI
      // renders "0/100" + "fair" until the new bundle ships; that's an
      // ugly degraded state for a few minutes/hours but NOT a crash.
      score: 0,
      score_band: "fair" as const,
      score_breakdown: [] as Array<{ label_ar: string; label_en: string; weight: number; passed: boolean; value?: string }>,
    };

    if (developerId) {
      await admin.from("developers").update({
        website_analysis: result,
        website_analyzed_at: new Date().toISOString(),
      }).eq("id", developerId).then(() => {}, () => {});
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
