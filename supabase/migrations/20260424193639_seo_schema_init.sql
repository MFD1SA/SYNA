-- ============================================================
-- SEO Admin: baseline schema (enums, 10 tables, RLS, indexes).
--
-- Situation: the admin SEO surface (9 pages, 10 services,
-- 3 edge functions) was built against tables that already exist
-- in production but were never committed as a versioned migration
-- in this repo. Fresh environments (new Supabase projects, local
-- dev clones, preview branches) had no way to reproduce the
-- schema.
--
-- This file captures the current production state as a
-- documentation baseline. Every statement is idempotent:
--   CREATE TYPE IF NOT EXISTS (wrapped in DO blocks)
--   CREATE TABLE IF NOT EXISTS
--   CREATE INDEX IF NOT EXISTS
--   DROP TRIGGER / DROP POLICY IF EXISTS  before CREATE
--
-- Applied against a DB that already has the schema, it is a
-- true no-op — exact column types, defaults, FK actions, index
-- names, trigger names, and policy names match live so nothing
-- is silently reshaped.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seo_content_mode') THEN
    CREATE TYPE public.seo_content_mode AS ENUM (
      'auto_auto', 'auto_review', 'manual_only'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seo_entity_type') THEN
    CREATE TYPE public.seo_entity_type AS ENUM (
      'city', 'district', 'property_type', 'service', 'topic'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seo_page_status') THEN
    CREATE TYPE public.seo_page_status AS ENUM (
      'draft', 'ready_for_review', 'published', 'noindex', 'archived'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seo_page_type') THEN
    CREATE TYPE public.seo_page_type AS ENUM (
      'city', 'district', 'property_type',
      'company', 'developer', 'service', 'topic', 'hybrid'
    );
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------

-- 2.1 seo_entities — city/district/etc. taxonomy. Self-FK parent_id
-- nests districts under cities and other hierarchies.
CREATE TABLE IF NOT EXISTS public.seo_entities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    public.seo_entity_type NOT NULL,
  slug           TEXT NOT NULL,
  name_ar        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  parent_id      UUID REFERENCES public.seo_entities(id) ON DELETE SET NULL,
  metadata       JSONB DEFAULT '{}'::jsonb,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_sensitive   BOOLEAN NOT NULL DEFAULT false,
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_entities_entity_type_slug_key UNIQUE (entity_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_seo_entities_type
  ON public.seo_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_seo_entities_parent
  ON public.seo_entities (parent_id);


-- 2.2 seo_templates — bilingual content blueprints per page_type.
-- One default per page_type is enforced by a partial unique index
-- (idx_seo_templates_default_per_type) instead of a table
-- constraint, so toggling is_default doesn't require drop/create.
CREATE TABLE IF NOT EXISTS public.seo_templates (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type                    public.seo_page_type NOT NULL,
  name                         TEXT NOT NULL,
  is_default                   BOOLEAN NOT NULL DEFAULT false,
  title_template_ar            TEXT NOT NULL,
  title_template_en            TEXT NOT NULL,
  meta_description_ar          TEXT NOT NULL,
  meta_description_en          TEXT NOT NULL,
  h1_template_ar               TEXT NOT NULL,
  h1_template_en               TEXT NOT NULL,
  intro_template_ar            TEXT,
  intro_template_en            TEXT,
  body_sections_ar             JSONB DEFAULT '[]'::jsonb,
  body_sections_en             JSONB DEFAULT '[]'::jsonb,
  faq_template                 JSONB DEFAULT '[]'::jsonb,
  internal_links_template      JSONB DEFAULT '[]'::jsonb,
  og_title_template_ar         TEXT,
  og_title_template_en         TEXT,
  og_description_template_ar   TEXT,
  og_description_template_en   TEXT,
  og_image_pattern             TEXT,
  canonical_pattern            TEXT NOT NULL,
  default_content_mode         public.seo_content_mode NOT NULL DEFAULT 'auto_review',
  is_active                    BOOLEAN NOT NULL DEFAULT true,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_templates_type
  ON public.seo_templates (page_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_templates_default_per_type
  ON public.seo_templates (page_type)
  WHERE is_default = true;


-- 2.3 seo_generation_rules — drives when the generator runs.
-- max_pages_per_run = 50 and priority = 100 defaults keep the
-- generator from runaway expansion for a newly-seeded rule.
CREATE TABLE IF NOT EXISTS public.seo_generation_rules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  page_type               public.seo_page_type NOT NULL,
  min_data_requirements   JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_gates           JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_pages_per_run       INTEGER DEFAULT 50,
  content_mode            public.seo_content_mode NOT NULL DEFAULT 'auto_review',
  is_active               BOOLEAN NOT NULL DEFAULT true,
  priority                INTEGER DEFAULT 100,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_rules_type
  ON public.seo_generation_rules (page_type);


-- 2.4 seo_generation_runs — history/audit of generator invocations.
-- trigger_type and status are text (not enums) and are gated by
-- CHECK constraints; this matches what the edge function writes.
CREATE TABLE IF NOT EXISTS public.seo_generation_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id           UUID REFERENCES public.seo_generation_rules(id) ON DELETE SET NULL,
  triggered_by      UUID,
  trigger_type      TEXT NOT NULL DEFAULT 'manual',
  status            TEXT NOT NULL DEFAULT 'pending',
  pages_generated   INTEGER DEFAULT 0,
  pages_skipped     INTEGER DEFAULT 0,
  errors            JSONB DEFAULT '[]'::jsonb,
  started_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_generation_runs_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  CONSTRAINT seo_generation_runs_trigger_type_check
    CHECK (trigger_type IN ('manual', 'scheduled', 'webhook'))
);

CREATE INDEX IF NOT EXISTS idx_seo_generation_runs_rule_id
  ON public.seo_generation_runs (rule_id);
CREATE INDEX IF NOT EXISTS idx_seo_gen_runs_status
  ON public.seo_generation_runs (status);


-- 2.5 seo_pages — core content rows. Served publicly only when
-- status=published AND noindex=false (enforced via RLS below).
-- hreflang_group is a UUID (groups ar/en sibling pages) and the
-- JSON columns carry empty-collection defaults so UPSERTs that
-- omit them don't need null-handling downstream.
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type              public.seo_page_type NOT NULL,
  template_id            UUID REFERENCES public.seo_templates(id) ON DELETE SET NULL,
  slug                   TEXT NOT NULL,
  canonical_url          TEXT,
  locale                 TEXT NOT NULL DEFAULT 'ar',
  hreflang_group         UUID,
  title                  TEXT NOT NULL,
  meta_description       TEXT NOT NULL,
  h1                     TEXT NOT NULL,
  intro                  TEXT,
  body_html              TEXT,
  schema_json            JSONB DEFAULT '{}'::jsonb,
  faq_items              JSONB DEFAULT '[]'::jsonb,
  internal_links         JSONB DEFAULT '[]'::jsonb,
  og_title               TEXT,
  og_description         TEXT,
  og_image               TEXT,
  entity_id              UUID REFERENCES public.seo_entities(id) ON DELETE SET NULL,
  secondary_entity_id    UUID REFERENCES public.seo_entities(id) ON DELETE SET NULL,
  bound_developer_id     UUID,
  bound_data_snapshot    JSONB DEFAULT '{}'::jsonb,
  status                 public.seo_page_status NOT NULL DEFAULT 'draft',
  content_mode           public.seo_content_mode NOT NULL DEFAULT 'auto_review',
  quality_score          INTEGER DEFAULT 0,
  word_count             INTEGER DEFAULT 0,
  noindex                BOOLEAN NOT NULL DEFAULT false,
  nofollow               BOOLEAN NOT NULL DEFAULT false,
  generated_at           TIMESTAMPTZ,
  published_at           TIMESTAMPTZ,
  last_reviewed_by       UUID,
  last_reviewed_at       TIMESTAMPTZ,
  review_notes           TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_pages_slug_locale_key UNIQUE (slug, locale),
  CONSTRAINT seo_pages_locale_check CHECK (locale IN ('ar', 'en'))
);

CREATE INDEX IF NOT EXISTS idx_seo_pages_type
  ON public.seo_pages (page_type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_status
  ON public.seo_pages (status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_entity
  ON public.seo_pages (entity_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_secondary_entity_id
  ON public.seo_pages (secondary_entity_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_template_id
  ON public.seo_pages (template_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_locale
  ON public.seo_pages (locale);
CREATE INDEX IF NOT EXISTS idx_seo_pages_hreflang
  ON public.seo_pages (hreflang_group);
CREATE INDEX IF NOT EXISTS idx_seo_pages_published
  ON public.seo_pages (published_at DESC)
  WHERE status = 'published';


-- 2.6 seo_page_sections — repeating content blocks per page.
-- Cascades on page delete. is_auto_generated defaults true because
-- most sections come from templates; manual overrides flip it.
CREATE TABLE IF NOT EXISTS public.seo_page_sections (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id            UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  section_type       TEXT NOT NULL,
  heading            TEXT,
  body               TEXT,
  display_order      INTEGER NOT NULL DEFAULT 0,
  is_auto_generated  BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_sections_page
  ON public.seo_page_sections (page_id);


-- 2.7 seo_page_links — internal-link graph. Source cascades on
-- page delete (the link is gone with its source); target uses
-- SET NULL so outbound links survive if the target is deleted.
CREATE TABLE IF NOT EXISTS public.seo_page_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id  UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  target_page_id  UUID          REFERENCES public.seo_pages(id) ON DELETE SET NULL,
  target_url      TEXT,
  anchor_text     TEXT NOT NULL,
  link_context    TEXT,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_links_source
  ON public.seo_page_links (source_page_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_links_target
  ON public.seo_page_links (target_page_id);


-- 2.8 seo_publish_queue — scheduled status transitions. Drained by
-- an edge function / cron. status is free-text constrained.
CREATE TABLE IF NOT EXISTS public.seo_publish_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id        UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  target_status  public.seo_page_status NOT NULL DEFAULT 'published',
  scheduled_for  TIMESTAMPTZ,
  processed_at   TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'queued',
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_publish_queue_status_check
    CHECK (status IN ('queued', 'processing', 'done', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_seo_publish_queue_page_id
  ON public.seo_publish_queue (page_id);
CREATE INDEX IF NOT EXISTS idx_seo_publish_queue_pending
  ON public.seo_publish_queue (status, scheduled_for)
  WHERE status = 'queued';


-- 2.9 seo_redirects — 301/302/307/308 mappings. Unique source_path
-- prevents dueling rules for the same incoming URL.
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path  TEXT NOT NULL,
  target_path  TEXT NOT NULL,
  status_code  INTEGER NOT NULL DEFAULT 301,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_redirects_source_path_key UNIQUE (source_path),
  CONSTRAINT seo_redirects_status_code_check
    CHECK (status_code IN (301, 302, 307, 308))
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_source
  ON public.seo_redirects (source_path)
  WHERE is_active = true;


-- 2.10 seo_issues — lint/crawl findings. details holds the
-- arbitrary payload; severity is constrained to four levels.
CREATE TABLE IF NOT EXISTS public.seo_issues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  issue_type   TEXT NOT NULL,
  severity     TEXT NOT NULL,
  details      JSONB DEFAULT '{}'::jsonb,
  is_resolved  BOOLEAN NOT NULL DEFAULT false,
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seo_issues_severity_check
    CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_seo_issues_page
  ON public.seo_issues (page_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_unresolved
  ON public.seo_issues (is_resolved)
  WHERE is_resolved = false;


-- ------------------------------------------------------------
-- 3. TRIGGERS — updated_at maintenance.
-- Depends on public.update_updated_at_column() from the initial
-- foundational migration (20260222185511). Trigger names match
-- the live production convention: "trg_<short>_updated" (no _at).
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_seo_entities_updated  ON public.seo_entities;
DROP TRIGGER IF EXISTS trg_seo_templates_updated ON public.seo_templates;
DROP TRIGGER IF EXISTS trg_seo_rules_updated     ON public.seo_generation_rules;
DROP TRIGGER IF EXISTS trg_seo_pages_updated     ON public.seo_pages;
DROP TRIGGER IF EXISTS trg_seo_sections_updated  ON public.seo_page_sections;
DROP TRIGGER IF EXISTS trg_seo_redirects_updated ON public.seo_redirects;

CREATE TRIGGER trg_seo_entities_updated
  BEFORE UPDATE ON public.seo_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_seo_templates_updated
  BEFORE UPDATE ON public.seo_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_seo_rules_updated
  BEFORE UPDATE ON public.seo_generation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_seo_pages_updated
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_seo_sections_updated
  BEFORE UPDATE ON public.seo_page_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_seo_redirects_updated
  BEFORE UPDATE ON public.seo_redirects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY
--
-- Model:
--   - RLS ON for every SEO table (default deny).
--   - Admin (public.has_role(auth.uid(),'admin')) gets ALL.
--   - Service role bypasses RLS (edge functions).
--   - Public SELECT (anon + authenticated) scoped to:
--       * seo_pages         : status='published' AND noindex=false
--       * seo_redirects     : is_active=true
--       * seo_entities      : is_active=true
--       * seo_page_sections : owning page is published & indexable
--       * seo_page_links    : owning source page is published & indexable
--     These are the surfaces needed to render a public SEO page
--     without a session (sitemap/robots, server-rendered pages).
--   - Everything else (templates, rules, runs, queue, issues) is
--     admin-only.
-- ------------------------------------------------------------

ALTER TABLE public.seo_entities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_generation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_generation_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_sections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_publish_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_redirects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_issues           ENABLE ROW LEVEL SECURITY;

-- Drop exact policy names first, then re-create. This is a pure
-- no-op on live (names match live exactly) and avoids leaving a
-- mismatched name on new environments.

-- seo_entities
DROP POLICY IF EXISTS seo_entities_admin_all    ON public.seo_entities;
DROP POLICY IF EXISTS seo_entities_public_read  ON public.seo_entities;
CREATE POLICY seo_entities_admin_all ON public.seo_entities
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY seo_entities_public_read ON public.seo_entities
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- seo_templates (admin-only)
DROP POLICY IF EXISTS seo_templates_admin_all ON public.seo_templates;
CREATE POLICY seo_templates_admin_all ON public.seo_templates
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- seo_generation_rules (admin-only)
DROP POLICY IF EXISTS seo_rules_admin_all ON public.seo_generation_rules;
CREATE POLICY seo_rules_admin_all ON public.seo_generation_rules
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- seo_generation_runs (admin-only)
DROP POLICY IF EXISTS seo_runs_admin_all ON public.seo_generation_runs;
CREATE POLICY seo_runs_admin_all ON public.seo_generation_runs
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- seo_issues (admin-only)
DROP POLICY IF EXISTS seo_issues_admin_all ON public.seo_issues;
CREATE POLICY seo_issues_admin_all ON public.seo_issues
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- seo_publish_queue (admin-only)
DROP POLICY IF EXISTS seo_queue_admin_all ON public.seo_publish_queue;
CREATE POLICY seo_queue_admin_all ON public.seo_publish_queue
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- seo_pages: admin ALL + public SELECT on published+indexable.
DROP POLICY IF EXISTS seo_pages_admin_all   ON public.seo_pages;
DROP POLICY IF EXISTS seo_pages_public_read ON public.seo_pages;
CREATE POLICY seo_pages_admin_all ON public.seo_pages
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY seo_pages_public_read ON public.seo_pages
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND noindex = false);

-- seo_redirects: admin ALL + public SELECT on active.
DROP POLICY IF EXISTS seo_redirects_admin_all   ON public.seo_redirects;
DROP POLICY IF EXISTS seo_redirects_public_read ON public.seo_redirects;
CREATE POLICY seo_redirects_admin_all ON public.seo_redirects
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY seo_redirects_public_read ON public.seo_redirects
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- seo_page_sections: admin ALL + public SELECT when owning page
-- is published and indexable (anon SSR needs to pull sections).
DROP POLICY IF EXISTS seo_sections_admin_all    ON public.seo_page_sections;
DROP POLICY IF EXISTS seo_sections_public_read  ON public.seo_page_sections;
CREATE POLICY seo_sections_admin_all ON public.seo_page_sections
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY seo_sections_public_read ON public.seo_page_sections
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_pages p
    WHERE p.id = seo_page_sections.page_id
      AND p.status = 'published'::public.seo_page_status
      AND p.noindex = false
  ));

-- seo_page_links: admin ALL + public SELECT when owning source
-- page is published and indexable (so internal-link blocks render).
DROP POLICY IF EXISTS seo_links_admin_all    ON public.seo_page_links;
DROP POLICY IF EXISTS seo_links_public_read  ON public.seo_page_links;
CREATE POLICY seo_links_admin_all ON public.seo_page_links
  FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY seo_links_public_read ON public.seo_page_links
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.seo_pages p
    WHERE p.id = seo_page_links.source_page_id
      AND p.status = 'published'::public.seo_page_status
      AND p.noindex = false
  ));


-- ------------------------------------------------------------
-- 5. COMMENTS
-- ------------------------------------------------------------

COMMENT ON TABLE public.seo_entities IS
  'Taxonomy of SEO-addressable things (cities, districts, property types, services, topics). Self-FK nests hierarchies.';
COMMENT ON TABLE public.seo_templates IS
  'Bilingual content blueprints keyed by page_type. One default per page_type enforced by a partial unique index.';
COMMENT ON TABLE public.seo_generation_rules IS
  'Controls when the SEO generator produces pages for a page_type. Quality gates + data requirements gate publication.';
COMMENT ON TABLE public.seo_generation_runs IS
  'Audit log of generator invocations.';
COMMENT ON TABLE public.seo_pages IS
  'Core SEO content rows. Served publicly only when status=published AND noindex=false (enforced in RLS).';
COMMENT ON TABLE public.seo_page_sections IS
  'Repeating content blocks per page. Cascades on page delete.';
COMMENT ON TABLE public.seo_page_links IS
  'Internal-link graph. Source cascades; target SET NULL so outbound links survive target deletion.';
COMMENT ON TABLE public.seo_publish_queue IS
  'Scheduled status transitions for pages. Drained by an edge function or cron.';
COMMENT ON TABLE public.seo_redirects IS
  '301/302/307/308 mappings. Publicly readable when is_active=true so anon requests can resolve.';
COMMENT ON TABLE public.seo_issues IS
  'Lint/crawl findings. severity constrained to low/medium/high/critical.';
