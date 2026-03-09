-- Add missing developer registration fields
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS contact_person_name text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS project_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_cities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_profile_url text;

CREATE INDEX IF NOT EXISTS idx_developers_city ON public.developers (city);
CREATE INDEX IF NOT EXISTS idx_developers_project_types ON public.developers USING GIN (project_types);
CREATE INDEX IF NOT EXISTS idx_developers_target_cities ON public.developers USING GIN (target_cities);