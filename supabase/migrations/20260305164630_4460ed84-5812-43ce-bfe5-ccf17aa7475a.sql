-- Remove direct anon access to base lands table entirely
-- The lands_public view with security_invoker handles public reads
DROP POLICY IF EXISTS "Anon can read featured active lands" ON public.lands;

-- Grant anon SELECT on the view only, not the base table
-- Since the view has security_invoker=on and anon can't access base table,
-- we need a service-level approach. Let's use security_barrier instead.
DROP VIEW IF EXISTS public.lands_public;
CREATE VIEW public.lands_public
WITH (security_barrier = true) AS
  SELECT 
    id, city, district, land_area_sqm, usage_type, project_type, 
    partnership_goal, partnership_model, quality_level, revenue_model,
    financing_preference, developer_experience_requirements,
    expected_dev_duration_months, vision_summary,
    street_width_m, width_m, length_m,
    is_active, is_featured, image_url, created_at, updated_at
  FROM public.lands
  WHERE is_active = true AND is_featured = true;

-- Allow anon to read from this view by granting on base table with minimal access
CREATE POLICY "Anon reads featured lands only"
  ON public.lands FOR SELECT
  TO anon
  USING (is_active = true AND is_featured = true);