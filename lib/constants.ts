/**
 * Enum values from PRD §12.1 and the Indonesian words shown for them (CONTEXT.md).
 * Role colour classes are written out in full so Tailwind can see them; never build them from strings.
 */

/** Roles a student can prefer (`profiles.preferred_roles`). */
export const PREFERRED_ROLE_KEYS = [
  "backend",
  "frontend",
  "uiux",
  "data",
  "product",
  "business",
] as const;
export type PreferredRoleKey = (typeof PREFERRED_ROLE_KEYS)[number];

/** Every role colour key, including `other` for team roles that fit none (`team_roles.color_key`). */
export const ROLE_KEYS = [...PREFERRED_ROLE_KEYS, "other"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLE_LABELS: Record<RoleKey, string> = {
  backend: "Backend",
  frontend: "Frontend",
  uiux: "UI/UX",
  data: "Data/AI",
  product: "Product dan Pitching",
  business: "Business Case",
  other: "Lainnya",
};

export const ROLE_COLORS: Record<RoleKey, { solid: string; soft: string; ink: string }> = {
  backend: { solid: "bg-role-backend", soft: "bg-role-backend-soft", ink: "text-role-backend-ink" },
  frontend: {
    solid: "bg-role-frontend",
    soft: "bg-role-frontend-soft",
    ink: "text-role-frontend-ink",
  },
  uiux: { solid: "bg-role-uiux", soft: "bg-role-uiux-soft", ink: "text-role-uiux-ink" },
  data: { solid: "bg-role-data", soft: "bg-role-data-soft", ink: "text-role-data-ink" },
  product: { solid: "bg-role-product", soft: "bg-role-product-soft", ink: "text-role-product-ink" },
  business: {
    solid: "bg-role-business",
    soft: "bg-role-business-soft",
    ink: "text-role-business-ink",
  },
  other: { solid: "bg-role-other", soft: "bg-role-other-soft", ink: "text-role-other-ink" },
};

export function isRoleKey(value: string | null | undefined): value is RoleKey {
  return (ROLE_KEYS as readonly string[]).includes(value ?? "");
}

export const LEVELS = [1, 2, 3, 4] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, { label: string; hint: string }> = {
  1: { label: "Dasar", hint: "Pernah belajar atau mencoba" },
  2: { label: "Menengah", hint: "Pernah memakai di proyek atau tugas" },
  3: { label: "Mahir", hint: "Pernah memakai di beberapa proyek dan bisa mandiri" },
  4: { label: "Ahli", hint: "Bisa mengajari orang lain atau pernah juara dengan skill ini" },
};

export const GOALS = ["win", "learn"] as const;
export type Goal = (typeof GOALS)[number];
export const GOAL_LABELS: Record<Goal, string> = { win: "Juara", learn: "Belajar" };

export const WORK_TIMES = ["morning", "afternoon", "night", "flexible"] as const;
export type WorkTime = (typeof WORK_TIMES)[number];
export const WORK_TIME_LABELS: Record<WorkTime, string> = {
  morning: "Pagi",
  afternoon: "Siang",
  night: "Malam",
  flexible: "Fleksibel",
};

export const COMP_CATEGORIES = [
  "hackathon",
  "it_competition",
  "ui_ux",
  "data",
  "business_case",
  "paper",
] as const;
export type CompCategory = (typeof COMP_CATEGORIES)[number];
export const COMP_CATEGORY_LABELS: Record<CompCategory, string> = {
  hackathon: "Hackathon",
  it_competition: "Lomba IT",
  ui_ux: "Lomba UI/UX",
  data: "Lomba data",
  business_case: "Business case",
  paper: "Karya tulis",
};

export const COMP_RESULTS = [
  "participant",
  "finalist",
  "winner_1",
  "winner_2",
  "winner_3",
  "honorable",
] as const;
export type CompResult = (typeof COMP_RESULTS)[number];
export const COMP_RESULT_LABELS: Record<CompResult, string> = {
  participant: "Peserta",
  finalist: "Finalis",
  winner_1: "Juara 1",
  winner_2: "Juara 2",
  winner_3: "Juara 3",
  honorable: "Harapan",
};

export const SKILL_CATEGORIES = [
  "engineering",
  "design",
  "data_ai",
  "product_business",
  "communication",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  engineering: "Engineering",
  design: "Design",
  data_ai: "Data/AI",
  product_business: "Product dan Bisnis",
  communication: "Komunikasi",
};

export const ROLE_SOURCES = ["guidebook", "criteria", "template", "manual"] as const;
export type RoleSource = (typeof ROLE_SOURCES)[number];
