-- ============================================================
-- Report approval consensus hardening
--
-- Before: the client determined actor_role itself and then wrote
-- it into report_approvals. That trusted the client — someone with
-- direct SQL access (or anyone who can bypass UI) could spoof
-- role='admin' to force an approval. Even with RLS's
-- `user_id = auth.uid()` WITH CHECK, the role column wasn't
-- constrained to match the user's actual role on the deal.
--
-- Also: the status recompute (`hasReject ? rejected : ownerApproved
-- && devApproved ? fully_approved : ...`) ran as two separate client
-- queries — upsert the approval, read all approvals, update status.
-- Two users clicking "approve" at the same time could race and
-- leave the report in `partially_approved` forever.
--
-- Fix: single SECURITY DEFINER RPC that determines role from
-- server state, upserts the approval inside a row lock, recomputes
-- status, and returns the new status + next phase for the caller
-- to hand to `transition-deal-phase`.
-- ============================================================

-- Drop any older version before recreating (makes this migration
-- re-runnable if someone tweaks the signature later).
DROP FUNCTION IF EXISTS public.submit_report_approval(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.submit_report_approval(
  _report_id  UUID,
  _decision   TEXT,  -- 'approved' | 'rejected' | 'changes_requested'
  _notes      TEXT
)
RETURNS TABLE (
  report_id       UUID,
  deal_request_id UUID,
  actor_role      TEXT,
  new_status      TEXT,
  next_phase      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid            UUID := auth.uid();
  _deal_req_id    UUID;
  _land_id        UUID;
  _developer_id   UUID;
  _current_status TEXT;
  _expires_at     TIMESTAMPTZ;
  _is_admin       BOOLEAN := false;
  _is_owner       BOOLEAN := false;
  _is_developer   BOOLEAN := false;
  _actor_role     TEXT;
  _has_reject     BOOLEAN;
  _has_changes    BOOLEAN;
  _owner_ok       BOOLEAN;
  _dev_ok         BOOLEAN;
  _new_status     TEXT;
  _next_phase     TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF _decision NOT IN ('approved', 'rejected', 'changes_requested') THEN
    RAISE EXCEPTION 'Invalid decision: %', _decision USING ERRCODE = 'check_violation';
  END IF;

  -- Lock the report row. Everything downstream (re-read, upsert,
  -- status recompute, status update) happens under this lock so
  -- concurrent decisions from owner + developer serialize cleanly.
  SELECT mr.deal_request_id, mr.status, mr.expires_at
    INTO _deal_req_id, _current_status, _expires_at
  FROM public.meeting_reports mr
  WHERE mr.id = _report_id
  FOR UPDATE;

  IF _deal_req_id IS NULL THEN
    RAISE EXCEPTION 'Report not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF _current_status IN ('fully_approved', 'rejected', 'expired') THEN
    RAISE EXCEPTION 'Report is no longer open for approval (status=%)',
      _current_status USING ERRCODE = 'check_violation';
  END IF;

  IF _expires_at < now() THEN
    RAISE EXCEPTION 'Report approval deadline has passed'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Resolve actor role server-side. Do not trust any client input.
  SELECT public.has_role(_uid, 'admin'::public.app_role) INTO _is_admin;

  SELECT dr.land_id, dr.developer_id
    INTO _land_id, _developer_id
  FROM public.deal_requests dr
  WHERE dr.id = _deal_req_id;

  IF _land_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.lands l
      WHERE l.id = _land_id AND l.owner_id = _uid
    ) INTO _is_owner;
  END IF;

  IF _developer_id IS NOT NULL AND NOT _is_owner THEN
    SELECT EXISTS (
      SELECT 1 FROM public.developers d
      WHERE d.id = _developer_id AND d.user_id = _uid
    ) INTO _is_developer;
  END IF;

  -- Priority: owner > developer > admin.
  -- Reason: owner/developer approvals drive consensus; admin just
  -- acts as an override mechanism without counting for either
  -- side. If the same user happened to be both admin and owner
  -- (unlikely but possible in staging), we log them as owner so
  -- their approval advances the deal.
  IF _is_owner THEN
    _actor_role := 'owner';
  ELSIF _is_developer THEN
    _actor_role := 'developer';
  ELSIF _is_admin THEN
    _actor_role := 'admin';
  ELSE
    RAISE EXCEPTION 'Not authorised to approve this report'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Upsert the approval with the server-derived role.
  INSERT INTO public.report_approvals AS ra
    (report_id, user_id, role, decision, notes, decided_at)
  VALUES
    (_report_id, _uid, _actor_role, _decision, NULLIF(_notes, ''), now())
  ON CONFLICT (report_id, user_id) DO UPDATE
  SET role       = EXCLUDED.role,
      decision   = EXCLUDED.decision,
      notes      = EXCLUDED.notes,
      decided_at = EXCLUDED.decided_at;

  -- Recompute aggregate status from the (now-updated) approval set.
  SELECT
    bool_or(a.decision = 'rejected'),
    bool_or(a.decision = 'changes_requested'),
    bool_or(a.role = 'owner'     AND a.decision = 'approved'),
    bool_or(a.role = 'developer' AND a.decision = 'approved')
  INTO _has_reject, _has_changes, _owner_ok, _dev_ok
  FROM public.report_approvals a
  WHERE a.report_id = _report_id;

  IF _has_reject THEN
    _new_status := 'rejected';
    _next_phase := 'report_rejected';
  ELSIF _has_changes THEN
    _new_status := 'changes_requested';
    _next_phase := 'report_changes_requested';
  ELSIF _owner_ok AND _dev_ok THEN
    _new_status := 'fully_approved';
    _next_phase := 'report_approved';
  ELSIF _owner_ok OR _dev_ok THEN
    _new_status := 'partially_approved';
    _next_phase := NULL;  -- stay in report_pending_approval
  ELSE
    _new_status := 'pending_approval';
    _next_phase := NULL;
  END IF;

  -- Persist status only if it changed (avoid spurious updated_at churn).
  IF _new_status IS DISTINCT FROM _current_status THEN
    UPDATE public.meeting_reports
    SET status = _new_status, updated_at = now()
    WHERE id = _report_id;
  END IF;

  RETURN QUERY SELECT _report_id, _deal_req_id, _actor_role, _new_status, _next_phase;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_report_approval(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_report_approval(UUID, TEXT, TEXT)
  TO authenticated;

COMMENT ON FUNCTION public.submit_report_approval(UUID, TEXT, TEXT) IS
  'Records a report approval decision, serializing under a row lock '
  'on meeting_reports to avoid races between concurrent decisions. '
  'Resolves actor_role server-side (never trusts client input) and '
  'returns the new aggregate status plus the recommended next deal '
  'phase (if any).';
