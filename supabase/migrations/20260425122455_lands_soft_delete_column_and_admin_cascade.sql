-- ════════════════════════════════════════════════════════════════════════
-- Soft-delete infrastructure for lands / deal_requests / deals
-- ────────────────────────────────────────────────────────────────────────
-- Why: 14 production query call sites across Admin/Owner/CRM panels
-- already reference .is("deleted_at", null) and one update sets it,
-- but the column was never added to the DB. PostgREST returned 400
-- "column does not exist" for every load — the lands list, owner
-- dashboard, CRM browse, deal requests count, and developer dashboard
-- KPIs all silently failed. AdminOwners.handleDeleteOwner also called
-- a missing RPC `admin_soft_delete_owner_lands` whose error was
-- swallowed as a "warning" — leaving orphaned lands after every
-- owner deletion. This migration closes the gap.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Add deleted_at to the three tables (idempotent) ─────────────────────
alter table public.lands
  add column if not exists deleted_at timestamptz;

alter table public.deal_requests
  add column if not exists deleted_at timestamptz;

alter table public.deals
  add column if not exists deleted_at timestamptz;

-- 2. Partial indexes for the dominant WHERE deleted_at IS NULL pattern ──
create index if not exists idx_lands_active_alive
  on public.lands (created_at desc)
  where deleted_at is null;

create index if not exists idx_deal_requests_alive
  on public.deal_requests (developer_id, status)
  where deleted_at is null;

create index if not exists idx_deals_alive
  on public.deals (developer_id, current_stage)
  where deleted_at is null;

-- 3. Admin cascade RPC: soft-delete every land owned by a user, and
--    cancel any open deal_requests pointing at those lands. Used by
--    AdminOwners before the auth user is destroyed by create-owner.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.admin_soft_delete_owner_lands(_owner_user_id uuid)
returns table (lands_soft_deleted int, requests_cancelled int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lands_count int := 0;
  v_requests_count int := 0;
begin
  -- Authorization: only admins may invoke this cascade.
  if not (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) then
    raise exception 'admin_soft_delete_owner_lands: caller % is not admin', auth.uid();
  end if;

  -- Soft-delete the user's lands (both the deleted_at marker and is_active
  -- flag so the existing "Anon reads featured", "Verified developers can
  -- browse active lands" policies keep them invisible to public users).
  with updated as (
    update public.lands
    set deleted_at = coalesce(deleted_at, now()),
        is_active = false,
        updated_at = now()
    where owner_id = _owner_user_id
      and deleted_at is null
    returning id
  )
  select count(*) into v_lands_count from updated;

  -- Cancel any non-terminal deal_requests on those (now-deleted) lands.
  with cancelled as (
    update public.deal_requests
    set deleted_at = coalesce(deleted_at, now()),
        current_phase = 'closed_lost',
        rejection_reason = coalesce(rejection_reason, 'owner_account_deleted'),
        closed_at = coalesce(closed_at, now()),
        updated_at = now()
    where land_id in (select id from public.lands where owner_id = _owner_user_id)
      and current_phase not in ('closed_won', 'closed_lost')
      and deleted_at is null
    returning id
  )
  select count(*) into v_requests_count from cancelled;

  return query select v_lands_count, v_requests_count;
end;
$$;

grant execute on function public.admin_soft_delete_owner_lands(uuid) to authenticated;

-- 4. Trigger: prevent HARD delete of a land that still has active deals
--    referencing it. Code comments in AdminLands.confirmDeleteLand already
--    reference this trigger — codify the intent.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.fn_prevent_land_delete_with_active_deals()
returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from public.deals d
    where d.land_id = old.id
      and d.current_stage not in ('deal_closed', 'deal_cancelled')
  ) then
    raise exception 'Cannot delete land %: it has active deals. Soft-delete via deleted_at instead.', old.id
      using errcode = 'foreign_key_violation';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_land_delete_with_active_deals on public.lands;
create trigger trg_prevent_land_delete_with_active_deals
before delete on public.lands
for each row execute function public.fn_prevent_land_delete_with_active_deals();

-- 5. Backfill: any land where is_active=false today but has no deleted_at
--    is still resolvable on its owner's dashboard. We do NOT auto-mark
--    them deleted — admins decide via the AdminLands UI. This block is
--    intentionally empty to make that explicit.

-- Done. The 8 production files that already filter on .is("deleted_at", null)
-- now resolve correctly, and the AdminOwners delete cascade returns
-- structured counts instead of silently missing.
