
-- Add new columns to lands table for enhanced submission workflow
ALTER TABLE public.lands
  ADD COLUMN IF NOT EXISTS deed_date date,
  ADD COLUMN IF NOT EXISTS brokerage_license_number text,
  ADD COLUMN IF NOT EXISTS parcel_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS land_boundaries text,
  ADD COLUMN IF NOT EXISTS street_info text,
  ADD COLUMN IF NOT EXISTS project_model text DEFAULT 'development_partnership',
  ADD COLUMN IF NOT EXISTS development_subtype text,
  ADD COLUMN IF NOT EXISTS contribution_model text,
  ADD COLUMN IF NOT EXISTS exit_percentage numeric,
  ADD COLUMN IF NOT EXISTS estimated_price_per_sqm numeric,
  ADD COLUMN IF NOT EXISTS estimated_total_value numeric,
  ADD COLUMN IF NOT EXISTS deed_file_url text,
  ADD COLUMN IF NOT EXISTS kroki_file_url text,
  ADD COLUMN IF NOT EXISTS additional_docs_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submission_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS legal_acknowledgment_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_acknowledgment_date timestamptz,
  ADD COLUMN IF NOT EXISTS platform_fee_acknowledged boolean DEFAULT false;

-- Create storage bucket for land documents (deed, kroki, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('land-documents', 'land-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for land-documents bucket
CREATE POLICY "Owners can upload land documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'land-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can read own land documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'land-documents' AND (
  (auth.uid())::text = (storage.foldername(name))[1]
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
));

CREATE POLICY "Admins can manage all land documents"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'land-documents' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
