-- ═══════════════════════════════════════════════════════════════
-- Security hardening — P0 findings from 2026-04-21 audit
-- ═══════════════════════════════════════════════════════════════
-- This migration closes five critical security holes surfaced by
-- the audit. Each section is self-contained and idempotent, so the
-- file can be re-run without breaking the policy table.
--
--   (1) Anon SELECT on public.lands leaked PII (plot_number,
--       deed_number, owner_name, exact GPS, owner_id) for every
--       featured land. Bypassed the identity-reveal state machine.
--
--   (2) Storage bucket `land-images` allowed any authenticated
--       user to INSERT / UPDATE / DELETE objects — the policy
--       names ("Admins can…") were labels, not constraints.
--
--   (3) Storage bucket `developer-docs` allowed unauthenticated
--       anon INSERT into the whole bucket — storage-flood /
--       malware-hosting / cost-DoS vector.
--
--   (4) Storage bucket `deal-studies` was readable by ANY
--       authenticated user — a competing developer could read
--       every feasibility study on the platform.
--
--   (5) Several SECURITY DEFINER functions lacked SET search_path,
--       leaving them vulnerable to search_path shadowing attacks
--       from temp-schema trickery.
-- ═══════════════════════════════════════════════════════════════

-- ─── (1) Anon PII leak on public.lands ─────────────────────────
-- The `lands_public` view already uses security_barrier=true and
-- selects only the non-PII columns. The fix is to stop granting
-- anon a direct SELECT on the base table and route them through
-- the view. We keep authenticated-role policies unchanged.

DROP POLICY IF EXISTS "Anon reads featured lands only" ON public.lands;

-- Make sure the view exists with the safe column whitelist. Do
-- NOT add sensitive fields to this SELECT list without an audit.
DROP VIEW IF EXISTS public.lands_public;
CREATE VIEW public.lands_public
WITH (security_barrier = true, security_invoker = false) AS
  SELECT
    id, city, district, land_area_sqm, usage_type, project_type,
    partnership_goal, partnership_model, quality_level, revenue_model,
    financing_preference, developer_experience_requirements,
    expected_dev_duration_months, vision_summary,
    street_width_m, width_m, length_m,
    is_active, is_featured, image_url, created_at, updated_at
  FROM public.lands
  WHERE is_active = true
    AND is_featured = true
    AND deleted_at IS NULL;

-- Grant anon SELECT on the view (NOT the base table).
GRANT SELECT ON public.lands_public TO anon;
GRANT SELECT ON public.lands_public TO authenticated;

-- Revoke any stale base-table grants that may have leaked through.
REVOKE ALL ON public.lands FROM anon;

-- ─── (1b) Verified-developer SELECT on public.lands ────────────
-- Also tighten the full-row read for verified developers: the
-- reveal-level machine (compute_reveal_level) should be the only
-- path to sensitive columns. Verified developers who have not yet
-- engaged with a land should see only the sanitized projection.
-- We keep the existing policy in place but re-create it with a
-- narrower column set by gating at the view layer — the actual
-- column-scrub is enforced by `compute_reveal_level()` called
-- from the application query builder. The belt-and-braces below
-- ensures deleted_at is always respected.

DROP POLICY IF EXISTS "Verified developers can browse active lands" ON public.lands;
CREATE POLICY "Verified developers can browse active lands"
  ON public.lands FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.developers d
      WHERE d.user_id = auth.uid()
        AND d.verification_status = 'verified'
    )
  );

-- ─── (2) Storage bucket `land-images` — lock down writes ───────
-- Drop the misleadingly-named "Admins can…" policies that had no
-- actual role or path check, then re-create them with real gates.

DROP POLICY IF EXISTS "Admins can upload land images"  ON storage.objects;
DROP POLICY IF EXISTS "Admins can update land images"  ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete land images"  ON storage.objects;

CREATE POLICY "Admins can upload land images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'land-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can update land images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'land-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'land-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can delete land images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'land-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ─── (3) Storage bucket `developer-docs` — kill anon INSERT ────
-- Registration uploads happen through the edge function
-- `register-developer` (service-role) which bypasses RLS, so the
-- anon-INSERT policy was never needed for the happy path. Dropping
-- it removes the storage-flood vector without breaking registration.

DROP POLICY IF EXISTS "Allow anonymous uploads to developer-docs" ON storage.objects;

-- For browser-side logo uploads during registration (before the
-- edge function runs), callers must sign in as the just-created
-- user and upload under their own user_id folder. Re-create a
-- tight INSERT policy that scopes path to the caller's UUID.
DROP POLICY IF EXISTS "Developers upload their own docs" ON storage.objects;
CREATE POLICY "Developers upload their own docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'developer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: owner (developer) or admin.
DROP POLICY IF EXISTS "Developers read their own docs" ON storage.objects;
CREATE POLICY "Developers read their own docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'developer-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

-- Update + delete: only the owning developer or an admin.
DROP POLICY IF EXISTS "Developers update their own docs" ON storage.objects;
CREATE POLICY "Developers update their own docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'developer-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

DROP POLICY IF EXISTS "Developers delete their own docs" ON storage.objects;
CREATE POLICY "Developers delete their own docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'developer-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

-- ─── (4) Storage bucket `deal-studies` — restrict to parties ───
-- Current policy: any authenticated user can read any study file.
-- Correct: the developer who submitted the deal_request, the
-- owner of the land it targets, or an admin.
--
-- We encode path as `<deal_request_id>/<filename>`. StudyPanel.tsx
-- uploads with that prefix today (line 231 uses the signed-URL
-- path based on deal_request_id), so the prefix check below is
-- consistent with the frontend contract.

DROP POLICY IF EXISTS "Authenticated users read study files"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload study files" ON storage.objects;
DROP POLICY IF EXISTS "Parties read study files"               ON storage.objects;
DROP POLICY IF EXISTS "Parties upload study files"             ON storage.objects;

-- Helper: is the caller a party to the given deal_request?
CREATE OR REPLACE FUNCTION public.is_deal_party(_deal_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deal_requests dr
    LEFT JOIN public.developers d ON d.id = dr.developer_id
    LEFT JOIN public.lands      l ON l.id = dr.land_id
    WHERE dr.id = _deal_request_id
      AND (
        d.user_id = _user_id
        OR l.owner_id = _user_id
        OR public.has_role(_user_id, 'admin'::public.app_role)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_deal_party(uuid, uuid) TO authenticated;

CREATE POLICY "Parties read study files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deal-studies'
    AND public.is_deal_party(
      NULLIF((storage.foldername(name))[1], '')::uuid,
      auth.uid()
    )
  );

CREATE POLICY "Parties upload study files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deal-studies'
    AND public.is_deal_party(
      NULLIF((storage.foldername(name))[1], '')::uuid,
      auth.uid()
    )
  );

-- ─── (5) SECURITY DEFINER search_path hardening ────────────────
-- Lock search_path on every SECURITY DEFINER function added in
-- the phase5-12 migrations that didn't pin it. We re-declare the
-- `SET search_path` clause via ALTER FUNCTION — safer than
-- re-creating the function body.

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true  -- SECURITY DEFINER
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema_name, fn.function_name, fn.args
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- End of security hardening migration.
-- ═══════════════════════════════════════════════════════════════
