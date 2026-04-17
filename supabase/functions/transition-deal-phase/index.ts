import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

/* ── CORS ── */
const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const h = url.hostname.toLowerCase();
    return h === allowedRootDomain || h.endsWith(`.${allowedRootDomain}`);
  } catch { return false; }
};
const resolveSafeOrigin = (o: string | null) => isAllowedOrigin(o) ? o! : publicSiteUrl;
const buildCorsHeaders = (o: string | null) => ({
  "Access-Control-Allow-Origin": resolveSafeOrigin(o),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

/* ── State Machine ── */

const VALID_PHASES = [
  "nda_pending", "nda_developer_accepted", "nda_both_accepted",
  "under_review", "study_required",
  "study_submitted", "study_under_review", "study_changes_requested",
  "study_resubmitted", "study_approved", "study_rejected",
  "meeting_proposed", "meeting_confirmed", "meeting_completed",
  "report_pending_approval", "report_approved", "report_rejected",
  "report_changes_requested", "report_expired",
  "negotiation_active", "final_approval", "closed_won",
  "closed_lost", "cancelled",
] as const;

const TERMINAL_PHASES = ["closed_won", "closed_lost", "cancelled"];

/**
 * Whitelist: from_phase → { to_phase → allowed_roles[] }
 */
const TRANSITIONS: Record<string, Record<string, string[]>> = {
  // NDA flow
  nda_pending: {
    nda_developer_accepted: ["system"],
  },
  nda_developer_accepted: {
    nda_both_accepted: ["system"],
    closed_lost: ["admin"],
    cancelled: ["developer", "admin"],
  },
  nda_both_accepted: {
    under_review: ["owner", "admin"],
    study_required: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  under_review: {
    study_required: ["owner", "admin"],
    meeting_proposed: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },

  // Study flow
  study_required: {
    study_submitted: ["developer"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  study_submitted: {
    study_under_review: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  study_under_review: {
    study_approved: ["owner", "admin"],
    study_changes_requested: ["owner", "admin"],
    study_rejected: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  study_changes_requested: {
    study_resubmitted: ["developer"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  study_resubmitted: {
    study_under_review: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  study_approved: {
    meeting_proposed: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },
  study_rejected: {
    study_required: ["admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["developer", "admin"],
  },

  // Meeting flow
  meeting_proposed: {
    meeting_confirmed: ["developer"],
    meeting_proposed: ["owner", "admin"],  // reschedule = new proposal
    cancelled: ["owner", "developer", "admin"],
  },
  meeting_confirmed: {
    meeting_completed: ["owner", "admin"],
    meeting_proposed: ["owner", "admin"],  // reschedule
    cancelled: ["owner", "developer", "admin"],
  },
  meeting_completed: {
    report_pending_approval: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },

  // Report flow
  report_pending_approval: {
    report_approved: ["system", "owner", "admin"],  // auto when both approve
    report_rejected: ["owner", "developer", "admin"],
    report_changes_requested: ["owner", "developer", "admin"],
    report_expired: ["system", "admin"],  // auto after 24h
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },
  report_approved: {
    negotiation_active: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },
  report_rejected: {
    report_pending_approval: ["owner", "admin"],  // reissue
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },
  report_changes_requested: {
    report_pending_approval: ["owner", "admin"],  // reissue after changes
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },
  report_expired: {
    report_pending_approval: ["owner", "admin"],  // reissue
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },

  // Negotiation flow
  negotiation_active: {
    final_approval: ["owner", "admin"],
    closed_lost: ["owner", "admin"],
    cancelled: ["owner", "developer", "admin"],
  },
  final_approval: {
    closed_won: ["owner", "admin"],
    negotiation_active: ["owner", "admin"],  // reopen negotiation
    closed_lost: ["owner", "admin"],
    cancelled: ["admin"],
  },
};

/** Map current_phase → legacy status column for backward compat */
const PHASE_TO_LEGACY_STATUS: Record<string, string> = {
  nda_pending: "pending",
  nda_developer_accepted: "pending",
  nda_both_accepted: "pending",
  under_review: "pending",
  study_required: "info_requested",
  study_submitted: "info_requested",
  study_under_review: "info_requested",
  study_changes_requested: "info_requested",
  study_resubmitted: "info_requested",
  study_approved: "approved",
  study_rejected: "rejected",
  meeting_proposed: "approved",
  meeting_confirmed: "approved",
  meeting_completed: "approved",
  report_pending_approval: "approved",
  report_approved: "approved",
  report_rejected: "rejected",
  report_changes_requested: "approved",
  report_expired: "approved",
  negotiation_active: "approved",
  final_approval: "approved",
  closed_won: "approved",
  closed_lost: "rejected",
  cancelled: "rejected",
};

/* ── Handler ── */

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || null;
  const userAgent = req.headers.get("user-agent") || null;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const payload = await req.json();
    const requestId = String(payload.request_id || "").trim();
    const targetPhase = String(payload.target_phase || "").trim();
    const reason = payload.reason ? String(payload.reason).trim() : null;

    if (!requestId) throw new Error("request_id is required");
    if (!targetPhase) throw new Error("target_phase is required");
    if (!(VALID_PHASES as readonly string[]).includes(targetPhase)) {
      throw new Error("Invalid target_phase");
    }

    // Fetch the deal request
    const { data: dealReq, error: fetchErr } = await adminClient
      .from("deal_requests")
      .select("id, current_phase, land_id, developer_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !dealReq) throw new Error("Deal request not found");

    const currentPhase = dealReq.current_phase;

    // Terminal check
    if (TERMINAL_PHASES.includes(currentPhase)) {
      throw new Error(`Deal request is in terminal phase: ${currentPhase}`);
    }

    // Transition whitelist check
    const allowed = TRANSITIONS[currentPhase];
    if (!allowed || !allowed[targetPhase]) {
      throw new Error(`Transition from '${currentPhase}' to '${targetPhase}' is not allowed`);
    }

    const allowedRoles = allowed[targetPhase];

    // ── Determine actor role ──
    let actorRole = "unknown";

    const { data: adminRows } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);

    if (adminRows && adminRows.length > 0) {
      actorRole = "admin";
    } else {
      const { data: ownerCheck } = await adminClient
        .from("lands")
        .select("id")
        .eq("id", dealReq.land_id)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (ownerCheck) {
        actorRole = "owner";
      } else {
        const { data: devCheck } = await adminClient
          .from("developers")
          .select("id")
          .eq("id", dealReq.developer_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (devCheck) {
          actorRole = "developer";
        }
      }
    }

    if (actorRole === "unknown") {
      throw new Error("You do not have permission for this request");
    }
    if (!allowedRoles.includes(actorRole)) {
      throw new Error(`Role '${actorRole}' cannot perform this transition`);
    }

    // ── Build update ──
    const updates: Record<string, unknown> = {
      current_phase: targetPhase,
      status: PHASE_TO_LEGACY_STATUS[targetPhase] || "pending",
    };

    if (targetPhase === "closed_won" || targetPhase === "closed_lost" || targetPhase === "cancelled") {
      updates.closed_at = new Date().toISOString();
      if (targetPhase === "closed_won") {
        updates.approved_by = user.id;
      } else {
        updates.rejected_by = user.id;
        if (reason) updates.rejection_reason = reason;
      }
    }

    if (targetPhase === "nda_both_accepted") {
      updates.owner_nda_status = "accepted";
      updates.identity_reveal_level = "brand_visible";
    }

    // Execute update
    const { error: updateErr } = await adminClient
      .from("deal_requests")
      .update(updates)
      .eq("id", requestId);

    if (updateErr) throw new Error("Failed to update deal request phase");

    // Log transition
    await adminClient.from("deal_phase_transitions").insert({
      deal_request_id: requestId,
      from_phase: currentPhase,
      to_phase: targetPhase,
      triggered_by: user.id,
      actor_role: actorRole,
      reason,
      ip_address: clientIp,
      user_agent: userAgent,
    });

    return new Response(JSON.stringify({
      success: true,
      from_phase: currentPhase,
      to_phase: targetPhase,
      actor_role: actorRole,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Phase transition failed";
    console.error("[transition-deal-phase] Error:", message);

    const safeMessages = [
      "Unauthorized", "request_id is required", "target_phase is required",
      "Invalid target_phase", "Deal request not found", "terminal phase",
      "not allowed", "do not have permission", "cannot perform",
      "Failed to update",
    ];
    const safe = safeMessages.some(m => message.includes(m)) ? message : "Phase transition failed";
    return new Response(JSON.stringify({ error: safe }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
