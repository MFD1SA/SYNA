
ALTER TABLE public.target_companies 
ADD COLUMN lead_status TEXT NOT NULL DEFAULT 'new';

COMMENT ON COLUMN public.target_companies.lead_status IS 'new = just discovered, prospect = being targeted, client = registered';
