// ═══════════════════════════════════════════════════════════════════════
// SINA SEO — Dynamic Sitemap
// ═══════════════════════════════════════════════════════════════════════
// Serves /sitemap.xml from the latest published seo_pages + static
// marketing pages. Wired via vercel.json rewrite.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const SITE = "https://cidoma.com";

// Static marketing pages — always included
const staticPaths = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/about", changefreq: "monthly", priority: "0.7" },
  { loc: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { loc: "/partnerships", changefreq: "weekly", priority: "0.9" },
  { loc: "/partnerships/owners", changefreq: "weekly", priority: "0.8" },
  { loc: "/partnerships/developers", changefreq: "weekly", priority: "0.8" },
  { loc: "/offers", changefreq: "daily", priority: "0.9" },
  { loc: "/opportunities", changefreq: "daily", priority: "0.8" },
  { loc: "/contact", changefreq: "yearly", priority: "0.3" },
  { loc: "/faq", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog", changefreq: "weekly", priority: "0.6" },
  { loc: "/terms", changefreq: "yearly", priority: "0.1" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.1" },
  { loc: "/usage-policy", changefreq: "yearly", priority: "0.1" },
  { loc: "/subscriptions", changefreq: "monthly", priority: "0.6" },
  { loc: "/for-owners", changefreq: "monthly", priority: "0.7" },
  { loc: "/for-developers", changefreq: "monthly", priority: "0.7" },
];

// Every static path has an English twin at /en<path>. Emit both with
// reciprocal hreflang so Google picks the right locale per searcher.
function staticHreflang(path: string): string {
  const ar = `${SITE}${path === "/" ? "/" : path}`;
  const en = `${SITE}/en${path === "/" ? "" : path}`;
  return (
    `    <xhtml:link rel="alternate" hreflang="ar" href="${ar}"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${ar}"/>`
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(d: string | null | undefined): string {
  if (!d) return new Date().toISOString();
  try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
}

Deno.serve(async (_req) => {
  const client = createClient(supabaseUrl, anonKey);

  // Fetch published non-noindex pages with their hreflang groups
  const { data: pages, error } = await client
    .from("seo_pages")
    .select("slug, locale, updated_at, published_at, hreflang_group, status, noindex")
    .eq("status", "published")
    .eq("noindex", false)
    .order("published_at", { ascending: false })
    .limit(50000);

  // Fetch active platform offers (public marketing catalog)
  const { data: offers } = await client
    .from("platform_offers")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(5000);

  // Fetch published + owner-approved + FEATURED opportunities (lands).
  //
  // Why the `is_featured=true` filter: OpportunityDetail only renders rows
  // that are featured (`.eq("is_featured", true)`). Without this filter the
  // sitemap advertises URLs that the page will render as "not available",
  // which Google treats as a soft-404 and drags down the rest of the
  // domain's crawl-budget / ranking. Featured is the gate between
  // "listed internally" and "indexable for the open web".
  const { data: lands } = await client
    .from("lands")
    .select("id, updated_at")
    .eq("is_active", true)
    .eq("owner_approved", true)
    .eq("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(error.message)}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  // Group pages by hreflang_group to emit alternate links
  const groups = new Map<string, typeof pages>();
  (pages ?? []).forEach((p) => {
    const key = p.hreflang_group ?? `${p.slug}::${p.locale}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(p);
    groups.set(key, bucket);
  });

  const urls: string[] = [];

  // Static paths — emit the Arabic URL and an English sibling via hreflang
  staticPaths.forEach((s) => {
    urls.push(
      `  <url>\n    <loc>${SITE}${s.loc}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n${staticHreflang(s.loc)}\n  </url>`
    );
    // Also emit the English URL itself so Google has a direct entry
    const enLoc = s.loc === "/" ? "/en" : `/en${s.loc}`;
    urls.push(
      `  <url>\n    <loc>${SITE}${enLoc}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n${staticHreflang(s.loc)}\n  </url>`
    );
  });

  // Dynamic offers (/offers/{slug})
  (offers ?? []).forEach((o: any) => {
    if (!o.slug) return;
    const lastmod = toIsoDate(o.updated_at);
    const arUrl = `${SITE}/offers/${encodeURIComponent(o.slug)}`;
    const enUrl = `${SITE}/en/offers/${encodeURIComponent(o.slug)}`;
    urls.push(
      `  <url>\n    <loc>${arUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>\n  </url>`
    );
  });

  // Dynamic opportunities (/opportunity/{id})
  (lands ?? []).forEach((l: any) => {
    if (!l.id) return;
    const lastmod = toIsoDate(l.updated_at);
    const arUrl = `${SITE}/opportunity/${l.id}`;
    const enUrl = `${SITE}/en/opportunity/${l.id}`;
    urls.push(
      `  <url>\n    <loc>${arUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>\n  </url>`
    );
  });

  // Dynamic SEO pages
  groups.forEach((group) => {
    group.forEach((p) => {
      const path = p.locale === "en" ? `/en${p.slug}` : p.slug;
      const lastmod = toIsoDate(p.updated_at);
      const alternates = group
        .map((alt) => {
          const altPath = alt.locale === "en" ? `/en${alt.slug}` : alt.slug;
          return `    <xhtml:link rel="alternate" hreflang="${alt.locale}" href="${SITE}${altPath}"/>`;
        })
        .join("\n");
      urls.push(
        `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n${alternates}\n  </url>`
      );
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
