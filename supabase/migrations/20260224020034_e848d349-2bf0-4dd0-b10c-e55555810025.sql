
-- Table for admin team permissions (supervisors)
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_email text,
  display_name text,
  is_super_admin boolean NOT NULL DEFAULT false,
  perm_developers boolean NOT NULL DEFAULT false,
  perm_lands boolean NOT NULL DEFAULT false,
  perm_owners boolean NOT NULL DEFAULT false,
  perm_deals boolean NOT NULL DEFAULT false,
  perm_content boolean NOT NULL DEFAULT false,
  perm_ai boolean NOT NULL DEFAULT false,
  perm_audit_log boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage this table
CREATE POLICY "Admins can manage admin_permissions"
  ON public.admin_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_admin_permissions_updated_at
  BEFORE UPDATE ON public.admin_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
