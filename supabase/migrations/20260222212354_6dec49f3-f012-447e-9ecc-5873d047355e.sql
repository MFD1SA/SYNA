
-- Update RLS policies for projects
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (
    (auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (
    (auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role)
  );

-- Update RLS policies for units
DROP POLICY IF EXISTS "Users can delete own units" ON public.units;
CREATE POLICY "Users can delete own units" ON public.units
  FOR DELETE USING (
    (auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can update own units" ON public.units;
CREATE POLICY "Users can update own units" ON public.units
  FOR UPDATE USING (
    (auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can insert own units" ON public.units;
CREATE POLICY "Users can insert own units" ON public.units
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role)
  );

-- Update RLS policies for leases
DROP POLICY IF EXISTS "Users can delete own leases" ON public.leases;
CREATE POLICY "Users can delete own leases" ON public.leases
  FOR DELETE USING (
    (auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can update own leases" ON public.leases;
CREATE POLICY "Users can update own leases" ON public.leases
  FOR UPDATE USING (
    (auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can insert own leases" ON public.leases;
CREATE POLICY "Users can insert own leases" ON public.leases
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND NOT has_role(auth.uid(), 'viewer'::app_role)
  );
