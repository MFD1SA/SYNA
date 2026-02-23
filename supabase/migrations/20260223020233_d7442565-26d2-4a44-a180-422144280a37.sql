
-- Add featured flag for lands to appear on homepage
ALTER TABLE public.lands ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Allow public (anonymous) to read featured active lands for homepage
CREATE POLICY "Anyone can read featured active lands"
ON public.lands
FOR SELECT
USING (is_active = true AND is_featured = true);
