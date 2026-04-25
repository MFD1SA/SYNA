-- ============================================================
-- Lands: server-side validation + soft-delete protection
--
-- Two Owner-panel P1 fixes rolled into one migration because they
-- both touch the same table:
--
-- 1. Validation CHECK constraints so the database rejects
--    nonsense values even if a client skips its own validation
--    (and so admins editing via the SQL console get the same
--    guardrails).
--
-- 2. Soft-delete: `deal_requests.land_id REFERENCES lands(id)
--    ON DELETE CASCADE` — hard-deleting a land blows away every
--    deal ever attached to it. Route deletes through a soft-delete
--    column and block hard deletes while any non-terminal deal
--    still references the land.
-- ============================================================

-- 1. Validation constraints.
--
-- We wrap each in DO blocks so the migration is re-runnable after
-- any future adjustment, and we use NOT VALID + VALIDATE CONSTRAINT
-- for anything that might reject existing rows: that gives us a
-- chance to surface bad data in a follow-up rather than failing the
-- deploy. For NEW values the checks apply immediately.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lands_area_positive_chk' AND conrelid = 'public.lands'::regclass
  ) THEN
    -- 1 sqm floor (nobody sells a plot smaller than a bathtub),
    -- 100 million sqm ceiling (~100 km² — larger than most Saudi
    -- districts; if someone claims more we want human review).
    ALTER TABLE public.lands
      ADD CONSTRAINT lands_area_positive_chk
      CHECK (land_area_sqm > 0 AND land_area_sqm <= 100000000) NOT VALID;
    ALTER TABLE public.lands VALIDATE CONSTRAINT lands_area_positive_chk;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lands_price_nonneg_chk' AND conrelid = 'public.lands'::regclass
  ) THEN
    ALTER TABLE public.lands
      ADD CONSTRAINT lands_price_nonneg_chk
      CHECK (
        (estimated_price_per_sqm IS NULL OR estimated_price_per_sqm >= 0)
        AND
        (estimated_total_value   IS NULL OR estimated_total_value   >= 0)
      ) NOT VALID;
    ALTER TABLE public.lands VALIDATE CONSTRAINT lands_price_nonneg_chk;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lands_dimensions_positive_chk' AND conrelid = 'public.lands'::regclass
  ) THEN
    ALTER TABLE public.lands
      ADD CONSTRAINT lands_dimensions_positive_chk
      CHECK (
        (length_m       IS NULL OR length_m       > 0)
        AND
        (width_m        IS NULL OR width_m        > 0)
        AND
        (street_width_m IS NULL OR street_width_m >= 0)
      ) NOT VALID;
    ALTER TABLE public.lands VALIDATE CONSTRAINT lands_dimensions_positive_chk;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lands_parcel_count_chk' AND conrelid = 'public.lands'::regclass
  ) THEN
    ALTER TABLE public.lands
      ADD CONSTRAINT lands_parcel_count_chk
      CHECK (parcel_count IS NULL OR parcel_count >= 1) NOT VALID;
    ALTER TABLE public.lands VALIDATE CONSTRAINT lands_parcel_count_chk;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lands_exit_percentage_chk' AND conrelid = 'public.lands'::regclass
  ) THEN
    ALTER TABLE public.lands
      ADD CONSTRAINT lands_exit_percentage_chk
      CHECK (exit_percentage IS NULL OR (exit_percentage >= 0 AND exit_percentage <= 100)) NOT VALID;
    ALTER TABLE public.lands VALIDATE CONSTRAINT lands_exit_percentage_chk;
  END IF;
END $$;

-- Geographic bounds for the Kingdom (covers all of Saudi Arabia
-- plus a safety margin). Rejects 0,0 placeholder and copy-paste
-- errors like swapping lat/lng.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lands_geo_bounds_chk' AND conrelid = 'public.lands'::regclass
  ) THEN
    ALTER TABLE public.lands
      ADD CONSTRAINT lands_geo_bounds_chk
      CHECK (
        (exact_location_lat IS NULL AND exact_location_lng IS NULL)
        OR
        (
          exact_location_lat IS NOT NULL AND exact_location_lng IS NOT NULL
          AND exact_location_lat BETWEEN 15.0 AND 33.0
          AND exact_location_lng BETWEEN 33.0 AND 56.0
        )
      ) NOT VALID;
    -- DO NOT VALIDATE on legacy rows — some pre-existing records
    -- may have placeholder coordinates. Admin can clean those up
    -- and run `ALTER TABLE lands VALIDATE CONSTRAINT lands_geo_bounds_chk`
    -- as a follow-up.
  END IF;
END $$;

-- 2. Soft-delete column + guard trigger.
ALTER TABLE public.lands
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_lands_deleted_at
  ON public.lands (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Trigger: prevent hard-delete while any non-terminal deal_request
-- exists for this land. Terminal = closed_won / closed_lost /
-- cancelled. Admin can still hard-delete by first cancelling all
-- open deals; the trigger surfaces the exact count so the caller
-- knows what needs cleaning up.
CREATE OR REPLACE FUNCTION public.prevent_land_delete_with_active_deals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _active_count INT;
BEGIN
  SELECT COUNT(*) INTO _active_count
  FROM public.deal_requests
  WHERE land_id = OLD.id
    AND current_phase NOT IN ('closed_won', 'closed_lost', 'cancelled');

  IF _active_count > 0 THEN
    RAISE EXCEPTION
      'Cannot delete land %: % active deal_request(s) still reference it. '
      'Close or cancel them first, or soft-delete by setting deleted_at.',
      OLD.id, _active_count
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_land_delete_with_active_deals ON public.lands;
CREATE TRIGGER trg_prevent_land_delete_with_active_deals
  BEFORE DELETE ON public.lands
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_land_delete_with_active_deals();

COMMENT ON COLUMN public.lands.deleted_at IS
  'Soft-delete timestamp. NULL = active. Client queries should filter '
  'deleted_at IS NULL for the owner/public views; admin lists can opt in '
  'to include soft-deleted rows.';

COMMENT ON FUNCTION public.prevent_land_delete_with_active_deals() IS
  'BEFORE DELETE trigger on lands: blocks hard-delete while any '
  'non-terminal deal_requests reference the land, preventing the '
  'ON DELETE CASCADE from wiping deal history.';
