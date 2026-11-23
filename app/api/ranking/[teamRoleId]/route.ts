import { NextResponse } from "next/server";
import { z } from "zod";
import { ERROR_MESSAGES, isErrorCode, type ErrorCode } from "@/lib/action-result";
import { buildRankingPage, RankingSource } from "@/lib/ranking/build";
import { RANKING_PAGE_SIZE } from "@/lib/ranking/types";
import { createClient } from "@/lib/supabase/server";

const query = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(RANKING_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
});

const STATUS: Partial<Record<ErrorCode, number>> = {
  AUTH_REQUIRED: 401,
  NOT_MEMBER: 403,
  ROLE_NOT_FOUND: 404,
  VALIDATION: 400,
};

function fail(code: ErrorCode) {
  return NextResponse.json(
    { error: { code, message: ERROR_MESSAGES[code] } },
    { status: STATUS[code] ?? 500 },
  );
}

/**
 * GET /api/ranking/[teamRoleId]?limit=20&offset=0 (PRD §13.2, F-RNK-01). For members of the
 * role's team. `ranking_candidates` applies filters 1–6 of PRD §7.2 in SQL as the signed-in user;
 * the score, filter 7 and the order come from lib/matching (ADR 0002), then the page is sliced.
 */
export async function GET(req: Request, { params }: { params: Promise<{ teamRoleId: string }> }) {
  const { teamRoleId } = await params;
  if (!z.uuid().safeParse(teamRoleId).success) return fail("ROLE_NOT_FOUND");

  const url = new URL(req.url);
  const parsed = query.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("ranking_candidates", { p_team_role: teamRoleId });
  if (error) {
    return fail(error.code === "P0001" && isErrorCode(error.message) ? error.message : "UNKNOWN");
  }

  const source = RankingSource.safeParse(data);
  if (!source.success) {
    console.error("ranking_candidates returned an unexpected shape", source.error.issues);
    return fail("UNKNOWN");
  }

  // `ranking_viewed` for the "time to the candidate list" metric (PRD §17). First page only; a
  // failed log never blocks the ranking.
  if (parsed.data.offset === 0) await logRankingView(supabase, user.id, teamRoleId);

  // Earlier "Cocok" / "Kurang cocok" from this team (F-RNK-05); RLS shows them to members only.
  const { data: rated } = await supabase
    .from("recommendation_feedback")
    .select("candidate_id, feedback")
    .eq("team_role_id", teamRoleId);
  const feedback = new Map((rated ?? []).map((r) => [r.candidate_id, r.feedback]));

  return NextResponse.json(buildRankingPage(source.data, parsed.data, feedback), {
    headers: { "Cache-Control": "no-store" },
  });
}

async function logRankingView(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  teamRoleId: string,
) {
  const [{ data: me }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("id").eq("user_id", userId).single(),
    supabase.from("team_roles").select("team_id").eq("id", teamRoleId).single(),
  ]);
  if (!me || !role) return;
  const { error } = await supabase
    .from("events")
    .insert({ profile_id: me.id, team_id: role.team_id, type: "ranking_viewed" });
  if (error) console.error("ranking: log ranking_viewed", error.message);
}
