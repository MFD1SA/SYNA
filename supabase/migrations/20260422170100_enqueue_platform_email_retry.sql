-- ============================================================
-- P0.2 — RPC enqueue_platform_email_retry
-- ============================================================
-- Problem: services like dealClosing.service invoke the
-- send-platform-email edge function with await + try/catch, but
-- when the invoke itself fails (network / cold-start timeout /
-- 500 before Resend step), no row is ever written to email_log.
-- The email silently disappears — no retry, no audit, no trace.
--
-- Fix: expose a tiny SECURITY DEFINER RPC that an authenticated
-- user can call to record "I wanted to send event X for entity Y,
-- please retry." It writes one row to email_log with status='queued'
-- and next_retry_at=now(), so the email-retry cron (P0.4) picks it
-- up on the next tick.
--
-- Allowlist: only event_types the platform actually uses — no
-- open-ended write-access to email_log from the client.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_platform_email_retry(
  _event_type TEXT,
  _related_entity_type TEXT,
  _related_entity_id UUID,
  _error TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allowed_events CONSTANT TEXT[] := ARRAY[
    -- Study flow
    'study_required', 'study_submitted',
    'study_approved', 'study_rejected', 'study_changes_requested',
    -- Meeting flow
    'meeting_proposed', 'meeting_confirmed',
    'meeting_cancelled', 'meeting_completed',
    -- Report flow
    'report_created', 'report_approved', 'report_rejected',
    'report_changes_requested', 'report_deadline_reminder', 'report_expired',
    -- NDA flow
    'nda_developer_accepted', 'nda_owner_accepted',
    'request_rejected', 'request_cancelled',
    -- Negotiation flow
    'negotiation_new_round', 'negotiation_accepted',
    'negotiation_rejected', 'negotiation_counter_offer',
    -- Deal closing
    'deal_closed_won', 'deal_closed_lost'
  ];
  v_row_id UUID;
BEGIN
  -- Caller must be authenticated. Anonymous callers can't enqueue.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Event type must be in allowlist
  IF NOT (_event_type = ANY(v_allowed_events)) THEN
    RAISE EXCEPTION 'Event type not allowed: %', _event_type;
  END IF;

  -- Sanity: entity type and id must be present together
  IF _related_entity_id IS NULL THEN
    RAISE EXCEPTION 'related_entity_id is required';
  END IF;

  -- Write a queued row. recipient_email is unknown at this point —
  -- the retry worker looks it up from the entity when it fires. We
  -- use a placeholder sentinel so the NOT NULL constraint holds.
  INSERT INTO public.email_log (
    event_type, recipient_email, subject, status, attempts,
    next_retry_at, error, related_entity_type, related_entity_id,
    metadata
  )
  VALUES (
    _event_type,
    '__deferred__',           -- sentinel; retry worker resolves real recipient
    '__deferred__',           -- sentinel subject; retry worker fills in
    'queued',
    0,
    now(),                    -- fire on next cron tick
    LEFT(COALESCE(_error, 'client invoke failed'), 500),
    _related_entity_type,
    _related_entity_id,
    jsonb_build_object(
      'enqueued_by', auth.uid()::TEXT,
      'enqueued_at', now(),
      'reason', 'client_invoke_fallback'
    )
  )
  RETURNING id INTO v_row_id;

  RETURN v_row_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_platform_email_retry(TEXT, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_platform_email_retry(TEXT, TEXT, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.enqueue_platform_email_retry IS
  'Client-side fallback: records a queued email_log row when the '
  'send-platform-email edge function invoke fails client-side. '
  'Processed by the email-retry cron on the next tick. Authenticated '
  'users only; event_types are allowlisted.';
