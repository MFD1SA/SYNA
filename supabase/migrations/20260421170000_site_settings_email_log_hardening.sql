-- ============================================================
-- Hardening migration — 2026-04-21
--
-- 1. site_settings: scope the "anyone can read" policy to a
--    whitelist so future non-public rows (feature flags, webhook
--    URLs, etc.) don't leak to anon clients.
-- 2. email_log: lock the admin FOR ALL policy to TO authenticated
--    and add an explicit deny-to-anon policy so intent is
--    documented even if a future developer adds a permissive
--    policy by mistake (PostgreSQL policies are OR'd, so this
--    belt-and-suspenders matters for audit review).
-- ============================================================

-- ── 1. site_settings ─────────────────────────────────────────
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- The only currently-used row is `hero_image`, which is rendered
-- on the public landing page, so it MUST stay world-readable.
UPDATE public.site_settings SET is_public = true WHERE key = 'hero_image';

-- Drop the old permissive SELECT and replace with a scoped one.
-- Wrapped in DO $$ so the migration is idempotent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'site_settings'
      AND policyname = 'Anyone can read site settings'
  ) THEN
    DROP POLICY "Anyone can read site settings" ON public.site_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'site_settings'
      AND policyname = 'Public rows readable by anyone'
  ) THEN
    CREATE POLICY "Public rows readable by anyone"
      ON public.site_settings FOR SELECT
      USING (is_public = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'site_settings'
      AND policyname = 'Admin can read all site settings'
  ) THEN
    CREATE POLICY "Admin can read all site settings"
      ON public.site_settings FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

COMMENT ON COLUMN public.site_settings.is_public IS
  'When true the row is world-readable via RLS (used for landing-page content like hero_image). '
  'Keep FALSE for any row holding non-public config.';

-- ── 2. email_log ─────────────────────────────────────────────
-- Recreate the admin FOR ALL policy scoped to `authenticated` so
-- anon role can never see rows, even if a future session somehow
-- inherits admin role via mistake. Also add an explicit deny
-- policy for anon (redundant with the default-deny behaviour of
-- RLS when no policy matches, but documents intent for reviewers).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_log'
      AND policyname = 'Admin full access to email log'
  ) THEN
    DROP POLICY "Admin full access to email log" ON public.email_log;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_log'
      AND policyname = 'Admin full access to email log'
  ) THEN
    CREATE POLICY "Admin full access to email log"
      ON public.email_log
      AS PERMISSIVE
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  -- Explicit RESTRICTIVE policy: no anon access, ever.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_log'
      AND policyname = 'Deny anon email log access'
  ) THEN
    CREATE POLICY "Deny anon email log access"
      ON public.email_log
      AS RESTRICTIVE
      FOR ALL
      TO anon
      USING (false);
  END IF;
END $$;

COMMENT ON TABLE public.email_log IS
  'Outbound email queue and audit trail. Admin-only via RLS. Service-role '
  'callers (edge functions) bypass RLS by design and insert rows.';
