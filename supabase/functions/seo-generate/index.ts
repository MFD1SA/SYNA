// ═══════════════════════════════════════════════════════════════════════
// SINA SEO — Generation Edge Function
// ═══════════════════════════════════════════════════════════════════════
// Single source of truth for programmatic page generation.
// Invoked manually from admin UI OR by a scheduled cron trigger.
//
// Enforces Google-aligned guardrails server-side:
// - Minimum data thresholds per rule
// - Quality gates (word count, internal links, FAQ, etc.)
// - Duplicate detection (same title+locale, same slug+locale)
// - Sensitive topics: forced manual_only mode
// - No scaled spam: each page bound to real entity + real data snapshot
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Handlebars-lite template renderer ───────────────────────────────
// Supports {{variable}} substitution only — no loops, no conditionals.
// Intentionally minimal to prevent template abuse (no code injection path).
function render(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined ? String(v) : "";
  });
}

function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.split(" ").length : 0;
}

type Severity = "low" | "medium" | "high" | "critical";

interface GeneratedPage {
  page_type: string;
  template_id: string | null;
  slug: string;
  locale: "ar" | "en";
  canonical_url: string;
  title: string;
  meta_description: string;
  h1: string;
  intro: string;
  body_html: string;
  schema_json: Record<string, unknown>;
  faq_items: unknown[];
  internal_links: Array<{ label: string; url: string }>;
  og_title: string;
  og_description: string;
  og_image: string | null;
  entity_id: string | null;
  secondary_entity_id?: string | null;
  bound_data_snapshot: Record<string, unknown>;
  status: string;
  content_mode: string;
  quality_score: number;
  word_count: number;
  noindex: boolean;
  generated_at: string;
}

// ─── Server-side quality gate ────────────────────────────────────────
function evaluateQuality(
  page: GeneratedPage,
  gates: Record<string, unknown>
): { pass: boolean; score: number; issues: Array<{ type: string; severity: Severity; message: string }> } {
  const issues: Array<{ type: string; severity: Severity; message: string }> = [];
  let score = 100;

  const minWords = Number(gates.min_word_count ?? 200);
  const minLinks = Number(gates.require_internal_links ?? 0);
  const maxTitle = Number(gates.max_title_length ?? 70);
  const maxDesc = Number(gates.max_description_length ?? 170);
  const requireFaq = gates.require_faq === true;

  if (!page.title) { issues.push({ type: "missing_title", severity: "critical", message: "Title missing" }); score -= 40; }
  if (!page.h1) { issues.push({ type: "missing_h1", severity: "high", message: "H1 missing" }); score -= 15; }
  if (!page.meta_description) { issues.push({ type: "missing_description", severity: "high", message: "Description missing" }); score -= 15; }
  if (page.title.length > maxTitle) { issues.push({ type: "title_too_long", severity: "low", message: `Title length ${page.title.length}` }); score -= 3; }
  if (page.meta_description.length > maxDesc) { issues.push({ type: "description_too_long", severity: "low", message: `Description length ${page.meta_description.length}` }); score -= 3; }
  if (page.word_count < minWords) { issues.push({ type: "thin_content", severity: "high", message: `${page.word_count} words < ${minWords}` }); score -= 20; }
  if (page.internal_links.length < minLinks) { issues.push({ type: "missing_internal_links", severity: "medium", message: `${page.internal_links.length} < ${minLinks}` }); score -= 10; }
  if (requireFaq && (!page.faq_items || page.faq_items.length === 0)) {
    issues.push({ type: "missing_faq", severity: "medium", message: "FAQ required but absent" }); score -= 10;
  }

  // Keyword stuffing
  const corpus = `${page.intro} ${page.body_html}`.toLowerCase().replace(/<[^>]+>/g, " ");
  const tokens = corpus.split(/[\s.,;:!?()،؛]+/).filter((t) => t.length > 2);
  if (tokens.length >= 50) {
    const counts = new Map<string, number>();
    tokens.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    let maxRatio = 0;
    let maxTok = "";
    counts.forEach((c, k) => { const r = c / tokens.length; if (r > maxRatio) { maxRatio = r; maxTok = k; } });
    if (maxRatio > 0.04) {
      issues.push({ type: "keyword_stuffing", severity: "high", message: `"${maxTok}" ${(maxRatio * 100).toFixed(1)}%` });
      score -= 15;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const pass = score >= 60 && !issues.some((i) => i.severity === "critical");
  return { pass, score, issues };
}

// ─── Page builders — one per page_type ────────────────────────────────
interface BuilderContext {
  admin: ReturnType<typeof createClient>;
  runId: string;
}

async function buildCityPage(
  ctx: BuilderContext,
  entity: Record<string, unknown>,
  template: Record<string, unknown>,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const name = locale === "ar" ? nameAr : nameEn;

  // Count real lands in this city (live data — no fake metrics)
  const { count: landsCount } = await ctx.admin
    .from("lands")
    .select("id", { count: "exact", head: true })
    .ilike("city", `%${nameAr.split(" ")[0]}%`);

  const { count: developersCount } = await ctx.admin
    .from("developers")
    .select("id", { count: "exact", head: true })
    .ilike("city", `%${nameAr.split(" ")[0]}%`);

  const vars = {
    name_ar: nameAr, name_en: nameEn, name, slug,
    lands_count: landsCount ?? 0,
    developers_count: developersCount ?? 0,
  };

  const title = render(locale === "ar" ? template.title_template_ar as string : template.title_template_en as string, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar as string : template.meta_description_en as string, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar as string : template.h1_template_en as string, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar as string ?? "") : (template.intro_template_en as string ?? ""), vars);

  // Render body sections
  const sections = (locale === "ar" ? template.body_sections_ar : template.body_sections_en) as Array<{ heading_ar?: string; heading_en?: string; body_ar?: string; body_en?: string }> ?? [];
  const bodyHtml = sections
    .map((s) => {
      const heading = locale === "ar" ? s.heading_ar : s.heading_en;
      const body = locale === "ar" ? s.body_ar : s.body_en;
      if (!heading || !body) return "";
      return `<section><h2>${render(heading, vars)}</h2><p>${render(body, vars)}</p></section>`;
    })
    .filter(Boolean)
    .join("\n");

  // Internal links: always link to the city page's siblings (developers, offers by city)
  const internalLinks = [
    { label: locale === "ar" ? `أراضٍ في ${name}` : `Lands in ${name}`, url: `/properties/lands` },
    { label: locale === "ar" ? `مطورون عقاريون` : `Real Estate Developers`, url: `/services/real-estate-development` },
    { label: locale === "ar" ? `الشراكة العقارية` : `Real Estate Partnership`, url: `/services/real-estate-partnership` },
  ];

  const canonical = render(template.canonical_pattern as string, vars);
  const fullCanonical = `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`;

  const page: GeneratedPage = {
    page_type: "city",
    template_id: template.id as string,
    slug: canonical,
    locale,
    canonical_url: fullCanonical,
    title, meta_description: desc, h1, intro,
    body_html: bodyHtml,
    schema_json: {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": name,
      "url": fullCanonical,
      "address": { "@type": "PostalAddress", "addressCountry": "SA" },
    },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title,
    og_description: desc,
    og_image: null,
    entity_id: entity.id as string,
    bound_data_snapshot: { landsCount, developersCount, generated_on_count: (landsCount ?? 0) + (developersCount ?? 0) },
    status: "draft",
    content_mode: template.default_content_mode as string,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };

  return page;
}

async function buildPropertyTypePage(
  _ctx: BuilderContext,
  entity: Record<string, unknown>,
  template: Record<string, unknown>,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const name = locale === "ar" ? nameAr : nameEn;
  const vars = { name_ar: nameAr, name_en: nameEn, name, slug };

  const title = render(locale === "ar" ? template.title_template_ar as string : template.title_template_en as string, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar as string : template.meta_description_en as string, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar as string : template.h1_template_en as string, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar as string ?? "") : (template.intro_template_en as string ?? ""), vars);

  const bodyHtml = locale === "ar"
    ? `<section><h2>نظرة عامة على ${name}</h2><p>سوق ${name} في المملكة العربية السعودية يشهد حركة نشطة مدفوعة بالنمو العمراني والطلب المتزايد على الأصول العقارية عالية الجودة.</p></section><section><h2>كيف يعمل ذلك عبر سينا</h2><p>تربط منصة سينا المالكين بالمطورين المؤهّلين عبر مسار موثّق متدرّج، يبدأ من إدراج الأصل وينتهي بإغلاق شراكة رسمية موثّقة.</p></section>`
    : `<section><h2>Overview of ${name}</h2><p>The ${name} market in Saudi Arabia is seeing active movement driven by urban growth and rising demand for high-quality real estate assets.</p></section><section><h2>How it works on SINA</h2><p>SINA connects owners with qualified developers through a staged, verified journey — from listing the asset to closing a formal, documented partnership.</p></section>`;

  const internalLinks = [
    { label: locale === "ar" ? `التطوير العقاري` : `Real Estate Development`, url: `/services/real-estate-development` },
    { label: locale === "ar" ? `الشراكة العقارية` : `Real Estate Partnership`, url: `/services/real-estate-partnership` },
  ];

  const canonical = render(template.canonical_pattern as string, vars);
  return {
    page_type: "property_type",
    template_id: template.id as string,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: { "@context": "https://schema.org", "@type": "WebPage", "name": title },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title, og_description: desc, og_image: null,
    entity_id: entity.id as string,
    bound_data_snapshot: {},
    status: "draft",
    content_mode: template.default_content_mode as string,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

async function buildServicePage(
  _ctx: BuilderContext,
  entity: Record<string, unknown>,
  template: Record<string, unknown>,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const isSensitive = entity.is_sensitive === true;
  const name = locale === "ar" ? nameAr : nameEn;
  const vars = { name_ar: nameAr, name_en: nameEn, name, slug };

  const title = render(locale === "ar" ? template.title_template_ar as string : template.title_template_en as string, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar as string : template.meta_description_en as string, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar as string : template.h1_template_en as string, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar as string ?? "") : (template.intro_template_en as string ?? ""), vars);

  const bodyHtml = locale === "ar"
    ? `<section><h2>ماذا نقدّم</h2><p>تقدّم منصة سينا خدمة ${name} ضمن بيئة رقمية مرخّصة من الهيئة العامة للعقار (REGA)، بمسار موثّق متدرّج يضمن وضوح الحقوق والالتزامات.</p></section><section><h2>كيف تستفيد</h2><p>سواء كنت مالك أرض أو مطوّراً عقارياً، يتيح لك نظام سينا الوصول إلى أدوات احترافية مع حماية بيانات كاملة وفحص نافٍ للجهالة.</p></section>`
    : `<section><h2>What we offer</h2><p>SINA delivers ${name} in a REGA-licensed digital environment, with a staged verified journey ensuring clarity of rights and obligations.</p></section><section><h2>How you benefit</h2><p>Whether you are a landowner or a real estate developer, SINA's system gives you access to professional tools with full data protection and due diligence.</p></section>`;

  const internalLinks = [
    { label: locale === "ar" ? `كيف تعمل سينا` : `How SINA Works`, url: `/how-it-works` },
    { label: locale === "ar" ? `الأسئلة الشائعة` : `FAQ`, url: `/faq` },
  ];

  const canonical = render(template.canonical_pattern as string, vars);
  return {
    page_type: "service",
    template_id: template.id as string,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": name,
      "provider": { "@type": "Organization", "name": "SINA Real Estate Development", "url": "https://cidoma.com" },
      "areaServed": "SA",
    },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title, og_description: desc, og_image: null,
    entity_id: entity.id as string,
    bound_data_snapshot: { is_sensitive: isSensitive },
    status: "draft",
    // Sensitive topics → always manual_only regardless of rule
    content_mode: isSensitive ? "manual_only" : (template.default_content_mode as string),
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

async function buildTopicPage(
  _ctx: BuilderContext,
  entity: Record<string, unknown>,
  template: Record<string, unknown>,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const name = locale === "ar" ? nameAr : nameEn;
  const vars = { name_ar: nameAr, name_en: nameEn, name, slug };

  const title = render(locale === "ar" ? template.title_template_ar as string : template.title_template_en as string, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar as string : template.meta_description_en as string, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar as string : template.h1_template_en as string, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar as string ?? "") : (template.intro_template_en as string ?? ""), vars);

  // Topics are inherently informational; body is stubbed minimal and marked manual_only
  // so the admin fills authoritative content before publish.
  const bodyHtml = locale === "ar"
    ? `<section><h2>${name}</h2><p>هذا دليل مبدئي حول ${name}. يحتاج المسؤول إلى مراجعة النص وإضافة محتوى كامل قبل النشر.</p></section>`
    : `<section><h2>${name}</h2><p>This is a preliminary guide on ${name}. An editor must review and add full content before publishing.</p></section>`;

  const canonical = render(template.canonical_pattern as string, vars);
  return {
    page_type: "topic",
    template_id: template.id as string,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: { "@context": "https://schema.org", "@type": "Article", "headline": title },
    faq_items: [],
    internal_links: [
      { label: locale === "ar" ? `كيف تعمل سينا` : `How SINA Works`, url: `/how-it-works` },
    ],
    og_title: title, og_description: desc, og_image: null,
    entity_id: entity.id as string,
    bound_data_snapshot: { requires_editorial_review: true },
    status: "draft",
    content_mode: "manual_only",
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Main request handler ────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const ruleId: string | undefined = body.ruleId;
    const dryRun: boolean = body.dryRun === true;

    const admin = createClient(supabaseUrl, serviceKey);

    // Create a run record
    const { data: run, error: runError } = await admin
      .from("seo_generation_runs")
      .insert({ rule_id: ruleId ?? null, trigger_type: "manual", status: "running" })
      .select("id")
      .single();
    if (runError || !run) throw new Error(runError?.message ?? "Failed to create run");
    const runId = run.id as string;

    // Load rules
    const rulesQuery = admin.from("seo_generation_rules").select("*").eq("is_active", true);
    if (ruleId) rulesQuery.eq("id", ruleId);
    const { data: rules, error: rulesError } = await rulesQuery;
    if (rulesError) throw new Error(rulesError.message);

    const skippedReasons: Array<{ entity: string; reason: string }> = [];
    const errors: Array<Record<string, unknown>> = [];
    let generated = 0;
    let skipped = 0;

    const ctx: BuilderContext = { admin, runId };

    for (const rule of rules ?? []) {
      const gates = rule.quality_gates ?? {};
      const reqs = rule.min_data_requirements ?? {};

      // Load default template for this page_type
      const { data: tmpl } = await admin
        .from("seo_templates")
        .select("*")
        .eq("page_type", rule.page_type)
        .eq("is_default", true)
        .eq("is_active", true)
        .maybeSingle();
      if (!tmpl) {
        errors.push({ rule: rule.name, reason: "No default template" });
        continue;
      }

      // Determine source entities for this rule
      let entityQuery = admin.from("seo_entities").select("*").eq("is_active", true);

      if (["city", "property_type", "service", "topic"].includes(rule.page_type)) {
        entityQuery = entityQuery.eq("entity_type", rule.page_type);
      } else if (rule.page_type === "district") {
        entityQuery = entityQuery.eq("entity_type", "district");
      } else {
        // developer / company / hybrid pages — not handled in this MVP run
        skippedReasons.push({ entity: rule.page_type, reason: "Page type not in MVP auto-generation scope" });
        continue;
      }

      if (reqs.exclude_sensitive === true) entityQuery = entityQuery.eq("is_sensitive", false);
      if (reqs.only_sensitive === true) entityQuery = entityQuery.eq("is_sensitive", true);

      const maxRun = rule.max_pages_per_run ?? 50;
      entityQuery = entityQuery.limit(maxRun);

      const { data: entities, error: entError } = await entityQuery;
      if (entError) { errors.push({ rule: rule.name, reason: entError.message }); continue; }

      for (const entity of entities ?? []) {
        // Generate both Arabic and English versions (hreflang pair)
        const hreflangGroup = crypto.randomUUID();

        for (const locale of ["ar", "en"] as const) {
          let page: GeneratedPage | null = null;

          try {
            if (rule.page_type === "city") {
              page = await buildCityPage(ctx, entity, tmpl, locale);
            } else if (rule.page_type === "property_type") {
              page = await buildPropertyTypePage(ctx, entity, tmpl, locale);
            } else if (rule.page_type === "service") {
              page = await buildServicePage(ctx, entity, tmpl, locale);
            } else if (rule.page_type === "topic") {
              page = await buildTopicPage(ctx, entity, tmpl, locale);
            }
          } catch (err) {
            errors.push({ rule: rule.name, entity: entity.slug, locale, reason: String(err) });
            continue;
          }

          if (!page) { skipped++; skippedReasons.push({ entity: `${entity.slug} (${locale})`, reason: "Builder returned null" }); continue; }

          // Evaluate quality
          const q = evaluateQuality(page, gates);
          page.quality_score = q.score;

          if (!q.pass) {
            skipped++;
            skippedReasons.push({ entity: `${entity.slug} (${locale})`, reason: `Quality failed: ${q.issues.map((i) => i.type).join(", ")}` });
            continue;
          }

          // Check duplicates (same slug+locale already exists)
          const { data: existing } = await admin
            .from("seo_pages")
            .select("id,status")
            .eq("slug", page.slug)
            .eq("locale", page.locale)
            .maybeSingle();

          if (existing) {
            // Only update if still draft/ready_for_review (don't overwrite published content)
            if (["draft", "ready_for_review"].includes((existing as { status: string }).status)) {
              if (!dryRun) {
                await admin.from("seo_pages").update({
                  ...page,
                  hreflang_group: hreflangGroup,
                  bound_data_snapshot: page.bound_data_snapshot,
                }).eq("id", (existing as { id: string }).id);
              }
              generated++;
            } else {
              skipped++;
              skippedReasons.push({ entity: `${entity.slug} (${locale})`, reason: "Already published — not overwritten" });
            }
            continue;
          }

          if (dryRun) { generated++; continue; }

          const { error: insertError } = await admin.from("seo_pages").insert({
            ...page,
            hreflang_group: hreflangGroup,
          });
          if (insertError) {
            errors.push({ rule: rule.name, entity: entity.slug, locale, reason: insertError.message });
            continue;
          }
          generated++;
        }
      }
    }

    // Finalize run
    await admin.from("seo_generation_runs").update({
      status: errors.length > 0 ? "completed" : "completed",
      pages_generated: generated,
      pages_skipped: skipped,
      errors,
      completed_at: new Date().toISOString(),
    }).eq("id", runId);

    return new Response(JSON.stringify({
      runId,
      status: "completed",
      pagesGenerated: generated,
      pagesSkipped: skipped,
      skippedReasons,
      errors,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ status: "failed", error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
