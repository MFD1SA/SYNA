import { describe, it, expect } from "vitest";
import {
  buildSafeStoragePath,
  safeExtension,
  SAFE_IMAGE_MIMES,
  SAFE_PDF_MIMES,
  SAFE_DOC_MIMES,
  UnsafeFileTypeError,
} from "./storageSafe";

/**
 * Tests for the storage-path safety helpers.
 *
 * The promise these helpers make: NEVER trust file.name for the storage
 * extension, ALWAYS derive from the validated MIME. Anything outside
 * the safelist throws hard.
 *
 * Regressions here would silently re-open the path-spoof attack
 * (`evil.png.html` → stored as `.html` → CDN serves as text/html →
 * same-origin XSS). So this suite is a real security gate.
 */

const fakeFile = (name: string, mime: string, size = 1024): File => {
  // Vitest's jsdom environment has the File constructor, but we control
  // exactly what name + type the helper sees.
  return new File([new Uint8Array(size)], name, { type: mime });
};

describe("storageSafe.safeExtension", () => {
  it("derives ext from the validated MIME, ignoring file.name", () => {
    const f = fakeFile("evil.html.png", "image/png");
    expect(safeExtension(f, SAFE_IMAGE_MIMES)).toBe("png");
  });

  it("derives the same ext regardless of misleading filename", () => {
    const a = fakeFile("photo.HTML", "image/jpeg");
    const b = fakeFile("photo.exe", "image/jpeg");
    expect(safeExtension(a, SAFE_IMAGE_MIMES)).toBe("jpg");
    expect(safeExtension(b, SAFE_IMAGE_MIMES)).toBe("jpg");
  });

  it("rejects unknown MIME types hard", () => {
    expect(() => safeExtension(fakeFile("a.svg", "image/svg+xml"), SAFE_IMAGE_MIMES)).toThrow(UnsafeFileTypeError);
    expect(() => safeExtension(fakeFile("a.html", "text/html"), SAFE_DOC_MIMES)).toThrow(UnsafeFileTypeError);
    expect(() => safeExtension(fakeFile("a.exe", "application/x-msdownload"), SAFE_DOC_MIMES)).toThrow(UnsafeFileTypeError);
  });

  it("rejects empty/blank MIME (browser couldn't sniff)", () => {
    const f = fakeFile("photo.jpg", "");
    expect(() => safeExtension(f, SAFE_IMAGE_MIMES)).toThrow(UnsafeFileTypeError);
  });

  it("normalises MIME case", () => {
    // The helper lowercases internally; "IMAGE/PNG" should still resolve.
    const f = fakeFile("a.png", "IMAGE/PNG");
    expect(safeExtension(f, SAFE_IMAGE_MIMES)).toBe("png");
  });

  it("PDF safelist accepts only application/pdf", () => {
    expect(safeExtension(fakeFile("doc.pdf", "application/pdf"), SAFE_PDF_MIMES)).toBe("pdf");
    expect(() => safeExtension(fakeFile("doc.pdf", "image/png"), SAFE_PDF_MIMES)).toThrow(UnsafeFileTypeError);
  });
});

describe("storageSafe.buildSafeStoragePath", () => {
  it("emits a token-only stem with the safelist extension", () => {
    const f = fakeFile("anything.png", "image/png");
    const path = buildSafeStoragePath("uploads", f, SAFE_IMAGE_MIMES);
    expect(path).toMatch(/^uploads\/[A-Za-z0-9-]+\.png$/);
    expect(path).not.toContain("anything");
  });

  it("strips path-ish characters from the folder", () => {
    const f = fakeFile("a.png", "image/png");
    const path = buildSafeStoragePath("../etc/../uploads", f, SAFE_IMAGE_MIMES);
    expect(path).not.toContain("..");
  });

  it("collapses redundant slashes in the folder", () => {
    const f = fakeFile("a.png", "image/png");
    const path = buildSafeStoragePath("a//b///c", f, SAFE_IMAGE_MIMES);
    expect(path.startsWith("a/b/c/")).toBe(true);
  });

  it("rejects unsafe MIMEs before any path is generated", () => {
    const f = fakeFile("evil.svg", "image/svg+xml");
    expect(() => buildSafeStoragePath("uploads", f, SAFE_IMAGE_MIMES)).toThrow(UnsafeFileTypeError);
  });
});
