/**
 * Sentry wiring — opt-in via env.
 *
 * Reads `VITE_SENTRY_DSN` at build time. If absent, becomes a no-op so
 * local development and preview deployments stay silent and self-contained.
 * In production on cidoma.com, set `VITE_SENTRY_DSN` in the Vercel project
 * and Sentry starts collecting errors + tracing.
 *
 * Notes:
 * - We use BrowserTracing with sampleRate=0.1 (10%) to keep volume low.
 * - We scrub known PII-carrying query params (email/phone) before sending.
 * - Error Boundary integration lives in `src/components/shared/SentryErrorBoundary.tsx`.
 */

import * as Sentry from "@sentry/react";

export const SENTRY_ENABLED = !!import.meta.env.VITE_SENTRY_DSN;

export function initSentry(): void {
  if (!SENTRY_ENABLED) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE ?? "production",
    release: import.meta.env.VITE_APP_VERSION ?? "unknown",

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Light sampling keeps costs bounded; tune via env if needed.
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_RATE ?? 0.1),
    replaysSessionSampleRate: 0, // no session replay by default
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_ON_ERROR_RATE ?? 0.1),

    // PII scrubber — the BreadcrumbHint from fetch includes request URLs.
    // We strip sensitive query params before anything leaves the browser.
    beforeSend(event) {
      try {
        if (event.request?.url) {
          event.request.url = scrubUrl(event.request.url);
        }
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((b) => {
            if (b.data && typeof b.data.url === "string") {
              return { ...b, data: { ...b.data, url: scrubUrl(b.data.url) } };
            }
            return b;
          });
        }
      } catch {
        // Never let scrubbing itself break reporting.
      }
      return event;
    },

    ignoreErrors: [
      // Noise: extensions and user scripts that inject into our page.
      /ResizeObserver loop/i,
      /Non-Error promise rejection captured/i,
      // Firefox: benign network abort on navigation away.
      "NetworkError when attempting to fetch resource",
    ],
  });
}

/** Strip sensitive query params from URLs before they reach Sentry. */
function scrubUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of ["email", "phone", "token", "access_token", "refresh_token", "t"]) {
      if (u.searchParams.has(key)) u.searchParams.set(key, "[redacted]");
    }
    // Drop fragments entirely — they're how we pass impersonation tokens.
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

/** Manual capture helper — for error paths we catch explicitly. */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!SENTRY_ENABLED) {
    console.error(err, context);
    return;
  }
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

/** Set the user context once a session is known — no PII beyond user id. */
export function setSentryUser(userId: string | null): void {
  if (!SENTRY_ENABLED) return;
  Sentry.setUser(userId ? { id: userId } : null);
}
