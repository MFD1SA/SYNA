
-- =========================================
-- DOMA Development Partnership Platform
-- Phase 1: Core Schema
-- =========================================

-- New enums
CREATE TYPE public.developer_verification_status AS ENUM ('pending_review', 'verified', 'rejected');
CREATE TYPE public.land_usage_type AS ENUM ('residential', 'commercial', 'residential_commercial', 'high_density');
CREATE TYPE public.owner_partnership_goal AS ENUM ('develop_sell', 'develop_rent', 'develop_mixed', 'develop_complex');
CREATE TYPE public.deal_stage AS ENUM (
  'listed', 'request_submitted', 'owner_review', 'owner_approved',
  'meeting_scheduled', 'strategy_defined', 'documents_exchanged',
  'agreements_prepared', 'deal_closed', 'deal_cancelled'
);
CREATE TYPE public.deal_health AS ENUM ('green', 'yellow', 'red');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'info_requested');
CREATE TYPE public.deal_task_status AS ENUM ('pending', 'in_progress', 'done');
CREATE TYPE public.meeting_type AS ENUM ('google_meet', 'in_person');

-- =========================================
-- 1. DEVELOPERS TABLE
-- =========================================
CREATE TABLE public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  cr_number TEXT NOT NULL,
  cr_file_url TEXT NOT NULL,
  cr_extracted_name TEXT,
  cr_extracted_number TEXT,
  marketing_brand_name TEXT,
  email TEXT,
  phone TEXT,
  verification_status public.developer_verification_status NOT NULL DEFAULT 'pending_review',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cr_number)
);

ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own developer profile" ON public.developers
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own developer profile" ON public.developers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own developer profile" ON public.developers
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2. LANDS TABLE (by owner)
-- =========================================
CREATE TABLE public.lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL, -- user_id of the landowner
  tenant_id UUID REFERENCES public.tenants(id),
  city TEXT NOT NULL,
  district TEXT,
  land_area_sqm NUMERIC NOT NULL,
  length_m NUMERIC,
  width_m NUMERIC,
  street_width_m NUMERIC,
  usage_type public.land_usage_type NOT NULL DEFAULT 'residential',
  partnership_goal public.owner_partnership_goal NOT NULL DEFAULT 'develop_sell',
  -- Owner vision fields
  project_type TEXT, -- e.g. "residential tower", "mall"
  quality_level TEXT, -- e.g. "luxury", "mid-range"
  revenue_model TEXT, -- e.g. "sale", "rental", "mixed"
  expected_dev_duration_months INTEGER,
  developer_experience_requirements TEXT,
  financing_preference TEXT,
  vision_summary TEXT, -- brief summary shown before approval
  -- Privacy-sensitive fields (hidden from developer before approval)
  plot_number TEXT,
  plan_number TEXT,
  owner_name TEXT,
  deed_number TEXT,
  exact_location_lat DOUBLE PRECISION,
  exact_location_lng DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own lands
CREATE POLICY "Owners can read own lands" ON public.lands
  FOR SELECT USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can insert lands" ON public.lands
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own lands" ON public.lands
  FOR UPDATE USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete own lands" ON public.lands
  FOR DELETE USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

-- Verified developers can see active land listings (masked view via app logic)
CREATE POLICY "Verified developers can browse active lands" ON public.lands
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.developers d
      WHERE d.user_id = auth.uid() AND d.verification_status = 'verified'
    )
  );

CREATE TRIGGER update_lands_updated_at
  BEFORE UPDATE ON public.lands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3. DEAL REQUESTS (developer -> owner)
-- =========================================
CREATE TABLE public.deal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  proposed_project_type TEXT NOT NULL,
  proposal_summary TEXT NOT NULL,
  estimated_duration_months INTEGER,
  needs_financing BOOLEAN DEFAULT false,
  attachments_urls TEXT[], -- company deck, etc.
  commission_accepted BOOLEAN NOT NULL DEFAULT false,
  commission_rate NUMERIC NOT NULL DEFAULT 2.50,
  status public.request_status NOT NULL DEFAULT 'pending',
  owner_response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_requests ENABLE ROW LEVEL SECURITY;

-- Developer can read/create own requests
CREATE POLICY "Developers can read own requests" ON public.deal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.developers d WHERE d.id = developer_id AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.lands l WHERE l.id = land_id AND l.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Developers can create requests" ON public.deal_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.developers d WHERE d.id = developer_id AND d.user_id = auth.uid() AND d.verification_status = 'verified')
    AND commission_accepted = true
  );

-- Owner can update (approve/reject) requests on their lands
CREATE POLICY "Owners can update requests on their lands" ON public.deal_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.lands l WHERE l.id = land_id AND l.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER update_deal_requests_updated_at
  BEFORE UPDATE ON public.deal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. DEALS (active partnerships)
-- =========================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.deal_requests(id),
  land_id UUID NOT NULL REFERENCES public.lands(id),
  developer_id UUID NOT NULL REFERENCES public.developers(id),
  owner_id UUID NOT NULL,
  current_stage public.deal_stage NOT NULL DEFAULT 'owner_approved',
  health public.deal_health NOT NULL DEFAULT 'green',
  commission_rate NUMERIC NOT NULL DEFAULT 2.50,
  commission_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid
  support_assignee UUID, -- admin/support staff
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal parties can read deals" ON public.deals
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id = developer_id AND d.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin can manage deals" ON public.deals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deal parties can update deals" ON public.deals
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id = developer_id AND d.user_id = auth.uid())
  );

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5. DEAL STAGE LOG (timeline)
-- =========================================
CREATE TABLE public.deal_stages_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage public.deal_stage,
  to_stage public.deal_stage NOT NULL,
  changed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_stages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal parties can read stage logs" ON public.deal_stages_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.developers dev WHERE dev.id = d.developer_id AND dev.user_id = auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert stage logs" ON public.deal_stages_log
  FOR INSERT WITH CHECK (auth.uid() = changed_by OR has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- 6. DEAL TASKS
-- =========================================
CREATE TABLE public.deal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status public.deal_task_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal parties can read tasks" ON public.deal_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.developers dev WHERE dev.id = d.developer_id AND dev.user_id = auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Deal parties can manage tasks" ON public.deal_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.developers dev WHERE dev.id = d.developer_id AND dev.user_id = auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER update_deal_tasks_updated_at
  BEFORE UPDATE ON public.deal_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 7. DEAL MEETINGS
-- =========================================
CREATE TABLE public.deal_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  meeting_type public.meeting_type NOT NULL DEFAULT 'google_meet',
  meet_link TEXT,
  location TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal parties can read meetings" ON public.deal_meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.developers dev WHERE dev.id = d.developer_id AND dev.user_id = auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Deal parties can manage meetings" ON public.deal_meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.developers dev WHERE dev.id = d.developer_id AND dev.user_id = auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER update_deal_meetings_updated_at
  BEFORE UPDATE ON public.deal_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 8. DEAL ACTIVITY LOG (general logs)
-- =========================================
CREATE TABLE public.deal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal parties can read logs" ON public.deal_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.developers dev WHERE dev.id = d.developer_id AND dev.user_id = auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert logs" ON public.deal_logs
  FOR INSERT WITH CHECK (auth.uid() = performed_by OR has_role(auth.uid(), 'admin'::app_role));
