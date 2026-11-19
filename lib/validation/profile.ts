import { z } from "zod";
import {
  COMP_CATEGORIES,
  COMP_RESULTS,
  GOALS,
  PREFERRED_ROLE_KEYS,
  WORK_TIMES,
} from "@/lib/constants";
import { normalizePhone } from "@/lib/format/phone";
import { httpsUrl, optionalHttpsUrl, optionalText, uuid } from "./common";

// Profile, skill, history, portfolio and contact inputs (PRD F-PRF-01..05, §13.1).
// The wizard steps and the /profil tabs validate with these same schemas, on the client and the server.

export const MIN_SKILLS = 3;
export const MAX_PREFERRED_ROLES = 3;

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "Username 3 sampai 20 karakter, hanya huruf kecil, angka, dan _");

const year = (label: string) =>
  z
    .number(`${label} wajib diisi`)
    .int(`${label} tidak valid`)
    .min(2015, `${label} paling awal 2015`)
    .max(2035, `${label} paling akhir 2035`);

// Step 1: Data diri ------------------------------------------------------------

export const identitySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama lengkap wajib diisi")
    .max(80, "Nama maksimal 80 karakter"),
  username,
  campus: z.string().trim().min(2, "Kampus wajib diisi").max(100, "Kampus maksimal 100 karakter"),
  major: z.string().trim().min(2, "Jurusan wajib diisi").max(100, "Jurusan maksimal 100 karakter"),
  entryYear: year("Angkatan"),
  bio: optionalText(280, "Bio maksimal 280 karakter"),
});
export type IdentityInput = z.input<typeof identitySchema>;

// Step 2: Role dan skill -------------------------------------------------------

export const skillItemSchema = z.object({
  skillId: z.number().int().positive("Skill tidak valid"),
  level: z.number().int().min(1, "Level 1 sampai 4").max(4, "Level 1 sampai 4"),
  evidenceUrl: optionalHttpsUrl,
});
export type SkillItemInput = z.input<typeof skillItemSchema>;

export const skillsSchema = z
  .array(skillItemSchema)
  .min(MIN_SKILLS, "Pilih minimal 3 skill")
  .max(30, "Maksimal 30 skill")
  .refine(
    (items) => new Set(items.map((s) => s.skillId)).size === items.length,
    "Ada skill yang dipilih dua kali",
  );

export const rolesSkillsSchema = z.object({
  preferredRoles: z
    .array(z.enum(PREFERRED_ROLE_KEYS))
    .min(1, "Pilih minimal 1 role yang kamu minati")
    .max(MAX_PREFERRED_ROLES, "Pilih maksimal 3 role")
    .refine((roles) => new Set(roles).size === roles.length, "Ada role yang dipilih dua kali"),
  skills: skillsSchema,
});
export type RolesSkillsInput = z.input<typeof rolesSkillsSchema>;

// Step 3: Riwayat dan portofolio -----------------------------------------------

export const historyItemSchema = z.object({
  id: uuid.optional(),
  competitionName: z
    .string()
    .trim()
    .min(2, "Nama lomba wajib diisi")
    .max(100, "Nama lomba maksimal 100 karakter"),
  year: year("Tahun"),
  category: z.enum(COMP_CATEGORIES, "Pilih kategori lomba"),
  role: optionalText(40, "Role maksimal 40 karakter"),
  result: z.enum(COMP_RESULTS, "Pilih hasil lomba"),
  evidenceUrl: optionalHttpsUrl,
  note: optionalText(200, "Catatan maksimal 200 karakter"),
});
export type HistoryItemInput = z.input<typeof historyItemSchema>;

export const portfolioItemSchema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(2, "Judul wajib diisi").max(80, "Judul maksimal 80 karakter"),
  description: optionalText(300, "Deskripsi maksimal 300 karakter"),
  url: httpsUrl,
  skillIds: z.array(z.number().int().positive()).max(6, "Maksimal 6 skill terkait").default([]),
});
export type PortfolioItemInput = z.input<typeof portfolioItemSchema>;

export const historyPortfolioSchema = z.object({
  history: z.array(historyItemSchema).max(20, "Maksimal 20 riwayat lomba"),
  portfolio: z.array(portfolioItemSchema).max(12, "Maksimal 12 portofolio"),
});
export type HistoryPortfolioInput = z.input<typeof historyPortfolioSchema>;

// Step 4: Kontak dan preferensi ------------------------------------------------

export const whatsapp = z
  .string()
  .trim()
  .min(1, "Nomor WhatsApp wajib diisi")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Nomor WhatsApp harus diawali +62 atau 08" });
      return z.NEVER;
    }
    return normalized;
  });

export const contactPrefsSchema = z.object({
  whatsapp,
  contactEmail: z
    .string()
    .trim()
    .max(254, "Email terlalu panjang")
    .refine((v) => v === "" || z.email().safeParse(v).success, "Format email belum benar")
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullish()
    .transform((v) => v ?? null),
  hoursPerWeek: z
    .number("Jam per minggu wajib diisi")
    .int("Jam per minggu harus bilangan bulat")
    .min(0, "Jam per minggu 0 sampai 40")
    .max(40, "Jam per minggu 0 sampai 40"),
  goal: z.enum(GOALS, "Pilih tujuanmu"),
  workTime: z.enum(WORK_TIMES, "Pilih jam kerjamu"),
  openToInvite: z.boolean(),
});
export type ContactPrefsInput = z.input<typeof contactPrefsSchema>;

// Wizard -----------------------------------------------------------------------

export const ONBOARDING_STEPS = [
  { step: 1, title: "Data diri" },
  { step: 2, title: "Role dan skill" },
  { step: 3, title: "Riwayat dan portofolio" },
  { step: 4, title: "Kontak dan preferensi" },
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]["step"];

export const stepSchemas = {
  1: identitySchema,
  2: rolesSkillsSchema,
  3: historyPortfolioSchema,
  4: contactPrefsSchema,
} as const;

/** Input of `saveOnboardingStep(step, data)` (PRD §13.1). */
export const onboardingStepInput = z.discriminatedUnion("step", [
  z.object({ step: z.literal(1), data: identitySchema }),
  z.object({ step: z.literal(2), data: rolesSkillsSchema }),
  z.object({ step: z.literal(3), data: historyPortfolioSchema }),
  z.object({ step: z.literal(4), data: contactPrefsSchema }),
]);
export type OnboardingStepInput = z.input<typeof onboardingStepInput>;
export type OnboardingStepData = z.output<typeof onboardingStepInput>;
