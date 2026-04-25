/**
 * Safe storage filename derivation.
 *
 * Problem this solves:
 *   `file.name.split(".").pop()` trusts the caller's filename — "evil.php.jpg"
 *   returns "jpg" but "evil.jpg.php" returns "php" (unsafelisted); a file with
 *   no dot at all returns the entire filename as "ext". That extension then
 *   gets embedded in the storage path, which ultimately hits a CDN where the
 *   wrong extension can flip content-type sniffing and serve user-controlled
 *   HTML/SVG inline as same-origin assets.
 *
 * The fix:
 *   - validate MIME against an explicit safelist (fail hard on anything else)
 *   - derive the extension from the VALIDATED MIME, never from filename
 *   - strip any path-ish characters from the filename stem entirely
 */

export const SAFE_IMAGE_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const SAFE_PDF_MIMES: Record<string, string> = {
  "application/pdf": "pdf",
};

export const SAFE_DOC_MIMES: Record<string, string> = {
  ...SAFE_PDF_MIMES,
  ...SAFE_IMAGE_MIMES,
};

export class UnsafeFileTypeError extends Error {
  constructor(public readonly receivedMime: string, public readonly receivedName: string) {
    super(`Unsupported file type: ${receivedMime || "(blank)"} from "${receivedName}"`);
    this.name = "UnsafeFileTypeError";
  }
}

/**
 * Generate a safe storage path component. Never embeds any part of the
 * user-supplied filename — only a random token plus the safelisted
 * extension derived from the validated MIME.
 *
 * @throws UnsafeFileTypeError if the file's MIME isn't in the safelist.
 */
export function buildSafeStoragePath(
  folder: string,
  file: File,
  allowedMimes: Record<string, string>,
): string {
  const mime = (file.type || "").toLowerCase();
  const ext = allowedMimes[mime];
  if (!ext) throw new UnsafeFileTypeError(mime, file.name);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  // Sanitize folder to a simple path segment set.
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\/+/g, "/");
  return `${safeFolder}/${token}.${ext}`;
}

/**
 * Convenience wrapper when the caller just wants an extension, not a
 * full path (e.g., they have their own folder/ID convention).
 *
 * @throws UnsafeFileTypeError if the file's MIME isn't in the safelist.
 */
export function safeExtension(file: File, allowedMimes: Record<string, string>): string {
  const mime = (file.type || "").toLowerCase();
  const ext = allowedMimes[mime];
  if (!ext) throw new UnsafeFileTypeError(mime, file.name);
  return ext;
}
