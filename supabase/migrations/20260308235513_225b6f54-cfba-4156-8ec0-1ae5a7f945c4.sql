-- Tighten permissive contact_submissions insert policy to satisfy linter

DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO public
WITH CHECK (
  length(btrim(name)) > 0
  AND length(btrim(message)) > 0
  AND length(btrim(email)) > 5
  AND position('@' in email) > 1
  AND length(email) <= 255
);