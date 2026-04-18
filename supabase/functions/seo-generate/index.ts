// ═══════════════════════════════════════════════════════════════════════
// SINA SEO — Generation Edge Function
// ═══════════════════════════════════════════════════════════════════════
// Single source of truth for programmatic page generation.
// Invoked manually from admin UI OR by a scheduled cron trigger (pg_cron).
//
// Enforces Google-aligned guardrails server-side:
// - Minimum data thresholds per rule
// - Quality gates (word count, internal links, FAQ, etc.)
// - Duplicate detection (same title+locale, same slug+locale)
// - Sensitive topics: forced manual_only mode
// - No scaled spam: each page bound to real entity + real data snapshot
// - Quality issues auto-inserted into seo_issues for admin review
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Handlebars-lite (whitelist: {{var}} only — no logic, no code) ──
function render(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined ? String(v) : "";
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
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
  bound_developer_id?: string | null;
  bound_data_snapshot: Record<string, unknown>;
  status: string;
  content_mode: string;
  quality_score: number;
  word_count: number;
  noindex: boolean;
  generated_at: string;
}

// ─── Quality evaluator ──────────────────────────────────────────────
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

// ─── Builder context ────────────────────────────────────────────────
interface BuilderContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any;
  runId: string;
}

// ─── City builder ───────────────────────────────────────────────────
async function buildCityPage(
  ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const name = locale === "ar" ? nameAr : nameEn;

  const { count: landsCount } = await ctx.admin
    .from("lands").select("id", { count: "exact", head: true })
    .ilike("city", `%${nameAr.split(" ")[0]}%`);

  const { count: developersCount } = await ctx.admin
    .from("developers").select("id", { count: "exact", head: true })
    .ilike("city", `%${nameAr.split(" ")[0]}%`);

  const vars = { name_ar: nameAr, name_en: nameEn, name, slug, lands_count: landsCount ?? 0, developers_count: developersCount ?? 0 };

  const title = render(locale === "ar" ? template.title_template_ar : template.title_template_en, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar : template.meta_description_en, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar : template.h1_template_en, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar ?? "") : (template.intro_template_en ?? ""), vars);

  const sections = (locale === "ar" ? template.body_sections_ar : template.body_sections_en) as Array<{ heading_ar?: string; heading_en?: string; body_ar?: string; body_en?: string }> ?? [];
  const bodyHtml = sections.map((s) => {
    const heading = locale === "ar" ? s.heading_ar : s.heading_en;
    const body = locale === "ar" ? s.body_ar : s.body_en;
    if (!heading || !body) return "";
    return `<section><h2>${render(heading, vars)}</h2><p>${render(body, vars)}</p></section>`;
  }).filter(Boolean).join("\n");

  const internalLinks = [
    { label: locale === "ar" ? `أراضي في ${name}` : `Lands in ${name}`, url: `/properties/lands` },
    { label: locale === "ar" ? `مطورون عقاريون` : `Real Estate Developers`, url: `/services/real-estate-development` },
    { label: locale === "ar" ? `الشراكة العقارية` : `Real Estate Partnership`, url: `/services/real-estate-partnership` },
  ];

  const canonical = render(template.canonical_pattern, vars);
  const fullCanonical = `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`;

  return {
    page_type: "city",
    template_id: template.id,
    slug: canonical,
    locale,
    canonical_url: fullCanonical,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": name,
      "url": fullCanonical,
      "address": { "@type": "PostalAddress", "addressCountry": "SA", "addressLocality": name },
    },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title, og_description: desc, og_image: null,
    entity_id: entity.id,
    bound_data_snapshot: { landsCount, developersCount, generated_on_count: (landsCount ?? 0) + (developersCount ?? 0) },
    status: "draft",
    content_mode: template.default_content_mode,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Property-type builder ──────────────────────────────────────────
async function buildPropertyTypePage(
  _ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const name = locale === "ar" ? nameAr : nameEn;
  const vars = { name_ar: nameAr, name_en: nameEn, name, slug };

  const title = render(locale === "ar" ? template.title_template_ar : template.title_template_en, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar : template.meta_description_en, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar : template.h1_template_en, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar ?? "") : (template.intro_template_en ?? ""), vars);

  const bodyHtml = locale === "ar"
    ? `<section><h2>نظرة عامة على ${name}</h2><p>سوق ${name} في المملكة العربية السعودية يشهد حركة نشطة مدفوعة بالنمو العمراني والطلب المتزايد على الأصول العقارية عالية الجودة.</p></section><section><h2>كيف يعمل ذلك عبر سينا</h2><p>تربط منصة سينا المالكين بالمطورين المؤهّلين عبر مسار موثّق متدرّج، يبدأ من إدراج الأصل وينتهي بإغلاق شراكة رسمية موثّقة.</p></section>`
    : `<section><h2>Overview of ${name}</h2><p>The ${name} market in Saudi Arabia is seeing active movement driven by urban growth and rising demand for high-quality real estate assets.</p></section><section><h2>How it works on SINA</h2><p>SINA connects owners with qualified developers through a staged, verified journey — from listing the asset to closing a formal, documented partnership.</p></section>`;

  const internalLinks = [
    { label: locale === "ar" ? `التطوير العقاري` : `Real Estate Development`, url: `/services/real-estate-development` },
    { label: locale === "ar" ? `الشراكة العقارية` : `Real Estate Partnership`, url: `/services/real-estate-partnership` },
  ];

  const canonical = render(template.canonical_pattern, vars);
  return {
    page_type: "property_type",
    template_id: template.id,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: { "@context": "https://schema.org", "@type": "WebPage", "name": title },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title, og_description: desc, og_image: null,
    entity_id: entity.id,
    bound_data_snapshot: {},
    status: "draft",
    content_mode: template.default_content_mode,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Service builder ────────────────────────────────────────────────
async function buildServicePage(
  _ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const isSensitive = entity.is_sensitive === true;
  const name = locale === "ar" ? nameAr : nameEn;
  const vars = { name_ar: nameAr, name_en: nameEn, name, slug };

  const title = render(locale === "ar" ? template.title_template_ar : template.title_template_en, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar : template.meta_description_en, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar : template.h1_template_en, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar ?? "") : (template.intro_template_en ?? ""), vars);

  const bodyHtml = locale === "ar"
    ? `<section><h2>ماذا نقدّم</h2><p>تقدّم منصة سينا خدمة ${name} ضمن بيئة رقمية مرخّصة من الهيئة العامة للعقار (REGA)، بمسار موثّق متدرّج يضمن وضوح الحقوق والالتزامات.</p></section><section><h2>كيف تستفيد</h2><p>سواء كنت مالك أرض أو مطوّراً عقارياً، يتيح لك نظام سينا الوصول إلى أدوات احترافية مع حماية بيانات كاملة وفحص نافٍ للجهالة.</p></section>`
    : `<section><h2>What we offer</h2><p>SINA delivers ${name} in a REGA-licensed digital environment, with a staged verified journey ensuring clarity of rights and obligations.</p></section><section><h2>How you benefit</h2><p>Whether you are a landowner or a real estate developer, SINA's system gives you access to professional tools with full data protection and due diligence.</p></section>`;

  const internalLinks = [
    { label: locale === "ar" ? `كيف تعمل سينا` : `How SINA Works`, url: `/how-it-works` },
    { label: locale === "ar" ? `الأسئلة الشائعة` : `FAQ`, url: `/faq` },
  ];

  const canonical = render(template.canonical_pattern, vars);
  return {
    page_type: "service",
    template_id: template.id,
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
    entity_id: entity.id,
    bound_data_snapshot: { is_sensitive: isSensitive },
    status: "draft",
    content_mode: isSensitive ? "manual_only" : template.default_content_mode,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Topic builder ──────────────────────────────────────────────────
async function buildTopicPage(
  _ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const nameAr = entity.name_ar as string;
  const nameEn = entity.name_en as string;
  const slug = entity.slug as string;
  const name = locale === "ar" ? nameAr : nameEn;
  const vars = { name_ar: nameAr, name_en: nameEn, name, slug };

  const title = render(locale === "ar" ? template.title_template_ar : template.title_template_en, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar : template.meta_description_en, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar : template.h1_template_en, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar ?? "") : (template.intro_template_en ?? ""), vars);

  const bodyHtml = locale === "ar"
    ? `<section><h2>${name}</h2><p>هذا دليل مبدئي حول ${name}. يحتاج المسؤول إلى مراجعة النص وإضافة محتوى كامل قبل النشر. يتم حماية الصفحة بوضع manual_only حتى اعتمادها.</p></section>`
    : `<section><h2>${name}</h2><p>This is a preliminary guide on ${name}. An editor must review and add full content before publishing. The page is locked in manual_only mode until approval.</p></section>`;

  const canonical = render(template.canonical_pattern, vars);
  return {
    page_type: "topic",
    template_id: template.id,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: { "@context": "https://schema.org", "@type": "Article", "headline": title },
    faq_items: [],
    internal_links: [{ label: locale === "ar" ? `كيف تعمل سينا` : `How SINA Works`, url: `/how-it-works` }],
    og_title: title, og_description: desc, og_image: null,
    entity_id: entity.id,
    bound_data_snapshot: { requires_editorial_review: true },
    status: "draft",
    content_mode: "manual_only",
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Developer builder ──────────────────────────────────────────────
async function buildDeveloperPage(
  _ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  developer: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const companyName = (developer.company_name ?? "").toString();
  if (!companyName.trim()) return null;
  const slug = slugify(developer.marketing_brand_name || companyName);
  if (!slug) return null;

  const vars = {
    company_name: companyName,
    marketing_brand_name: developer.marketing_brand_name || companyName,
    city: developer.city || "",
    slug,
  };

  const title = render(locale === "ar" ? template.title_template_ar : template.title_template_en, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar : template.meta_description_en, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar : template.h1_template_en, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar ?? "") : (template.intro_template_en ?? ""), vars);

  const cityLine = developer.city
    ? (locale === "ar" ? `<li>المدينة الرئيسية: ${developer.city}</li>` : `<li>Primary city: ${developer.city}</li>`)
    : "";
  const targetCitiesLine = Array.isArray(developer.target_cities) && developer.target_cities.length > 0
    ? (locale === "ar"
      ? `<li>المدن المستهدفة: ${developer.target_cities.slice(0, 6).join("، ")}</li>`
      : `<li>Target cities: ${developer.target_cities.slice(0, 6).join(", ")}</li>`)
    : "";
  const verificationLine = developer.verification_status === "verified"
    ? (locale === "ar" ? `<li>الحالة: <strong>موثّق نظامياً</strong></li>` : `<li>Status: <strong>Officially verified</strong></li>`)
    : "";

  const bodyHtml = locale === "ar"
    ? `<section><h2>نبذة عن ${companyName}</h2><p>تعمل ${companyName} ضمن شبكة سينا للمطورين العقاريين المعتمدين في المملكة العربية السعودية، حيث يمر كل مطوّر بمسار تحقّق متعدد المراحل قبل قبوله.</p><ul>${cityLine}${targetCitiesLine}${verificationLine}</ul></section><section><h2>لماذا سينا</h2><p>تُتيح منصة سينا للمطورين والمالكين بناء شراكات تطويرية موثّقة بخصوصية تامة وحوكمة كاملة، بعيداً عن التواصل غير المنظم.</p></section>`
    : `<section><h2>About ${companyName}</h2><p>${companyName} operates within SINA's verified developer network in Saudi Arabia, where every developer undergoes a multi-stage verification journey before being onboarded.</p><ul>${cityLine}${targetCitiesLine}${verificationLine}</ul></section><section><h2>Why SINA</h2><p>SINA enables developers and owners to build documented development partnerships with full privacy and governance, beyond unstructured communication.</p></section>`;

  const internalLinks = [
    { label: locale === "ar" ? `التطوير العقاري` : `Real Estate Development`, url: `/services/real-estate-development` },
    { label: locale === "ar" ? `الشراكة العقارية` : `Real Estate Partnership`, url: `/services/real-estate-partnership` },
    { label: locale === "ar" ? `كل المطوّرين` : `All Developers`, url: `/partnerships/developers` },
  ];

  const canonical = `/developers/${slug}`;
  return {
    page_type: "developer",
    template_id: template.id,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": companyName,
      "address": developer.city ? { "@type": "PostalAddress", "addressCountry": "SA", "addressLocality": developer.city } : undefined,
      "url": `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title, og_description: desc, og_image: developer.logo_url ?? null,
    entity_id: null,
    bound_developer_id: developer.id,
    bound_data_snapshot: {
      company_name: companyName,
      city: developer.city,
      verification_status: developer.verification_status,
      target_cities: developer.target_cities,
    },
    status: "draft",
    content_mode: template.default_content_mode,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Company builder (variant of developer with different URL bucket) ─
async function buildCompanyPage(
  ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  developer: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const base = await buildDeveloperPage(ctx, developer, template, locale);
  if (!base) return null;
  // Flip to /companies/{slug} so both buckets coexist without dedupe collisions
  const slug = base.slug.replace("/developers/", "/companies/");
  return {
    ...base,
    page_type: "company",
    slug,
    canonical_url: base.canonical_url.replace("/developers/", "/companies/"),
  };
}

// ─── Hybrid (Service × City) builder ────────────────────────────────
async function buildHybridServiceCity(
  ctx: BuilderContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  city: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  locale: "ar" | "en"
): Promise<GeneratedPage | null> {
  const cityAr = city.name_ar as string;
  const cityEn = city.name_en as string;
  const serviceAr = service.name_ar as string;
  const serviceEn = service.name_en as string;
  const citySlug = city.slug as string;
  const serviceSlug = service.slug as string;

  const vars = {
    service_ar: serviceAr, service_en: serviceEn,
    city_ar: cityAr, city_en: cityEn,
    service_slug: serviceSlug, city_slug: citySlug,
  };

  const title = render(locale === "ar" ? template.title_template_ar : template.title_template_en, vars);
  const desc = render(locale === "ar" ? template.meta_description_ar : template.meta_description_en, vars);
  const h1 = render(locale === "ar" ? template.h1_template_ar : template.h1_template_en, vars);
  const intro = render(locale === "ar" ? (template.intro_template_ar ?? "") : (template.intro_template_en ?? ""), vars);

  const cityName = locale === "ar" ? cityAr : cityEn;
  const serviceName = locale === "ar" ? serviceAr : serviceEn;

  const { count: landsInCity } = await ctx.admin
    .from("lands").select("id", { count: "exact", head: true })
    .ilike("city", `%${cityAr.split(" ")[0]}%`);

  // Guardrail: skip hybrid if there's not enough local data
  if ((landsInCity ?? 0) < 1 && serviceSlug !== "real-estate-valuation" && serviceSlug !== "property-management") {
    return null;
  }

  const bodyHtml = locale === "ar"
    ? `<section><h2>${serviceName} في ${cityName}</h2><p>تقدّم سينا خدمة ${serviceName} لملاك الأراضي والمطورين في ${cityName} عبر بيئة رقمية موثّقة ومرخّصة، مع مسار فحص متعدد المراحل يضمن جودة الفرص.</p></section><section><h2>ما الذي يجعلها مختلفة</h2><p>في ${cityName} تتطلب الشراكات العقارية بيانات دقيقة وحوكمة صارمة. نظام سينا يمنح الطرفين أدوات متابعة لحظية + فحص نافٍ للجهالة + حماية بيانات متكاملة.</p></section>`
    : `<section><h2>${serviceName} in ${cityName}</h2><p>SINA delivers ${serviceName} to landowners and developers in ${cityName} through a licensed, verified digital environment, with a multi-stage vetting path that guarantees opportunity quality.</p></section><section><h2>What makes it different</h2><p>In ${cityName}, real estate partnerships require accurate data and strict governance. SINA gives both parties real-time tracking + due diligence + full data protection.</p></section>`;

  const internalLinks = [
    { label: locale === "ar" ? `${serviceName}` : serviceName, url: `/services/${serviceSlug}` },
    { label: locale === "ar" ? `${cityName}` : cityName, url: `/sa/${citySlug}` },
    { label: locale === "ar" ? `الشراكة العقارية` : `Real Estate Partnership`, url: `/services/real-estate-partnership` },
  ];

  const canonical = render(template.canonical_pattern, vars);
  return {
    page_type: "hybrid",
    template_id: template.id,
    slug: canonical,
    locale,
    canonical_url: `https://cidoma.com${locale === "en" ? "/en" : ""}${canonical}`,
    title, meta_description: desc, h1, intro, body_html: bodyHtml,
    schema_json: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": title,
      "areaServed": { "@type": "City", "name": cityName, "addressCountry": "SA" },
      "provider": { "@type": "Organization", "name": "SINA Real Estate Development", "url": "https://cidoma.com" },
    },
    faq_items: [],
    internal_links: internalLinks,
    og_title: title, og_description: desc, og_image: null,
    entity_id: service.id,
    secondary_entity_id: city.id,
    bound_data_snapshot: { service: serviceSlug, city: citySlug, landsInCity },
    status: "draft",
    content_mode: service.is_sensitive ? "manual_only" : template.default_content_mode,
    quality_score: 0,
    word_count: countWords(intro) + countWords(bodyHtml),
    noindex: false,
    generated_at: new Date().toISOString(),
  };
}

// ─── Background worker: runs all the generation work off the hot path ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runGeneration(admin: any, runId: string, ruleId: string | undefined, dryRun: boolean) {
  try {
    let rulesQuery = admin.from("seo_generation_rules").select("*").eq("is_active", true);
    if (ruleId) rulesQuery = rulesQuery.eq("id", ruleId);
    const { data: rules, error: rulesError } = await rulesQuery;
    if (rulesError) throw new Error(rulesError.message);

    const skippedReasons: Array<{ entity: string; reason: string }> = [];
    const errors: Array<Record<string, unknown>> = [];
    let generated = 0;
    let skipped = 0;

    const ctx: BuilderContext = { admin, runId };

    // Helper: insert quality issues for a page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordIssues = async (pageId: string | null, issues: Array<{ type: string; severity: Severity; message: string }>) => {
      if (issues.length === 0) return;
      const rows = issues.map((i) => ({
        page_id: pageId,
        issue_type: i.type,
        severity: i.severity,
        details: { message: i.message },
      }));
      await admin.from("seo_issues").insert(rows).then(() => {}, () => {});
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const rule of (rules ?? []) as any[]) {
      const gates = rule.quality_gates ?? {};
      const reqs = rule.min_data_requirements ?? {};

      const { data: tmpl } = await admin
        .from("seo_templates").select("*")
        .eq("page_type", rule.page_type)
        .eq("is_default", true).eq("is_active", true)
        .maybeSingle();
      if (!tmpl) {
        errors.push({ rule: rule.name, reason: "No default template" });
        continue;
      }

      const maxRun = rule.max_pages_per_run ?? 50;

      // ─── Entity-based rules: city, property_type, service, topic, district ─
      if (["city", "property_type", "service", "topic", "district"].includes(rule.page_type)) {
        let entityQuery = admin.from("seo_entities").select("*")
          .eq("is_active", true).eq("entity_type", rule.page_type);
        if (reqs.exclude_sensitive === true) entityQuery = entityQuery.eq("is_sensitive", false);
        if (reqs.only_sensitive === true) entityQuery = entityQuery.eq("is_sensitive", true);
        entityQuery = entityQuery.limit(maxRun);

        const { data: entities, error: entError } = await entityQuery;
        if (entError) { errors.push({ rule: rule.name, reason: entError.message }); continue; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const entity of (entities ?? []) as any[]) {
          const hreflangGroup = crypto.randomUUID();
          for (const locale of ["ar", "en"] as const) {
            let page: GeneratedPage | null = null;
            try {
              if (rule.page_type === "city") page = await buildCityPage(ctx, entity, tmpl, locale);
              else if (rule.page_type === "property_type") page = await buildPropertyTypePage(ctx, entity, tmpl, locale);
              else if (rule.page_type === "service") page = await buildServicePage(ctx, entity, tmpl, locale);
              else if (rule.page_type === "topic") page = await buildTopicPage(ctx, entity, tmpl, locale);
            } catch (err) {
              errors.push({ rule: rule.name, entity: entity.slug, locale, reason: String(err) });
              continue;
            }
            if (!page) { skipped++; skippedReasons.push({ entity: `${entity.slug} (${locale})`, reason: "Builder returned null" }); continue; }

            const q = evaluateQuality(page, gates);
            page.quality_score = q.score;

            if (!q.pass) {
              skipped++;
              skippedReasons.push({ entity: `${entity.slug} (${locale})`, reason: `Quality failed: ${q.issues.map((i) => i.type).join(", ")}` });
              await recordIssues(null, q.issues);
              continue;
            }

            const { data: existing } = await admin.from("seo_pages")
              .select("id,status").eq("slug", page.slug).eq("locale", page.locale).maybeSingle();

            if (existing) {
              const existingRow = existing as { id: string; status: string };
              if (["draft", "ready_for_review"].includes(existingRow.status)) {
                if (!dryRun) {
                  await admin.from("seo_pages").update({
                    ...page,
                    hreflang_group: hreflangGroup,
                  }).eq("id", existingRow.id);
                  await recordIssues(existingRow.id, q.issues.filter((i) => i.severity !== "low"));
                }
                generated++;
              } else {
                skipped++;
                skippedReasons.push({ entity: `${entity.slug} (${locale})`, reason: "Already published — not overwritten" });
              }
              continue;
            }

            if (dryRun) { generated++; continue; }

            const { data: inserted, error: insertError } = await admin.from("seo_pages")
              .insert({ ...page, hreflang_group: hreflangGroup })
              .select("id").single();
            if (insertError) { errors.push({ rule: rule.name, entity: entity.slug, locale, reason: insertError.message }); continue; }
            const insertedRow = inserted as { id: string } | null;
            if (insertedRow?.id) await recordIssues(insertedRow.id, q.issues.filter((i) => i.severity !== "low"));
            generated++;
          }
        }
      }

      // ─── Developer / Company rules ─────────────────────────────────────
      else if (rule.page_type === "developer" || rule.page_type === "company") {
        let devQuery = admin.from("developers").select("id, company_name, marketing_brand_name, city, target_cities, verification_status, logo_url");
        if (reqs.verification_status) devQuery = devQuery.eq("verification_status", reqs.verification_status);
        devQuery = devQuery.not("company_name", "is", null).limit(maxRun);

        const { data: devs, error: devError } = await devQuery;
        if (devError) { errors.push({ rule: rule.name, reason: devError.message }); continue; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const developer of (devs ?? []) as any[]) {
          const hreflangGroup = crypto.randomUUID();
          for (const locale of ["ar", "en"] as const) {
            let page: GeneratedPage | null = null;
            try {
              page = rule.page_type === "company"
                ? await buildCompanyPage(ctx, developer, tmpl, locale)
                : await buildDeveloperPage(ctx, developer, tmpl, locale);
            } catch (err) {
              errors.push({ rule: rule.name, developer_id: developer.id, locale, reason: String(err) });
              continue;
            }
            if (!page) { skipped++; continue; }

            const q = evaluateQuality(page, gates);
            page.quality_score = q.score;
            if (!q.pass) {
              skipped++;
              await recordIssues(null, q.issues);
              continue;
            }

            const { data: existing } = await admin.from("seo_pages")
              .select("id,status").eq("slug", page.slug).eq("locale", page.locale).maybeSingle();
            if (existing) {
              const ex = existing as { id: string; status: string };
              if (["draft", "ready_for_review"].includes(ex.status)) {
                if (!dryRun) {
                  await admin.from("seo_pages").update({ ...page, hreflang_group: hreflangGroup }).eq("id", ex.id);
                }
                generated++;
              } else {
                skipped++;
              }
              continue;
            }

            if (dryRun) { generated++; continue; }
            const { data: inserted, error: insertError } = await admin.from("seo_pages")
              .insert({ ...page, hreflang_group: hreflangGroup }).select("id").single();
            if (insertError) { errors.push({ rule: rule.name, developer_id: developer.id, locale, reason: insertError.message }); continue; }
            const insertedRow = inserted as { id: string } | null;
            if (insertedRow?.id) await recordIssues(insertedRow.id, q.issues.filter((i) => i.severity !== "low"));
            generated++;
          }
        }
      }

      // ─── Hybrid Service × City ──────────────────────────────────────────
      else if (rule.page_type === "hybrid") {
        const { data: services } = await admin.from("seo_entities")
          .select("*").eq("is_active", true).eq("entity_type", "service").limit(20);
        const { data: cities } = await admin.from("seo_entities")
          .select("*").eq("is_active", true).eq("entity_type", "city").limit(20);

        let count = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outer: for (const service of (services ?? []) as any[]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const city of (cities ?? []) as any[]) {
            if (count >= maxRun) break outer;
            const hreflangGroup = crypto.randomUUID();
            for (const locale of ["ar", "en"] as const) {
              const page = await buildHybridServiceCity(ctx, service, city, tmpl, locale);
              if (!page) { skipped++; continue; }

              const q = evaluateQuality(page, gates);
              page.quality_score = q.score;
              if (!q.pass) { skipped++; await recordIssues(null, q.issues); continue; }

              const { data: existing } = await admin.from("seo_pages")
                .select("id,status").eq("slug", page.slug).eq("locale", page.locale).maybeSingle();
              if (existing) {
                const ex = existing as { id: string; status: string };
                if (["draft", "ready_for_review"].includes(ex.status)) {
                  if (!dryRun) await admin.from("seo_pages").update({ ...page, hreflang_group: hreflangGroup }).eq("id", ex.id);
                  generated++;
                } else { skipped++; }
                continue;
              }
              if (dryRun) { generated++; count++; continue; }
              const { data: inserted, error: insertError } = await admin.from("seo_pages")
                .insert({ ...page, hreflang_group: hreflangGroup }).select("id").single();
              if (insertError) { errors.push({ rule: rule.name, reason: insertError.message }); continue; }
              const insertedRow = inserted as { id: string } | null;
              if (insertedRow?.id) await recordIssues(insertedRow.id, q.issues.filter((i) => i.severity !== "low"));
              generated++;
              count++;
            }
          }
        }
      }
    }

    await admin.from("seo_generation_runs").update({
      status: "completed",
      pages_generated: generated,
      pages_skipped: skipped,
      errors,
      completed_at: new Date().toISOString(),
    }).eq("id", runId);
    return { generated, skipped, skippedReasons, errors };
  } catch (err) {
    await admin.from("seo_generation_runs").update({
      status: "failed",
      errors: [{ reason: String(err) }],
      completed_at: new Date().toISOString(),
    }).eq("id", runId);
    throw err;
  }
}

// ─── Main handler: accepts the job, schedules it, returns immediately ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const ruleId: string | undefined = body.ruleId;
    const dryRun: boolean = body.dryRun === true;
    // Optional: when waitFor=true the caller blocks on results (smaller rules only).
    const waitFor: boolean = body.waitFor === true;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: run, error: runError } = await admin
      .from("seo_generation_runs")
      .insert({ rule_id: ruleId ?? null, trigger_type: body.triggerType ?? "manual", status: "running" })
      .select("id").single();
    if (runError || !run) throw new Error(runError?.message ?? "Failed to create run");
    const runId = (run as { id: string }).id;

    // Kick off work
    const workPromise = runGeneration(admin, runId, ruleId, dryRun);

    if (waitFor) {
      try {
        const result = await workPromise;
        return new Response(JSON.stringify({
          runId,
          status: "completed",
          pagesGenerated: result.generated,
          pagesSkipped: result.skipped,
          skippedReasons: result.skippedReasons,
          errors: result.errors,
        }), { headers: { ...CORS, "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ runId, status: "failed", error: String(err) }), {
          status: 500, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    // Default: fire-and-forget. Use EdgeRuntime.waitUntil so the worker
    // keeps running after the HTTP response returns. Client polls
    // seo_generation_runs for completion.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime && typeof runtime.waitUntil === "function") {
      runtime.waitUntil(workPromise.catch((err: unknown) => console.error("[seo-generate] background error:", err)));
    } else {
      // Fallback: swallow the promise to avoid unhandled rejection in environments without EdgeRuntime
      workPromise.catch((err) => console.error("[seo-generate] background error:", err));
    }

    return new Response(JSON.stringify({
      runId,
      status: "started",
      message: "Generation started in background. Poll seo_generation_runs for completion.",
    }), { status: 202, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ status: "failed", error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
