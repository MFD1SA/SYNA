-- Phase 3: Brokerage license fields on lands + brokerage contracts table

-- 1. Add license fields to lands table
ALTER TABLE public.lands
  ADD COLUMN IF NOT EXISTS brokerage_license_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS brokerage_license_date DATE,
  ADD COLUMN IF NOT EXISTS brokerage_license_expiry DATE;

-- 2. Create brokerage contracts table
CREATE TABLE public.brokerage_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  contract_file_url TEXT,
  contract_date DATE,
  contract_expiry DATE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 2.50,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brokerage_contracts ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Admin full access
CREATE POLICY "Admin manages brokerage contracts"
  ON public.brokerage_contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. RLS: Owner reads own contracts only
CREATE POLICY "Owner reads own brokerage contracts"
  ON public.brokerage_contracts FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- 5. NO policy for developers = zero access

-- 6. Indexes
CREATE INDEX idx_brokerage_contracts_land_id ON public.brokerage_contracts(land_id);
CREATE INDEX idx_brokerage_contracts_owner_id ON public.brokerage_contracts(owner_id);
