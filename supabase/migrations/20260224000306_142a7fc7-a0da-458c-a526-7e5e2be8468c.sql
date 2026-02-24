
-- 1) Add owner_approved and partnership_model to lands
ALTER TABLE public.lands
  ADD COLUMN IF NOT EXISTS owner_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partnership_model TEXT CHECK (partnership_model IN ('equity_share', 'income_years', 'full_sale')) DEFAULT NULL;

-- 2) Create land_pulse_snapshots for DOMA Radius 900 AI cache
CREATE TABLE public.land_pulse_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  radius_m INTEGER NOT NULL DEFAULT 900,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pois_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_report_ar TEXT,
  ai_report_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_land_pulse_land_id ON public.land_pulse_snapshots(land_id);
CREATE INDEX idx_land_pulse_created ON public.land_pulse_snapshots(created_at DESC);

-- Enable RLS
ALTER TABLE public.land_pulse_snapshots ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage pulse snapshots"
ON public.land_pulse_snapshots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Verified developers can read snapshots for active lands
CREATE POLICY "Verified developers can read pulse snapshots"
ON public.land_pulse_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM developers d
    WHERE d.user_id = auth.uid()
    AND d.verification_status = 'verified'
  )
  AND EXISTS (
    SELECT 1 FROM lands l
    WHERE l.id = land_pulse_snapshots.land_id
    AND l.is_active = true
    AND l.owner_approved = true
  )
);

-- Land owners can read snapshots for their own lands
CREATE POLICY "Owners can read own land pulse snapshots"
ON public.land_pulse_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lands l
    WHERE l.id = land_pulse_snapshots.land_id
    AND l.owner_id = auth.uid()
  )
);
