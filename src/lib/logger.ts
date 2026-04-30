/**
 * Central logger.
 * ───────────────────────────────────────────────────────────────────────
 * Wraps `console.*` so production builds drop debug/info noise but still
 * surface real errors. Designed to be a near-drop-in replacement for
 * `console.X(...)` so a sweep across services is mechanical:
 *
 *   - log.debug(...)   → only in dev (Vite mode === "development")
 *   - log.info(...)    → only in dev
 *   - log.warn(...)    → always (cheap, occasionally useful in prod)
 *   - log.error(...)   → always; in prod also forwarded to Sentry if wired
 *
 * Why this matters:
 *   1. Many services (brokerage, NDA, identity-reveal) previously called
 *      `console.error(..., error)` passing the full Supabase error object.
 *      That object frequently includes the failing row's PII (foreign-key
 *      values, column data) — a privacy leak in any browser devtools that
 *      gets forwarded to a screen recording / external error reporter.
 *   2. Production console floods make it harder to spot real failures.
 *
 * Convention: pass a SHORT message + optional structured fields. Avoid
 * passing whole DB rows; pass row.id only.
 *
 *   GOOD:  log.error("nda fetch failed", { land_id: id, code: e.code });
 *   BAD:   log.error("nda fetch failed", error);   // dumps the row
 */

// Vite exposes import.meta.env at build time.
const IS_DEV = import.meta.env?.DEV === true || import.meta.env?.MODE === "development";

type LogPayload = Record<string, unknown> | string | number | boolean | null | undefined;

function fmt(args: unknown[]): unknown[] {
  // Light scrub: if a Supabase PostgrestError-shaped object is passed,
  // keep only safe metadata. This is best-effort, not a guarantee —
  // callers should still avoid passing full error objects.
  return args.map((a) => {
    if (a && typeof a === "object" && "message" in a && "code" in a) {
      const e = a as { message?: unknown; code?: unknown; hint?: unknown; details?: unknown };
      return { message: e.message, code: e.code, hint: e.hint, details: e.details };
    }
    return a;
  });
}

export const log = {
  /** Verbose — dev only. */
  debug(message: string, ...rest: LogPayload[]): void {
    if (!IS_DEV) return;
    // eslint-disable-next-line no-console
    console.debug(`[debug] ${message}`, ...fmt(rest));
  },

  /** Informational — dev only. */
  info(message: string, ...rest: LogPayload[]): void {
    if (!IS_DEV) return;
    // eslint-disable-next-line no-console
    console.info(`[info] ${message}`, ...fmt(rest));
  },

  /** Recoverable issue — kept in production. */
  warn(message: string, ...rest: LogPayload[]): void {
    // eslint-disable-next-line no-console
    console.warn(`[warn] ${message}`, ...fmt(rest));
  },

  /** Real error — always logged; Sentry will pick it up via the global
   *  unhandled-error handler, so we DON'T also forward here to avoid
   *  double-reporting. */
  error(message: string, ...rest: LogPayload[]): void {
    // eslint-disable-next-line no-console
    console.error(`[error] ${message}`, ...fmt(rest));
  },
};

export default log;
