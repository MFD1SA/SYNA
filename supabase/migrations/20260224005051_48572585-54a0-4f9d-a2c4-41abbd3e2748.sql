
-- Allow admins to delete developers
CREATE POLICY "Admin can delete developers"
ON public.developers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
