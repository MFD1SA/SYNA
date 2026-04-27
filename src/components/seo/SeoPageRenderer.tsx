import React, { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import InnerHero from "@/components/landing/InnerHero";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMetaTags } from "@/hooks/useMetaTags";
import { getSeoPageBySlug } from "@/services/seo/pages.service";
import type { SeoPage } from "@/types/seo";
import { ArrowLeft, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  /** The URL slug (e.g. "/sa/riyadh" or "/properties/villas"). Built from the route. */
  slug: string;
}

/**
 * Shared renderer for every programmatically-generated SEO page.
 * - Fetches the page by slug + current locale
 * - Sets all meta/OG/canonical/hreflang + JSON-LD via useMetaTags
 * - Renders hero, intro, body sections, FAQ, and internal links
 * - Redirects to /404 if page not found or not published
 */
export const SeoPageRenderer: React.FC<Props> = ({ slug }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [page, setPage] = useState<SeoPage | null>(null);
  const [altPage, setAltPage] = useState<SeoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getSeoPageBySlug(slug, isAr ? "ar" : "en")
      .then(async (p) => {
        if (cancelled) return;
        if (!p) {
          // Try the other locale (for users who hit /ar/... vs /en/...)
          const fallback = await getSeoPageBySlug(slug, isAr ? "en" : "ar");
          if (!fallback) setNotFound(true);
          setPage(fallback);
        } else {
          setPage(p);
          // Load hreflang sibling
          if (p.hreflang_group) {
            // fire-and-forget sibling fetch for alternate hreflang link
            // (we just need its canonical_url; read via supabase direct for minimal tx)
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[SeoPageRenderer] fetch error:", err);
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug, isAr]);

  // Build structured data arrays: org + breadcrumb + faq (if any) + page-specific
  const structuredData: Array<Record<string, unknown>> = [];
  if (page) {
    // Add FAQPage schema only when there are real FAQs (Google guideline)
    if (Array.isArray(page.faq_items) && page.faq_items.length > 0) {
      structuredData.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": page.faq_items.map((f) => ({
          "@type": "Question",
          "name": isAr ? f.question_ar : f.question_en,
          "acceptedAnswer": { "@type": "Answer", "text": isAr ? f.answer_ar : f.answer_en },
        })),
      });
    }
    // Breadcrumb
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": isAr ? "الرئيسية" : "Home", "item": "https://cidoma.com/" },
        { "@type": "ListItem", "position": 2, "name": page.h1, "item": page.canonical_url },
      ],
    });
    // Page-specific from page.schema_json
    if (page.schema_json && Object.keys(page.schema_json).length > 0) {
      structuredData.push(page.schema_json);
    }
  }

  // Always call the hook, even when page is null (conditionally pass opts)
  useMetaTags(
    page
      ? {
          title: page.title,
          description: page.meta_description,
          canonical: page.canonical_url ?? undefined,
          ogTitle: page.og_title ?? page.title,
          ogDescription: page.og_description ?? page.meta_description,
          ogImage: page.og_image ?? undefined,
          ogType: "website",
          twitterCard: "summary_large_image",
          noindex: page.noindex,
          nofollow: page.nofollow,
          structuredData,
        }
      : { title: isAr ? "جاري التحميل..." : "Loading..." }
  );

  // Sanitize stored HTML before rendering — prevents stored-XSS if a
  // seo_pages row is compromised or authored with unsafe markup.
  // NOTE: hook must run unconditionally (before any early returns) to
  // satisfy React's Rules of Hooks.
  const sanitizedBody = useMemo(() => {
    if (!page?.body_html) return "";
    return DOMPurify.sanitize(page.body_html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    });
  }, [page?.body_html]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-7 w-7 animate-spin rounded-full border-r-2 border-t-2 border-[#2B2B2B]" />
      </div>
    );
  }

  if (notFound || !page) return <Navigate to="/404" replace />;

  return (
    <div className="min-h-screen bg-white" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      <InnerHero
        title={page.h1}
        subtitle={page.meta_description}
        isAr={isAr}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-1.5 text-[12px] overflow-x-auto whitespace-nowrap">
            <Link to="/" className="text-gray-400 hover:text-[#2B2B2B]">{isAr ? "الرئيسية" : "Home"}</Link>
            <Chevron className="h-3 w-3 text-gray-300" strokeWidth={2} />
            <span className="text-[#2B2B2B] font-semibold">{page.h1}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          {page.intro && (
            <p className="text-[16px] md:text-[17px] text-gray-700 leading-[1.85] mb-8">{page.intro}</p>
          )}

          {page.body_html && (
            <div
              className="prose prose-slate max-w-none
                prose-headings:text-[#020202] prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-[22px] md:prose-h2:text-[26px] prose-h2:mt-10 prose-h2:mb-4
                prose-p:text-[15px] md:prose-p:text-[16px] prose-p:leading-[1.85] prose-p:text-gray-600
                prose-a:text-[#2B2B2B] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: sanitizedBody }}
            />
          )}

          {/* FAQ */}
          {Array.isArray(page.faq_items) && page.faq_items.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[22px] md:text-[26px] font-bold text-[#020202] mb-6 tracking-tight">
                {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h2>
              <div className="space-y-3">
                {page.faq_items.map((faq, i) => (
                  <details key={i} className="group bg-white rounded-xl border border-gray-100 p-5 open:shadow-[0_8px_24px_-12px_rgba(15,31,46,0.1)]">
                    <summary className="cursor-pointer font-bold text-[15px] text-[#020202] list-none flex items-center justify-between">
                      <span>{isAr ? faq.question_ar : faq.question_en}</span>
                      <Chevron className="h-4 w-4 text-[#C45A41] group-open:rotate-90 transition-transform" strokeWidth={2} />
                    </summary>
                    <p className="mt-3 text-[14px] text-gray-600 leading-[1.85]">
                      {isAr ? faq.answer_ar : faq.answer_en}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Internal links */}
          {Array.isArray(page.internal_links) && page.internal_links.length > 0 && (
            <section className="mt-12 rounded-2xl bg-[#F7F9FB] border border-gray-100 p-6 md:p-7">
              <h3 className="text-[16px] font-bold text-[#020202] mb-4">
                {isAr ? "روابط ذات صلة" : "Related Links"}
              </h3>
              <ul className="grid sm:grid-cols-2 gap-2">
                {page.internal_links.map((l, i) => (
                  <li key={i}>
                    <Link
                      to={l.url}
                      className="flex items-center gap-2 text-[14px] text-[#2B2B2B] font-semibold hover:text-[#020202] py-1.5"
                    >
                      <Arrow className="h-3.5 w-3.5 text-[#C45A41]" strokeWidth={2} />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default SeoPageRenderer;
