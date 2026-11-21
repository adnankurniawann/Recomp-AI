/**
 * The embed URL for a lesson video (PRD F-LRN-03: video embed in the lesson). Only YouTube and
 * Vimeo links become an iframe, using YouTube's no-cookie domain; anything else gives null and the
 * player shows a plain link instead.
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const id = (s: string | null | undefined) => (s && /^[\w-]{6,20}$/.test(s) ? s : null);

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.pathname === "/watch" ? u.searchParams.get("v") : u.pathname.split("/")[2];
    const ok = id(v);
    return ok ? `https://www.youtube-nocookie.com/embed/${ok}` : null;
  }
  if (host === "youtu.be") {
    const ok = id(u.pathname.slice(1));
    return ok ? `https://www.youtube-nocookie.com/embed/${ok}` : null;
  }
  if (host === "vimeo.com") {
    const v = u.pathname.slice(1);
    return /^\d{5,12}$/.test(v) ? `https://player.vimeo.com/video/${v}` : null;
  }
  return null;
}
