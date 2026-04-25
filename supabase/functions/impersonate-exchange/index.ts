// impersonate-exchange
//
// Second leg of the admin impersonation hand-off. The client (Impersonate
// Callback tab) POSTs the exchange_id it received in the URL fragment;
// we atomically consume the matching `impersonation_exchanges` row and
// return the access/refresh tokens once. A consumed or expired id is
// rejected with 410 Gone — the browser then shows an error instead of
// silently failing.
//
// verify_jwt is FALSE for this function: the impersonation tab has no
// session yet (that's literally what this call is fetching). Security
// relies entirely on:
//   - single-use atomic consume (RPC sets used_at in same UPDATE)
//   - 60s TTL
//   - UUID v4 unguessability
//   - the row only exists if impersonate-user (admin-verified) created it

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const { exchange_id } = await req.json();
    if (!exchange_id || typeof exchange_id !== "string" || !UUID_V4.test(exchange_id)) {
      return new Response(JSON.stringify({ error: "Invalid exchange_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminClient.rpc("consume_impersonation_exchange", {
      _id: exchange_id,
    });

    if (error) {
      console.error("consume_impersonation_exchange rpc error:", error);
      return new Response(JSON.stringify({ error: "Exchange failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The RPC returns SETOF — empty set means the row was already used or expired.
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!row) {
      return new Response(JSON.stringify({ error: "Exchange expired or already used" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      access_token: row.access_token,
      refresh_token: row.refresh_token,
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("impersonate-exchange error:", err?.message);
    return new Response(JSON.stringify({ error: "Exchange failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
