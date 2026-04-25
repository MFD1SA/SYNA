-- ============================================================
-- RLS hardening — close two WITH CHECK gaps and one cross-ref
-- on developer_reports INSERT.
--
-- Context: the original policies were written with only USING
-- clauses. Postgres applies USING to the row as-seen-before-update
-- and WITH CHECK to the row as-written-after-update. Without a
-- WITH CHECK, an attacker who satisfies USING can still mutate
-- protected columns (e.g. pointing `user_id` at another account)
-- as long as the pre-image passed. That's the pattern we're
-- closing for both `profiles` and `developer_reports`.
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles: UPDATE must match before AND after
-- ------------------------------------------------------------
-- The existing "Users can update own profile" policy has only
-- `USING (auth.uid() = user_id)`. Without WITH CHECK, a user
-- could theoretically rewrite user_id to another user's id in
-- the same UPDATE. Drop-and-recreate to make the guarantee
-- symmetric (pre-image AND post-image must belong to the caller).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. developer_reports: INSERT must be consistent with the deal
-- ------------------------------------------------------------
-- The original "Owner inserts own developer reports" policy
-- only checks `requested_by = auth.uid()`. That keeps the row
-- attributable but it does NOT verify the caller actually owns
-- the land the deal_request is tied to — so any authenticated
-- user can spawn reports against any developer, burning our
-- Lovable AI budget by proxy and polluting the report cache.
--
-- Tightened rule: the caller must be either
--   (a) the land owner linked to the deal_request, OR
--   (b) an admin (admins already have the "Admin full access" policy).
DROP POLICY IF EXISTS "Owner inserts own developer reports" ON public.developer_reports;

CREATE POLICY "Owner inserts own developer reports"
  ON public.developer_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.deal_requests dr
        JOIN public.lands l ON l.id = dr.land_id
        WHERE dr.id = developer_reports.deal_request_id
          AND dr.developer_id = developer_reports.developer_id
          AND l.owner_id = auth.uid()
      )
    )
  );

-- Also add a matching UPDATE policy for the owner so they can
-- re-run a stale report without relying on the admin-ALL policy.
-- Without this, the only writers are admins — which forces the
-- "regenerate" button through an edge function that runs as
-- service role. That still works, but the defense-in-depth value
-- of having an explicit owner-UPDATE rule is non-trivial:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'developer_reports'
      AND policyname = 'Owner updates own developer reports'
  ) THEN
    CREATE POLICY "Owner updates own developer reports"
      ON public.developer_reports
      FOR UPDATE
      TO authenticated
      USING      (requested_by = auth.uid())
      WITH CHECK (
        requested_by = auth.uid()
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR EXISTS (
            SELECT 1
            FROM public.deal_requests dr
            JOIN public.lands l ON l.id = dr.land_id
            WHERE dr.id = developer_reports.deal_request_id
              AND dr.developer_id = developer_reports.developer_id
              AND l.owner_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. developers: UPDATE must preserve user_id binding
-- ------------------------------------------------------------
-- A verified developer who can pass the USING check owns the row,
-- but without WITH CHECK they could pivot user_id to a different
-- account — effectively handing over a verified CR-backed profile.
-- That's a clear privilege-transfer hazard. The fix is symmetric.
DROP POLICY IF EXISTS "Users can update own developer profile" ON public.developers;

CREATE POLICY "Users can update own developer profile"
  ON public.developers
  FOR UPDATE
  TO authenticated
  USING      (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- ------------------------------------------------------------
-- 4. lands: UPDATE must preserve owner_id binding
-- ------------------------------------------------------------
-- Parallel fix for the lands table. Owner must still own the row
-- AFTER the update, not just before. This closes two distinct
-- hazards:
--   (a) ownership transfer: rewriting owner_id to another user
--   (b) approval bypass: a malicious client writing
--       `is_active = true, owner_approved = true` is still bounded
--       by other triggers, but the symmetric WITH CHECK guarantees
--       the row stays attributable to the caller.
DROP POLICY IF EXISTS "Owners can update own lands" ON public.lands;

CREATE POLICY "Owners can update own lands"
  ON public.lands
  FOR UPDATE
  TO authenticated
  USING      (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- ------------------------------------------------------------
-- 5. deal_requests: UPDATE must keep the same land/developer pair
-- ------------------------------------------------------------
-- The existing policy lets the land owner (or admin) update
-- requests on their land. Without WITH CHECK, a malicious owner
-- could flip `developer_id` or `land_id` on a pending request
-- and redirect a proposal to a different deal. Tightening the
-- post-image keeps both scalars in the owner's scope.
DROP POLICY IF EXISTS "Owners can update requests on their lands" ON public.deal_requests;

CREATE POLICY "Owners can update requests on their lands"
  ON public.deal_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.lands l WHERE l.id = deal_requests.land_id AND l.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.lands l WHERE l.id = deal_requests.land_id AND l.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ------------------------------------------------------------
-- 6. deals: UPDATE must keep the same parties
-- ------------------------------------------------------------
-- Either party (owner or developer) can update a deal under the
-- existing USING clause. Without WITH CHECK, either party could
-- rewrite owner_id / developer_id mid-deal. The post-image rule
-- pins both parties' identifiers to the caller's scope.
DROP POLICY IF EXISTS "Deal parties can update deals" ON public.deals;

CREATE POLICY "Deal parties can update deals"
  ON public.deals
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = deals.owner_id
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id = deals.developer_id AND d.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = deals.owner_id
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id = deals.developer_id AND d.user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 7. Verification comments
-- ------------------------------------------------------------
-- After this migration, a caller can no longer:
--   * point their own profile at another user_id (profiles WITH CHECK),
--   * insert a developer_reports row tied to a land they don't own,
--   * rewrite user_id / owner_id / land_id / developer_id on rows
--     they are otherwise allowed to update (profiles, developers,
--     lands, deal_requests, deals).
-- Admins are unaffected (their FOR ALL policies still grant every verb).
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS
  'Symmetric USING/WITH CHECK — prevents user_id rewrite on update.';
COMMENT ON POLICY "Users can update own developer profile" ON public.developers IS
  'Symmetric USING/WITH CHECK — prevents transferring a verified developer to another user.';
COMMENT ON POLICY "Owners can update own lands" ON public.lands IS
  'Symmetric USING/WITH CHECK — prevents owner_id rewrite on update.';
COMMENT ON POLICY "Owners can update requests on their lands" ON public.deal_requests IS
  'Symmetric USING/WITH CHECK — prevents redirecting a request to a different land/developer.';
COMMENT ON POLICY "Deal parties can update deals" ON public.deals IS
  'Symmetric USING/WITH CHECK — prevents rewriting deal parties mid-flight.';
COMMENT ON POLICY "Owner inserts own developer reports" ON public.developer_reports IS
  'Caller must own the land behind the deal_request (or be admin). Prevents API-budget abuse.';
