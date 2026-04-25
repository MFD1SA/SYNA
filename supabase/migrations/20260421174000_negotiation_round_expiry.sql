-- ============================================================
-- Negotiation round expiry + atomicity
--
-- Before:
--   • Rounds had no deadline — a counter-offer could sit forever.
--   • Client computed round_number = COUNT(*) + 1 (race prone,
--     same bug pattern as deal_studies versioning).
--   • Client wrote initiator_role / responder_role itself — same
--     spoof risk as report approvals before the consensus fix.
--   • Nothing stopped a party from spamming new rounds while an
--     earlier round was still awaiting a response.
--
-- After:
--   • `response_deadline_at TIMESTAMPTZ` column, default
--     created_at + 7 days, enforced by a sweeper RPC called from
--     the hourly cron (check-report-deadlines).
--   • UNIQUE(deal_request_id, round_number) makes duplicates
--     impossible at the storage layer.
--   • `create_negotiation_round` + `respond_to_negotiation_round`
--     RPCs: server-resolve role, row-lock the deal request,
--     and reject illegal sequences (e.g. new round while the last
--     one is still open, responding after the deadline).
-- ============================================================

-- 1. Add deadline column + backfill.
ALTER TABLE public.negotiation_rounds
  ADD COLUMN IF NOT EXISTS response_deadline_at TIMESTAMPTZ;

UPDATE public.negotiation_rounds
SET response_deadline_at = created_at + INTERVAL '7 days'
WHERE response_deadline_at IS NULL;

ALTER TABLE public.negotiation_rounds
  ALTER COLUMN response_deadline_at SET NOT NULL;

ALTER TABLE public.negotiation_rounds
  ALTER COLUMN response_deadline_at SET DEFAULT (now() + INTERVAL '7 days');

-- 2. Enforce round uniqueness so two concurrent creators can't
-- both claim round_number=N.
DO $$
BEGIN
  -- Collapse any accidental dupes (earliest row wins).
  DELETE FROM public.negotiation_rounds nr
  USING (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY deal_request_id, round_number
             ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM public.negotiation_rounds
  ) dupes
  WHERE nr.id = dupes.id
    AND dupes.rn > 1;
END $$;

ALTER TABLE public.negotiation_rounds
  DROP CONSTRAINT IF EXISTS negotiation_rounds_deal_round_uniq;

ALTER TABLE public.negotiation_rounds
  ADD CONSTRAINT negotiation_rounds_deal_round_uniq
  UNIQUE (deal_request_id, round_number);

-- Partial index to make the sweeper cheap.
CREATE INDEX IF NOT EXISTS idx_nr_open_deadline
  ON public.negotiation_rounds (response_deadline_at)
  WHERE response_decision IS NULL;

-- 3. Expiry sweeper — called hourly by check-report-deadlines.
-- Marks stale rounds as expired and closes the parent deal as
-- closed_lost with reason='negotiation_deadline_expired'. A single
-- transaction so the UI never sees a deal that's half-expired.
CREATE OR REPLACE FUNCTION public.expire_stale_negotiation_rounds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _count INT;
BEGIN
  WITH expired_rounds AS (
    UPDATE public.negotiation_rounds
    SET response_decision = 'rejected',
        response_notes    = 'Auto-rejected: response deadline expired',
        responded_at      = now(),
        responder_role    = 'admin'  -- system actor
    WHERE response_decision IS NULL
      AND response_deadline_at < now()
    RETURNING deal_request_id
  ),
  closed_deals AS (
    UPDATE public.deal_requests dr
    SET current_phase    = 'closed_lost',
        rejection_reason = 'negotiation_deadline_expired',
        closed_at        = now()
    WHERE dr.id IN (SELECT DISTINCT deal_request_id FROM expired_rounds)
      AND dr.current_phase IN ('negotiation_active', 'final_approval')
    RETURNING id
  )
  SELECT COUNT(*) INTO _count FROM closed_deals;

  RETURN COALESCE(_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_negotiation_rounds() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_negotiation_rounds() TO service_role;

COMMENT ON FUNCTION public.expire_stale_negotiation_rounds() IS
  'Flips negotiation_rounds with response_deadline_at < now() and no '
  'response to rejected=auto, and closes the parent deal_request as '
  'closed_lost. Called hourly by the check-report-deadlines cron.';

-- 4. Atomic create — single RPC that resolves role, row-locks the
-- deal request, assigns the next round_number, rejects if the
-- previous round is still awaiting a response.
CREATE OR REPLACE FUNCTION public.create_negotiation_round(
  _deal_request_id UUID,
  _offer_summary   TEXT,
  _proposed_terms  JSONB,
  _attachments     JSONB
)
RETURNS public.negotiation_rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid          UUID := auth.uid();
  _current_phase TEXT;
  _land_id      UUID;
  _developer_id UUID;
  _is_admin     BOOLEAN;
  _is_owner     BOOLEAN := false;
  _is_developer BOOLEAN := false;
  _actor_role   TEXT;
  _next_round   INT;
  _prev_open    INT;
  _row          public.negotiation_rounds;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Lock the parent deal so concurrent creators serialize cleanly.
  SELECT dr.current_phase, dr.land_id, dr.developer_id
    INTO _current_phase, _land_id, _developer_id
  FROM public.deal_requests dr
  WHERE dr.id = _deal_request_id
  FOR UPDATE;

  IF _current_phase IS NULL THEN
    RAISE EXCEPTION 'Deal request not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF _current_phase IN ('closed_won', 'closed_lost', 'cancelled', 'final_approval') THEN
    RAISE EXCEPTION 'Deal is not open for negotiation (phase=%)', _current_phase
      USING ERRCODE = 'check_violation';
  END IF;

  -- Role resolution (server-side, never trust client).
  SELECT public.has_role(_uid, 'admin'::public.app_role) INTO _is_admin;

  IF _land_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.lands WHERE id = _land_id AND owner_id = _uid)
      INTO _is_owner;
  END IF;

  IF _developer_id IS NOT NULL AND NOT _is_owner THEN
    SELECT EXISTS (SELECT 1 FROM public.developers WHERE id = _developer_id AND user_id = _uid)
      INTO _is_developer;
  END IF;

  IF _is_owner THEN
    _actor_role := 'owner';
  ELSIF _is_developer THEN
    _actor_role := 'developer';
  ELSIF _is_admin THEN
    _actor_role := 'admin';
  ELSE
    RAISE EXCEPTION 'Not authorised to create rounds on this deal'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Reject new round if the previous one hasn't been responded to.
  -- Admin bypass (they can always inject a round to break deadlock).
  IF _actor_role <> 'admin' THEN
    SELECT COUNT(*) INTO _prev_open
    FROM public.negotiation_rounds
    WHERE deal_request_id = _deal_request_id
      AND response_decision IS NULL;

    IF _prev_open > 0 THEN
      RAISE EXCEPTION 'Previous round is still awaiting a response'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  SELECT COALESCE(MAX(round_number), 0) + 1
    INTO _next_round
  FROM public.negotiation_rounds
  WHERE deal_request_id = _deal_request_id;

  INSERT INTO public.negotiation_rounds (
    deal_request_id,
    round_number,
    initiated_by,
    initiator_role,
    offer_summary,
    proposed_terms,
    attachments,
    response_deadline_at
  ) VALUES (
    _deal_request_id,
    _next_round,
    _uid,
    _actor_role,
    _offer_summary,
    COALESCE(_proposed_terms, '{}'::jsonb),
    COALESCE(_attachments,    '[]'::jsonb),
    now() + INTERVAL '7 days'
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_negotiation_round(UUID, TEXT, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_negotiation_round(UUID, TEXT, JSONB, JSONB) TO authenticated;

-- 5. Atomic response — resolves responder role server-side,
-- rejects late responses, and refuses to overwrite an existing
-- response (the respond-once-per-round invariant).
CREATE OR REPLACE FUNCTION public.respond_to_negotiation_round(
  _round_id UUID,
  _decision TEXT,
  _notes    TEXT
)
RETURNS public.negotiation_rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid          UUID := auth.uid();
  _deal_req_id  UUID;
  _land_id      UUID;
  _developer_id UUID;
  _initiator    UUID;
  _existing     TEXT;
  _deadline     TIMESTAMPTZ;
  _is_admin     BOOLEAN;
  _is_owner     BOOLEAN := false;
  _is_developer BOOLEAN := false;
  _actor_role   TEXT;
  _row          public.negotiation_rounds;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF _decision NOT IN ('accepted', 'rejected', 'counter_offer') THEN
    RAISE EXCEPTION 'Invalid decision: %', _decision USING ERRCODE = 'check_violation';
  END IF;

  -- Lock the round row.
  SELECT nr.deal_request_id, nr.initiated_by, nr.response_decision, nr.response_deadline_at
    INTO _deal_req_id, _initiator, _existing, _deadline
  FROM public.negotiation_rounds nr
  WHERE nr.id = _round_id
  FOR UPDATE;

  IF _deal_req_id IS NULL THEN
    RAISE EXCEPTION 'Round not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'Round already has a response (%).', _existing
      USING ERRCODE = 'check_violation';
  END IF;

  IF _deadline < now() THEN
    RAISE EXCEPTION 'Response deadline has passed'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT dr.land_id, dr.developer_id
    INTO _land_id, _developer_id
  FROM public.deal_requests dr
  WHERE dr.id = _deal_req_id;

  -- Role resolution + block the initiator from responding to their own round.
  SELECT public.has_role(_uid, 'admin'::public.app_role) INTO _is_admin;

  IF _land_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.lands WHERE id = _land_id AND owner_id = _uid)
      INTO _is_owner;
  END IF;

  IF _developer_id IS NOT NULL AND NOT _is_owner THEN
    SELECT EXISTS (SELECT 1 FROM public.developers WHERE id = _developer_id AND user_id = _uid)
      INTO _is_developer;
  END IF;

  IF _is_owner THEN
    _actor_role := 'owner';
  ELSIF _is_developer THEN
    _actor_role := 'developer';
  ELSIF _is_admin THEN
    _actor_role := 'admin';
  ELSE
    RAISE EXCEPTION 'Not authorised to respond to this round'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Initiator can't respond to their own round (admin bypass).
  IF _uid = _initiator AND _actor_role <> 'admin' THEN
    RAISE EXCEPTION 'You cannot respond to a round you initiated'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.negotiation_rounds
  SET response_decision = _decision,
      response_notes    = NULLIF(_notes, ''),
      responded_by      = _uid,
      responder_role    = _actor_role,
      responded_at      = now()
  WHERE id = _round_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_negotiation_round(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_negotiation_round(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_negotiation_round(UUID, TEXT, JSONB, JSONB) IS
  'Creates a new negotiation round atomically. Server-resolves initiator_role, '
  'assigns next round_number under a row lock, and rejects creation while the '
  'previous round is still awaiting a response.';

COMMENT ON FUNCTION public.respond_to_negotiation_round(UUID, TEXT, TEXT) IS
  'Records a response to a negotiation round. Server-resolves responder_role, '
  'rejects late/duplicate responses, and prevents the initiator from '
  'responding to their own round.';
