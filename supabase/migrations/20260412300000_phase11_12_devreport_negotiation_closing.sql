-- Phase 11+12: Smart Developer Report + Negotiation + Deal Closing
-- Adds developer_reports, negotiation_rounds, deal_closings tables
-- Expands current_phase CHECK to include negotiation/closing phases

-- ============================================================
-- 1. Expand current_phase CHECK constraint (21 → 24 phases)
-- ============================================================

ALTER TABLE public.deal_requests DROP CONSTRAINT IF EXISTS deal_requests_current_phase_check;
ALTER TABLE public.deal_requests ADD CONSTRAINT deal_requests_current_phase_check
  CHECK (current_phase IN (
    'nda_pending', 'nda_developer_accepted', 'nda_both_accepted',
    'under_review', 'study_required',
    'study_submitted', 'study_under_review', 'study_changes_requested',
    'study_resubmitted', 'study_approved', 'study_rejected',
    'meeting_proposed', 'meeting_confirmed', 'meeting_completed',
    'report_pending_approval', 'report_approved', 'report_rejected',
    'report_changes_requested', 'report_expired',
    'negotiation_active', 'final_approval', 'closed_won',
    'closed_lost', 'cancelled'
  ));

-- ============================================================
-- 2. developer_reports — smart developer profile reports
-- ============================================================

CREATE TABLE IF NOT EXISTS public.developer_reports (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id   UUID        REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  developer_id      UUID        NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  requested_by      UUID        NOT NULL REFERENCES auth.users(id),
  status            TEXT        NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
  report_data       JSONB,
  cache_key         TEXT,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_developer    ON public.developer_reports(developer_id);
CREATE INDEX IF NOT EXISTS idx_dr_deal_request ON public.developer_reports(deal_request_id);
CREATE INDEX IF NOT EXISTS idx_dr_status       ON public.developer_reports(status);
CREATE INDEX IF NOT EXISTS idx_dr_cache_key    ON public.developer_reports(cache_key);

ALTER TABLE public.developer_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='developer_reports'
      AND policyname='Admin full access to developer reports'
  ) THEN
    CREATE POLICY "Admin full access to developer reports"
      ON public.developer_reports FOR ALL
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='developer_reports'
      AND policyname='Owner reads own developer reports'
  ) THEN
    CREATE POLICY "Owner reads own developer reports"
      ON public.developer_reports FOR SELECT
      USING (requested_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='developer_reports'
      AND policyname='Owner inserts own developer reports'
  ) THEN
    CREATE POLICY "Owner inserts own developer reports"
      ON public.developer_reports FOR INSERT
      WITH CHECK (requested_by = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 3. negotiation_rounds — structured negotiation tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.negotiation_rounds (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id   UUID        NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  round_number      INT         NOT NULL DEFAULT 1,
  initiated_by      UUID        NOT NULL REFERENCES auth.users(id),
  initiator_role    TEXT        NOT NULL
    CHECK (initiator_role IN ('owner', 'developer', 'admin')),
  offer_summary     TEXT        NOT NULL,
  proposed_terms    JSONB       NOT NULL DEFAULT '{}',
  attachments       JSONB       DEFAULT '[]',
  response_decision TEXT
    CHECK (response_decision IN ('accepted', 'rejected', 'counter_offer')),
  response_notes    TEXT,
  responded_by      UUID        REFERENCES auth.users(id),
  responder_role    TEXT
    CHECK (responder_role IN ('owner', 'developer', 'admin')),
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nr_deal_request ON public.negotiation_rounds(deal_request_id);
CREATE INDEX IF NOT EXISTS idx_nr_round        ON public.negotiation_rounds(deal_request_id, round_number);

ALTER TABLE public.negotiation_rounds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='negotiation_rounds'
      AND policyname='Admin full access to negotiation rounds'
  ) THEN
    CREATE POLICY "Admin full access to negotiation rounds"
      ON public.negotiation_rounds FOR ALL
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='negotiation_rounds'
      AND policyname='Parties read own negotiation rounds'
  ) THEN
    CREATE POLICY "Parties read own negotiation rounds"
      ON public.negotiation_rounds FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          LEFT JOIN public.lands l ON l.id = dr.land_id
          LEFT JOIN public.developers d ON d.id = dr.developer_id
          WHERE dr.id = negotiation_rounds.deal_request_id
            AND (l.owner_id = auth.uid() OR d.user_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='negotiation_rounds'
      AND policyname='Parties insert negotiation rounds'
  ) THEN
    CREATE POLICY "Parties insert negotiation rounds"
      ON public.negotiation_rounds FOR INSERT
      WITH CHECK (initiated_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='negotiation_rounds'
      AND policyname='Parties update negotiation rounds'
  ) THEN
    CREATE POLICY "Parties update negotiation rounds"
      ON public.negotiation_rounds FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          LEFT JOIN public.lands l ON l.id = dr.land_id
          LEFT JOIN public.developers d ON d.id = dr.developer_id
          WHERE dr.id = negotiation_rounds.deal_request_id
            AND (l.owner_id = auth.uid() OR d.user_id = auth.uid())
        )
      );
  END IF;
END $$;

-- ============================================================
-- 4. deal_closings — final deal outcome and commission record
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deal_closings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id     UUID        NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE UNIQUE,
  outcome             TEXT        NOT NULL
    CHECK (outcome IN ('closed_won', 'closed_lost')),
  commission_rate     NUMERIC(5,2),
  commission_type     TEXT
    CHECK (commission_type IN ('percentage', 'fixed', 'hybrid')),
  commission_reference TEXT,
  commission_approved BOOLEAN     NOT NULL DEFAULT false,
  final_terms         JSONB       DEFAULT '{}',
  approved_by         UUID        REFERENCES auth.users(id),
  approved_at         TIMESTAMPTZ,
  closing_notes       TEXT,
  legal_notes         TEXT,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_deal_request ON public.deal_closings(deal_request_id);
CREATE INDEX IF NOT EXISTS idx_dc_outcome      ON public.deal_closings(outcome);

ALTER TABLE public.deal_closings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='deal_closings'
      AND policyname='Admin full access to deal closings'
  ) THEN
    CREATE POLICY "Admin full access to deal closings"
      ON public.deal_closings FOR ALL
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='deal_closings'
      AND policyname='Parties read own deal closings'
  ) THEN
    CREATE POLICY "Parties read own deal closings"
      ON public.deal_closings FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          LEFT JOIN public.lands l ON l.id = dr.land_id
          LEFT JOIN public.developers d ON d.id = dr.developer_id
          WHERE dr.id = deal_closings.deal_request_id
            AND (l.owner_id = auth.uid() OR d.user_id = auth.uid())
        )
      );
  END IF;
END $$;
