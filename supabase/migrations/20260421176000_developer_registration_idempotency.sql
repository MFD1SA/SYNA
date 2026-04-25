-- ═══════════════════════════════════════════════════════════════
-- Developer registration idempotency
-- ═══════════════════════════════════════════════════════════════
-- Closes two gaps exposed by the QA audit:
--
--   1. `developers.user_id` had no UNIQUE constraint — a retry after
--      a partial edge-function failure (or a concurrent double-click
--      while the auth step was inflight) could create two rows for
--      the same auth user.
--
--   2. `developer_agreements` had no UNIQUE (user_id, agreement_type,
--      agreement_version) — the same retry story could produce two
--      v2.0 commission_agreement rows per user. The batch fetcher in
--      src/services/agreements.service.ts already dedups client-side,
--      but duplicates on the DB itself are a liability during audits.
--
-- Both constraints are added NOT VALID first to avoid blocking if any
-- historical duplicates exist, then we collapse duplicates and VALIDATE.
-- This idempotent pattern lets the migration re-run cleanly.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Collapse + enforce UNIQUE on developers.user_id ────────────
-- Keep the oldest developer row per user_id (earliest created_at wins,
-- tie-break on id). Any later duplicates lose their `id` → any rows in
-- downstream tables that FK to the losing developer.id would dangle,
-- so we update them to point at the keeper first.
DO $$
DECLARE
  _dup_count INT;
BEGIN
  SELECT COUNT(*) INTO _dup_count
  FROM (
    SELECT user_id
    FROM public.developers
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) d;

  IF _dup_count > 0 THEN
    RAISE NOTICE 'Collapsing % user_id duplicates in developers', _dup_count;

    -- Build a mapping: losing developer_id → keeper developer_id
    WITH ranked AS (
      SELECT id, user_id,
             ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY created_at ASC, id ASC
             ) AS rn
      FROM public.developers
    ),
    keepers AS (
      SELECT user_id, id AS keeper_id FROM ranked WHERE rn = 1
    ),
    losers AS (
      SELECT r.id AS loser_id, k.keeper_id
      FROM ranked r
      JOIN keepers k ON k.user_id = r.user_id
      WHERE r.rn > 1
    )
    -- Fix up every FK that references developers.id
    UPDATE public.deal_requests dr
    SET developer_id = l.keeper_id
    FROM losers l
    WHERE dr.developer_id = l.loser_id;

    -- developer_agreements.developer_id (ON DELETE SET NULL — optional)
    UPDATE public.developer_agreements da
    SET developer_id = l.keeper_id
    FROM (
      SELECT r.id AS loser_id, k.keeper_id
      FROM (
        SELECT id, user_id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS rn
        FROM public.developers
      ) r
      JOIN (
        SELECT user_id, id AS keeper_id
        FROM (
          SELECT id, user_id,
                 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS rn
          FROM public.developers
        ) s
        WHERE rn = 1
      ) k ON k.user_id = r.user_id
      WHERE r.rn > 1
    ) l
    WHERE da.developer_id = l.loser_id;

    -- Now drop the losers
    DELETE FROM public.developers d
    USING (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS rn
        FROM public.developers
      ) x
      WHERE rn > 1
    ) l
    WHERE d.id = l.id;
  END IF;
END $$;

ALTER TABLE public.developers
  DROP CONSTRAINT IF EXISTS developers_user_id_uniq;

ALTER TABLE public.developers
  ADD CONSTRAINT developers_user_id_uniq UNIQUE (user_id);

-- ─── 2. Collapse + enforce UNIQUE on developer_agreements ──────────
-- For each (user_id, agreement_type, agreement_version) triple, keep
-- the most recent (latest accepted_at, then latest created_at, then
-- largest id as final tie-breaker).
DO $$
DECLARE
  _dup_count INT;
BEGIN
  SELECT COUNT(*) INTO _dup_count
  FROM (
    SELECT user_id, agreement_type, agreement_version
    FROM public.developer_agreements
    GROUP BY user_id, agreement_type, agreement_version
    HAVING COUNT(*) > 1
  ) d;

  IF _dup_count > 0 THEN
    RAISE NOTICE 'Collapsing % agreement triples', _dup_count;

    DELETE FROM public.developer_agreements da
    USING (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY user_id, agreement_type, agreement_version
                 ORDER BY accepted_at DESC NULLS LAST,
                          created_at DESC,
                          id DESC
               ) AS rn
        FROM public.developer_agreements
      ) ranked
      WHERE rn > 1
    ) dups
    WHERE da.id = dups.id;
  END IF;
END $$;

ALTER TABLE public.developer_agreements
  DROP CONSTRAINT IF EXISTS developer_agreements_user_type_version_uniq;

ALTER TABLE public.developer_agreements
  ADD CONSTRAINT developer_agreements_user_type_version_uniq
  UNIQUE (user_id, agreement_type, agreement_version);

COMMENT ON CONSTRAINT developer_agreements_user_type_version_uniq
  ON public.developer_agreements IS
  'Guarantees a developer can only hold one row per agreement version. '
  'If a new version is rolled out, insert a new row with a new '
  'agreement_version; never mutate an existing accepted row.';

-- ─── 3. Index supports fast uniqueness check in register-developer ─
CREATE INDEX IF NOT EXISTS idx_developers_user_id
  ON public.developers (user_id);
