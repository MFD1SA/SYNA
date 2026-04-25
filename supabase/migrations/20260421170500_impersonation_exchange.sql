-- ============================================================
-- impersonation_exchanges — one-time token hand-off for admin
-- impersonation flow.
--
-- Previously impersonate-user returned the access/refresh tokens
-- embedded (base64) in the verify_url fragment. Even though
-- fragments aren't sent to servers on navigation, the URL itself
-- travels in the JSON response body — so the tokens show up in
-- browser devtools, network logs and any error reporter that
-- captures response bodies.
--
-- This table stores the session tokens server-side for ≤60s and
-- hands them to the callback via a single-use exchange_id UUID.
-- The UUID alone is useless after TTL or after one consumption.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.impersonation_exchanges (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token    TEXT        NOT NULL,
  refresh_token   TEXT        NOT NULL,
  admin_user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impersonation_exchanges_expires
  ON public.impersonation_exchanges (expires_at);

ALTER TABLE public.impersonation_exchanges ENABLE ROW LEVEL SECURITY;

-- No policies → no direct access from any role. Service role bypasses
-- RLS and does reads/writes through the edge functions.
-- An explicit RESTRICTIVE deny makes the intent unambiguous for auditors.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'impersonation_exchanges'
      AND policyname = 'Block all direct access'
  ) THEN
    CREATE POLICY "Block all direct access"
      ON public.impersonation_exchanges
      AS RESTRICTIVE
      FOR ALL
      TO public
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Atomic consume helper. Runs as SECURITY DEFINER so the RPC can
-- read + update the row in one statement regardless of RLS.
CREATE OR REPLACE FUNCTION public.consume_impersonation_exchange(_id UUID)
RETURNS TABLE (access_token TEXT, refresh_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.impersonation_exchanges
  SET used_at = now()
  WHERE id = _id
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING
    impersonation_exchanges.access_token,
    impersonation_exchanges.refresh_token;
END;
$$;

-- Expose the RPC so service_role can call it; no one else should.
REVOKE ALL ON FUNCTION public.consume_impersonation_exchange(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_impersonation_exchange(UUID) TO service_role;

COMMENT ON TABLE public.impersonation_exchanges IS
  'Short-lived (≤60s) single-use rows that hand session tokens from '
  'impersonate-user to impersonate-exchange. Rows self-expire via '
  'expires_at; used_at is set atomically on consume. RLS-blocked for '
  'all roles — only service_role (edge functions) can read/write.';
