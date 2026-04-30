-- ═══════════════════════════════════════════════════════════════════════
-- Lands column-safe view + tightened developer RLS (P0 — audit C-01/C-02)
-- ═══════════════════════════════════════════════════════════════════════
-- Audit finding (2026-04-29):
--   The previous developer-side RLS on public.lands was a row-level filter
--   only ("Verified developers can browse active lands" — passed any
--   active+!deleted row). Column-level scrubbing was enforced ONLY in the
--   application query builder (compute_reveal_level / identityReveal
--   service). Any verified developer with a JWT could bypass the UI by
--   running a direct REST call:
--       supabase.from('lands').select(
--         'deed_number, owner_name, exact_location_lat, exact_location_lng,
--          plot_number, plan_number, owner_id'
--       ).eq('is_active', true);
--   That returns the FULL set of privacy-sensitive columns the table was
--   explicitly designed to hide before NDA + reveal-level progression.
--
-- This migration closes the hole at the database layer:
--   1. New SECURITY DEFINER helper `is_developer_in_land_context(land_id,
--      user_id)` returns true when the caller is a verified developer AND
--      has a deal_request OR a deal that touches the given land.
--   2. Replaces the broad "Verified developers can browse active lands"
--      SELECT policy with one that only fires when the caller has a real
--      deal context for the row. Browsing without context now goes through
--      a dedicated safe-column view.
--   3. Creates `lands_developer_browse` view that exposes ONLY columns
--      safe for pre-NDA browsing (no deed_number, owner_name, exact GPS,
--      plot_number, plan_number, owner_id). Granted to authenticated.
--   4. Composite index on (is_active, owner_approved, deleted_at) for
--      fast browse listing as data grows.
--
-- After this migration, owners and admins keep full access. Developers
-- with active deals/requests on a specific land keep full row access for
-- that land. The leak is closed for browsing without context.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Helper: is the caller a verified developer with land context? ─
CREATE OR REPLACE FUNCTION public.is_developer_in_land_context(
  _land_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.developers d
    WHERE d.user_id = _user_id
      AND d.verification_status = 'verified'
      AND (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          WHERE dr.developer_id = d.id AND dr.land_id = _land_id
        )
        OR EXISTS (
          SELECT 1 FROM public.deals dl
          WHERE dl.developer_id = d.id AND dl.land_id = _land_id
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_developer_in_land_context(uuid, uuid) TO authenticated;

-- ─── 2. Replace the broad developer SELECT policy ─────────────────────
DROP POLICY IF EXISTS "Verified developers can browse active lands" ON public.lands;

-- Narrower policy: a verified developer can read a `lands` row in full
-- only when they have a deal context (request or deal) on it. Browsing
-- without context goes through `lands_developer_browse` view.
CREATE POLICY "Developers read lands with deal context"
  ON public.lands FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.is_developer_in_land_context(id, auth.uid())
  );

-- ─── 3. Safe-column browse view ───────────────────────────────────────
-- Excludes (in order of sensitivity):
--   owner_id, owner_name, deed_number, plot_number, plan_number,
--   exact_location_lat, exact_location_lng, estimated_total_value,
--   estimated_price_per_sqm, tenant_id
-- Includes everything a developer needs for the browse-and-evaluate
-- workflow: location at city/district granularity, area, project
-- vision, brokerage status (but NOT the brokerage license number),
-- quality/revenue model, gallery, and the public image_url.
DROP VIEW IF EXISTS public.lands_developer_browse;
CREATE VIEW public.lands_developer_browse
WITH (security_barrier = true, security_invoker = false) AS
  SELECT
    l.id,
    l.city,
    l.district,
    l.land_area_sqm,
    l.length_m,
    l.width_m,
    l.street_width_m,
    l.usage_type,
    l.partnership_goal,
    l.partnership_model,
    l.project_type,
    l.quality_level,
    l.revenue_model,
    l.expected_dev_duration_months,
    l.developer_experience_requirements,
    l.financing_preference,
    l.vision_summary,
    l.image_url,
    l.gallery_urls,
    l.brokerage_license_status,
    l.is_active,
    l.is_featured,
    l.owner_approved,
    l.created_at,
    l.updated_at
  FROM public.lands l
  WHERE l.is_active = true
    AND l.owner_approved = true
    AND l.deleted_at IS NULL;

-- The view runs with the OWNER's privileges (security_invoker=false +
-- security_barrier=true) so the underlying lands RLS does NOT apply
-- inside it. We gate access at the GRANT layer instead.
REVOKE ALL ON public.lands_developer_browse FROM PUBLIC;
GRANT SELECT ON public.lands_developer_browse TO authenticated;

COMMENT ON VIEW public.lands_developer_browse IS
  'Pre-NDA safe view for developer browsing. Excludes owner_id, owner_name, deed_number, plot/plan numbers, exact GPS, and money fields. Use the base table public.lands only after deal context is established (request/deal exists).';

-- ─── 4. Composite index for fast browse ───────────────────────────────
-- The browse query filters on (is_active, owner_approved, deleted_at IS
-- NULL) and orders by created_at DESC. Composite supports the WHERE
-- predicate; created_at is added so the planner can use the same index
-- for ORDER BY without a separate sort.
CREATE INDEX IF NOT EXISTS idx_lands_browse_filter
  ON public.lands (is_active, owner_approved, deleted_at, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- Verification snippets (run manually after deploy):
--
--   -- A verified developer with no deal context should get 0 rows
--   -- from the base table:
--   set role authenticated;
--   set request.jwt.claim.sub = '<some_dev_uuid>';
--   select count(*) from public.lands;     -- expect 0
--   select count(*) from public.lands_developer_browse; -- expect N
--
--   -- After inserting a deal_request for that dev on a specific land,
--   -- only that land becomes visible in the base table:
--   select id from public.lands;          -- expect 1 row (the land)
-- ═══════════════════════════════════════════════════════════════════════
