
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'lease_expiring', 'receivable_overdue'
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  message_en TEXT NOT NULL,
  entity_id UUID, -- reference to lease or receivable
  entity_type TEXT, -- 'lease' or 'receivable'
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read notifications"
ON public.notifications FOR SELECT
USING (
  is_tenant_member(auth.uid(), tenant_id)
  OR (tenant_id IS NULL AND auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tenant members can update notifications"
ON public.notifications FOR UPDATE
USING (
  is_tenant_member(auth.uid(), tenant_id)
  OR (tenant_id IS NULL AND auth.uid() = user_id)
);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  is_tenant_member(auth.uid(), tenant_id)
  OR (tenant_id IS NULL AND auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (
  is_tenant_member(auth.uid(), tenant_id)
  OR (tenant_id IS NULL AND auth.uid() = user_id)
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
