// ═══════════════════════════════════════════════════════════════════════
// P0.4 — email-retry-cron
// ═══════════════════════════════════════════════════════════════════════
// Scheduled sweeper that re-attempts stuck email_log rows.
//
// Why we need it:
//   - The client-side safeSendPlatformEmail helper (P0.2) writes a
//     '__deferred__' email_log row when the edge function invoke fails.
//     Without a cron, those rows would sit forever.
//   - send-platform-email itself writes rows as status='failed' when
//     Resend returns an error. The original spec always included
//     attempts/max_attempts/next_retry_at but no consumer of those
//     fields existed.
//
// Authorization:
//   - Accepts CRON_SECRET via `Authorization: Bearer {secret}`
//     (aligned with check-report-deadlines) OR `x-cron-secret`.
//   - Optionally accepts admin JWT for manual triggers from the UI.
//
// Intended schedule: every 15 minutes (aligned with the stated SLA
// in the audit report).
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Exponential backoff: attempt N → wait BASE * 2^(N-1) minutes */
const BASE_RETRY_MINUTES = 5;
const MAX_BATCH = 50;

function nextRetryAt(attemptsAfterThis: number): string {
  const mins = BASE_RETRY_MINUTES * Math.pow(2, Math.max(0, attemptsAfterThis - 1));
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Auth: CRON_SECRET or admin JWT ──
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const xCronSecret = req.headers.get("x-cron-secret") || "";
  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  let authorized = false;

  if (cronSecret && (authHeader === `Bearer ${cronSecret}` || xCronSecret === cronSecret)) {
    authorized = true;
  }

  if (!authorized && authHeader) {
    try {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const roleClient = createClient(supabaseUrl, serviceKey);
        const { data: roleData } = await roleClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) authorized = true;
      }
    } catch {
      // auth failure stays unauthorized
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const now = new Date();

  let retried = 0;
  let succeeded = 0;
  let failed_permanently = 0;
  let skipped = 0;

  try {
    // Pick up due rows. Two groups:
    //   1. '__deferred__' rows from safeSendPlatformEmail — recipient is
    //      resolved by re-invoking send-platform-email.
    //   2. 'failed' rows with attempts < max_attempts and next_retry_at
    //      past due — same re-invoke path.
    const { data: dueRows, error: dueErr } = await admin
      .from("email_log")
      .select("id, event_type, recipient_email, attempts, max_attempts, next_retry_at, related_entity_type, related_entity_id")
      .in("status", ["queued", "failed"])
      .or(`next_retry_at.is.null,next_retry_at.lte.${now.toISOString()}`)
      .order("next_retry_at", { ascending: true, nullsFirst: true })
      .limit(MAX_BATCH);

    if (dueErr) throw new Error(`Failed to load due email_log rows: ${dueErr.message}`);

    for (const row of dueRows ?? []) {
      const attempts = Number(row.attempts ?? 0);
      const maxAttempts = Number(row.max_attempts ?? 3);

      // Permanent failure — mark and skip.
      if (attempts >= maxAttempts) {
        await admin
          .from("email_log")
          .update({
            status: "failed",
            error: `[email-retry-cron] Max attempts reached (${maxAttempts})`,
            last_attempt_at: now.toISOString(),
            next_retry_at: null,
          })
          .eq("id", row.id);
        failed_permanently++;
        continue;
      }

      // Skip rows without enough info to retry
      if (!row.event_type || !row.related_entity_type || !row.related_entity_id) {
        skipped++;
        continue;
      }

      const body: Record<string, unknown> = { event_type: row.event_type };
      if (row.related_entity_type === "deal_request") {
        body.deal_request_id = row.related_entity_id;
      } else if (row.related_entity_type === "report") {
        body.report_id = row.related_entity_id;
      } else {
        skipped++;
        continue;
      }

      retried++;

      try {
        const { error: invokeErr } = await admin.functions.invoke("send-platform-email", {
          body,
          headers: cronSecret ? { "x-cron-secret": cronSecret } : {},
        });

        if (invokeErr) {
          // Re-queue with backoff; the row itself stays as "failed"-with-retry
          await admin
            .from("email_log")
            .update({
              status: "failed",
              attempts: attempts + 1,
              last_attempt_at: now.toISOString(),
              next_retry_at: nextRetryAt(attempts + 1),
              error: (invokeErr.message || "invoke failed").slice(0, 500),
            })
            .eq("id", row.id);
          continue;
        }

        // Successfully handed off to send-platform-email, which writes
        // its own fresh log rows per recipient. Delete the retry-queue
        // row so we don't re-fire.
        await admin.from("email_log").delete().eq("id", row.id);
        succeeded++;
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        await admin
          .from("email_log")
          .update({
            status: "failed",
            attempts: attempts + 1,
            last_attempt_at: now.toISOString(),
            next_retry_at: nextRetryAt(attempts + 1),
            error: m.slice(0, 500),
          })
          .eq("id", row.id);
      }
    }

    console.log(
      `[email-retry-cron] retried=${retried} succeeded=${succeeded} failed_permanently=${failed_permanently} skipped=${skipped}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        retried,
        succeeded,
        failed_permanently,
        skipped,
        checked_at: now.toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email-retry-cron] fatal:", msg);
    return new Response(JSON.stringify({ error: "Retry sweep failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
