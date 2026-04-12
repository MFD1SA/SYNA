-- Migration: site_settings table + site-assets storage bucket + RLS policies
-- Purpose: Admin-managed hero image for homepage via site_settings table
-- Applied via Supabase MCP on 2026-04-11; this file documents the changes locally

-- ============================================================
-- 1. site_settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  key        TEXT        NOT NULL UNIQUE,
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID        REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- RLS: admin-only write
CREATE POLICY "Admin can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete site settings"
  ON public.site_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default hero_image row
INSERT INTO public.site_settings (key, value)
VALUES ('hero_image', '{"url": "", "alt_ar": "الرياض", "alt_en": "Riyadh"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2. site-assets storage bucket (public read, admin write)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read
CREATE POLICY "Public read site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

-- Storage RLS: admin upload
CREATE POLICY "Admin upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage RLS: admin update
CREATE POLICY "Admin update site assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage RLS: admin delete
CREATE POLICY "Admin delete site assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));
