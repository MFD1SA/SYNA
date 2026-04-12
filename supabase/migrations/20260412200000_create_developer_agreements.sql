-- Developer commission agreements table
-- Stores the legally binding commission agreement signed during registration
CREATE TABLE public.developer_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  agreement_type TEXT NOT NULL DEFAULT 'commission_agreement',
  agreement_version TEXT NOT NULL DEFAULT 'v1.0',
  agreement_text_ar TEXT NOT NULL,
  agreement_text_en TEXT NOT NULL,
  commission_brokerage DECIMAL(5,2) NOT NULL DEFAULT 2.50,
  commission_operational DECIMAL(5,2) NOT NULL DEFAULT 0.50,
  commission_total DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developer reads own agreements"
  ON public.developer_agreements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Developer inserts own agreement"
  ON public.developer_agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin reads all agreements"
  ON public.developer_agreements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manages agreements"
  ON public.developer_agreements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_developer_agreements_user_id ON public.developer_agreements(user_id);
