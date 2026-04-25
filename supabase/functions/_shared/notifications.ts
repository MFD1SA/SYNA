// In-app notification helper. Writes rows to public.notifications using the
// service-role Supabase client so RLS is bypassed safely server-side.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let cachedAdmin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  cachedAdmin = createClient(url, key, { auth: { persistSession: false } });
  return cachedAdmin;
}

export type NotificationType =
  | "opportunity_new"
  | "opportunity_interest"
  | "deal_update"
  | "system"
  | "contact"
  // P1.1 / P1.4 — deal-flow + land-lifecycle events surfaced to users.
  // Keeping this union in sync with server-side INSERTs means we fail
  // fast (TypeScript) instead of silently persisting a typo.
  | "study_required"
  | "meeting_proposed"
  | "meeting_rescheduled"
  | "report_pending_approval"
  | "study_approved"
  | "study_rejected"
  | "study_changes_requested"
  | "closed_lost"
  | "cancelled"
  | "land_approved"
  | "land_changes_required"
  | "land_published"
  | "land_unpublished"
  | "land_new_submitted"
  | "land_cr_uploaded"
  | "developer_cr_uploaded"
  | "owner_complaint"
  | "deal_abuse_flag";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  entityType?: string;
  entityId?: string;
}

export interface CreateNotificationResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface CreateNotificationsResult {
  success: boolean;
  inserted: number;
  error?: string;
}

/**
 * Insert a single in-app notification.
 *
 * P2.5 — returns a structured result. Previously this returned a plain
 * `string | null`, which conflated "RLS denied / FK violation" with
 * "no row returned". Callers couldn't tell a silent drop from a real
 * insert. The new shape forces each caller to decide:
 *   - `success: true`  → id is set
 *   - `success: false` → error is set, log includes it; caller can
 *                         surface it upstream if the notification is
 *                         critical for the operation.
 *
 * We still don't throw — one failed notification must not take down a
 * happy-path transaction — but the error is no longer hidden.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      title_ar: input.titleAr,
      title_en: input.titleEn,
      message_ar: input.messageAr,
      message_en: input.messageEn,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[notifications] insert failed", {
      message: error.message,
      user_id: input.userId,
      type: input.type,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

/** Bulk insert notifications — one row per recipient. */
export async function createNotifications(
  inputs: CreateNotificationInput[],
): Promise<CreateNotificationsResult> {
  if (inputs.length === 0) return { success: true, inserted: 0 };
  const admin = getAdminClient();
  const rows = inputs.map((i) => ({
    user_id: i.userId,
    type: i.type,
    title_ar: i.titleAr,
    title_en: i.titleEn,
    message_ar: i.messageAr,
    message_en: i.messageEn,
    entity_type: i.entityType ?? null,
    entity_id: i.entityId ?? null,
  }));
  const { error, count } = await admin
    .from("notifications")
    .insert(rows, { count: "exact" });
  if (error) {
    console.error("[notifications] bulk insert failed", {
      message: error.message,
      attempted: rows.length,
      first_user_id: rows[0]?.user_id,
      first_type: rows[0]?.type,
    });
    return { success: false, inserted: 0, error: error.message };
  }
  return { success: true, inserted: count ?? rows.length };
}
