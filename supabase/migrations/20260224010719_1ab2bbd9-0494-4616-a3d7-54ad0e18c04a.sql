
-- Audit Log table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Platform content table for admin-managed texts
CREATE TABLE public.platform_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'text',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active content"
ON public.platform_content
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage content"
ON public.platform_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default content entries
INSERT INTO public.platform_content (content_key, title_ar, title_en, body_ar, body_en, content_type) VALUES
('hero_title', 'عنوان الصفحة الرئيسية', 'Hero Title', 'منصة DOMA العقارية', 'DOMA Real Estate Platform', 'text'),
('hero_subtitle', 'وصف الصفحة الرئيسية', 'Hero Subtitle', 'نربط ملاك الأراضي بالمطورين العقاريين', 'Connecting landowners with real estate developers', 'text'),
('announcement', 'إعلان المنصة', 'Platform Announcement', '', '', 'notification');
