-- ============================================================
-- P0.1 — Audit log on impersonation consume
-- ============================================================
-- Previously only the INITIATION of impersonation (impersonate-user
-- edge function) wrote an audit_logs row. The actual CONSUMPTION of
-- the exchange token (moment the admin's browser receives the target
-- user's session) was unlogged.
--
-- Impact:
--   - Auditors could see an admin REQUESTED impersonation, but had no
--     proof the session was actually materialized.
--   - If impersonate-exchange was ever called with a stolen/leaked
--     UUID, the breach left no trail.
--
-- Fix: make the SECURITY DEFINER consume function itself INSERT a
-- second audit row — 'impersonate_user_consumed' — atomically with
-- the token handoff. No way to "use" an exchange without writing
-- to audit_logs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.consume_impersonation_exchange(_id UUID)
RETURNS TABLE (access_token TEXT, refresh_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id       UUID;
  v_target_id      UUID;
  v_access_token   TEXT;
  v_refresh_token  TEXT;
  v_admin_email    TEXT;
BEGIN
  -- Atomic consume: the UPDATE ... WHERE used_at IS NULL guard makes
  -- double-spend impossible even under race conditions.
  UPDATE public.impersonation_exchanges
  SET used_at = now()
  WHERE id = _id
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING
    impersonation_exchanges.admin_user_id,
    impersonation_exchanges.target_user_id,
    impersonation_exchanges.access_token,
    impersonation_exchanges.refresh_token
  INTO v_admin_id, v_target_id, v_access_token, v_refresh_token;

  -- If nothing was updated (expired/used/unknown), return empty.
  -- impersonate-exchange interprets empty set as 410 Gone.
  IF v_admin_id IS NULL THEN
    RETURN;
  END IF;

  -- Look up admin email for readable audit trail (best-effort).
  SELECT email INTO v_admin_email FROM auth.users WHERE id = v_admin_id;

  -- Audit log row — the actual moment impersonation materialized.
  -- Complements the earlier 'impersonate_user' row written by
  -- impersonate-user (initiation). Together they form a complete trail:
  --   INITIATED (impersonate_user) → CONSUMED (impersonate_user_consumed).
  INSERT INTO public.audit_logs (
    user_id, user_email, action, entity_type, entity_id, details
  )
  VALUES (
    v_admin_id,
    v_admin_email,
    'impersonate_user_consumed',
    'user',
    v_target_id::TEXT,
    jsonb_build_object(
      'exchange_id', _id::TEXT,
      'consumed_at', now()
    )
  );

  RETURN QUERY SELECT v_access_token, v_refresh_token;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_impersonation_exchange(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_impersonation_exchange(UUID) TO service_role;

COMMENT ON FUNCTION public.consume_impersonation_exchange(UUID) IS
  'Atomic single-use consume of impersonation_exchanges row. '
  'Also writes audit_logs(''impersonate_user_consumed'') so every '
  'successful consume is traceable. Returns empty set when the id '
  'is already used, expired or unknown.';
