import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  it("joins simple class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values without emitting empty tokens", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves tailwind conflicts via tailwind-merge (last wins)", () => {
    // p-2 then p-4 → only p-4 survives
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("accepts conditional object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });
});
