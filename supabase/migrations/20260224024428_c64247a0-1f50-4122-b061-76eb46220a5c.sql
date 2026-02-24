
-- Table for tracking target real estate companies
CREATE TABLE public.target_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT,
  project_count INTEGER DEFAULT 0,
  ai_strength_score INTEGER, -- 0-100
  ai_analysis TEXT,
  is_registered BOOLEAN NOT NULL DEFAULT false,
  registered_developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  added_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.target_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage target companies"
ON public.target_companies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_target_companies_updated_at
BEFORE UPDATE ON public.target_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
