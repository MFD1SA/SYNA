/**
 * URL safety utilities for cases where user-submitted URLs are rendered
 * back to other users as clickable links.
 *
 * The insertion path is usually the first gate (Zod schemas, server-side
 * validation), but old rows, legacy imports, and future API surfaces
 * mean we can't assume every URL we read is safe. This helper gives a
 * defence-in-depth filter at render time.
 *
 * Rules:
 *   - must parse
 *   - must be http: or https: (blocks javascript:, data:, vbscript:, file:)
 *   - must not carry userinfo (user:pass@host) — never legitimate for
 *     document shares and a known phishing/open-redirect vector
 *   - optional hostname safelist — if provided, hostname must match exactly
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export interface SafeUrlOptions {
  /** If set, URL hostname must be in this allowlist (exact match). */
  allowedHosts?: Set<string> | string[];
  /** Require https specifically (rejects http). Default true. */
  httpsOnly?: boolean;
}

/**
 * Returns the URL string as-is if it passes all safety rules, or null otherwise.
 * Callers rendering href attributes should fall back to a safe placeholder
 * ("#" or a disabled state) on null.
 */
export function sanitizeHref(
  raw: string | null | undefined,
  options: SafeUrlOptions = {},
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }

  if (!SAFE_PROTOCOLS.has(u.protocol)) return null;
  if ((options.httpsOnly ?? true) && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;

  if (options.allowedHosts) {
    const hosts = options.allowedHosts instanceof Set
      ? options.allowedHosts
      : new Set(options.allowedHosts);
    if (!hosts.has(u.hostname)) return null;
  }

  return u.toString();
}

/**
 * Specifically for Google Drive / Docs share links rendered in the CRM.
 * Kept here so all call sites agree on the allowlist.
 */
export const DRIVE_ALLOWED_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
]);

export function sanitizeDriveHref(raw: string | null | undefined): string | null {
  return sanitizeHref(raw, { allowedHosts: DRIVE_ALLOWED_HOSTS, httpsOnly: true });
}
