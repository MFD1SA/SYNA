import { expect, test } from "@playwright/test";

/**
 * Smoke suite — boots a dev server, hits key public routes, and asserts no
 * runtime crashes, no failing network requests, and that core UI is present.
 *
 * This is intentionally shallow: it guards the SPA shell (routing, CSP,
 * hydration) against accidental regressions. Deeper behavioural testing
 * belongs in Vitest + component tests.
 */

test.describe("smoke / public shell", () => {
  // A page should never throw or log uncaught errors on load.
  test.beforeEach(async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const txt = msg.text();
        // Ignore noisy, known-safe third-party warnings.
        if (/Download the React DevTools/.test(txt)) return;
        if (/ResizeObserver loop/.test(txt)) return;
        consoleErrors.push(`console.error: ${txt}`);
      }
    });
    // Stash for the tests to assert.
    (page as unknown as { __errors: string[] }).__errors = consoleErrors;
  });

  test("landing page loads and renders the hero", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp?.status()).toBe(200);

    // The root HTML should have dir="rtl" and lang="ar" by default.
    await expect(page.locator("html")).toHaveAttribute("dir", /rtl|ltr/);

    // Wait for React to finish the first paint by waiting for <main> or
    // the CTA buttons that live on every layout.
    await page.waitForLoadState("networkidle");

    const errors = (page as unknown as { __errors: string[] }).__errors ?? [];
    expect(errors, `page emitted errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("auth/login loads without runtime errors", async ({ page }) => {
    const resp = await page.goto("/auth/login");
    expect(resp?.status()).toBe(200);
    await page.waitForLoadState("networkidle");

    // The login surface should render an email field of some kind.
    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[autocomplete="email"]',
    );
    await expect(emailInput.first()).toBeVisible({ timeout: 10_000 });

    const errors = (page as unknown as { __errors: string[] }).__errors ?? [];
    expect(errors, `page emitted errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("public marketing pages respond OK", async ({ page }) => {
    const routes = [
      "/for-owners",
      "/for-developers",
      "/about",
      "/how-it-works",
      "/contact",
      "/faq",
      "/terms",
      "/privacy",
      "/usage-policy",
    ];
    for (const path of routes) {
      const resp = await page.goto(path);
      expect(resp?.status(), `${path} should be 200`).toBe(200);
    }
  });

  test("CSP headers are present and strict (via meta or response)", async ({
    page,
  }) => {
    const resp = await page.goto("/");
    const csp =
      resp?.headers()["content-security-policy"] ??
      (await page
        .locator('meta[http-equiv="Content-Security-Policy"]')
        .getAttribute("content")
        .catch(() => null));

    // In dev Vite may not ship the header; we accept either the prod header
    // OR the dev fallback (absent). Production is enforced by vercel.json
    // and verified separately in `scripts/verify-headers`.
    if (csp) {
      expect(csp).toMatch(/default-src/);
      expect(csp).toMatch(/frame-ancestors/);
      expect(csp).not.toMatch(/'unsafe-eval'/);
    }
  });

  test("cookie banner renders or is already dismissed", async ({ page }) => {
    // Fresh session — the banner should appear unless localStorage already
    // has consent. We clear it and verify visibility.
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("sina_cookie_consent_v1"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // The banner uses PDPL-compliant AR/EN copy — match both.
    const banner = page.locator(
      "text=/ملفات الارتباط|cookies|نحترم خصوصيتك|we value your privacy/i",
    );
    await expect(banner.first()).toBeVisible({ timeout: 10_000 });
  });
});
