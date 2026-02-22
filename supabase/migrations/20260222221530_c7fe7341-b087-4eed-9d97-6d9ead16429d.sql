
-- =============================================
-- PHASE 1: NEW ENUMS
-- =============================================
CREATE TYPE public.tenant_role AS ENUM ('owner', 'manager', 'staff', 'viewer');
CREATE TYPE public.receivable_status AS ENUM ('pending', 'paid', 'overdue', 'partial');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.unit_status AS ENUM ('vacant', 'occupied', 'reserved', 'maintenance');
CREATE TYPE public.property_type AS ENUM ('residential', 'commercial', 'under_construction');

-- =============================================
-- PHASE 2: TENANTS TABLE
-- =============================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  currency TEXT NOT NULL DEFAULT 'SAR',
  language TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 3: TENANT MEMBERS TABLE
-- =============================================
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 4: HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role tenant_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  )
$$;

-- =============================================
-- PHASE 5: ADD TENANT_ID TO EXISTING TABLES
-- =============================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS property_type property_type NOT NULL DEFAULT 'commercial';

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS status unit_status NOT NULL DEFAULT 'vacant';
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS unit_number TEXT;

ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS responsible_employee UUID;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;

-- =============================================
-- PHASE 6: RECEIVABLES TABLE
-- =============================================
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  paid_date DATE,
  status receivable_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 7: MAINTENANCE TICKETS TABLE
-- =============================================
CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 8: ATTACHMENTS TABLE
-- =============================================
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 9: STORAGE BUCKET FOR ATTACHMENTS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PHASE 10: RLS POLICIES - TENANTS
-- =============================================
CREATE POLICY "Members can read own tenant"
  ON public.tenants FOR SELECT
  USING (public.is_tenant_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can update tenant"
  ON public.tenants FOR UPDATE
  USING (public.has_tenant_role(auth.uid(), id, 'owner') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 11: RLS POLICIES - TENANT_MEMBERS
-- =============================================
CREATE POLICY "Members can read tenant members"
  ON public.tenant_members FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage members"
  ON public.tenant_members FOR ALL
  USING (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 12: UPDATE EXISTING TABLE RLS - PROJECTS
-- =============================================
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Tenant members can read projects"
  ON public.projects FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant members can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Tenant members can update projects"
  ON public.projects FOR UPDATE
  USING (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant members can delete projects"
  ON public.projects FOR DELETE
  USING (
    (tenant_id IS NOT NULL AND (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'manager')))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- PHASE 13: UPDATE EXISTING TABLE RLS - UNITS
-- =============================================
DROP POLICY IF EXISTS "Users can read own units" ON public.units;
DROP POLICY IF EXISTS "Users can insert own units" ON public.units;
DROP POLICY IF EXISTS "Users can update own units" ON public.units;
DROP POLICY IF EXISTS "Users can delete own units" ON public.units;

CREATE POLICY "Tenant members can read units"
  ON public.units FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant members can insert units"
  ON public.units FOR INSERT
  WITH CHECK (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Tenant members can update units"
  ON public.units FOR UPDATE
  USING (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant members can delete units"
  ON public.units FOR DELETE
  USING (
    (tenant_id IS NOT NULL AND (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'manager')))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- PHASE 14: UPDATE EXISTING TABLE RLS - LEASES
-- =============================================
DROP POLICY IF EXISTS "Users can read own leases" ON public.leases;
DROP POLICY IF EXISTS "Users can insert own leases" ON public.leases;
DROP POLICY IF EXISTS "Users can update own leases" ON public.leases;
DROP POLICY IF EXISTS "Users can delete own leases" ON public.leases;

CREATE POLICY "Tenant members can read leases"
  ON public.leases FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant members can insert leases"
  ON public.leases FOR INSERT
  WITH CHECK (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Tenant members can update leases"
  ON public.leases FOR UPDATE
  USING (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant members can delete leases"
  ON public.leases FOR DELETE
  USING (
    (tenant_id IS NOT NULL AND (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'manager')))
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- PHASE 15: RLS - RECEIVABLES
-- =============================================
CREATE POLICY "Tenant members can read receivables"
  ON public.receivables FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant members can insert receivables"
  ON public.receivables FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'));

CREATE POLICY "Tenant members can update receivables"
  ON public.receivables FOR UPDATE
  USING (public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'));

CREATE POLICY "Tenant members can delete receivables"
  ON public.receivables FOR DELETE
  USING (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'manager') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 16: RLS - MAINTENANCE TICKETS
-- =============================================
CREATE POLICY "Tenant members can read tickets"
  ON public.maintenance_tickets FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant members can insert tickets"
  ON public.maintenance_tickets FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'));

CREATE POLICY "Tenant members can update tickets"
  ON public.maintenance_tickets FOR UPDATE
  USING (public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'));

CREATE POLICY "Tenant members can delete tickets"
  ON public.maintenance_tickets FOR DELETE
  USING (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'manager') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 17: RLS - ATTACHMENTS
-- =============================================
CREATE POLICY "Tenant members can read attachments"
  ON public.attachments FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant members can insert attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'));

CREATE POLICY "Tenant members can delete attachments"
  ON public.attachments FOR DELETE
  USING (public.is_tenant_member(auth.uid(), tenant_id) AND NOT public.has_tenant_role(auth.uid(), tenant_id, 'viewer'));

-- =============================================
-- PHASE 18: STORAGE RLS
-- =============================================
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- =============================================
-- PHASE 19: INSERT FOR NEW TENANT ON REGISTRATION
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_tenant_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
  _sub_type TEXT;
BEGIN
  _sub_type := COALESCE(NEW.raw_user_meta_data->>'subscription_type', 'individual');
  
  -- Only create tenant for non-individual subscriptions or if explicitly requested
  IF _sub_type != 'individual' THEN
    INSERT INTO public.tenants (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'full_name', NEW.email))
    RETURNING id INTO _tenant_id;
    
    INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (_tenant_id, NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_registration();
