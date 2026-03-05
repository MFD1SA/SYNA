-- Fix security definer view by adding security_invoker
DROP VIEW IF EXISTS public.lands_public;
CREATE VIEW public.lands_public
WITH (security_invoker = on, security_barrier = true) AS
  SELECT 
    id, city, district, land_area_sqm, usage_type, project_type, 
    partnership_goal, partnership_model, quality_level, revenue_model,
    financing_preference, developer_experience_requirements,
    expected_dev_duration_months, vision_summary,
    street_width_m, width_m, length_m,
    is_active, is_featured, image_url, created_at, updated_at
  FROM public.lands
  WHERE is_active = true AND is_featured = true;