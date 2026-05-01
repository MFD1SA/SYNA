/**
 * extractEdgeError — pulls the real error message out of a Supabase
 * Functions error.
 *
 * Why this exists:
 *   When an edge function returns a non-2xx response, supabase-js v2
 *   wraps it in `FunctionsHttpError` whose `.message` is always the
 *   useless generic string `"Edge Function returned a non-2xx status
 *   code"`. The actual body — our `{ error: "Transition not allowed" }`
 *   payload — sits on `error.context`, a Response object the caller
 *   must read explicitly. Without this helper that body is silently
 *   dropped and the user sees the generic wrapper.
 *
 * Usage:
 *   const { data, error } = await supabase.functions.invoke(...);
 *   if (error) {
 *     const detail = await extractEdgeError(error);
 *     return { success: false, error: detail };
 *   }
 *
 * The helper is tolerant: if the body isn't JSON, it falls back to
 * the raw text; if reading the body itself throws, it returns the
 * original message. It NEVER throws.
 */
export async function extractEdgeError(error: unknown): Promise<string> {
  if (!error) return "Operation failed";
  const err = error as { message?: string; context?: Response };

  // Path 1: FunctionsHttpError.context is a Response. Clone it before
  // reading so a downstream caller (Sentry, retry, etc.) can still
  // consume the original body if needed.
  if (err.context && typeof err.context.clone === "function") {
    try {
      const body = await err.context.clone().json();
      if (body && typeof body === "object") {
        const obj = body as { error?: unknown; message?: unknown; details?: unknown };
        if (typeof obj.error === "string" && obj.error.length > 0) return obj.error;
        if (typeof obj.message === "string" && obj.message.length > 0) return obj.message;
        if (typeof obj.details === "string" && obj.details.length > 0) return obj.details;
      }
    } catch {
      /* body not JSON — try as text */
    }
    try {
      const text = await err.context.clone().text();
      const trimmed = text?.trim();
      if (trimmed) return trimmed.slice(0, 500);
    } catch {
      /* body unreadable — fall through to message */
    }
  }

  return err.message || "Operation failed";
}

/**
 * One-liner helper for the recurring admin-pages pattern:
 *
 *   const res = await supabase.functions.invoke(...);
 *   if (res.error || res.data?.error) {
 *     throw new Error(await getInvokeErrorMessage(res));
 *   }
 *
 * Combines all three error sources into a single best-available string:
 *   1. `data.error`  — function returned HTTP 200 with `{error: "..."}` body
 *   2. `extractEdgeError(error)` — non-2xx body parsed out of FunctionsHttpError
 *   3. `error.message` — JS/network failure or final fallback
 */
export async function getInvokeErrorMessage(
  result: { data?: unknown; error?: unknown },
  fallback = "Operation failed",
): Promise<string> {
  const data = result.data as { error?: unknown } | undefined;
  if (data && typeof data === "object" && "error" in data && data.error) {
    return String(data.error);
  }
  if (result.error) {
    return await extractEdgeError(result.error) || fallback;
  }
  return fallback;
}
