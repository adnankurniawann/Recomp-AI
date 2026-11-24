import { NextResponse } from "next/server";
import { z } from "zod";
import { ERROR_MESSAGES, isErrorCode, type ErrorCode } from "@/lib/action-result";
import { getGemini } from "@/lib/ai/gemini";
import { RECRUITER_PROMPT_VERSION } from "@/lib/ai/prompts/recruiter";
import { RECRUIT_COUNT, firstName, runRecruiterAgent } from "@/lib/ai/recruiter";
import { buildRankingPage, RankingSource } from "@/lib/ranking/build";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const maxDuration = 60;

const body = z.object({ teamRoleId: z.uuid() });
const RATE_LIMIT_PER_HOUR = 10;

const STATUS: Partial<Record<ErrorCode, number>> = {
  VALIDATION: 400,
  AUTH_REQUIRED: 401,
  NOT_LEADER: 403,
  NOT_MEMBER: 403,
  ROLE_NOT_FOUND: 404,
  NO_CANDIDATES: 404,
  RATE_LIMITED: 429,
};

function fail(code: ErrorCode) {
  return NextResponse.json(
    { error: { code, message: ERROR_MESSAGES[code] } },
    { status: STATUS[code] ?? 500 },
  );
}

/**
 * POST /api/ai/recruit (PRD §13.2, §8.2, F-RCR-01). For the team leader. Takes the top 3 ranked
 * candidates not yet invited (ranking_candidates + lib/matching) and drafts a message for each.
 * Without the LLM the drafts come from the F-INV-01 template (ADR 0006). Nothing is sent here:
 * the drafts are logged in agent_actions as `pending` and an invite needs the leader's click.
 * Response: `{ agentActionId, drafts: [{ candidateId, fullName, score, message, aiDrafted }], aiUsed }`.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION");
  const { teamRoleId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");
  const { data: me } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();
  if (!me) return fail("AUTH_REQUIRED");

  const { data: role } = await supabase
    .from("team_roles")
    .select("id, name, teams(id, name, leader_id, competitions(name))")
    .eq("id", teamRoleId)
    .maybeSingle();
  if (!role) return fail("ROLE_NOT_FOUND");
  const team = role.teams;
  if (!team || team.leader_id !== me.id) return fail("NOT_LEADER");

  const { count } = await supabase
    .from("agent_actions")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", me.id)
    .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return fail("RATE_LIMITED");

  const [{ data: ranking, error }, { data: skills }] = await Promise.all([
    supabase.rpc("ranking_candidates", { p_team_role: teamRoleId }),
    supabase.from("skills").select("name"),
  ]);
  if (error) {
    return fail(error.code === "P0001" && isErrorCode(error.message) ? error.message : "UNKNOWN");
  }
  const source = RankingSource.safeParse(ranking);
  if (!source.success) return fail("UNKNOWN");
  const top = buildRankingPage(source.data, { limit: RECRUIT_COUNT, offset: 0 }).candidates;
  if (top.length === 0) return fail("NO_CANDIDATES");

  const facts = {
    teamName: team.name,
    competitionName: team.competitions?.name ?? "",
    roleName: role.name,
    leaderFirstName: firstName(me.full_name),
  };
  const gemini = getGemini();
  const started = Date.now();
  const { drafts, error: agentError } = await runRecruiterAgent({
    team: facts,
    candidates: top.map((c) => ({
      candidateId: c.profile.id,
      fullName: c.profile.fullName,
      firstName: firstName(c.profile.fullName),
      score: c.score,
      matchedSkills: c.matchedRequired.map((s) => s.name),
      reasons: c.reasons.map((r) => r.text),
    })),
    allSkillNames: (skills ?? []).map((s) => s.name),
    generate: gemini?.generateJson ?? null,
  });

  const { data: action, error: logError } = await supabase
    .from("agent_actions")
    .insert({
      agent: "recruiter",
      actor_id: me.id,
      team_id: team.id,
      target_id: teamRoleId,
      input: {
        teamRoleId,
        candidateIds: top.map((c) => c.profile.id),
        promptVersion: RECRUITER_PROMPT_VERSION,
      },
      output: { drafts, decisions: {} } as unknown as Json,
      approval: "pending",
      model: gemini?.model ?? "template",
      duration_ms: Date.now() - started,
      error: agentError,
    })
    .select("id")
    .single();
  if (logError || !action) {
    console.error("recruit: log agent action", logError);
    return fail("UNKNOWN");
  }

  return NextResponse.json({ agentActionId: action.id, drafts, aiUsed: gemini !== null });
}
