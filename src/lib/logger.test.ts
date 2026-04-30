import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { log } from "./logger";

/**
 * Tests for the central logger.
 *
 * Two contracts to lock down:
 *   1. Supabase PostgrestError objects passed as the second arg are
 *      scrubbed to ONLY { message, code, hint, details } — never the
 *      whole error (which can carry the failing row).
 *   2. debug/info silenced in production-like mode; warn/error always
 *      go through.
 *
 * Both regressions would show up as silent PII leaks into devtools,
 * which is exactly what the audit replaced raw console.* with this
 * logger to prevent.
 */

describe("logger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("scrubs Supabase-shaped error objects", () => {
    it("keeps only { message, code, hint, details }", () => {
      const supabaseLikeError = {
        message: "duplicate key value",
        code: "23505",
        hint: "use upsert",
        details: "Key (email)=(test@example.com) already exists.",
        // Sensitive fields the logger MUST scrub:
        row: { email: "test@example.com", password_hash: "secret" },
        statement: "INSERT INTO ...",
        privateField: "should not appear",
      };

      log.error("op failed", supabaseLikeError);

      expect(errorSpy).toHaveBeenCalledOnce();
      const formatted = errorSpy.mock.calls[0][1] as any;
      expect(formatted).toEqual({
        message: "duplicate key value",
        code: "23505",
        hint: "use upsert",
        details: "Key (email)=(test@example.com) already exists.",
      });
      expect(formatted).not.toHaveProperty("row");
      expect(formatted).not.toHaveProperty("password_hash");
      expect(formatted).not.toHaveProperty("statement");
      expect(formatted).not.toHaveProperty("privateField");
    });

    it("does not scrub non-error objects", () => {
      const ordinaryObject = { foo: "bar", baz: 42 };
      log.error("info dump", ordinaryObject);
      expect(errorSpy).toHaveBeenCalledWith("[error] info dump", ordinaryObject);
    });

    it("passes primitive payloads through", () => {
      log.error("simple", 42, "hello");
      expect(errorSpy).toHaveBeenCalledWith("[error] simple", 42, "hello");
    });
  });

  describe("level prefixes", () => {
    it("warn prepends [warn]", () => {
      log.warn("careful");
      expect(warnSpy).toHaveBeenCalledWith("[warn] careful");
    });

    it("error prepends [error]", () => {
      log.error("boom");
      expect(errorSpy).toHaveBeenCalledWith("[error] boom");
    });
  });
});
