// ═══════════════════════════════════════════════════════════════════════
// SINA SEO — IndexNow submission
// ═══════════════════════════════════════════════════════════════════════
// Pushes URL changes to Bing / Yandex / Seznam / Naver via the shared
// IndexNow protocol. Google does not consume IndexNow but picks up the
// same URLs from the sitemap, so coverage is complete.
//
// Invocation:
//   POST { urls: string[] }                 — submit specific URLs
//   POST {}  or GET                          — submit the full known set
//                                              (static pages + active offers
//                                              + approved opportunities)
//
// Key verification file is served from the site root at:
//   https://cidoma.com/<KEY>.txt
// The file content is the key itself.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://cidoma.com";
const KEY = "e3e616d6f6f53656b776848c48e2822b";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Static paths to push. NO /en/* entries — those routes aren't wired
// in the React router and would resolve to a soft-404 (catch-all
// renders <NotFound /> with HTTP 200). Submitting them to IndexNow
// pollutes Bing/Yandex with broken URLs and burns our submission
// quota. Re-add /en variants when the English route table lands.
const STATIC_PATHS = [
  "/",
  "/about",
  "/how-it-works",
  "/partnerships",
  "/partnerships/owners",
  "/partnerships/developers",
  "/offers",
  "/opportunities",
  "/contact",
  "/faq",
  "/blog",
  "/terms",
  "/privacy",
  "/for-owners",
  "/for-developers",
];

async function collectAllUrls(): Promise<string[]> {
  const client = createClient(supabaseUrl, anonKey);
  const urls = new Set<string>();

  STATIC_PATHS.forEach((p) => urls.add(`${SITE}${p}`));

  const { data: offers } = await client
    .from("platform_offers")
    .select("slug")
    .eq("is_active", true)
    .limit(5000);
  (offers ?? []).forEach((o: any) => {
    if (!o.slug) return;
    urls.add(`${SITE}/offers/${encodeURIComponent(o.slug)}`);
  });

  // Match the sitemap's gating exactly — only featured + approved lands
  // are publicly viewable. Submitting non-featured ids would push
  // soft-404s to Bing/Yandex.
  const { data: lands } = await client
    .from("lands")
    .select("id")
    .eq("is_active", true)
    .eq("owner_approved", true)
    .eq("is_featured", true)
    .limit(5000);
  (lands ?? []).forEach((l: any) => {
    if (!l.id) return;
    urls.add(`${SITE}/opportunity/${l.id}`);
  });

  // SEO pages — Arabic only; /en/* slugs would resolve to soft-404.
  const { data: seoPages } = await client
    .from("seo_pages")
    .select("slug, locale")
    .eq("status", "published")
    .eq("noindex", false)
    .eq("locale", "ar")
    .limit(50000);
  (seoPages ?? []).forEach((p: any) => {
    if (!p.slug) return;
    urls.add(`${SITE}${p.slug}`);
  });

  return Array.from(urls);
}

async function submitBatch(batch: string[]): Promise<{ status: number; body: string }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "cidoma.com",
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch,
    }),
  });
  const body = await res.text();
  return { status: res.status, body };
}

Deno.serve(async (req) => {
  try {
    let requested: string[] | null = null;
    if (req.method === "POST") {
      try {
        const payload = await req.json();
        if (Array.isArray(payload?.urls) && payload.urls.length > 0) {
          requested = payload.urls.filter((u: unknown) => typeof u === "string");
        }
      } catch {
        /* empty body is fine */
      }
    }

    const urls = requested ?? (await collectAllUrls());
    if (urls.length === 0) {
      return new Response(JSON.stringify({ ok: true, submitted: 0, note: "no urls" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // IndexNow caps payloads at 10,000 URLs per request; chunk defensively.
    const results: Array<{ status: number; body: string; count: number }> = [];
    const CHUNK = 1000;
    for (let i = 0; i < urls.length; i += CHUNK) {
      const batch = urls.slice(i, i + CHUNK);
      const r = await submitBatch(batch);
      results.push({ status: r.status, body: r.body.slice(0, 300), count: batch.length });
    }

    const ok = results.every((r) => r.status >= 200 && r.status < 300);
    return new Response(
      JSON.stringify({ ok, submitted: urls.length, batches: results }, null, 2),
      {
        status: ok ? 200 : 207,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
