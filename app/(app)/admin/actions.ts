"use server";

import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import type { StoredExtraction } from "@/lib/ai/skill-map";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import {
  competitionSchema,
  mentorSchema,
  reviewExtractionSchema,
  type CompetitionInput,
  type MentorInput,
  type ReviewExtractionInput,
} from "@/lib/validation/admin";
import { uuid } from "@/lib/validation/common";

// Admin actions (PRD F-CMP-04). RLS lets only admins write competitions, extractions and the
// guidebooks bucket; the explicit check here gives a clear error instead of an empty result.

type Client = Awaited<ReturnType<typeof createClient>>;

async function adminProfile(supabase: Client): Promise<string | null> {
  const [{ data: isAdmin }, { data: me }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("current_profile_id"),
  ]);
  return isAdmin && me ? me : null;
}

/** Adds or edits a competition. */
export async function saveCompetition(
  input: CompetitionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = competitionSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const me = await adminProfile(supabase);
  if (!me) return fail("FORBIDDEN");

  const c = parsed.data;
  const row = {
    slug: c.slug,
    name: c.name,
    organizer: c.organizer,
    category: c.category,
    description: c.description,
    registration_deadline: c.registrationDeadline,
    event_date: c.eventDate,
    team_min: c.teamMin,
    team_max: c.teamMax,
    official_url: c.officialUrl,
    is_published: c.isPublished,
    is_featured: c.isFeatured,
    is_simulated: c.isSimulated,
  };
  const { data, error } = c.id
    ? await supabase.from("competitions").update(row).eq("id", c.id).select("id").single()
    : await supabase
        .from("competitions")
        .insert({ ...row, created_by: me })
        .select("id")
        .single();
  if (error?.code === "23505") {
    return fail("VALIDATION", "Slug ini sudah dipakai lomba lain.", {
      slug: "Slug ini sudah dipakai lomba lain.",
    });
  }
  if (error || !data) {
    console.error("[admin competition]", error?.code, error?.message);
    return fail("UNKNOWN");
  }

  revalidatePath("/lomba", "layout");
  revalidatePath("/admin/lomba", "layout");
  return ok({ id: data.id });
}

/**
 * Points the competition at a guidebook the admin just uploaded to `guidebooks/<id>/…pdf` from the
 * browser (the bucket checks type and size). Old files stay: older extractions name them.
 */
export async function setGuidebook(
  competitionId: string,
  path: string,
): Promise<ActionResult<Record<string, never>>> {
  if (!uuid.safeParse(competitionId).success || !/^[0-9a-f-]{36}\/[\w-]+\.pdf$/.test(path)) {
    return fail("VALIDATION");
  }
  if (!path.startsWith(`${competitionId}/`)) return fail("VALIDATION");

  const supabase = await createClient();
  if (!(await adminProfile(supabase))) return fail("FORBIDDEN");

  const { error } = await supabase
    .from("competitions")
    .update({ guidebook_path: path })
    .eq("id", competitionId);
  if (error) {
    console.error("[admin guidebook]", error.code, error.message);
    return fail("UNKNOWN");
  }
  revalidatePath("/admin/lomba", "layout");
  revalidatePath("/lomba", "layout");
  return ok({});
}

/** Saves the admin's edits to an extraction and approves it (`reviewed`, F-CMP-04). */
export async function reviewExtraction(
  input: ReviewExtractionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = reviewExtractionSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);

  const supabase = await createClient();
  const me = await adminProfile(supabase);
  if (!me) return fail("FORBIDDEN");

  const r = parsed.data;
  const { data: row } = await supabase
    .from("competition_extractions")
    .select("id, competition_id, status, data")
    .eq("id", r.extractionId)
    .maybeSingle();
  if (!row?.data || (row.status !== "draft" && row.status !== "reviewed")) {
    return fail("NOT_FOUND", "Hasil ekstraksi ini tidak bisa direview.");
  }

  const old = row.data as unknown as StoredExtraction;
  const data: StoredExtraction = {
    ...old,
    summary: r.summary,
    team_size: { ...old.team_size, min: r.teamSize.min, max: r.teamSize.max },
    deadlines: r.deadlines,
    judging_criteria: r.criteria.map((c) => ({
      name: c.name,
      weight_percent: c.weightPercent,
      ...(c.description && { description: c.description }),
      page: c.page,
    })),
    roles: r.roles.map((x) => ({
      name: x.name,
      ...(x.description && { description: x.description }),
      colorKey: x.colorKey,
      source: x.source,
      sourcePage: x.sourcePage,
      sourceCriterion: x.sourceCriterion,
      edited: false,
      requiredSkills: x.requiredSkills,
      optionalSkillIds: x.optionalSkillIds,
      hoursPerWeek: x.hoursPerWeek,
      slots: x.slots,
      reason: x.reason ?? null,
      unmatchedSkills: x.unmatchedSkills ?? [],
    })),
  };

  const { error } = await supabase
    .from("competition_extractions")
    .update({
      data: data as unknown as Json,
      status: "reviewed",
      reviewed_by: me,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (error) {
    console.error("[admin review]", error.code, error.message);
    return fail("UNKNOWN");
  }
  revalidatePath("/lomba", "layout");
  revalidatePath("/admin/lomba", "layout");
  return ok({ id: row.id });
}

/** Adds or edits a mentor and their services in one go (`save_mentor`, F-ADM-01). */
export async function saveMentor(input: MentorInput): Promise<ActionResult<{ id: string }>> {
  const parsed = mentorSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error.issues);
  const m = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_mentor", {
    p_mentor: {
      display_name: m.displayName,
      roles: m.roles,
      headline: m.headline,
      bio: m.bio,
      competition_categories: m.categories,
      verified: m.verified,
      is_simulated: m.isSimulated,
      is_active: m.isActive,
    },
    p_services: m.services.map((s) => ({
      ...(s.id && { id: s.id }),
      name: s.name,
      description: s.description,
      duration_min: s.durationMin,
      price: s.price,
    })),
    p_id: m.id,
  });
  if (error || !data) {
    console.error("[admin mentor]", error?.code, error?.message);
    return error ? failFromDb(error) : fail("UNKNOWN");
  }
  revalidatePath("/mentor", "layout");
  revalidatePath("/admin/mentor", "layout");
  return ok({ id: data });
}
