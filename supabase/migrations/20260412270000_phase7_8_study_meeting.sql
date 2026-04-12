-- Phase 7+8: Study System + Meeting System
-- Adds deal_studies, deal_request_meetings tables
-- Expands current_phase CHECK to include study + meeting sub-phases

-- ============================================================
-- 1. Expand current_phase CHECK constraint
-- ============================================================

ALTER TABLE public.deal_requests DROP CONSTRAINT IF EXISTS deal_requests_current_phase_check;
ALTER TABLE public.deal_requests ADD CONSTRAINT deal_requests_current_phase_check
  CHECK (current_phase IN (
    'nda_pending', 'nda_developer_accepted', 'nda_both_accepted',
    'under_review', 'study_required',
    'study_submitted', 'study_under_review', 'study_changes_requested',
    'study_resubmitted', 'study_approved', 'study_rejected',
    'meeting_proposed', 'meeting_confirmed', 'meeting_completed',
    'closed_lost', 'cancelled'
  ));

-- ============================================================
-- 2. deal_studies — versioned feasibility studies
-- ============================================================

CREATE TABLE public.deal_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id UUID NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  summary TEXT,
  file_url TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'changes_requested', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ds_deal_request ON public.deal_studies(deal_request_id);
CREATE INDEX idx_ds_status ON public.deal_studies(status);
CREATE INDEX idx_ds_created ON public.deal_studies(created_at DESC);

-- RLS
ALTER TABLE public.deal_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to studies"
  ON public.deal_studies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Developer manages own studies"
  ON public.deal_studies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.developers d ON d.id = dr.developer_id
      WHERE dr.id = deal_studies.deal_request_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner reads studies for their lands"
  ON public.deal_studies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.lands l ON l.id = dr.land_id
      WHERE dr.id = deal_studies.deal_request_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owner updates study status"
  ON public.deal_studies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.lands l ON l.id = dr.land_id
      WHERE dr.id = deal_studies.deal_request_id AND l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. deal_request_meetings — meeting proposals and tracking
-- ============================================================

CREATE TABLE public.deal_request_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id UUID NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES auth.users(id),
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  meeting_link TEXT,
  room_id TEXT DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'reschedule_requested', 'rescheduled', 'cancelled', 'completed', 'no_show')),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  reschedule_count INT NOT NULL DEFAULT 0,
  reschedule_reason TEXT,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_deal_request ON public.deal_request_meetings(deal_request_id);
CREATE INDEX idx_dm_status ON public.deal_request_meetings(status);
CREATE INDEX idx_dm_proposed_date ON public.deal_request_meetings(proposed_date);

-- RLS
ALTER TABLE public.deal_request_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to meetings"
  ON public.deal_request_meetings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Developer reads and updates own meetings"
  ON public.deal_request_meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.developers d ON d.id = dr.developer_id
      WHERE dr.id = deal_request_meetings.deal_request_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner manages meetings for their lands"
  ON public.deal_request_meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_requests dr
      INNER JOIN public.lands l ON l.id = dr.land_id
      WHERE dr.id = deal_request_meetings.deal_request_id AND l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Storage bucket for study files
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-studies', 'deal-studies', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users upload study files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deal-studies' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users read study files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deal-studies' AND auth.role() = 'authenticated');
