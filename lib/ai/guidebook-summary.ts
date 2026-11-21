import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompCategory, RoleKey } from "@/lib/constants";
import { roleSourceLabel } from "@/lib/format/role-source";
import type { Database } from "@/lib/supabase/types";
import { pickUsableExtraction, type StoredExtraction } from "./skill-map";

export const DRAFT_SUMMARY_NOTE = "Ringkasan dibuat AI dan belum diperiksa admin";

/** Everything the "Ringkasan guidebook" tab shows (F-CMP-02, PRD §10.3). */
export interface GuidebookSummary {
  extractionId: string;
  /** True for `draft`: show DRAFT_SUMMARY_NOTE. */
  isDraft: boolean;
  summary: string;
  teamSize: { min: number; max: number; page: number | null };
  criteria: { name: string; weightPercent: number | null; page: number | null }[];
  deadlines: { name: string; date: string | null; page: number | null }[];
  roles: {
    name: string;
    colorKey: RoleKey;
    sourceLabel: string;
    /** Required skills first, then optional ones, by name. */
    skills: { name: string; required: boolean }[];
  }[];
}

/** Builds the tab content from a stored extraction. Pure, so it is tested without a database. */
export function toGuidebookSummary(
  row: { id: string; status: string; data: StoredExtraction },
  category: CompCategory,
  skillNames: ReadonlyMap<number, string>,
): GuidebookSummary {
  const d = row.data;
  return {
    extractionId: row.id,
    isDraft: row.status === "draft",
    summary: d.summary,
    teamSize: d.team_size,
    criteria: d.judging_criteria.map((c) => ({
      name: c.name,
      weightPercent: c.weight_percent,
      page: c.page,
    })),
    deadlines: d.deadlines,
    roles: d.roles.map((r) => ({
      name: r.name,
      colorKey: r.colorKey,
      sourceLabel: roleSourceLabel(r, { category, criteria: d.judging_criteria }),
      skills: [
        ...r.requiredSkills.map((s) => ({ id: s.skillId, required: true })),
        ...r.optionalSkillIds.map((id) => ({ id, required: false })),
      ].flatMap(({ id, required }) => {
        const name = skillNames.get(id);
        return name ? [{ name, required }] : [];
      }),
    })),
  };
}

/**
 * Content of the "Ringkasan guidebook" tab, or null when the tab should be hidden: no guidebook,
 * or no `draft`/`reviewed` extraction of the current guidebook file. Works for visitors without
 * a session (RLS lets everyone read finished extractions and skills).
 */
export async function getGuidebookSummary(
  supabase: SupabaseClient<Database>,
  competition: { id: string; category: CompCategory; guidebook_path: string | null },
): Promise<GuidebookSummary | null> {
  if (!competition.guidebook_path) return null;

  const { data: rows } = await supabase
    .from("competition_extractions")
    .select("id, status, created_at, data")
    .eq("competition_id", competition.id)
    .in("status", ["reviewed", "draft"]);
  const usable = pickUsableExtraction(rows ?? [], competition.guidebook_path);
  if (!usable) return null;

  const ids = [
    ...new Set(
      usable.data.roles.flatMap((r) => [
        ...r.requiredSkills.map((s) => s.skillId),
        ...r.optionalSkillIds,
      ]),
    ),
  ];
  const { data: skills } = ids.length
    ? await supabase.from("skills").select("id, name").in("id", ids)
    : { data: [] };

  return toGuidebookSummary(
    usable,
    competition.category,
    new Map((skills ?? []).map((s) => [s.id, s.name])),
  );
}
