// ═══════════════════════════════════════════════════════════════════════
// SINA SEO — robots.txt
// ═══════════════════════════════════════════════════════════════════════
// Served via Vercel rewrite at /robots.txt.
// Disallows private app surfaces; allows the marketing + SEO pages.
// ═══════════════════════════════════════════════════════════════════════

Deno.serve(() => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Application surfaces — not for search indexing",
    "Disallow: /admincp",
    "Disallow: /admincp/",
    "Disallow: /crm",
    "Disallow: /crm/",
    "Disallow: /owner",
    "Disallow: /owner/",
    "Disallow: /auth/",
    "Disallow: /api/",
    "Disallow: /_next/",
    "",
    "# Sitemap",
    "Sitemap: https://cidoma.com/sitemap.xml",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
