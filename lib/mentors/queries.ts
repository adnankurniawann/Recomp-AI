import "server-only";
import { cache } from "react";
import { COMP_CATEGORIES, isRoleKey, type CompCategory, type RoleKey } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";

// The mentor detail page /mentor/[id] (PRD F-MNT-02, §10.9). Public: mentor contacts live in
// mentor_contacts and are never selected here; they open only after a paid booking (ADR 0003).

export interface MentorDetail {
  id: string;
  name: string;
  photoUrl: string | null;
  roles: RoleKey[];
  headline: string;
  bio: string | null;
  achievements: { year: number | null; title: string }[];
  categories: CompCategory[];
  verified: boolean;
  isSimulated: boolean;
  services: {
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    price: number;
  }[];
  /** Free slots from now on, soonest first. */
  slots: { id: string; startsAt: string }[];
  /** Teams of the signed-in student that can book (not archived). Empty when signed out. */
  viewerTeams: { id: string; name: string }[];
  signedIn: boolean;
}

const MAX_SLOTS = 12;

export const loadMentor = cache(async function loadMentor(
  id: string,
): Promise<MentorDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const { data: m, error } = await supabase
    .from("mentors")
    .select(
      "id, display_name, photo_path, roles, headline, bio, achievements, competition_categories, verified, is_simulated, is_active",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`mentor: ${error.message}`);
  if (!m || !m.is_active) return null;

  const [services, slots, auth] = await Promise.all([
    supabase
      .from("mentor_services")
      .select("id, name, description, duration_min, price")
      .eq("mentor_id", m.id)
      .order("price"),
    supabase
      .from("mentor_slots")
      .select("id, starts_at")
      .eq("mentor_id", m.id)
      .eq("is_booked", false)
      .gt("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(MAX_SLOTS),
    supabase.auth.getUser(),
  ]);
  if (services.error) throw new Error(`services: ${services.error.message}`);
  if (slots.error) throw new Error(`slots: ${slots.error.message}`);

  let viewerTeams: MentorDetail["viewerTeams"] = [];
  const user = auth.data.user;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (me) {
      const { data: rows, error: tErr } = await supabase
        .from("team_members")
        .select("team:teams(id, name, status)")
        .eq("profile_id", me.id);
      if (tErr) throw new Error(`teams: ${tErr.message}`);
      viewerTeams = (rows ?? []).flatMap((r) =>
        r.team && r.team.status !== "archived" ? [{ id: r.team.id, name: r.team.name }] : [],
      );
    }
  }

  const achievements = (Array.isArray(m.achievements) ? m.achievements : []).flatMap((a) => {
    const { year, title } = (a ?? {}) as { year?: unknown; title?: unknown };
    return typeof title === "string" && title
      ? [{ year: typeof year === "number" ? year : null, title }]
      : [];
  });

  return {
    id: m.id,
    name: m.display_name,
    photoUrl: publicStorageUrl("mentors", m.photo_path),
    roles: m.roles.filter(isRoleKey),
    headline: m.headline,
    bio: m.bio,
    achievements: achievements.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    categories: m.competition_categories.filter((c): c is CompCategory =>
      (COMP_CATEGORIES as readonly string[]).includes(c),
    ),
    verified: m.verified,
    isSimulated: m.is_simulated,
    services: (services.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMin: s.duration_min,
      price: s.price,
    })),
    slots: (slots.data ?? []).map((s) => ({ id: s.id, startsAt: s.starts_at })),
    viewerTeams,
    signedIn: Boolean(user),
  };
});
