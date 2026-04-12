import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Scheduled Edge Function: check-report-deadlines
 *
 * 1. Finds reports approaching deadline (< 2h remaining) → sends reminder email
 * 2. Finds reports past deadline (expired) → marks as expired, transitions deal phase
 *
 * Intended to be invoked via Supabase cron (pg_cron) every 15-30 minutes.
 */

Deno.serve(async (req) => {
  // Allow GET (cron) and POST (manual trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optional: verify cron secret for security
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  let reminders_sent = 0;
  let reports_expired = 0;

  try {
    // ── Step 1: Send reminders for reports approaching deadline ──
    // Reports where expires_at is within the next 2 hours AND reminder not yet sent
    const { data: approachingReports, error: approachErr } = await admin
      .from("meeting_reports")
      .select("id, deal_request_id, expires_at")
      .in("status", ["pending_approval", "partially_approved"])
      .eq("reminder_sent", false)
      .eq("expired_processed", false)
      .lte("expires_at", twoHoursFromNow.toISOString())
      .gt("expires_at", now.toISOString());

    if (approachErr) {
      console.error("[check-report-deadlines] Error fetching approaching reports:", approachErr.message);
    } else if (approachingReports && approachingReports.length > 0) {
      for (const report of approachingReports) {
        try {
          // Send reminder email
          await admin.functions.invoke("send-platform-email", {
            body: {
              event_type: "report_deadline_reminder",
              deal_request_id: report.deal_request_id,
              report_id: report.id,
            },
          });

          // Mark reminder sent
          await admin
            .from("meeting_reports")
            .update({
              reminder_sent: true,
              reminder_sent_at: now.toISOString(),
            })
            .eq("id", report.id);

          reminders_sent++;
        } catch (e) {
          console.error(`[check-report-deadlines] Reminder failed for report ${report.id}:`, e);
        }
      }
    }

    // ── Step 2: Expire reports past deadline ──
    const { data: expiredReports, error: expiredErr } = await admin
      .from("meeting_reports")
      .select("id, deal_request_id")
      .in("status", ["pending_approval", "partially_approved"])
      .eq("expired_processed", false)
      .lt("expires_at", now.toISOString());

    if (expiredErr) {
      console.error("[check-report-deadlines] Error fetching expired reports:", expiredErr.message);
    } else if (expiredReports && expiredReports.length > 0) {
      for (const report of expiredReports) {
        try {
          // Update report status to expired
          await admin
            .from("meeting_reports")
            .update({
              status: "expired",
              expired_processed: true,
              updated_at: now.toISOString(),
            })
            .eq("id", report.id);

          // Transition deal phase to report_expired (as system)
          // We use admin client directly since this is a system-level operation
          const { data: dealReq } = await admin
            .from("deal_requests")
            .select("current_phase")
            .eq("id", report.deal_request_id)
            .maybeSingle();

          if (dealReq && dealReq.current_phase === "report_pending_approval") {
            await admin
              .from("deal_requests")
              .update({
                current_phase: "report_expired",
                status: "approved", // legacy status mapping
              })
              .eq("id", report.deal_request_id);

            // Log the transition
            await admin.from("deal_phase_transitions").insert({
              deal_request_id: report.deal_request_id,
              from_phase: "report_pending_approval",
              to_phase: "report_expired",
              triggered_by: "00000000-0000-0000-0000-000000000000", // system user
              actor_role: "system",
              reason: "Report approval deadline expired (24h)",
            });
          }

          // Send expiry notification email
          try {
            await admin.functions.invoke("send-platform-email", {
              body: {
                event_type: "report_expired",
                deal_request_id: report.deal_request_id,
                report_id: report.id,
              },
            });
          } catch (e) {
            console.warn(`[check-report-deadlines] Expiry email failed for report ${report.id}:`, e);
          }

          reports_expired++;
        } catch (e) {
          console.error(`[check-report-deadlines] Expiry processing failed for report ${report.id}:`, e);
        }
      }
    }

    console.log(`[check-report-deadlines] Done: ${reminders_sent} reminders sent, ${reports_expired} reports expired`);

    return new Response(JSON.stringify({
      success: true,
      reminders_sent,
      reports_expired,
      checked_at: now.toISOString(),
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[check-report-deadlines] Fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
