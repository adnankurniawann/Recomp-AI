import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  TEMPLATE_FALLBACK_MESSAGE,
  pickUsableExtraction,
  templateToSuggestion,
  type RoleSuggestion,
} from "./skill-map";

export interface RoleSuggestions {
  /** `extraction`: roles read from the guidebook. `template`: the category templates. */
  source: "extraction" | "template";
  extractionId: string | null;
  /** `draft` shows "Ringkasan dibuat AI dan belum diperiksa admin" in the UI. */
  extractionStatus: "draft" | "reviewed" | null;
  /** Shown above the role editor when the guidebook could not be used (F-GBA-04). */
  notice: string | null;
  roles: RoleSuggestion[];
}

/**
 * Starting roles for a new team (`/tim/baru` step 2). Uses the newest reviewed extraction of the
 * current guidebook, else the newest draft (F-GBA-03). Without one, returns the category
 * templates with the fallback notice (F-GBA-04). Never calls the LLM.
 */
export async function getRoleSuggestions(
  supabase: SupabaseClient<Database>,
  competitionId: string,
): Promise<RoleSuggestions | null> {
  const { data: competition } = await supabase
    .from("competitions")
    .select("category, guidebook_path")
    .eq("id", competitionId)
    .maybeSingle();
  if (!competition) return null;

  if (competition.guidebook_path) {
    const { data: rows } = await supabase
      .from("competition_extractions")
      .select("id, status, created_at, data")
      .eq("competition_id", competitionId)
      .in("status", ["reviewed", "draft"]);
    const usable = pickUsableExtraction(rows ?? [], competition.guidebook_path);
    if (usable && usable.data.roles.length > 0) {
      return {
        source: "extraction",
        extractionId: usable.id,
        extractionStatus: usable.status as "draft" | "reviewed",
        notice: null,
        roles: usable.data.roles,
      };
    }
  }

  const { data: templates } = await supabase
    .from("role_templates")
    .select(
      "name, description, color_key, required_skills, optional_skill_ids, hours_per_week, slots",
    )
    .eq("category", competition.category)
    .order("sort");
  return {
    source: "template",
    extractionId: null,
    extractionStatus: null,
    notice: TEMPLATE_FALLBACK_MESSAGE,
    roles: (templates ?? []).map(templateToSuggestion),
  };
}
