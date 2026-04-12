-- Phase 6: Identity Reveal System
-- Audit log for all identity reveals + DB function for reveal level computation
-- Enforces: owner data NEVER revealed to developer before final agreement

-- ============================================================
-- 1. Identity Reveal Log — audit every reveal event
-- ============================================================

CREATE TABLE public.identity_reveal_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id UUID NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL REFERENCES auth.users(id),
  viewer_role TEXT NOT NULL CHECK (viewer_role IN ('developer', 'owner', 'admin')),
  revealed_party TEXT NOT NULL CHECK (revealed_party IN ('developer', 'owner')),
  reveal_level TEXT NOT NULL CHECK (reveal_level IN ('anonymous', 'brand_visible', 'full')),
  fields_revealed TEXT[] NOT NULL DEFAULT '{}',
  trigger_event TEXT NOT NULL,
  current_phase TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_irl_deal_request ON public.identity_reveal_log(deal_request_id);
CREATE INDEX idx_irl_viewer ON public.identity_reveal_log(viewer_user_id);
CREATE INDEX idx_irl_created ON public.identity_reveal_log(created_at DESC);

-- ============================================================
-- 2. RLS for identity_reveal_log
-- ============================================================

ALTER TABLE public.identity_reveal_log ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin reads all reveal logs"
  ON public.identity_reveal_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin inserts reveal logs"
  ON public.identity_reveal_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Users can read their own reveal logs
CREATE POLICY "User reads own reveal logs"
  ON public.identity_reveal_log FOR SELECT
  USING (viewer_user_id = auth.uid());

-- ============================================================
-- 3. DB function: compute reveal level
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_reveal_level(
  p_phase TEXT,
  p_viewer_role TEXT,
  p_viewing TEXT  -- 'developer' or 'owner' (who is being viewed)
) RETURNS TEXT AS $$
BEGIN
  -- Terminal states: freeze at whatever was reached, no new reveals
  IF p_phase IN ('closed_lost', 'cancelled') THEN
    RETURN 'anonymous';
  END IF;

  -- Owner viewing developer
  IF p_viewer_role = 'owner' AND p_viewing = 'developer' THEN
    IF p_phase IN ('nda_pending', 'nda_developer_accepted') THEN
      RETURN 'anonymous';
    ELSIF p_phase IN ('nda_both_accepted', 'under_review', 'study_required') THEN
      RETURN 'brand_visible';
    ELSE
      RETURN 'anonymous';
    END IF;
  END IF;

  -- Developer viewing owner: ALWAYS anonymous until final agreement
  IF p_viewer_role = 'developer' AND p_viewing = 'owner' THEN
    RETURN 'anonymous';
  END IF;

  -- Admin viewing anyone: full
  IF p_viewer_role = 'admin' THEN
    RETURN 'full';
  END IF;

  RETURN 'anonymous';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
