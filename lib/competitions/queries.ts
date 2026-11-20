import "server-only";
import { cache } from "react";
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

export interface CompetitionDetail extends CompetitionSummary {
  description: string | null;
  eventDate: string | null;
  officialUrl: string | null;
  guidebookUrl: string | null;
  /** The viewer's team in this competition, if they are in one. */
  myTeamId: string | null;
}

/** One published competition for `/lomba/[slug]`, or null when it does not exist. */
export const loadCompetition = cache(async function loadCompetition(
  slug: string,
): Promise<CompetitionDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const { data: c, error } = await supabase
    .from("competitions")
    .select("*, competition_interests(count)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`competition: ${error.message}`);
  if (!c) return null;

  const publicUrl = (bucket: string, path: string | null) =>
    path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;

  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    organizer: c.organizer,
    category: c.category,
    registrationDeadline: c.registration_deadline,
    teamMin: c.team_min,
    teamMax: c.team_max,
    posterUrl: publicUrl("posters", c.poster_path),
    hasGuidebook: c.guidebook_path !== null,
    interestCount: c.competition_interests[0]?.count ?? 0,
    isSimulated: c.is_simulated,
    description: c.description,
    eventDate: c.event_date,
    officialUrl: c.official_url,
    guidebookUrl: publicUrl("guidebooks", c.guidebook_path),
    myTeamId: await loadMyTeamId(supabase, c.id),
  };
});

async function loadMyTeamId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  competitionId: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("team_members")
    .select("team_id, profiles!inner(user_id)")
    .eq("competition_id", competitionId)
    .eq("profiles.user_id", user.id)
    .maybeSingle();
  return data?.team_id ?? null;
}
