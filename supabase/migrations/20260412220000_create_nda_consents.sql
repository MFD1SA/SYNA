-- NDA consents table (per-land, per-developer)
-- Each developer must accept NDA for each specific land before submitting a deal request
CREATE TABLE public.nda_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  nda_version TEXT NOT NULL DEFAULT '1.0',
  nda_text_ar TEXT NOT NULL,
  nda_text_en TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_nda_per_user_land UNIQUE (user_id, land_id)
);

ALTER TABLE public.nda_consents ENABLE ROW LEVEL SECURITY;

-- Developer reads own NDA consents only
CREATE POLICY "Developer reads own NDA consents"
  ON public.nda_consents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Developer can insert NDA consent for themselves only (initial pending record)
CREATE POLICY "Developer inserts own NDA consent"
  ON public.nda_consents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- NO update policy for developers — updates happen only via Edge Function with service_role

-- Admin reads all NDA consents
CREATE POLICY "Admin reads all NDA consents"
  ON public.nda_consents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin manages all NDA consents
CREATE POLICY "Admin manages NDA consents"
  ON public.nda_consents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_nda_consents_user_id ON public.nda_consents(user_id);
CREATE INDEX idx_nda_consents_land_id ON public.nda_consents(land_id);
CREATE INDEX idx_nda_consents_user_land ON public.nda_consents(user_id, land_id);

-- TRIGGER: Prevent changing rejected status (terminal state)
CREATE OR REPLACE FUNCTION public.prevent_nda_rejection_reversal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'rejected' THEN
    RAISE EXCEPTION 'NDA rejection is terminal — cannot change status after rejection';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nda_rejection_terminal
  BEFORE UPDATE ON public.nda_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_nda_rejection_reversal();
