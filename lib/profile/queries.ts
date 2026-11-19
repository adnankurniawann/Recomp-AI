import "server-only";
import { SKILL_CATEGORIES, type SkillCategory } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { toFormValues, toSavedState, type OwnProfileRows, type SkillOption } from "./form";
import { requiredSkillIdsFromJson, type RoleTemplateSkills } from "./suggest";

/**
 * The signed-in student's own profile with everything the wizard and /profil edit.
 * Reads under the student's session, so RLS decides what comes back. Returns null when signed out.
 */
export async function loadOwnProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`profile: ${error.message}`);
  if (!profile) return null;

  const [skills, history, portfolio, contact] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("skill_id, level, evidence_url")
      .eq("profile_id", profile.id),
    supabase.from("competition_history").select("*").eq("profile_id", profile.id),
    supabase.from("portfolio_items").select("*").eq("profile_id", profile.id),
    supabase
      .from("profile_contacts")
      .select("whatsapp, contact_email")
      .eq("profile_id", profile.id)
      .maybeSingle(),
  ]);
  for (const r of [skills, history, portfolio, contact]) {
    if (r.error) throw new Error(`profile rows: ${r.error.message}`);
  }

  const rows: OwnProfileRows = {
    profile,
    skills: skills.data ?? [],
    history: history.data ?? [],
    portfolio: portfolio.data ?? [],
    contact: contact.data,
    loginEmail: user.email ?? null,
  };

  return {
    profile,
    loginEmail: user.email ?? null,
    values: toFormValues(rows),
    saved: toSavedState(rows),
  };
}

/** The fixed skill list and the role templates used to suggest skills per role. */
export async function loadSkillCatalog(): Promise<{
  skills: SkillOption[];
  templates: RoleTemplateSkills[];
}> {
  const supabase = await createClient();
  const [skills, templates] = await Promise.all([
    supabase.from("skills").select("id, name, category").order("name"),
    supabase
      .from("role_templates")
      .select("category, color_key, sort, required_skills, optional_skill_ids"),
  ]);
  if (skills.error) throw new Error(`skills: ${skills.error.message}`);
  if (templates.error) throw new Error(`role_templates: ${templates.error.message}`);

  return {
    skills: (skills.data ?? []).filter((s): s is SkillOption =>
      (SKILL_CATEGORIES as readonly string[]).includes(s.category as SkillCategory),
    ),
    templates: (templates.data ?? []).map((t) => ({
      category: t.category,
      colorKey: t.color_key,
      sort: t.sort,
      requiredSkillIds: requiredSkillIdsFromJson(t.required_skills),
      optionalSkillIds: t.optional_skill_ids,
    })),
  };
}
