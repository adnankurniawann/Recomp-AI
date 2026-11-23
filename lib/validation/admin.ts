import { z } from "zod";
import { COMP_CATEGORIES } from "@/lib/constants";
import { optionalHttpsUrl, optionalText, uuid } from "./common";
import { MAX_ROLES, roleInputSchema, totalSlots } from "./team";

// Admin inputs (PRD F-CMP-04): the competition form and the extraction review.

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")
  .nullish()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const teamSize = z
  .number("Wajib diisi")
  .int()
  .min(1, "Ukuran tim 1 sampai 10")
  .max(10, "Ukuran tim 1 sampai 10");

export const competitionSchema = z
  .object({
    id: uuid.optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug pakai huruf kecil, angka, dan tanda hubung")
      .min(3, "Slug 3 sampai 60 karakter")
      .max(60, "Slug 3 sampai 60 karakter"),
    name: z
      .string()
      .trim()
      .min(3, "Nama 3 sampai 120 karakter")
      .max(120, "Nama 3 sampai 120 karakter"),
    organizer: z
      .string()
      .trim()
      .min(2, "Penyelenggara 2 sampai 120 karakter")
      .max(120, "Penyelenggara 2 sampai 120 karakter"),
    category: z.enum(COMP_CATEGORIES, "Pilih kategori"),
    description: optionalText(2000, "Deskripsi maksimal 2.000 karakter"),
    registrationDeadline: isoDate,
    eventDate: isoDate,
    teamMin: teamSize,
    teamMax: teamSize,
    officialUrl: optionalHttpsUrl,
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    isSimulated: z.boolean(),
  })
  .refine((c) => c.teamMin <= c.teamMax, {
    path: ["teamMax"],
    message: "Maksimal anggota tidak boleh kurang dari minimal",
  });
export type CompetitionInput = z.input<typeof competitionSchema>;

const page = z.number().int().positive().nullable();

export const reviewExtractionSchema = z
  .object({
    extractionId: uuid,
    summary: z
      .string()
      .trim()
      .min(1, "Ringkasan wajib diisi")
      .max(600, "Ringkasan maksimal 600 karakter"),
    teamSize: z.object({ min: teamSize, max: teamSize }),
    deadlines: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Nama tahap wajib diisi").max(80, "Maksimal 80 karakter"),
          date: isoDate,
          page,
        }),
      )
      .max(15, "Maksimal 15 tanggal"),
    criteria: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, "Nama kriteria wajib diisi")
            .max(80, "Maksimal 80 karakter"),
          weightPercent: z
            .number()
            .min(0, "Bobot 0 sampai 100")
            .max(100, "Bobot 0 sampai 100")
            .nullable(),
          description: z.string().max(300).optional(),
          page,
        }),
      )
      .max(20, "Maksimal 20 kriteria"),
    roles: z
      .array(
        roleInputSchema.extend({
          reason: z.string().max(300).nullable().optional(),
          unmatchedSkills: z
            .array(z.object({ name: z.string(), minLevel: z.number().int().nullable() }))
            .optional(),
        }),
      )
      .min(1, "Minimal 1 role")
      .max(MAX_ROLES, "Maksimal 6 role"),
  })
  .refine((v) => v.teamSize.min <= v.teamSize.max, {
    path: ["teamSize", "max"],
    message: "Maksimal anggota tidak boleh kurang dari minimal",
  })
  .refine((v) => totalSlots(v.roles) <= v.teamSize.max, {
    path: ["roles"],
    message: "Total slot role melebihi ukuran tim maksimal",
  });
export type ReviewExtractionInput = z.input<typeof reviewExtractionSchema>;
