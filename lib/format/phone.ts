/** Matches the `profile_contacts.whatsapp` check in the database: +62 then 8 to 13 digits. */
export const NORMALIZED_PHONE = /^\+62[0-9]{8,13}$/;

/**
 * Normalise an Indonesian WhatsApp number to `+62…` (PRD F-PRF-01 step 4).
 * Accepts `08…`, `62…` and `+62…`, with spaces, dashes, dots or brackets in between.
 * Returns null when the input isn't a valid Indonesian number.
 */
export function normalizePhone(input: string): string | null {
  const compact = input.trim().replace(/[\s\-.()]/g, "");
  if (!/^\+?[0-9]+$/.test(compact)) return null;

  let normalized: string;
  if (compact.startsWith("+62")) normalized = compact;
  else if (compact.startsWith("62")) normalized = `+${compact}`;
  else if (compact.startsWith("0")) normalized = `+62${compact.slice(1)}`;
  else return null;

  return NORMALIZED_PHONE.test(normalized) ? normalized : null;
}

/** The "Chat di WhatsApp" link for a normalised `+62…` number: `https://wa.me/62…`. */
export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}
