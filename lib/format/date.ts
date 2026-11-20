const TZ = "Asia/Jakarta";

/** Today's date in Jakarta as ISO, "2026-11-19". Deadlines are Jakarta dates. */
export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
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
