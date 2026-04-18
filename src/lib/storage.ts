import { supabase } from "@/integrations/supabase/client";

/**
 * Central storage helpers.
 *
 * Two buckets:
 *   • `land-images`      — PUBLIC. Use `uploadPublicImage` and store the public URL.
 *   • `land-documents`   — PRIVATE. Use `uploadPrivateFile` and store the PATH
 *                          (NOT the URL). Call `openPrivateFile` to get a
 *                          short-lived signed URL when displaying/downloading.
 *
 * Legacy records may contain a full `getPublicUrl` string for a private bucket
 * (non-working link). `openPrivateFile` handles that too by extracting the
 * path out of the URL before signing.
 */

export type PrivateBucket = "land-documents";
export type PublicBucket = "land-images";

const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

const extFromName = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : "bin";
};

/**
 * Upload a private file. Returns the storage PATH (not a URL).
 * Path layout: `{ownerId}/{uuid}.{ext}` — aligns with RLS policy that
 * restricts writes to `(storage.foldername(name))[1] = auth.uid()::text`
 * for owners. For admin-uploaded files on behalf of an owner, pass the
 * owner's id as `ownerId`.
 */
export async function uploadPrivateFile(
  file: File,
  bucket: PrivateBucket,
  ownerId: string,
): Promise<string> {
  const path = `${ownerId}/${crypto.randomUUID()}.${extFromName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/**
 * Upload a public image. Returns the public URL, safe to store as-is.
 */
export async function uploadPublicImage(
  file: File,
  bucket: PublicBucket,
): Promise<string> {
  const path = `${crypto.randomUUID()}.${extFromName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Given either a storage path or a legacy (non-working) public URL for a
 * private bucket, return the path portion that can be signed.
 */
function toPath(pathOrUrl: string, bucket: PrivateBucket): string {
  if (!pathOrUrl) return pathOrUrl;
  // Already looks like a path
  if (!/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  // Extract after `/object/public/{bucket}/` or `/object/sign/{bucket}/` or `/object/{bucket}/`
  const markers = [
    `/object/public/${bucket}/`,
    `/object/sign/${bucket}/`,
    `/object/${bucket}/`,
  ];
  for (const m of markers) {
    const idx = pathOrUrl.indexOf(m);
    if (idx !== -1) {
      const after = pathOrUrl.slice(idx + m.length);
      // strip query string (e.g. ?token=...)
      const q = after.indexOf("?");
      return q === -1 ? after : after.slice(0, q);
    }
  }
  return pathOrUrl;
}

/**
 * Create a short-lived signed URL for a private file. Accepts either a path
 * or a legacy URL. Returns null on error (caller should toast).
 */
export async function openPrivateFile(
  pathOrUrl: string,
  bucket: PrivateBucket = "land-documents",
): Promise<string | null> {
  const path = toPath(pathOrUrl, bucket);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("openPrivateFile error:", error, { path, bucket });
    return null;
  }
  return data.signedUrl;
}

/**
 * Open a private file in a new tab. Convenience wrapper around
 * `openPrivateFile` + `window.open`.
 */
export async function openPrivateFileInTab(
  pathOrUrl: string,
  bucket: PrivateBucket = "land-documents",
): Promise<boolean> {
  const url = await openPrivateFile(pathOrUrl, bucket);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

/**
 * Remove a private file. Accepts either a path or a legacy URL.
 */
export async function removePrivateFile(
  pathOrUrl: string,
  bucket: PrivateBucket = "land-documents",
): Promise<void> {
  const path = toPath(pathOrUrl, bucket);
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
