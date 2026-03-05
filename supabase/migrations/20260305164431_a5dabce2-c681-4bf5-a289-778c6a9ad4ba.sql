-- Fix contact_submissions: recreate SELECT policy as PERMISSIVE for admins only
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can read contact submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix lands: replace the current public policy with a proper anon-only policy
DROP POLICY IF EXISTS "Public can read featured lands via view only" ON public.lands;
CREATE POLICY "Anon can read featured active lands"
  ON public.lands FOR SELECT
  TO anon
  USING (is_active = true AND is_featured = true);