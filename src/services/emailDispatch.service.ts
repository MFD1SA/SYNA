import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

/*
 * Safe wrapper around `send-platform-email` edge function.
 *
 * Problem this solves: `supabase.functions.invoke` can fail in two ways —
 *   (a) throw (JS error, network down)
 *   (b) return `{ error: {...} }` (non-2xx, timeout)
 *
 * Several call sites (dealClosing, OwnerRequests, CrmDeals) previously
 * used bare `try/catch(console.warn)` which only catches (a), silently
 * swallowing (b). When either path fails the email simply vanishes —
 * no retry, no audit, no operator visibility.
 *
 * Fix: always destructure `{ data, error }` and check both. On failure
 * fall back to the `enqueue_platform_email_retry` RPC so the email-retry
 * cron picks the event up on the next tick. Returns a structured result
 * so callers can surface a soft-warning toast.
 */

export type EmailEvent =
  | "study_required" | "study_submitted"
  | "study_approved" | "study_rejected" | "study_changes_requested"
  | "meeting_proposed" | "meeting_confirmed"
  | "meeting_cancelled" | "meeting_completed"
  | "report_created" | "report_approved" | "report_rejected"
  | "report_changes_requested" | "report_deadline_reminder" | "report_expired"
  | "nda_developer_accepted" | "nda_owner_accepted"
  | "request_rejected" | "request_cancelled"
  | "negotiation_new_round" | "negotiation_accepted"
  | "negotiation_rejected" | "negotiation_counter_offer"
  | "deal_closed_won" | "deal_closed_lost";

export interface SafeEmailResult {
  /** true if the edge function returned 2xx in this attempt */
  sent: boolean;
  /** true if we couldn't send now but queued a retry row */
  queued: boolean;
  /** structured error string for logs/telemetry */
  error?: string;
}

export interface SafeEmailParams {
  eventType: EmailEvent;
  /** Deal request id OR report id OR similar entity uuid */
  dealRequestId?: string;
  reportId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Attempts to invoke send-platform-email. On any failure, enqueues a
 * retry row via RPC so the email-retry cron picks it up. Never throws —
 * returns a structured SafeEmailResult instead.
 */
export async function safeSendPlatformEmail(params: SafeEmailParams): Promise<SafeEmailResult> {
  const entityId = params.dealRequestId ?? params.reportId;
  const entityType = params.dealRequestId ? "deal_request" : params.reportId ? "report" : null;

  const body: Record<string, unknown> = {
    event_type: params.eventType,
    ...params.extra,
  };
  if (params.dealRequestId) body.deal_request_id = params.dealRequestId;
  if (params.reportId) body.report_id = params.reportId;

  // Attempt 1: live invoke
  try {
    const { data, error } = await supabase.functions.invoke("send-platform-email", { body });

    if (!error && !(data as { error?: string } | null)?.error) {
      return { sent: true, queued: false };
    }

    const errMsg = error?.message ?? (data as { error?: string } | null)?.error ?? "unknown";
    log.warn(`[safeSendPlatformEmail] invoke failed for ${params.eventType}:`, errMsg);

    // Fall through to retry-queue fallback
    const queued = await enqueueFallback(params.eventType, entityType, entityId, errMsg);
    return { sent: false, queued, error: errMsg };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.warn(`[safeSendPlatformEmail] invoke threw for ${params.eventType}:`, errMsg);
    const queued = await enqueueFallback(params.eventType, entityType, entityId, errMsg);
    return { sent: false, queued, error: errMsg };
  }
}

async function enqueueFallback(
  eventType: string,
  entityType: string | null,
  entityId: string | undefined,
  errorMsg: string,
): Promise<boolean> {
  if (!entityId || !entityType) {
    // Can't enqueue without an entity to resolve — accept the loss.
    log.warn(
      "[safeSendPlatformEmail] no entity id/type; cannot enqueue retry",
    );
    return false;
  }
  try {
    const { error: rpcErr } = await supabase.rpc("enqueue_platform_email_retry", {
      _event_type: eventType,
      _related_entity_type: entityType,
      _related_entity_id: entityId,
      _error: errorMsg,
    });
    if (rpcErr) {
      log.error(
        "[safeSendPlatformEmail] enqueue RPC failed:",
        rpcErr.message,
      );
      return false;
    }
    return true;
  } catch (err) {
    log.error("[safeSendPlatformEmail] enqueue threw:", err);
    return false;
  }
}
