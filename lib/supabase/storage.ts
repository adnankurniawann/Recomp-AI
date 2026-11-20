/** Public buckets from migration 0003. Files there are served by URL without a session. */
export type PublicBucket = "guidebooks" | "posters" | "portfolio" | "mentors";

/**
 * The public URL of a Storage object, built without a client so Server and Client Components can
 * both use it. Returns null when there is no path or Supabase isn't configured.
 */
export function publicStorageUrl(
  bucket: PublicBucket,
  path: string | null | undefined,
  baseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string | null {
  if (!path || !baseUrl) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encoded}`;
}
