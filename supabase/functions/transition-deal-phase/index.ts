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

    // Fetch the deal request with the joins we need for notifications
    // (land owner, developer user) — saves a round-trip later.
    const { data: dealReq, error: fetchErr } = await adminClient
      .from("deal_requests")
      .select("id, current_phase, land_id, developer_id, status, lands(owner_id, city, district), developers(user_id, company_name, marketing_brand_name)")
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

    // ── P1.1 / P1.2 — In-app notifications on transition ──────
    // Email notifications are already emitted by send-platform-email
    // when the frontend invokes it after a transition. What's missing
    // is the in-app (realtime) notification so the recipient sees a
    // bell-icon update without waiting for the email round-trip.
    //
    // Rules (one notification per transition, targeting the party
    // whose turn it is or who should be informed of a decision):
    //   - study_required             → developer (owner requested a study)
    //   - meeting_proposed (fresh)   → developer (new meeting invite)
    //   - meeting_proposed (resched) → developer (meeting moved)
    //   - closed_lost / cancelled    → opposite party (deal ended)
    //   - report_pending_approval    → opposite party (report to approve)
    try {
      // deal_requests.lands and .developers are embedded objects when
      // the single-row .select() returns them — Supabase makes them
      // arrays only if the relationship is many-to-one the "wrong way."
      // Here both sides are single, so treat them as objects.
      const land = (dealReq as { lands?: { owner_id?: string; city?: string; district?: string } }).lands;
      const dev = (dealReq as { developers?: { user_id?: string; company_name?: string; marketing_brand_name?: string } }).developers;
      const ownerId = land?.owner_id ?? null;
      const devUserId = dev?.user_id ?? null;
      const location = `${land?.city ?? ""}${land?.district ? ` — ${land.district}` : ""}`.trim() || "—";
      const devLabel = dev?.marketing_brand_name || dev?.company_name || "المطور";

      const notifications: Array<{
        user_id: string;
        type: string;
        title_ar: string;
        title_en: string;
        message_ar: string;
        message_en: string;
        entity_type: string;
        entity_id: string;
      }> = [];

      // study_required → developer
      if (targetPhase === "study_required" && devUserId) {
        notifications.push({
          user_id: devUserId,
          type: "deal_update",
          title_ar: "مطلوب دراسة جدوى",
          title_en: "Feasibility study requested",
          message_ar: `المالك يطلب دراسة جدوى لفرصة ${location}`,
          message_en: `Owner requested a feasibility study for opportunity ${location}`,
          entity_type: "deal_request",
          entity_id: requestId,
        });
      }

      // meeting_proposed — fresh or reschedule
      if (targetPhase === "meeting_proposed" && devUserId) {
        const isReschedule = ["meeting_proposed", "meeting_confirmed"].includes(currentPhase);
        notifications.push({
          user_id: devUserId,
          type: "deal_update",
          title_ar: isReschedule ? "إعادة جدولة الاجتماع" : "اقتراح اجتماع جديد",
          title_en: isReschedule ? "Meeting rescheduled" : "New meeting proposed",
          message_ar: isReschedule
            ? `تم اقتراح موعد جديد للاجتماع بخصوص ${location}`
            : `${devLabel}: اجتماع مقترح بخصوص ${location}`,
          message_en: isReschedule
            ? `New meeting time proposed for ${location}`
            : `New meeting proposed for ${location}`,
          entity_type: "deal_request",
          entity_id: requestId,
        });
      }

      // report_pending_approval → opposite party (owner or developer)
      if (targetPhase === "report_pending_approval") {
        if (actorRole === "owner" && devUserId) {
          notifications.push({
            user_id: devUserId,
            type: "deal_update",
            title_ar: "تقرير اجتماع يحتاج اعتمادك",
            title_en: "Meeting report needs your approval",
            message_ar: `تم إصدار تقرير الاجتماع بخصوص ${location} — مهلة 24 ساعة`,
            message_en: `Meeting report issued for ${location} — 24-hour deadline`,
            entity_type: "deal_request",
            entity_id: requestId,
          });
        } else if (actorRole === "developer" && ownerId) {
          notifications.push({
            user_id: ownerId,
            type: "deal_update",
            title_ar: "تقرير اجتماع يحتاج اعتمادك",
            title_en: "Meeting report needs your approval",
            message_ar: `المطور أصدر تقرير الاجتماع بخصوص ${location} — مهلة 24 ساعة`,
            message_en: `Developer issued meeting report for ${location} — 24h deadline`,
            entity_type: "deal_request",
            entity_id: requestId,
          });
        }
      }

      // closed_lost / cancelled → opposite party
      // (the party who DIDN'T trigger the closure should be told).
      if ((targetPhase === "closed_lost" || targetPhase === "cancelled")) {
        const verb = targetPhase === "cancelled" ? "الإلغاء" : "الإغلاق";
        const verbEn = targetPhase === "cancelled" ? "cancellation" : "closure";
        if (actorRole === "owner" && devUserId) {
          notifications.push({
            user_id: devUserId,
            type: "deal_update",
            title_ar: `تم ${verb} بواسطة المالك`,
            title_en: `Deal ${verbEn} by owner`,
            message_ar: `تم ${verb} الصفقة بخصوص ${location}${reason ? ` — السبب: ${reason}` : ""}`,
            message_en: `Owner ${verbEn} of the deal for ${location}${reason ? ` — reason: ${reason}` : ""}`,
            entity_type: "deal_request",
            entity_id: requestId,
          });
        } else if (actorRole === "developer" && ownerId) {
          notifications.push({
            user_id: ownerId,
            type: "deal_update",
            title_ar: `تم ${verb} بواسطة المطور`,
            title_en: `Deal ${verbEn} by developer`,
            message_ar: `المطور ${devLabel} ${verb === "الإلغاء" ? "ألغى" : "أغلق"} الصفقة بخصوص ${location}`,
            message_en: `Developer ${devLabel} triggered ${verbEn} for ${location}`,
            entity_type: "deal_request",
            entity_id: requestId,
          });
        } else if (actorRole === "admin") {
          // Admin-initiated closure — notify BOTH sides
          if (devUserId) {
            notifications.push({
              user_id: devUserId,
              type: "deal_update",
              title_ar: `تم ${verb} الصفقة`,
              title_en: `Deal ${verbEn}`,
              message_ar: `تم ${verb} الصفقة بخصوص ${location} من قِبل الإدارة${reason ? ` — السبب: ${reason}` : ""}`,
              message_en: `Deal ${verbEn} for ${location} by admin${reason ? ` — reason: ${reason}` : ""}`,
              entity_type: "deal_request",
              entity_id: requestId,
            });
          }
          if (ownerId) {
            notifications.push({
              user_id: ownerId,
              type: "deal_update",
              title_ar: `تم ${verb} الصفقة`,
              title_en: `Deal ${verbEn}`,
              message_ar: `تم ${verb} الصفقة بخصوص ${location} من قِبل الإدارة${reason ? ` — السبب: ${reason}` : ""}`,
              message_en: `Deal ${verbEn} for ${location} by admin${reason ? ` — reason: ${reason}` : ""}`,
              entity_type: "deal_request",
              entity_id: requestId,
            });
          }
        }
      }

      // study_approved / study_rejected / study_changes_requested → developer
      if (["study_approved", "study_rejected", "study_changes_requested"].includes(targetPhase) && devUserId) {
        const studyLabel = targetPhase === "study_approved"
          ? { ar: "الدراسة مقبولة", en: "Study approved" }
          : targetPhase === "study_rejected"
            ? { ar: "الدراسة مرفوضة", en: "Study rejected" }
            : { ar: "تعديلات على الدراسة", en: "Study changes requested" };
        notifications.push({
          user_id: devUserId,
          type: "deal_update",
          title_ar: studyLabel.ar,
          title_en: studyLabel.en,
          message_ar: `${studyLabel.ar} — ${location}`,
          message_en: `${studyLabel.en} — ${location}`,
          entity_type: "deal_request",
          entity_id: requestId,
        });
      }

      if (notifications.length > 0) {
        const { error: notifErr } = await adminClient
          .from("notifications")
          .insert(notifications);
        if (notifErr) {
          // Don't fail the transition on notification failure — log so
          // an operator can spot persistent breakage.
          console.warn(
            `[transition-deal-phase] notification insert failed for ${requestId}:`,
            notifErr.message,
          );
        }
      }
    } catch (notifyErr) {
      const m = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
      console.warn(`[transition-deal-phase] notify block threw for ${requestId}:`, m);
    }

    // ── P0.3 — Terminal-state file cleanup ────────────────────
    // When a deal reaches closed_lost or cancelled, the sensitive
    // study files uploaded to deal-studies bucket for this request
    // become orphans: no page in the app will render them, but
    // they continue consuming storage AND — more importantly —
    // anyone with a previously-issued signed URL can still read
    // them until its TTL expires.
    //
    // The right behavior is to remove them atomically with the
    // transition. closed_won is NOT cleaned up because the studies
    // are part of the deal audit trail.
    if (targetPhase === "closed_lost" || targetPhase === "cancelled") {
      try {
        // List everything under {requestId}/ in deal-studies bucket
        const { data: objects } = await adminClient.storage
          .from("deal-studies")
          .list(requestId, { limit: 1000 });
        if (objects && objects.length > 0) {
          const paths = objects.map((o) => `${requestId}/${o.name}`);
          const { error: rmErr } = await adminClient.storage
            .from("deal-studies")
            .remove(paths);
          if (rmErr) {
            console.warn(
              `[transition-deal-phase] file cleanup warning for ${requestId}:`,
              rmErr.message,
            );
          } else {
            // Mark the deal_studies rows as file_purged so the UI can
            // indicate the file is gone — we keep the metadata row.
            await adminClient
              .from("deal_studies")
              .update({
                file_url: "__purged__",
                notes: `${"Files purged on ".padStart(16, " ")}${new Date().toISOString()} (phase=${targetPhase})`,
              })
              .eq("deal_request_id", requestId);
          }
        }
      } catch (cleanupErr) {
        // Never fail the transition because of cleanup — just log.
        const m = cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr);
        console.warn(`[transition-deal-phase] cleanup threw for ${requestId}:`, m);
      }
    }

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
