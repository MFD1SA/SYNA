-- ============================================================
-- P1.3 — notify_all_admins RPC
-- ============================================================
-- Problem: regular users (owners, developers) need to fan out an
-- in-app notification to the admin team when they do things the
-- admins must review (CR upload, new land listing, new complaint).
--
-- notifications RLS only allows INSERT when auth.uid() = user_id
-- OR the caller is admin. A regular user trying to write a
-- notification for an admin user_id is denied — which is correct
-- for generic anti-spam, but blocks legitimate oversight flows.
--
-- Solution: expose a tightly-scoped SECURITY DEFINER RPC. It:
--   - requires an authenticated caller
--   - allowlists a small set of `type` values
--   - loops every admin user_id and writes one row per admin
-- The caller can't control the RECIPIENT list (only admins get it),
-- which eliminates the spam vector.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_all_admins(
  _type TEXT,
  _title_ar TEXT,
  _title_en TEXT,
  _message_ar TEXT,
  _message_en TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allowed_types CONSTANT TEXT[] := ARRAY[
    'land_new_submitted',
    'land_cr_uploaded',
    'developer_cr_uploaded',
    'owner_complaint',
    'deal_abuse_flag',
    'system'
  ];
  v_inserted INT := 0;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (_type = ANY(v_allowed_types)) THEN
    RAISE EXCEPTION 'Notification type not allowed: %', _type;
  END IF;

  IF length(_title_ar) = 0 OR length(_title_en) = 0
     OR length(_message_ar) = 0 OR length(_message_en) = 0 THEN
    RAISE EXCEPTION 'All title and message fields are required';
  END IF;

  -- Fan out: one row per admin user.
  INSERT INTO public.notifications (
    user_id, type, title_ar, title_en, message_ar, message_en,
    entity_type, entity_id
  )
  SELECT
    ur.user_id,
    _type,
    _title_ar,
    _title_en,
    _message_ar,
    _message_en,
    _entity_type,
    _entity_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::public.app_role;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_all_admins(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_all_admins(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.notify_all_admins IS
  'Fan-out to all admin users. Callable by any authenticated user; '
  'the type parameter is allowlisted so it can only be used for '
  'oversight-relevant events. Returns the number of notifications '
  'inserted.';
