-- Phase 5A: State Machine for deal_requests
-- Adds current_phase, NDA status tracking, rejection metadata, phase transition logging
-- Terminal states (closed_lost, cancelled) are irreversible at DB level

-- ============================================================
-- 1. Add new columns to deal_requests
-- ============================================================

ALTER TABLE public.deal_requests
  ADD COLUMN current_phase TEXT NOT NULL DEFAULT 'nda_developer_accepted'
    CHECK (current_phase IN (
      'nda_pending',
      'nda_developer_accepted',
      'nda_both_accepted',
      'under_review',
      'study_required',
      'closed_lost',
      'cancelled'
    )),
  ADD COLUMN developer_nda_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (developer_nda_status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN owner_nda_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (owner_nda_status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN identity_reveal_level TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (identity_reveal_level IN ('anonymous', 'brand_visible', 'full')),
  ADD COLUMN rejected_by UUID REFERENCES auth.users(id),
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN closed_at TIMESTAMPTZ;

-- ============================================================
-- 2. Backfill existing rows based on current status
-- ============================================================

-- Rejected requests → closed_lost
UPDATE public.deal_requests
SET current_phase = 'closed_lost', closed_at = updated_at
WHERE status = 'rejected'::public.request_status;

-- Approved requests → under_review (deal entity tracks the rest)
UPDATE public.deal_requests
SET current_phase = 'under_review'
WHERE status = 'approved'::public.request_status;

-- Info requested → under_review
UPDATE public.deal_requests
SET current_phase = 'under_review'
WHERE status = 'info_requested'::public.request_status;

-- Backfill owner_nda_status from nda_consents
UPDATE public.deal_requests dr
SET owner_nda_status = 'accepted'
FROM public.nda_consents nc, public.lands l
WHERE l.id = dr.land_id
  AND nc.land_id = dr.land_id
  AND nc.user_id = l.owner_id
  AND nc.actor_role = 'owner'
  AND nc.status = 'accepted';

-- Update identity_reveal_level where both NDAs accepted
UPDATE public.deal_requests
SET identity_reveal_level = 'brand_visible'
WHERE developer_nda_status = 'accepted' AND owner_nda_status = 'accepted';

-- Pending requests where owner NDA is accepted → nda_both_accepted
UPDATE public.deal_requests
SET current_phase = 'nda_both_accepted'
WHERE current_phase = 'nda_developer_accepted'
  AND owner_nda_status = 'accepted';

-- ============================================================
-- 3. Create phase transitions log table
-- ============================================================

CREATE TABLE public.deal_phase_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id UUID NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  from_phase TEXT NOT NULL,
  to_phase TEXT NOT NULL,
  triggered_by UUID NOT NULL REFERENCES auth.users(id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('developer', 'owner', 'admin', 'system')),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dpt_deal_request ON public.deal_phase_transitions(deal_request_id);
CREATE INDEX idx_dpt_created ON public.deal_phase_transitions(created_at DESC);

-- ============================================================
-- 4. DB trigger: prevent terminal state reversal
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_deal_terminal_phase_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_phase IN ('closed_lost', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot change phase of a terminated deal request (current: %)', OLD.current_phase;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_deal_terminal_phase_change
  BEFORE UPDATE OF current_phase ON public.deal_requests
  FOR EACH ROW
  WHEN (OLD.current_phase IS DISTINCT FROM NEW.current_phase)
  EXECUTE FUNCTION public.prevent_deal_terminal_phase_change();

-- ============================================================
-- 5. RLS for deal_phase_transitions
-- ============================================================

ALTER TABLE public.deal_phase_transitions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin reads all phase transitions"
  ON public.deal_phase_transitions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin inserts phase transitions"
  ON public.deal_phase_transitions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Developers read transitions for their own requests
CREATE POLICY "Developer reads own request transitions"
  ON public.deal_phase_transitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.developers d ON d.id = dr.developer_id
      WHERE dr.id = deal_phase_transitions.deal_request_id
        AND d.user_id = auth.uid()
    )
  );

-- Owners read transitions for requests on their lands
CREATE POLICY "Owner reads land request transitions"
  ON public.deal_phase_transitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.lands l ON l.id = dr.land_id
      WHERE dr.id = deal_phase_transitions.deal_request_id
        AND l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Index on current_phase for filtering
-- ============================================================

CREATE INDEX idx_deal_requests_current_phase ON public.deal_requests(current_phase);
