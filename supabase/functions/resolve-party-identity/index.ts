import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

/* ── CORS ── */
const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const h = url.hostname.toLowerCase();
    return h === allowedRootDomain || h.endsWith(`.${allowedRootDomain}`) || h === "localhost";
  } catch { return false; }
};
const resolveSafeOrigin = (o: string | null) => isAllowedOrigin(o) ? o! : publicSiteUrl;
const buildCorsHeaders = (o: string | null) => ({
  "Access-Control-Allow-Origin": resolveSafeOrigin(o),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

/* ── Reveal Level Matrix ── */

type RevealLevel = "anonymous" | "brand_visible" | "full";
type Phase = string;
type ViewerRole = "developer" | "owner" | "admin";

function computeRevealLevel(
  phase: Phase,
  viewerRole: ViewerRole,
  viewingParty: "developer" | "owner",
): RevealLevel {
  // Terminal states: no new reveals
  if (phase === "closed_lost" || phase === "cancelled") return "anonymous";

  // Admin sees everything
  if (viewerRole === "admin") return "full";

  // Owner viewing developer
  if (viewerRole === "owner" && viewingParty === "developer") {
    if (phase === "nda_pending" || phase === "nda_developer_accepted") return "anonymous";
    if (phase === "nda_both_accepted" || phase === "under_review" || phase === "study_required") return "brand_visible";
    return "anonymous";
  }

  // Developer viewing owner: ALWAYS anonymous until final agreement
  // (full reveal requires a future phase like "deal_closed" which doesn't exist yet)
  if (viewerRole === "developer" && viewingParty === "owner") {
    return "anonymous";
  }

  return "anonymous";
}

/* ── Fields per reveal level ── */

// Developer fields revealed to owner
function filterDeveloperFields(dev: Record<string, unknown>, level: RevealLevel): Record<string, unknown> {
  if (level === "anonymous") {
    return {
      verification_status: dev.verification_status,
      project_types: dev.project_types,
    };
  }
  if (level === "brand_visible") {
    return {
      marketing_brand_name: dev.marketing_brand_name,
      company_name: dev.company_name,
      verification_status: dev.verification_status,
      website: dev.website,
      project_types: dev.project_types,
      city: dev.city,
    };
  }
  // full
  return {
    company_name: dev.company_name,
    marketing_brand_name: dev.marketing_brand_name,
    contact_person_name: dev.contact_person_name,
    email: dev.email,
    phone: dev.phone,
    website: dev.website,
    verification_status: dev.verification_status,
    project_types: dev.project_types,
    city: dev.city,
    cr_number: dev.cr_number,
  };
}

// Owner fields revealed to developer
function filterOwnerFields(owner: Record<string, unknown>, level: RevealLevel): Record<string, unknown> {
  if (level === "anonymous") {
    // Nothing identifiable
    return {};
  }
  if (level === "brand_visible") {
    // Still nothing for owner — owner stays anonymous until full
    return {};
  }
  // full — only after final agreement
  return {
    owner_name: owner.owner_name,
    full_name: owner.full_name,
    email: owner.email,
    phone: owner.phone,
  };
}

/* ── Main handler ── */

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = buildCorsHeaders(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Auth
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { request_ids } = await req.json();
    if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0) {
      return new Response(JSON.stringify({ error: "request_ids array required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Cap batch size
    const ids = request_ids.slice(0, 50);

    // Determine viewer role
    const [adminCheck, ownerCheck, devCheck] = await Promise.all([
      sb.from("admin_roles").select("id").eq("user_id", user.id).maybeSingle(),
      sb.from("lands").select("id").eq("owner_id", user.id).limit(1),
      sb.from("developers").select("id").eq("user_id", user.id).maybeSingle(),
    ]);

    let viewerRole: ViewerRole = "developer";
    if (adminCheck.data) viewerRole = "admin";
    else if (ownerCheck.data && ownerCheck.data.length > 0) viewerRole = "owner";
    else if (devCheck.data) viewerRole = "developer";

    // Fetch requests with related data
    const { data: requests, error: reqErr } = await sb
      .from("deal_requests")
      .select("id, current_phase, developer_id, land_id, developer_nda_status, owner_nda_status, identity_reveal_level")
      .in("id", ids);

    if (reqErr) throw reqErr;
    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ identities: {} }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Gather unique developer_ids and land_ids
    const devIds = [...new Set(requests.map(r => r.developer_id))];
    const landIds = [...new Set(requests.map(r => r.land_id))];

    // Fetch developer data + land/owner data
    const [devRes, landRes, profileRes] = await Promise.all([
      sb.from("developers").select("id, company_name, marketing_brand_name, contact_person_name, email, phone, website, verification_status, project_types, city, cr_number").in("id", devIds),
      sb.from("lands").select("id, owner_id, owner_name").in("id", landIds),
      // Get owner profiles for full reveal
      sb.from("profiles").select("user_id, full_name, email, phone").in("user_id",
        (await sb.from("lands").select("owner_id").in("id", landIds)).data?.map(l => l.owner_id) || []
      ),
    ]);

    const devMap: Record<string, Record<string, unknown>> = {};
    devRes.data?.forEach(d => { devMap[d.id] = d; });

    const landMap: Record<string, Record<string, unknown>> = {};
    landRes.data?.forEach(l => { landMap[l.id] = l; });

    const profileMap: Record<string, Record<string, unknown>> = {};
    profileRes.data?.forEach(p => { profileMap[p.user_id] = p; });

    // Build response + log reveals
    const identities: Record<string, {
      reveal_level_for_developer: RevealLevel;
      reveal_level_for_owner: RevealLevel;
      developer: Record<string, unknown>;
      owner: Record<string, unknown>;
    }> = {};

    const logsToInsert: Array<Record<string, unknown>> = [];
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
    const ua = req.headers.get("user-agent") || "";

    for (const r of requests) {
      const dev = devMap[r.developer_id] || {};
      const land = landMap[r.land_id] || {};
      const ownerProfile = profileMap[(land as any).owner_id] || {};
      const ownerData = { ...land, ...ownerProfile };

      // Compute reveal levels
      const devRevealLevel = computeRevealLevel(r.current_phase, viewerRole, "developer");
      const ownerRevealLevel = computeRevealLevel(r.current_phase, viewerRole, "owner");

      // Filter fields
      const filteredDev = viewerRole === "owner" || viewerRole === "admin"
        ? filterDeveloperFields(dev, devRevealLevel)
        : {}; // Developer doesn't need to see their own filtered data

      const filteredOwner = viewerRole === "developer" || viewerRole === "admin"
        ? filterOwnerFields(ownerData, ownerRevealLevel)
        : {}; // Owner doesn't need to see their own filtered data

      identities[r.id] = {
        reveal_level_for_developer: devRevealLevel,
        reveal_level_for_owner: ownerRevealLevel,
        developer: filteredDev,
        owner: filteredOwner,
      };

      // Log the reveal (only for non-anonymous reveals or if admin)
      const relevantLevel = viewerRole === "owner" ? devRevealLevel : ownerRevealLevel;
      const relevantParty = viewerRole === "owner" ? "developer" : "owner";
      const revealedFields = viewerRole === "owner" ? Object.keys(filteredDev) : Object.keys(filteredOwner);

      if (relevantLevel !== "anonymous" || viewerRole === "admin") {
        logsToInsert.push({
          deal_request_id: r.id,
          viewer_user_id: user.id,
          viewer_role: viewerRole,
          revealed_party: relevantParty,
          reveal_level: relevantLevel,
          fields_revealed: revealedFields,
          trigger_event: "identity_request",
          current_phase: r.current_phase,
          ip_address: ip,
          user_agent: ua,
        });
      }
    }

    // Batch insert logs
    if (logsToInsert.length > 0) {
      await sb.from("identity_reveal_log").insert(logsToInsert);
    }

    return new Response(JSON.stringify({ identities, viewer_role: viewerRole }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
