-- Phase 9+10: Meeting Reports + Email Log
-- Adds meeting_reports, report_approvals, email_log tables
-- Expands current_phase CHECK to include report sub-phases

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
    'report_pending_approval', 'report_approved', 'report_rejected',
    'report_changes_requested', 'report_expired',
    'closed_lost', 'cancelled'
  ));

-- ============================================================
-- 2. meeting_reports — post-meeting report with approval lifecycle
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meeting_reports (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_request_id   UUID        NOT NULL REFERENCES public.deal_requests(id) ON DELETE CASCADE,
  meeting_id        UUID        NOT NULL REFERENCES public.deal_request_meetings(id) ON DELETE CASCADE,
  created_by        UUID        NOT NULL REFERENCES auth.users(id),
  version           INT         NOT NULL DEFAULT 1,
  summary           TEXT        NOT NULL,
  outcome           TEXT        NOT NULL
    CHECK (outcome IN ('positive', 'negative', 'needs_followup', 'needs_further_study', 'needs_modification')),
  action_items      JSONB       NOT NULL DEFAULT '[]',
  responsibilities  JSONB       NOT NULL DEFAULT '[]',
  deadlines         JSONB       NOT NULL DEFAULT '[]',
  additional_requests TEXT,
  next_steps        TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'partially_approved', 'fully_approved', 'rejected', 'changes_requested', 'expired')),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  reminder_sent     BOOLEAN     NOT NULL DEFAULT false,
  reminder_sent_at  TIMESTAMPTZ,
  expired_processed BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mr_deal_request ON public.meeting_reports(deal_request_id);
CREATE INDEX IF NOT EXISTS idx_mr_meeting      ON public.meeting_reports(meeting_id);
CREATE INDEX IF NOT EXISTS idx_mr_status       ON public.meeting_reports(status);
CREATE INDEX IF NOT EXISTS idx_mr_expires_at   ON public.meeting_reports(expires_at);

-- RLS
ALTER TABLE public.meeting_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meeting_reports'
      AND policyname = 'Admin full access to meeting reports'
  ) THEN
    CREATE POLICY "Admin full access to meeting reports"
      ON public.meeting_reports FOR ALL
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meeting_reports'
      AND policyname = 'Developer reads own meeting reports'
  ) THEN
    CREATE POLICY "Developer reads own meeting reports"
      ON public.meeting_reports FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          INNER JOIN public.developers d ON d.id = dr.developer_id
          WHERE dr.id = meeting_reports.deal_request_id AND d.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meeting_reports'
      AND policyname = 'Owner reads own meeting reports'
  ) THEN
    CREATE POLICY "Owner reads own meeting reports"
      ON public.meeting_reports FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          INNER JOIN public.lands l ON l.id = dr.land_id
          WHERE dr.id = meeting_reports.deal_request_id AND l.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meeting_reports'
      AND policyname = 'Owner updates own meeting reports'
  ) THEN
    CREATE POLICY "Owner updates own meeting reports"
      ON public.meeting_reports FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.deal_requests dr
          INNER JOIN public.lands l ON l.id = dr.land_id
          WHERE dr.id = meeting_reports.deal_request_id AND l.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- 3. report_approvals — per-stakeholder approval decisions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_approvals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID        NOT NULL REFERENCES public.meeting_reports(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  role        TEXT        NOT NULL
    CHECK (role IN ('owner', 'developer', 'admin')),
  decision    TEXT        NOT NULL
    CHECK (decision IN ('approved', 'rejected', 'changes_requested')),
  notes       TEXT,
  decided_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ra_report  ON public.report_approvals(report_id);
CREATE INDEX IF NOT EXISTS idx_ra_user    ON public.report_approvals(user_id);

-- RLS
ALTER TABLE public.report_approvals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_approvals'
      AND policyname = 'Admin full access to report approvals'
  ) THEN
    CREATE POLICY "Admin full access to report approvals"
      ON public.report_approvals FOR ALL
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_approvals'
      AND policyname = 'Users can insert their own report approvals'
  ) THEN
    CREATE POLICY "Users can insert their own report approvals"
      ON public.report_approvals FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_approvals'
      AND policyname = 'Users can read their own report approvals'
  ) THEN
    CREATE POLICY "Users can read their own report approvals"
      ON public.report_approvals FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 4. email_log — outbound email queue and audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type          TEXT        NOT NULL,
  recipient_email     TEXT        NOT NULL,
  recipient_user_id   UUID        REFERENCES auth.users(id),
  subject             TEXT        NOT NULL,
  body_preview        TEXT,
  status              TEXT        NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed', 'bounced')),
  attempts            INT         NOT NULL DEFAULT 0,
  max_attempts        INT         NOT NULL DEFAULT 3,
  last_attempt_at     TIMESTAMPTZ,
  next_retry_at       TIMESTAMPTZ,
  error               TEXT,
  related_entity_type TEXT,
  related_entity_id   UUID,
  metadata            JSONB                 DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_el_event_type          ON public.email_log(event_type);
CREATE INDEX IF NOT EXISTS idx_el_status              ON public.email_log(status);
CREATE INDEX IF NOT EXISTS idx_el_related_entity      ON public.email_log(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_el_recipient_user_id   ON public.email_log(recipient_user_id);

-- RLS
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_log'
      AND policyname = 'Admin full access to email log'
  ) THEN
    CREATE POLICY "Admin full access to email log"
      ON public.email_log FOR ALL
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;
