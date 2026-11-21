import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CompetitionSummary } from "./filter";

/** Published competitions for `/lomba`. Empty when Supabase is not configured yet. */
export async function loadCompetitions(): Promise<CompetitionSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select(
      "id, slug, name, organizer, category, registration_deadline, team_min, team_max, poster_path, guidebook_path, is_simulated, competition_interests(count)",
    )
    .eq("is_published", true);
  if (error) throw new Error(`competitions: ${error.message}`);

  return data.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    organizer: c.organizer,
    category: c.category,
    registrationDeadline: c.registration_deadline,
    teamMin: c.team_min,
    teamMax: c.team_max,
    posterUrl: c.poster_path
      ? supabase.storage.from("posters").getPublicUrl(c.poster_path).data.publicUrl
      : null,
    hasGuidebook: c.guidebook_path !== null,
    interestCount: c.competition_interests[0]?.count ?? 0,
    isSimulated: c.is_simulated,
  }));
}

/** Ids of the competitions the signed-in student marked "Tertarik". Empty when signed out. */
export async function loadInterestedIds(): Promise<Set<string>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return new Set();

  const supabase = await createClient();
  const { data: profileId } = await supabase.rpc("current_profile_id");
  if (!profileId) return new Set();

  const { data, error } = await supabase
    .from("competition_interests")
    .select("competition_id")
    .eq("profile_id", profileId);
  if (error) throw new Error(`competition_interests: ${error.message}`);
  return new Set(data.map((r) => r.competition_id));
}
