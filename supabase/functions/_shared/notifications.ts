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
  | "contact";

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

/**
 * Insert a single in-app notification. Never throws; logs on failure.
 * Returns the new row id or null.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<string | null> {
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
    console.error("[notifications] insert failed", error.message);
    return null;
  }
  return data?.id ?? null;
}

/** Bulk insert notifications — one row per recipient. */
export async function createNotifications(
  inputs: CreateNotificationInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;
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
    console.error("[notifications] bulk insert failed", error.message);
    return 0;
  }
  return count ?? rows.length;
}
