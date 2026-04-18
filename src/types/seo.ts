/**
 * SINA SEO Engine — TypeScript types
 * Mirrors the seo_* tables in Supabase.
 */

export type SeoPageType =
  | "city"
  | "district"
  | "property_type"
  | "company"
  | "developer"
  | "service"
  | "topic"
  | "hybrid";

export type SeoPageStatus =
  | "draft"
  | "ready_for_review"
  | "published"
  | "noindex"
  | "archived";

export type SeoContentMode = "auto_auto" | "auto_review" | "manual_only";

export type SeoEntityType =
  | "city"
  | "district"
  | "property_type"
  | "service"
  | "topic";

export interface SeoEntity {
  id: string;
  entity_type: SeoEntityType;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  parent_id: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_sensitive: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface SeoBodySection {
  heading_ar?: string;
  heading_en?: string;
  body_ar?: string;
  body_en?: string;
}

export interface SeoFaq {
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}

export interface SeoInternalLinkTemplate {
  label_ar: string;
  label_en: string;
  url_pattern: string;
  condition?: string;
}

export interface SeoTemplate {
  id: string;
  page_type: SeoPageType;
  name: string;
  is_default: boolean;
  title_template_ar: string;
  title_template_en: string;
  meta_description_ar: string;
  meta_description_en: string;
  h1_template_ar: string;
  h1_template_en: string;
  intro_template_ar: string | null;
  intro_template_en: string | null;
  body_sections_ar: SeoBodySection[];
  body_sections_en: SeoBodySection[];
  faq_template: SeoFaq[];
  internal_links_template: SeoInternalLinkTemplate[];
  og_title_template_ar: string | null;
  og_title_template_en: string | null;
  og_description_template_ar: string | null;
  og_description_template_en: string | null;
  og_image_pattern: string | null;
  canonical_pattern: string;
  default_content_mode: SeoContentMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeoInternalLink {
  label: string;
  url: string;
  context?: string;
}

export interface SeoPage {
  id: string;
  page_type: SeoPageType;
  template_id: string | null;
  slug: string;
  canonical_url: string | null;
  locale: "ar" | "en";
  hreflang_group: string | null;
  title: string;
  meta_description: string;
  h1: string;
  intro: string | null;
  body_html: string | null;
  schema_json: Record<string, unknown>;
  faq_items: SeoFaq[];
  internal_links: SeoInternalLink[];
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  entity_id: string | null;
  secondary_entity_id: string | null;
  bound_developer_id: string | null;
  bound_data_snapshot: Record<string, unknown>;
  status: SeoPageStatus;
  content_mode: SeoContentMode;
  quality_score: number | null;
  word_count: number | null;
  noindex: boolean;
  nofollow: boolean;
  generated_at: string | null;
  published_at: string | null;
  last_reviewed_by: string | null;
  last_reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoPageSection {
  id: string;
  page_id: string;
  section_type: string;
  heading: string | null;
  body: string | null;
  display_order: number;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeoGenerationRule {
  id: string;
  name: string;
  page_type: SeoPageType;
  min_data_requirements: Record<string, unknown>;
  quality_gates: Record<string, unknown>;
  max_pages_per_run: number | null;
  content_mode: SeoContentMode;
  is_active: boolean;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

export interface SeoRedirect {
  id: string;
  source_path: string;
  target_path: string;
  status_code: 301 | 302 | 307 | 308;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SeoIssueType =
  | "duplicate_title"
  | "duplicate_description"
  | "thin_content"
  | "orphan"
  | "canonical_conflict"
  | "hreflang_conflict"
  | "missing_h1"
  | "missing_faq"
  | "missing_internal_links"
  | "keyword_stuffing"
  | "low_quality";

export interface SeoIssue {
  id: string;
  page_id: string | null;
  issue_type: SeoIssueType | string;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface SeoGenerationRun {
  id: string;
  rule_id: string | null;
  triggered_by: string | null;
  trigger_type: "manual" | "scheduled" | "webhook";
  status: "pending" | "running" | "completed" | "failed";
  pages_generated: number;
  pages_skipped: number;
  errors: Array<Record<string, unknown>>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/** Labels for status + mode, for i18n-friendly rendering. */
export const pageStatusLabels: Record<SeoPageStatus, { ar: string; en: string; color: string }> = {
  draft: { ar: "مسودة", en: "Draft", color: "slate" },
  ready_for_review: { ar: "بانتظار المراجعة", en: "Ready for Review", color: "amber" },
  published: { ar: "منشور", en: "Published", color: "emerald" },
  noindex: { ar: "Noindex", en: "Noindex", color: "rose" },
  archived: { ar: "مؤرشف", en: "Archived", color: "slate" },
};

export const contentModeLabels: Record<SeoContentMode, { ar: string; en: string }> = {
  auto_auto: { ar: "توليد + نشر تلقائي", en: "Auto Generate + Publish" },
  auto_review: { ar: "توليد + مراجعة", en: "Auto Generate + Review" },
  manual_only: { ar: "يدوي فقط", en: "Manual Only" },
};

export const pageTypeLabels: Record<SeoPageType, { ar: string; en: string }> = {
  city: { ar: "مدينة", en: "City" },
  district: { ar: "حي", en: "District" },
  property_type: { ar: "نوع عقار", en: "Property Type" },
  company: { ar: "شركة", en: "Company" },
  developer: { ar: "مطور", en: "Developer" },
  service: { ar: "خدمة", en: "Service" },
  topic: { ar: "موضوع", en: "Topic" },
  hybrid: { ar: "صفحة هجينة", en: "Hybrid" },
};
