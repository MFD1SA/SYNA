/**
 * Quality guardrails — client-side checks to mirror the server-side checks.
 * Used for preview/validation in the admin UI before publishing.
 * The authoritative enforcement happens inside the seo-generate edge function.
 */

import type { SeoPage } from "@/types/seo";

export interface QualityCheckResult {
  score: number;             // 0-100
  wordCount: number;
  issues: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
  }>;
  passed: boolean;           // score >= 60 and no critical issues
}

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const cleaned = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.split(" ").length : 0;
}

/**
 * Detect keyword stuffing by checking if any single token appears > 4% of the time.
 * Excludes common Arabic/English stopwords.
 */
const STOPWORDS = new Set([
  "و", "في", "من", "على", "إلى", "عن", "هو", "هي", "أن", "ذلك", "هذه", "هذا", "التي", "الذي",
  "the", "a", "an", "and", "or", "of", "in", "on", "to", "with", "for", "is", "are", "be", "was",
]);

export function detectKeywordStuffing(text: string): { ratio: number; token: string } | null {
  const tokens = text
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .split(/[\s.,;:!?()،؛]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
  if (tokens.length < 50) return null;
  const counts = new Map<string, number>();
  tokens.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  let max = { ratio: 0, token: "" };
  counts.forEach((count, token) => {
    const ratio = count / tokens.length;
    if (ratio > max.ratio) max = { ratio, token };
  });
  if (max.ratio > 0.04) return max;
  return null;
}

export function evaluatePageQuality(page: Partial<SeoPage>): QualityCheckResult {
  const issues: QualityCheckResult["issues"] = [];
  let score = 100;

  const title = page.title?.trim() ?? "";
  const desc = page.meta_description?.trim() ?? "";
  const h1 = page.h1?.trim() ?? "";
  const body = page.body_html ?? "";
  const intro = page.intro ?? "";

  const wordCount = countWords(intro) + countWords(body);

  // Title checks
  if (!title) {
    issues.push({ type: "missing_title", severity: "critical", message: "Page title is missing." });
    score -= 40;
  } else if (title.length > 70) {
    issues.push({ type: "title_too_long", severity: "low", message: `Title is ${title.length} chars (recommend ≤ 70).` });
    score -= 5;
  }

  // Meta description
  if (!desc) {
    issues.push({ type: "missing_description", severity: "high", message: "Meta description is missing." });
    score -= 20;
  } else if (desc.length < 80 || desc.length > 170) {
    issues.push({
      type: "description_length",
      severity: "low",
      message: `Description length ${desc.length} (recommend 80–170).`,
    });
    score -= 5;
  }

  // H1
  if (!h1) {
    issues.push({ type: "missing_h1", severity: "high", message: "H1 is missing." });
    score -= 15;
  }

  // Thin content
  if (wordCount < 200) {
    issues.push({
      type: "thin_content",
      severity: "high",
      message: `Only ${wordCount} words — below 200 threshold.`,
    });
    score -= 20;
  } else if (wordCount < 400) {
    issues.push({
      type: "thin_content",
      severity: "medium",
      message: `${wordCount} words — consider expanding to 400+.`,
    });
    score -= 5;
  }

  // Keyword stuffing
  const stuffed = detectKeywordStuffing(`${intro} ${body}`);
  if (stuffed) {
    issues.push({
      type: "keyword_stuffing",
      severity: "high",
      message: `Token "${stuffed.token}" appears in ${(stuffed.ratio * 100).toFixed(1)}% of words.`,
    });
    score -= 15;
  }

  // Canonical
  if (!page.canonical_url) {
    issues.push({ type: "missing_canonical", severity: "medium", message: "Canonical URL is missing." });
    score -= 10;
  }

  // Internal links
  const linkCount = Array.isArray(page.internal_links) ? page.internal_links.length : 0;
  if (linkCount < 2) {
    issues.push({
      type: "missing_internal_links",
      severity: "medium",
      message: `Only ${linkCount} internal link(s) — recommend at least 2.`,
    });
    score -= 8;
  }

  score = Math.max(0, Math.min(100, score));
  const passed = score >= 60 && !issues.some((i) => i.severity === "critical");

  return { score, wordCount, issues, passed };
}
