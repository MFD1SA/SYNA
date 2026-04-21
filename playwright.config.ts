import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration — smoke-test layer on top of the Vitest unit suite.
 *
 * Goals (kept deliberately minimal):
 *  • Verify the landing page loads, cookie banner renders, and core nav works.
 *  • Verify the auth page loads without runtime errors.
 *  • Catch accidental 500s in the SPA shell, routing, and CSP regressions.
 *
 * We do NOT exercise live Supabase in CI — the smoke tests hit the SPA shell
 * only. Integration coverage lives in Vitest (+ future MSW harness).
 *
 * Run locally:   npm run test:e2e
 * Run in CI:     npm run test:e2e:ci  (uses the dev server on :8080)
 */

const PORT = Number(process.env.E2E_PORT ?? 8080);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ar-SA",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Only start a dev server when there isn't one already running (local dev).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
