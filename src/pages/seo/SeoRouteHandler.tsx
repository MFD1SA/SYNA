import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { SeoPageRenderer } from "@/components/seo/SeoPageRenderer";

/**
 * Single handler for all SEO-generated routes:
 *   /sa/:city              → /sa/{city}
 *   /sa/:city/:district    → /sa/{city}/{district}
 *   /properties/:type      → /properties/{type}
 *   /services/:service     → /services/{service}
 *   /developers/:slug      → /developers/{slug}
 *   /companies/:slug       → /companies/{slug}
 *   /topics/:slug          → /topics/{slug}
 *
 * Reads the current pathname and delegates to the renderer (which fetches by slug).
 */
const SeoRouteHandler: React.FC = () => {
  // useParams not used directly — we pass the pathname as the DB slug lookup key.
  useParams();
  const location = useLocation();

  // Strip trailing slash, strip /en prefix (locale is read from LanguageContext)
  let slug = location.pathname.replace(/\/$/, "");
  if (slug.startsWith("/en/")) slug = slug.slice(3);
  else if (slug === "/en") slug = "/";

  return <SeoPageRenderer slug={slug} />;
};

export default SeoRouteHandler;
