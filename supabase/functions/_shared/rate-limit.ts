// Shared rate-limit helper for edge functions.
//
// Usage:
//   const gate = await checkRateLimit(supabase, {
//     key: `send-contact:ip:${clientIp}`,
//     windowSeconds: 3600,
//     maxHits: 5,
//   });
//   if (!gate.allowed) return rateLimited(corsHeaders);
//
// The underlying RPC (`public.check_rate_limit`) is SECURITY DEFINER, inserts
// a hit row on every call, and returns `false` when the key already has
// >= maxHits within the window. Fail-open on RPC error — we never want
// rate-limiting to take down a legitimate request path. Errors are logged.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitOptions {
  /** Stable identifier for the bucket (prefix:dimension:value). */
  key: string;
  /** Sliding window in seconds. */
  windowSeconds: number;
  /** Max allowed hits within the window before denial. */
  maxHits: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Set when the RPC itself failed — treated as allowed (fail-open). */
  degraded?: boolean;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: opts.key,
      p_window_seconds: opts.windowSeconds,
      p_max_hits: opts.maxHits,
    });
    if (error) {
      console.error("[rate-limit] rpc error (fail-open)", error, { key: opts.key });
      return { allowed: true, degraded: true };
    }
    return { allowed: data === true };
  } catch (err) {
    console.error("[rate-limit] unexpected error (fail-open)", err, { key: opts.key });
    return { allowed: true, degraded: true };
  }
}

/** Extracts the best-available client IP from common proxy headers. */
export function clientIpFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Standard 429 response builder — caller supplies cors headers. */
export function rateLimited(
  corsHeaders: HeadersInit,
  retryAfterSeconds = 60,
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      error_code: "rate_limited",
      retry_after_seconds: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        ...corsHeaders,
      },
    },
  );
}
