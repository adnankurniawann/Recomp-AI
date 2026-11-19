import { z } from "zod";

export const HTTPS_URL_MESSAGE = "Tautan harus URL valid yang diawali https://";

/** True for an absolute https:// URL with a dotted host (PRD §14: user links are https only). */
export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export const httpsUrl = z
  .string()
  .trim()
  .max(500, "Tautan maksimal 500 karakter")
  .refine(isHttpsUrl, HTTPS_URL_MESSAGE);

/** An optional link from a form: an empty string becomes null. */
export const optionalHttpsUrl = z
  .string()
  .trim()
  .max(500, "Tautan maksimal 500 karakter")
  .refine((v) => v === "" || isHttpsUrl(v), HTTPS_URL_MESSAGE)
  .transform((v) => (v === "" ? null : v))
  .nullish()
  .transform((v) => v ?? null);

/** Optional free text: trimmed, and an empty string becomes null. */
export function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .nullish()
    .transform((v) => (v ? v : null));
}

export const uuid = z.uuid("ID tidak valid");
