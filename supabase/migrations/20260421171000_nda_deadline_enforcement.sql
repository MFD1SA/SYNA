-- ============================================================
-- NDA deadline enforcement
--
-- Every deal_request gets an `nda_deadline_at` timestamp 7 days
-- after creation. If either party's NDA status is still pending
-- past the deadline, the request flips to `closed_lost` with a
-- tagged rejection_reason. A scheduled cron calls the helper
-- function `public.expire_stale_nda_requests()` once an hour.
--
-- Also hardens `accept-nda` at the DB level: a trigger rejects
-- NDA status updates on requests whose deadline has passed.
-- ============================================================

ALTER TABLE public.deal_requests
  ADD COLUMN IF NOT EXISTS nda_deadline_at TIMESTAMPTZ
    DEFAULT (now() + INTERVAL '7 days');

-- Backfill existing rows that predate this column so they also
-- have a deadline (7 days from NOW, giving anyone still in NDA
-- a fresh clock rather than yanking the rug).
UPDATE public.deal_requests
SET nda_deadline_at = now() + INTERVAL '7 days'
WHERE nda_deadline_at IS NULL;

-- Make the column NOT NULL now that it's backfilled.
ALTER TABLE public.deal_requests
  ALTER COLUMN nda_deadline_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deal_requests_nda_deadline
  ON public.deal_requests (nda_deadline_at)
  WHERE current_phase IN ('nda_pending', 'nda_developer_accepted');

-- Sweeper: flip expired NDA requests to closed_lost atomically.
-- Called by cron (below) and safely re-runnable.
CREATE OR REPLACE FUNCTION public.expire_stale_nda_requests()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _count INT;
BEGIN
  WITH expired AS (
    UPDATE public.deal_requests
    SET current_phase    = 'closed_lost',
        rejection_reason = 'nda_deadline_expired',
        closed_at        = now()
    WHERE current_phase IN ('nda_pending', 'nda_developer_accepted')
      AND nda_deadline_at < now()
    RETURNING id, developer_id
  )
  SELECT COUNT(*) INTO _count FROM expired;

  RETURN COALESCE(_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_nda_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_nda_requests() TO service_role;

COMMENT ON FUNCTION public.expire_stale_nda_requests() IS
  'Sweeps deal_requests whose NDA is still pending past nda_deadline_at '
  'and flips them to closed_lost with reason=nda_deadline_expired. '
  'Called hourly from check-report-deadlines cron.';

-- Trigger: block NDA acceptance after the deadline has passed.
-- Lets the server-side accept-nda function surface a clean error to
-- the user instead of silently saving an acceptance that will get
-- immediately expired by the sweeper.
CREATE OR REPLACE FUNCTION public.prevent_post_deadline_nda_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.nda_deadline_at < now()
     AND OLD.current_phase IN ('nda_pending', 'nda_developer_accepted')
     AND (
       NEW.developer_nda_status <> OLD.developer_nda_status
       OR NEW.owner_nda_status <> OLD.owner_nda_status
     )
  THEN
    RAISE EXCEPTION 'NDA deadline has passed for this deal_request (deadline: %)',
      OLD.nda_deadline_at
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_post_deadline_nda_update ON public.deal_requests;
CREATE TRIGGER trg_prevent_post_deadline_nda_update
  BEFORE UPDATE OF developer_nda_status, owner_nda_status
    ON public.deal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_post_deadline_nda_update();
