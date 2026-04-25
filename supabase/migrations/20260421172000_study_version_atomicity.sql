-- ============================================================
-- Study version atomicity
--
-- Before: the client did `SELECT COUNT(*) + 1` to pick the next
-- version number, then INSERTed. Two concurrent upload clicks
-- would both read the same count and both insert version=N — the
-- second overwrites the first's reviewer_id/status on subsequent
-- queries that filter by version, and worse, the UI shows two
-- rows with the same "v2" label.
--
-- Fix: add UNIQUE(deal_request_id, version) so the database
-- enforces uniqueness, and expose a SECURITY DEFINER RPC that
-- computes MAX(version)+1 and INSERTs in a single statement. The
-- UNIQUE index also protects against any future code paths that
-- forget to use the RPC.
-- ============================================================

-- 1. Enforce uniqueness. If any duplicates exist from the old
-- race-prone path, the `ON CONFLICT DO NOTHING` in the dedup
-- helper below nukes them first.
DO $$
BEGIN
  -- Collapse any pre-existing duplicates: keep the earliest row
  -- per (deal_request_id, version), delete the rest. This only
  -- affects rows that were already corrupted by the race — fresh
  -- deployments see zero rows deleted.
  DELETE FROM public.deal_studies ds
  USING (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY deal_request_id, version
             ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM public.deal_studies
  ) dupes
  WHERE ds.id = dupes.id
    AND dupes.rn > 1;
END $$;

ALTER TABLE public.deal_studies
  DROP CONSTRAINT IF EXISTS deal_studies_request_version_uniq;

ALTER TABLE public.deal_studies
  ADD CONSTRAINT deal_studies_request_version_uniq
  UNIQUE (deal_request_id, version);

-- 2. Atomic insert RPC.
--
-- SECURITY DEFINER because the function needs to read MAX(version)
-- inside the same statement as the INSERT. The embedded
-- `has_permission` check ensures callers can only insert studies
-- for deal_requests where they're the assigned developer (or an
-- admin) — matching the existing RLS policies.
CREATE OR REPLACE FUNCTION public.insert_study_next_version(
  _deal_request_id UUID,
  _title           TEXT,
  _summary         TEXT,
  _file_url        TEXT,
  _notes           TEXT
)
RETURNS public.deal_studies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid           UUID := auth.uid();
  _is_admin      BOOLEAN;
  _is_developer  BOOLEAN;
  _next_version  INT;
  _row           public.deal_studies;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Admin bypass
  SELECT public.has_role(_uid, 'admin'::public.app_role) INTO _is_admin;

  IF NOT _is_admin THEN
    -- Developer on this deal_request?
    SELECT EXISTS (
      SELECT 1
      FROM public.deal_requests dr
      INNER JOIN public.developers d ON d.id = dr.developer_id
      WHERE dr.id = _deal_request_id
        AND d.user_id = _uid
    ) INTO _is_developer;

    IF NOT _is_developer THEN
      RAISE EXCEPTION 'Not authorised to upload studies for this deal_request'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Lock the parent row so concurrent uploaders serialize on it.
  -- This is cheap (single row) and keeps the MAX(version) +
  -- INSERT atomic even if the UNIQUE constraint weren't there.
  PERFORM 1
  FROM public.deal_requests
  WHERE id = _deal_request_id
  FOR UPDATE;

  SELECT COALESCE(MAX(version), 0) + 1
    INTO _next_version
  FROM public.deal_studies
  WHERE deal_request_id = _deal_request_id;

  INSERT INTO public.deal_studies (
    deal_request_id,
    version,
    uploaded_by,
    title,
    summary,
    file_url,
    notes,
    status
  ) VALUES (
    _deal_request_id,
    _next_version,
    _uid,
    _title,
    NULLIF(_summary, ''),
    _file_url,
    NULLIF(_notes, ''),
    'submitted'
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_study_next_version(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_study_next_version(UUID, TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

COMMENT ON FUNCTION public.insert_study_next_version(UUID, TEXT, TEXT, TEXT, TEXT) IS
  'Atomically picks MAX(version)+1 for deal_studies and inserts a new row. '
  'Serializes on deal_requests row lock to prevent concurrent duplicate-version races. '
  'Enforces the same authorisation rules as the RLS policies on deal_studies.';
