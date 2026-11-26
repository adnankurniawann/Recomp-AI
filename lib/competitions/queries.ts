import "server-only";
import { cache } from "react";
import { getGuidebookSummary, type GuidebookSummary } from "@/lib/ai/guidebook-summary";
import { createClient } from "@/lib/supabase/server";
import type { CompetitionSummary } from "./filter";

/** Published competitions for `/lomba`. Empty when Supabase is not configured yet. */
export async function loadCompetitions(): Promise<CompetitionSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select(
      "id, slug, name, organizer, category, registration_deadline, team_min, team_max, poster_path, guidebook_path, is_simulated, is_featured, competition_interests(count)",
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
    isFeatured: c.is_featured,
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

export interface CompetitionDetail extends CompetitionSummary {
  description: string | null;
  eventDate: string | null;
  officialUrl: string | null;
  guidebookPath: string | null;
  guidebookUrl: string | null;
  /** The viewer, when signed in: their team in this competition and their "Tertarik" mark. */
  viewer: { teamId: string | null; interested: boolean } | null;
}

/** One published competition for `/lomba/[slug]`, or null when it does not exist. */
export const loadCompetition = cache(async function loadCompetition(
  slug: string,
): Promise<CompetitionDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const [{ data: c, error }, { data: profileId }] = await Promise.all([
    supabase
      .from("competitions")
      .select("*, competition_interests(count)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.rpc("current_profile_id"),
  ]);
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
    isFeatured: c.is_featured,
    description: c.description,
    eventDate: c.event_date,
    officialUrl: c.official_url,
    guidebookPath: c.guidebook_path,
    guidebookUrl: publicUrl("guidebooks", c.guidebook_path),
    viewer: profileId ? await loadViewerState(supabase, c.id, profileId) : null,
  };
});

async function loadViewerState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  competitionId: string,
  profileId: string,
) {
  const [{ data: member }, { data: interest }] = await Promise.all([
    supabase
      .from("team_members")
      .select("team_id")
      .eq("competition_id", competitionId)
      .eq("profile_id", profileId)
      .maybeSingle(),
    supabase
      .from("competition_interests")
      .select("competition_id")
      .eq("competition_id", competitionId)
      .eq("profile_id", profileId)
      .maybeSingle(),
  ]);
  return { teamId: member?.team_id ?? null, interested: !!interest };
}

/** The "Ringkasan guidebook" tab content, or null to hide the tab (F-CMP-02). */
export async function loadGuidebookSummary(c: CompetitionDetail): Promise<GuidebookSummary | null> {
  if (!c.guidebookPath) return null;
  const supabase = await createClient();
  return getGuidebookSummary(supabase, {
    id: c.id,
    category: c.category,
    guidebook_path: c.guidebookPath,
  });
}
