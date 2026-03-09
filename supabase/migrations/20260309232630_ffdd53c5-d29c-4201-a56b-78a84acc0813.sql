
-- Add acknowledgment tracking columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS owner_acknowledgment_accepted boolean DEFAULT false;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS owner_acknowledgment_date timestamptz;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS developer_acknowledgment_accepted boolean DEFAULT false;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS developer_acknowledgment_date timestamptz;
