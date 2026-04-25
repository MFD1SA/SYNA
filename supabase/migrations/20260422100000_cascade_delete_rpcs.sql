-- ═══════════════════════════════════════════════════════════════
-- Transactional cascade-delete RPCs (P1 — audit 2026-04-22)
-- ═══════════════════════════════════════════════════════════════
-- AdminDevelopers.handleDeleteDev was performing a 6-step delete
-- chain from the browser: deal_tasks → deal_meetings → deal_stages_log
-- → deal_logs → deals → deal_requests → developers → auth.user. Each
-- call was a separate transaction; if step 3 or 4 failed with an RLS
-- or FK error the DB was left with dangling deals or deal_requests
-- referencing a half-gone developer, and the admin would see a
-- confusing mid-flight error.
--
-- This migration wraps the cascade in a SECURITY DEFINER function
-- that runs inside a single transaction. If any statement fails the
-- whole cascade rolls back. We keep the same ordering of deletes —
-- parents last — and log one audit row at the end.
--
-- NOTE: the auth.users deletion still goes through the edge function
-- (supabase.auth.admin.deleteUser requires the service-role key; the
-- database function can't call it). The edge function is invoked
-- only AFTER this RPC returns success.
--
-- NOTE: We do NOT delete platform_content, target_companies, or
-- audit_logs rows — those are intentionally retained as historical
-- evidence of the developer's activity on the platform.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_delete_developer_cascade(
  _developer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deal_ids uuid[];
  v_actor uuid := auth.uid();
  v_actor_email text;
BEGIN
  -- Admin-only gate. has_role is SECURITY DEFINER itself and safe.
  IF NOT public.has_role(v_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required' USING ERRCODE = '42501';
  END IF;

  IF _developer_id IS NULL THEN
    RAISE EXCEPTION 'developer id is required';
  END IF;

  -- Capture actor email for audit row.
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor;

  -- Gather all deal ids owned by this developer so we can cascade
  -- their children in deterministic order (not all children have
  -- ON DELETE CASCADE defined at the FK level).
  SELECT COALESCE(array_agg(id), '{}'::uuid[])
    INTO v_deal_ids
    FROM public.deals
    WHERE developer_id = _developer_id;

  -- Children of deals: tables without explicit CASCADE still need
  -- manual deletion. The ones below have ON DELETE CASCADE already
  -- (deal_tasks, deal_meetings, deal_stages_log, deal_logs) but we
  -- keep the explicit deletes for clarity and to survive any future
  -- FK re-wire that removes the cascade clause.
  IF array_length(v_deal_ids, 1) IS NOT NULL THEN
    DELETE FROM public.deal_tasks       WHERE deal_id = ANY(v_deal_ids);
    DELETE FROM public.deal_meetings    WHERE deal_id = ANY(v_deal_ids);
    DELETE FROM public.deal_stages_log  WHERE deal_id = ANY(v_deal_ids);
    DELETE FROM public.deal_logs        WHERE deal_id = ANY(v_deal_ids);
    DELETE FROM public.deals            WHERE id     = ANY(v_deal_ids);
  END IF;

  -- deal_requests.developer_id has NO cascade — wipe explicitly.
  DELETE FROM public.deal_requests WHERE developer_id = _developer_id;

  -- Finally, the developer row itself.
  DELETE FROM public.developers WHERE id = _developer_id;

  -- Audit row — one aggregate entry so the cascade is traceable.
  INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
  VALUES (
    v_actor,
    v_actor_email,
    'cascade_delete',
    'developer',
    _developer_id::text,
    jsonb_build_object(
      'deals_deleted',       COALESCE(array_length(v_deal_ids, 1), 0),
      'cascade',             ARRAY['deal_tasks','deal_meetings','deal_stages_log','deal_logs','deals','deal_requests','developers']
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_developer_cascade(uuid) TO authenticated;

-- Symmetrically, an atomic cascade for owner deletion — today's
-- flow goes through the create-owner edge function which deletes
-- only the auth user; all lands owned by that user are orphaned.
-- This RPC soft-deletes the lands (and cascades into any deal_requests
-- that target those lands) BEFORE the auth user is removed.

CREATE OR REPLACE FUNCTION public.admin_soft_delete_owner_lands(
  _owner_user_id uuid
)
RETURNS TABLE(lands_soft_deleted int, deal_requests_deleted int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_land_ids uuid[];
  v_lands_count int := 0;
  v_reqs_count int := 0;
BEGIN
  IF NOT public.has_role(v_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required' USING ERRCODE = '42501';
  END IF;

  IF _owner_user_id IS NULL THEN
    RAISE EXCEPTION 'owner user id is required';
  END IF;

  SELECT COALESCE(array_agg(id), '{}'::uuid[]), COUNT(*)::int
    INTO v_land_ids, v_lands_count
    FROM public.lands
    WHERE owner_id = _owner_user_id
      AND deleted_at IS NULL;

  -- Soft-delete owned lands (preserve history; RLS + app filter hide them).
  UPDATE public.lands
     SET deleted_at = now(), is_active = false
   WHERE owner_id = _owner_user_id
     AND deleted_at IS NULL;

  -- Any active deal_requests against those lands should be closed:
  -- we can't leave them hanging pointing at a phantom owner.
  IF v_lands_count > 0 THEN
    WITH closed AS (
      UPDATE public.deal_requests
         SET current_phase     = 'closed_lost'::public.deal_phase,
             rejection_reason  = COALESCE(rejection_reason, 'owner account removed'),
             closed_at         = COALESCE(closed_at, now())
       WHERE land_id = ANY(v_land_ids)
         AND current_phase NOT IN ('closed_won', 'closed_lost')
       RETURNING 1
    )
    SELECT COUNT(*)::int INTO v_reqs_count FROM closed;
  END IF;

  INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
  SELECT v_actor, u.email, 'cascade_soft_delete', 'owner', _owner_user_id::text,
         jsonb_build_object(
           'lands_soft_deleted',    v_lands_count,
           'deal_requests_closed',  v_reqs_count
         )
    FROM auth.users u WHERE u.id = v_actor;

  RETURN QUERY SELECT v_lands_count, v_reqs_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_soft_delete_owner_lands(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- End of cascade-delete RPCs migration.
-- ═══════════════════════════════════════════════════════════════
