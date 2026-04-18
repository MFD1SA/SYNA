-- =============================================================================
-- Phase 1 — Gallery support + High-Control roles + is_high_control() helper
-- =============================================================================
-- Goals:
--   1. Add gallery_urls[] to lands so owners can showcase multiple images.
--      Stored as public URLs from `land-images` bucket (already public-read).
--   2. Extend app_role enum with `supervisor` and `specialist` — together with
--      `admin` they form the "High Control" monitoring layer.
--   3. Add is_high_control() SECURITY DEFINER helper used by future RLS and
--      monitoring views.
-- =============================================================================

-- 1) gallery_urls -------------------------------------------------------------
ALTER TABLE public.lands
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.lands.gallery_urls IS
  'Public URLs to additional showcase images in the land-images bucket. '
  'Cover image lives on image_url. Max ~10 entries enforced at app layer.';

-- 2) Extend app_role enum ------------------------------------------------------
-- Postgres requires enum additions in their own statement; use IF NOT EXISTS
-- so re-running the migration is idempotent.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'specialist';

-- 3) is_high_control(user) -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_high_control(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'supervisor', 'specialist')
  )
$$;

COMMENT ON FUNCTION public.is_high_control(UUID) IS
  'True when the user is admin, supervisor, or specialist — i.e. part of the '
  'High Control monitoring layer. Use in RLS policies instead of duplicating '
  'has_role() OR chains.';
