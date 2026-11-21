const TZ = "Asia/Jakarta";

/** Today's date in Jakarta as ISO, "2026-11-19". Deadlines are Jakarta dates. */
export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/**
 * How long ago, in short Indonesian: "baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu".
 * From 7 days on it gives the date, "12 Nov 2026" (Jakarta time).
 */
export function formatRelativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(todayIso(then));
}

/** "2026-12-01" → "1 Des 2026". `year: false` gives "1 Des". */
export function formatDate(iso: string, { year = true } = {}): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(year && { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** A mentor slot in Jakarta time, "Sab 28 Nov 19.00" (PRD §10.9). */
export function formatSlot(iso: string): string {
  const parts = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("hour")}.${get("minute")}`;
}
