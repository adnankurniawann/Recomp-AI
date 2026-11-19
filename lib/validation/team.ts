import { z } from "zod";
import { GOALS, ROLE_KEYS, ROLE_SOURCES, WORK_TIMES } from "@/lib/constants";
import { uuid } from "./common";

// Team and role inputs (PRD F-TEM-01..02, §13.1). The team-size limit (`competitions.team_max`)
// lives in the database, so `create_team` and `saveRoles` check it with `totalSlots`.

export const MAX_ROLES = 6;

export const roleInputSchema = z.object({
  id: uuid.optional(),
  name: z
    .string()
    .trim()
    .min(2, "Nama role 2 sampai 40 karakter")
    .max(40, "Nama role 2 sampai 40 karakter"),
  description: z
    .string()
    .trim()
    .max(200, "Deskripsi maksimal 200 karakter")
    .optional()
    .transform((v) => (v ? v : undefined)),
  colorKey: z.enum(ROLE_KEYS),
  source: z.enum(ROLE_SOURCES),
  sourcePage: z.number().int().positive().nullable(),
  sourceCriterion: z.string().nullable(),
  edited: z.boolean(),
  requiredSkills: z
    .array(
      z.object({
        skillId: z.number().int().positive(),
        minLevel: z.number().int().min(1, "Level 1 sampai 4").max(4, "Level 1 sampai 4"),
      }),
    )
    .min(1, "Pilih minimal 1 skill wajib")
    .refine(
      (s) => new Set(s.map((x) => x.skillId)).size === s.length,
      "Ada skill wajib yang dobel",
    ),
  optionalSkillIds: z.array(z.number().int().positive()),
  hoursPerWeek: z
    .number("Jam per minggu wajib diisi")
    .int()
    .min(1, "Jam per minggu 1 sampai 40")
    .max(40, "Jam per minggu 1 sampai 40"),
  slots: z
    .number("Jumlah slot wajib diisi")
    .int()
    .min(1, "Slot 1 sampai 3")
    .max(3, "Slot 1 sampai 3"),
});
export type RoleInput = z.input<typeof roleInputSchema>;

const roles = z
  .array(roleInputSchema)
  .min(1, "Tim butuh minimal 1 role")
  .max(MAX_ROLES, "Maksimal 6 role");

export const createTeamSchema = z
  .object({
    competitionId: uuid,
    name: z
      .string()
      .trim()
      .min(2, "Nama tim 2 sampai 40 karakter")
      .max(40, "Nama tim 2 sampai 40 karakter"),
    goal: z.enum(GOALS, "Pilih tujuan tim"),
    workTime: z.enum(WORK_TIMES, "Pilih jam kerja tim"),
    roles,
    leaderRoleIndex: z.number().int().min(0),
  })
  .refine((v) => v.leaderRoleIndex < v.roles.length, {
    message: "Pilih role untuk ketua",
    path: ["leaderRoleIndex"],
  });
export type CreateTeamInput = z.input<typeof createTeamSchema>;

export const saveRolesSchema = z.object({ teamId: uuid, roles });
export type SaveRolesInput = z.input<typeof saveRolesSchema>;

export const assignMemberRoleSchema = z.object({ teamId: uuid, profileId: uuid, roleId: uuid });
export type AssignMemberRoleInput = z.input<typeof assignMemberRoleSchema>;

/** Sum of role slots, compared with `competitions.team_max` (error `SLOTS_EXCEED_MAX`). */
export function totalSlots(items: ReadonlyArray<{ slots: number }>): number {
  return items.reduce((sum, r) => sum + r.slots, 0);
}
