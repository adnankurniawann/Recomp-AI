/**
 * The one return shape of every server action (PRD §13).
 * `message` is Indonesian and safe to show to the student as is.
 */
export type ActionResult<T = Record<string, never>> =
  { ok: true; data: T } | { ok: false; error: ActionError };

export interface ActionError {
  code: ErrorCode;
  message: string;
  /** Field errors from Zod, keyed by dotted path ("skills.0.level"). Only for VALIDATION. */
  fields?: Record<string, string>;
}

/** Error codes from PRD §13.1 and §13.2, plus the generic ones every action can return. */
export const ERROR_MESSAGES = {
  // generic
  AUTH_REQUIRED: "Kamu perlu masuk dulu.",
  FORBIDDEN: "Kamu tidak punya akses untuk ini.",
  NOT_FOUND: "Data tidak ditemukan.",
  VALIDATION: "Ada isian yang belum sesuai. Cek lagi ya.",
  UNKNOWN: "Terjadi kesalahan. Coba lagi sebentar lagi.",

  // sign-in
  INVALID_CREDENTIALS: "Email atau password salah.",
  EMAIL_TAKEN: "Email ini sudah terdaftar. Coba masuk.",
  PROVIDER_DISABLED: "Masuk dengan Google belum aktif. Pakai email dulu ya.",

  // profile and onboarding
  USERNAME_TAKEN: "Username ini sudah dipakai. Coba yang lain.",
  MIN_ROLES: "Pilih minimal 1 role yang kamu minati.",
  MIN_SKILLS: "Pilih minimal 3 skill.",
  INCOMPLETE: "Profilmu belum lengkap. Selesaikan semua langkah dulu.",
  FILE_TOO_LARGE: "Ukuran gambar maksimal 2 MB.",

  // teams
  ALREADY_HAS_TEAM: "Kamu sudah punya tim untuk lomba ini.",
  SLOTS_EXCEED_MAX: "Total slot melebihi batas tim lomba.",
  NOT_LEADER: "Hanya ketua tim yang bisa melakukan ini.",
  NOT_MEMBER: "Kamu bukan anggota tim ini.",
  ROLE_FULL: "Role ini sudah penuh.",
  ROLE_NOT_FOUND: "Role tidak ditemukan.",
  ROLE_HAS_MEMBERS:
    "Role ini masih punya anggota. Pindahkan anggotanya dulu sebelum menghapus role atau mengurangi slot.",

  // invites
  ALREADY_PENDING: "Masih ada undangan yang menunggu respon untuk orang ini.",
  CANDIDATE_HAS_TEAM: "Kandidat ini sudah punya tim untuk lomba ini.",
  HAS_TEAM: "Kamu sudah punya tim untuk lomba ini.",
  NOT_PENDING: "Undangan ini sudah tidak menunggu respon.",

  // learning
  ALREADY_ANSWERED: "Soal ini sudah kamu jawab.",
  NO_ACCESS: "Buka kursus ini dulu untuk melanjutkan.",
  INVALID_CODE: "Kode promo tidak dikenal.",
  QUOTA_EXCEEDED: "Kuota kode promo ini sudah habis.",
  EXPIRED: "Kode promo ini sudah tidak berlaku.",
  MAX_ATTEMPTS: "Kamu sudah mengirim jawaban 3 kali.",

  // mentors
  SLOT_TAKEN: "Jadwal ini sudah dipesan. Pilih jadwal lain.",
  ALREADY_PAID: "Booking ini sudah dibayar.",

  // AI
  RATE_LIMITED: "Batas 10 permintaan AI per jam tercapai. Coba lagi nanti.",
  NO_CANDIDATES: "Belum ada kandidat untuk role ini.",
  AI_UNAVAILABLE: "Fitur AI sedang tidak aktif.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: ErrorCode,
  message: string = ERROR_MESSAGES[code],
  fields?: Record<string, string>,
): ActionResult<T> {
  return { ok: false, error: fields ? { code, message, fields } : { code, message } };
}

/** Turn Zod issues into a VALIDATION failure with one message per field. */
export function failValidation<T = never>(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): ActionResult<T> {
  return fail("VALIDATION", ERROR_MESSAGES.VALIDATION, issuesToFields(issues));
}

export function issuesToFields(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

export function isErrorCode(value: string): value is ErrorCode {
  return Object.hasOwn(ERROR_MESSAGES, value);
}

/**
 * Map a Postgres error from Supabase to a failure the student can read.
 * SQL functions raise `P0001` with an ErrorCode as the message (see supabase/migrations).
 */
export function failFromDb<T = never>(error: { code?: string; message: string }): ActionResult<T> {
  switch (error.code) {
    case "P0001":
      return isErrorCode(error.message) ? fail(error.message) : fail("UNKNOWN");
    case "23514": // check_violation
    case "23503": // foreign_key_violation
    case "22P02": // invalid_text_representation
      return fail("VALIDATION");
    case "42501": // insufficient_privilege, including RLS
      return fail("FORBIDDEN");
    default:
      return fail("UNKNOWN");
  }
}
