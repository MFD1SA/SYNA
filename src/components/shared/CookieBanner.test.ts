import { describe, expect, it, beforeEach } from "vitest";
import { hasCookieConsent } from "./CookieBanner";

describe("hasCookieConsent()", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false when nothing is stored", () => {
    expect(hasCookieConsent()).toBe(false);
  });

  it("returns true after user accepts", () => {
    localStorage.setItem(
      "sina_cookie_consent_v1",
      JSON.stringify({ value: "accepted", at: Date.now() }),
    );
    expect(hasCookieConsent()).toBe(true);
  });

  it("returns false after user rejects — rejection is not consent", () => {
    localStorage.setItem(
      "sina_cookie_consent_v1",
      JSON.stringify({ value: "rejected", at: Date.now() }),
    );
    expect(hasCookieConsent()).toBe(false);
  });

  it("treats malformed storage payloads as no-consent (never throws)", () => {
    localStorage.setItem("sina_cookie_consent_v1", "not-json{{{");
    expect(hasCookieConsent()).toBe(false);
  });
});
