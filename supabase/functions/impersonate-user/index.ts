import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === allowedRootDomain || hostname.endsWith(`.${allowedRootDomain}`);
  } catch {
    return false;
  }
};

const resolveSafeOrigin = (origin: string | null) => {
  if (isAllowedOrigin(origin)) return origin!;
  return publicSiteUrl;
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": resolveSafeOrigin(origin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");

    const { target_user_id } = await req.json();
    if (!target_user_id || typeof target_user_id !== "string") {
      throw new Error("target_user_id required");
    }

    const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(target_user_id);
    if (userError || !targetUser?.user?.email) throw new Error("User not found");
    if (target_user_id === caller.id) throw new Error("Cannot impersonate your own account");

    const { data: targetRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id)
      .eq("role", "admin")
      .maybeSingle();

    if (targetRole) {
      throw new Error("Admin impersonation is not allowed");
    }

    // Generate magic link
    const { data: magicLink, error: mlError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email,
      options: { redirectTo: publicSiteUrl },
    });

    if (mlError || !magicLink.properties?.hashed_token) throw new Error(mlError?.message ?? "Failed to generate magic link");

    const tokenHash = magicLink.properties.hashed_token;

    // Verify the token SERVER-SIDE via POST to get session tokens directly
    // This avoids relying on Supabase's redirect (which goes to the Site URL = localhost)
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
      },
      body: JSON.stringify({
        token_hash: tokenHash,
        type: "magiclink",
      }),
    });

    if (!verifyRes.ok) {
      const errBody = await verifyRes.text();
      console.error("Verify failed:", verifyRes.status, errBody);
      throw new Error("Failed to verify magic link token");
    }

    const session = await verifyRes.json();

    if (!session.access_token || !session.refresh_token) {
      throw new Error("Session tokens not returned from verification");
    }

    // Store the session tokens server-side with a ≤60s TTL and return
    // only the exchange_id to the admin browser. The callback page then
    // POSTs the exchange_id to `impersonate-exchange` which atomically
    // consumes the row and returns the tokens once.
    //
    // Why this replaces the old "tokens in URL fragment" approach:
    //   - Although URL fragments aren't sent to servers on navigation,
    //     they DO live inside this JSON response body — visible in browser
    //     devtools, network capture, and any error reporter that snapshots
    //     response payloads.
    //   - The UUID exchange_id alone is worthless after 60s or one use.
    const exchangeId = crypto.randomUUID();
    const { error: exchErr } = await adminClient
      .from("impersonation_exchanges")
      .insert({
        id: exchangeId,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        admin_user_id: caller.id,
        target_user_id,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      });
    if (exchErr) {
      console.error("impersonate-user exchange insert failed", exchErr);
      throw new Error("Failed to store exchange token");
    }

    // Audit log: record impersonation action server-side (mandatory — fail if not recorded)
    const { error: auditError } = await adminClient.from("audit_logs").insert({
      user_id: caller.id,
      user_email: caller.email,
      action: "impersonate_user",
      entity_type: "user",
      entity_id: target_user_id,
      details: {
        target_email: targetUser.user.email,
        exchange_id: exchangeId,
        timestamp: new Date().toISOString(),
      },
    });

    if (auditError) {
      throw new Error("Impersonation blocked: audit log failed");
    }

    // Verify URL carries ONLY the exchange_id in the fragment. No tokens
    // are in this response — the body is safe to log.
    // `email` is intentionally omitted: the admin already selected the
    // target by name on the previous page; returning it again is PII leakage.
    const redirectUrl = `${publicSiteUrl}/impersonate-callback#x=${encodeURIComponent(exchangeId)}`;
    return new Response(JSON.stringify({
      success: true,
      verify_url: redirectUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("impersonate-user error:", err.message);
    const safeMessages = [
      "Missing authorization", "Unauthorized", "Admin access required",
      "target_user_id required", "User not found",
      "Cannot impersonate your own account", "Admin impersonation is not allowed",
      "Impersonation blocked: audit log failed",
      "Failed to verify magic link token", "Session tokens not returned",
      "Failed to store exchange token",
    ];
    const message = safeMessages.some(m => err.message?.includes(m)) ? err.message : "Operation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
