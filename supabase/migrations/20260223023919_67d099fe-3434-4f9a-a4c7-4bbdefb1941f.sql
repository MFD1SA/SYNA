
-- Add new partnership goal enum values
ALTER TYPE public.owner_partnership_goal ADD VALUE IF NOT EXISTS 'sell_develop';
ALTER TYPE public.owner_partnership_goal ADD VALUE IF NOT EXISTS 'partial_exit';
ALTER TYPE public.owner_partnership_goal ADD VALUE IF NOT EXISTS 'offplan_sell';
