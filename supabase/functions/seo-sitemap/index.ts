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
];

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

  // Static paths
  staticPaths.forEach((s) => {
    urls.push(
      `  <url>\n    <loc>${SITE}${s.loc}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n  </url>`
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
