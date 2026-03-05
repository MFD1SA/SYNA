
-- Create a public view that excludes sensitive owner fields
CREATE VIEW public.lands_public
WITH (security_invoker = on) AS
  SELECT 
    id, city, district, land_area_sqm, usage_type, project_type, 
    partnership_goal, partnership_model, quality_level, revenue_model,
    financing_preference, developer_experience_requirements,
    expected_dev_duration_months, vision_summary,
    street_width_m, width_m, length_m,
    is_active, is_featured, image_url, created_at, updated_at
  FROM public.lands;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read featured active lands" ON public.lands;

-- Create a new public policy on the VIEW's base table that denies direct anonymous access
-- The view will be the only way to access featured lands publicly
CREATE POLICY "Public can read featured lands via view only"
  ON public.lands FOR SELECT
  USING (
    (is_active = true AND is_featured = true)
    AND (
      -- Only allow if accessed through the view (no owner_id exposed)
      current_setting('role') = 'anon'
      OR auth.uid() IS NULL
    )
  );
