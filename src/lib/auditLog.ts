import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

export const logAudit = async (
  userId: string,
  userEmail: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
) => {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      user_email: userEmail || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || {},
    });
  } catch (e) {
    log.error("Audit log error:", e);
  }
};
