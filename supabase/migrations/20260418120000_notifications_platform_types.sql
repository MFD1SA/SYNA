-- Extend notifications table to support platform-wide events
-- (new opportunity broadcast, developer interest, system messages, contact).
--
-- The table already exists (see 20260222224619_*.sql) with bilingual
-- title_ar/title_en/message_ar/message_en and nullable tenant_id so a
-- user-owned notification (tenant_id IS NULL) is already permitted under
-- the existing RLS. This migration:
--
--  1. Documents the new canonical type values.
--  2. Adds a composite (user_id, created_at DESC) index used by the
--     navbar bell dropdown which sorts recent-first.
--  3. Makes sure service-role inserts always succeed when the target user
--     has no tenant membership (platform flow).

COMMENT ON COLUMN public.notifications.type IS
  'Event type: opportunity_new | opportunity_interest | deal_update | system | contact | lease_expiring | receivable_overdue';

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- Ensure the INSERT policy does not block service-role fanout. Service role
-- bypasses RLS by default, but we also allow an authenticated admin to seed
-- notifications for another user (already covered by has_role). No-op if the
-- policy already matches; recreated idempotently.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    is_tenant_member(auth.uid(), tenant_id)
    OR (tenant_id IS NULL AND auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
