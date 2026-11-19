import { isRoleKey, type RoleKey } from "@/lib/constants";
import type { RoleInput } from "@/lib/validation/team";
import type { GuidebookExtraction } from "./schemas";

/**
 * Turns guidebook extractions and role templates into role suggestions for the role editor
 * (F-GBA-02..04). Pure, so it is tested without a database.
 */

export interface SkillRow {
  id: number;
  slug: string;
  name: string;
  aliases: string[];
}

/** A skill the LLM named that is not in `skills`. The role editor asks the leader for a match. */
export interface UnmatchedSkill {
  name: string;
  /** Null for an optional skill. */
  minLevel: number | null;
}

/** A role ready for the role editor: `RoleInput` plus why it was suggested and unmatched skills. */
export type RoleSuggestion = Omit<RoleInput, "id" | "edited" | "description"> & {
  description?: string;
  edited: false;
  reason: string | null;
  unmatchedSkills: UnmatchedSkill[];
};

/** Stored in `competition_extractions.data`: the LLM output plus the mapped roles. */
export type StoredExtraction = GuidebookExtraction & {
  guidebook_path: string;
  roles: RoleSuggestion[];
};

export const TEMPLATE_FALLBACK_MESSAGE =
  "AI belum bisa membaca guidebook ini. Kamu bisa mulai dari template";

/** "Back-end", "back end" and "backend" are the same skill; so are "Node.js" and "nodejs". */
export function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/[\s._-]+/g, "");
}

/** Lookup from every name, slug and alias of each skill to its id. */
export function buildSkillIndex(skills: SkillRow[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const s of skills) {
    for (const key of [s.name, s.slug, ...s.aliases]) {
      const k = normalizeSkillName(key);
      if (k && !index.has(k)) index.set(k, s.id);
    }
  }
  return index;
}

/** Best-effort colour for a role name; the leader can change it in the editor. */
export function guessColorKey(roleName: string): RoleKey {
  const n = roleName.toLowerCase();
  if (/\b(ui|ux)\b|desain|design/.test(n)) return "uiux";
  if (/back-?end|server|software|api/.test(n)) return "backend";
  if (/front-?end|web|mobile|android|ios/.test(n)) return "frontend";
  if (/data|\bai\b|machine|\bml\b|analis/.test(n)) return "data";
  if (/bisnis|business|keuangan|finance|market/.test(n)) return "business";
  if (/pitch|product|produk|presentasi|komunikasi|writer|penulis/.test(n)) return "product";
  return "other";
}

/** Maps every role in an extraction to skill ids (F-GBA-02). */
export function extractionToSuggestions(
  extraction: GuidebookExtraction,
  index: Map<string, number>,
): RoleSuggestion[] {
  return extraction.suggested_roles.map((role) => {
    const unmatchedSkills: UnmatchedSkill[] = [];
    const requiredSkills: RoleSuggestion["requiredSkills"] = [];
    for (const s of role.required_skills) {
      const id = index.get(normalizeSkillName(s.skill));
      if (id === undefined) unmatchedSkills.push({ name: s.skill, minLevel: s.min_level });
      else if (!requiredSkills.some((r) => r.skillId === id)) {
        requiredSkills.push({ skillId: id, minLevel: s.min_level });
      }
    }
    const optionalSkillIds: number[] = [];
    for (const name of role.optional_skills) {
      const id = index.get(normalizeSkillName(name));
      if (id === undefined) unmatchedSkills.push({ name, minLevel: null });
      else if (!optionalSkillIds.includes(id) && !requiredSkills.some((r) => r.skillId === id)) {
        optionalSkillIds.push(id);
      }
    }
    return {
      name: role.name,
      colorKey: guessColorKey(role.name),
      source: role.source,
      sourcePage: role.page,
      sourceCriterion: role.source_criterion,
      edited: false,
      requiredSkills,
      optionalSkillIds,
      hoursPerWeek: role.hours_per_week,
      slots: role.slots,
      reason: role.reason,
      unmatchedSkills,
    };
  });
}

export interface TemplateRow {
  name: string;
  description: string | null;
  color_key: string;
  required_skills: unknown;
  optional_skill_ids: number[];
  hours_per_week: number;
  slots: number;
}

/** A category template as a suggestion (fallback for F-GBA-04, or "Dari template" in the editor). */
export function templateToSuggestion(t: TemplateRow): RoleSuggestion {
  const required = Array.isArray(t.required_skills)
    ? (t.required_skills as { skill_id: number; min_level: number }[])
    : [];
  return {
    name: t.name,
    ...(t.description ? { description: t.description } : {}),
    colorKey: isRoleKey(t.color_key) ? t.color_key : "other",
    source: "template",
    sourcePage: null,
    sourceCriterion: null,
    edited: false,
    requiredSkills: required.map((r) => ({ skillId: r.skill_id, minLevel: r.min_level })),
    optionalSkillIds: t.optional_skill_ids,
    hoursPerWeek: t.hours_per_week,
    slots: t.slots,
    reason: null,
    unmatchedSkills: [],
  };
}

export interface ExtractionRow {
  id: string;
  status: "processing" | "draft" | "reviewed" | "failed";
  created_at: string;
  data: unknown;
}

/**
 * The extraction a new team should use for this guidebook (F-GBA-03): the newest `reviewed`,
 * else the newest `draft`. Rows for an older guidebook file are skipped.
 */
export function pickUsableExtraction<T extends ExtractionRow>(
  rows: T[],
  guidebookPath: string,
): (T & { data: StoredExtraction }) | null {
  const forFile = rows
    .filter((r) => isStoredExtraction(r.data) && r.data.guidebook_path === guidebookPath)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)) as (T & {
    data: StoredExtraction;
  })[];
  return (
    forFile.find((r) => r.status === "reviewed") ??
    forFile.find((r) => r.status === "draft") ??
    null
  );
}

function isStoredExtraction(data: unknown): data is StoredExtraction {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as StoredExtraction).guidebook_path === "string" &&
    Array.isArray((data as StoredExtraction).roles)
  );
}
