
-- Add image_url column to lands table
ALTER TABLE public.lands ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for land images
INSERT INTO storage.buckets (id, name, public) VALUES ('land-images', 'land-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for land images
CREATE POLICY "Land images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'land-images');

-- Admin can upload land images
CREATE POLICY "Admins can upload land images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'land-images');

-- Admin can update land images
CREATE POLICY "Admins can update land images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'land-images');

-- Admin can delete land images
CREATE POLICY "Admins can delete land images"
ON storage.objects FOR DELETE
USING (bucket_id = 'land-images');
