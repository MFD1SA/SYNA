import { useEffect } from "react";

interface MetaTagsOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
  nofollow?: boolean;
  /** Sibling locale URL for hreflang (e.g., the English version of an Arabic page) */
  hreflangAlternate?: { lang: "ar" | "en"; url: string } | null;
  /** JSON-LD structured data objects to inject (array of objects) */
  structuredData?: Array<Record<string, unknown>>;
}

/**
 * Imperative head management — no react-helmet dependency.
 * Sets <title>, <meta>, <link rel="canonical">, <link rel="alternate">,
 * and JSON-LD <script> tags. Cleans up on unmount.
 *
 * Note: this runs on the client only. For search engines that render JS
 * (Googlebot, Bingbot), tags are seen after first paint.
 * If prerendering is needed, see the sitemap edge function and consider
 * adding a prerender service in front of Vercel.
 */
export function useMetaTags(opts: MetaTagsOptions) {
  useEffect(() => {
    const cleanupFns: Array<() => void> = [];
    const ownedMarker = "data-sina-seo";

    if (opts.title) document.title = opts.title;

    const upsertMeta = (selector: string, attrs: Record<string, string>) => {
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      const created = !tag;
      if (!tag) {
        tag = document.createElement("meta");
        Object.entries(attrs).forEach(([k, v]) => tag!.setAttribute(k, v));
        tag.setAttribute(ownedMarker, "1");
        document.head.appendChild(tag);
      }
      Object.entries(attrs).forEach(([k, v]) => tag!.setAttribute(k, v));
      if (created) cleanupFns.push(() => tag?.remove());
    };

    const upsertLink = (selector: string, attrs: Record<string, string>) => {
      let tag = document.head.querySelector<HTMLLinkElement>(selector);
      const created = !tag;
      if (!tag) {
        tag = document.createElement("link");
        Object.entries(attrs).forEach(([k, v]) => tag!.setAttribute(k, v));
        tag.setAttribute(ownedMarker, "1");
        document.head.appendChild(tag);
      }
      Object.entries(attrs).forEach(([k, v]) => tag!.setAttribute(k, v));
      if (created) cleanupFns.push(() => tag?.remove());
    };

    if (opts.description) {
      upsertMeta(`meta[name="description"]`, { name: "description", content: opts.description });
    }

    // Robots
    const robotsDirectives: string[] = [];
    if (opts.noindex) robotsDirectives.push("noindex");
    if (opts.nofollow) robotsDirectives.push("nofollow");
    if (robotsDirectives.length > 0) {
      upsertMeta(`meta[name="robots"]`, {
        name: "robots",
        content: robotsDirectives.join(", "),
      });
    }

    // Canonical
    if (opts.canonical) {
      upsertLink(`link[rel="canonical"]`, { rel: "canonical", href: opts.canonical });
    }

    // Hreflang alternate (sibling locale)
    if (opts.hreflangAlternate) {
      const alt = opts.hreflangAlternate;
      upsertLink(`link[rel="alternate"][hreflang="${alt.lang}"]`, {
        rel: "alternate",
        hreflang: alt.lang,
        href: alt.url,
      });
    }

    // Open Graph
    if (opts.ogTitle) upsertMeta(`meta[property="og:title"]`, { property: "og:title", content: opts.ogTitle });
    if (opts.ogDescription)
      upsertMeta(`meta[property="og:description"]`, { property: "og:description", content: opts.ogDescription });
    if (opts.ogImage) upsertMeta(`meta[property="og:image"]`, { property: "og:image", content: opts.ogImage });
    if (opts.ogType) upsertMeta(`meta[property="og:type"]`, { property: "og:type", content: opts.ogType });

    // Twitter
    if (opts.twitterCard)
      upsertMeta(`meta[name="twitter:card"]`, { name: "twitter:card", content: opts.twitterCard });
    if (opts.ogTitle) upsertMeta(`meta[name="twitter:title"]`, { name: "twitter:title", content: opts.ogTitle });
    if (opts.ogDescription)
      upsertMeta(`meta[name="twitter:description"]`, { name: "twitter:description", content: opts.ogDescription });
    if (opts.ogImage) upsertMeta(`meta[name="twitter:image"]`, { name: "twitter:image", content: opts.ogImage });

    // JSON-LD structured data
    const addedScripts: HTMLScriptElement[] = [];
    if (Array.isArray(opts.structuredData)) {
      opts.structuredData.forEach((obj) => {
        if (!obj || typeof obj !== "object") return;
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(obj);
        script.setAttribute(ownedMarker, "1");
        document.head.appendChild(script);
        addedScripts.push(script);
      });
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
      addedScripts.forEach((s) => s.remove());
    };
  }, [
    opts.title,
    opts.description,
    opts.canonical,
    opts.ogTitle,
    opts.ogDescription,
    opts.ogImage,
    opts.ogType,
    opts.twitterCard,
    opts.noindex,
    opts.nofollow,
    opts.hreflangAlternate?.lang,
    opts.hreflangAlternate?.url,
    // Stringify arrays to detect content changes
    JSON.stringify(opts.structuredData ?? []),
  ]);
}
