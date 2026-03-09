
-- Add 4 new deal_stage enum values for the full 13-stage pipeline
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'accepting_proposals';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'agreed';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'active_project';
