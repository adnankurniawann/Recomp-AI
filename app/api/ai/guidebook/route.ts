import { NextResponse } from "next/server";
import { z } from "zod";
import { ERROR_MESSAGES, type ErrorCode } from "@/lib/action-result";
import { getGemini } from "@/lib/ai/gemini";
import { runGuidebookAgent } from "@/lib/ai/guidebook";
import { GUIDEBOOK_PROMPT_VERSION, type PromptTemplate } from "@/lib/ai/prompts/guidebook";
import {
  buildSkillIndex,
  extractionToSuggestions,
  pickUsableExtraction,
  type StoredExtraction,
} from "@/lib/ai/skill-map";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const maxDuration = 60;

// `force` runs the agent again even when a usable result exists (the admin wants a fresh read).
const body = z.object({ competitionId: z.uuid(), force: z.boolean().optional() });
const RATE_LIMIT_PER_HOUR = 10;

function fail(status: number, code: ErrorCode, message: string = ERROR_MESSAGES[code]) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * POST /api/ai/guidebook (PRD §13.2, F-GBA-01). Admin only. Reads the competition's guidebook
 * PDF, runs the guidebook agent and stores the result in `competition_extractions` as `draft` or
 * `failed`, with skills mapped to ids (F-GBA-02). A guidebook file that already has a `reviewed`
 * or `draft` result is not read again; that result comes back with `cached: true` (F-GBA-03).
 * This is also how demo mode works without the LLM (ADR 0006).
 * Response: `{ extractionId, status, data?, warnings, error?, cached }`.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "VALIDATION");
  const { competitionId, force } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "AUTH_REQUIRED");

  const [{ data: isAdmin }, { data: profile }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("profiles").select("id").eq("user_id", user.id).single(),
  ]);
  if (!isAdmin || !profile) return fail(403, "FORBIDDEN");

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, category, guidebook_path")
    .eq("id", competitionId)
    .maybeSingle();
  if (!competition) return fail(404, "NOT_FOUND");
  if (!competition.guidebook_path) {
    return fail(400, "NOT_FOUND", "Lomba ini belum punya guidebook. Unggah PDF-nya dulu.");
  }

  const guidebookPath = competition.guidebook_path;

  if (!force) {
    const { data: rows } = await supabase
      .from("competition_extractions")
      .select("id, status, created_at, data, warnings")
      .eq("competition_id", competitionId)
      .in("status", ["reviewed", "draft"]);
    const cached = pickUsableExtraction(rows ?? [], guidebookPath);
    if (cached) {
      return NextResponse.json({
        extractionId: cached.id,
        status: cached.status,
        data: cached.data,
        warnings: cached.warnings,
        cached: true,
      });
    }
  }

  const gemini = getGemini();
  if (!gemini) return fail(503, "AI_UNAVAILABLE");

  const { count } = await supabase
    .from("agent_actions")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", profile.id)
    .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return fail(429, "RATE_LIMITED");

  const [file, skills, templates] = await Promise.all([
    supabase.storage.from("guidebooks").download(guidebookPath),
    supabase.from("skills").select("id, slug, name, aliases").order("id"),
    supabase
      .from("role_templates")
      .select("name, required_skills, optional_skill_ids, hours_per_week, slots")
      .eq("category", competition.category)
      .order("sort"),
  ]);
  if (file.error || !file.data) {
    return fail(404, "NOT_FOUND", "File guidebook tidak ditemukan. Unggah ulang PDF-nya.");
  }

  const { data: extraction, error: insertError } = await supabase
    .from("competition_extractions")
    .insert({
      competition_id: competitionId,
      status: "processing",
      model: gemini.model,
      prompt_version: GUIDEBOOK_PROMPT_VERSION,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (insertError || !extraction) {
    console.error("guidebook: insert extraction", insertError);
    return fail(500, "UNKNOWN");
  }

  const nameById = new Map((skills.data ?? []).map((s) => [s.id, s.name]));
  const started = Date.now();
  const result = await runGuidebookAgent({
    pdf: new Uint8Array(await file.data.arrayBuffer()),
    category: competition.category,
    skillNames: [...nameById.values()],
    templates: (templates.data ?? []).map((t) => toPromptTemplate(t, nameById)),
    generate: gemini.generateJson,
  });
  const durationMs = Date.now() - started;

  const error = result.status === "failed" ? result.error : null;
  const data: StoredExtraction | null =
    result.status === "draft"
      ? {
          ...result.data,
          guidebook_path: guidebookPath,
          roles: extractionToSuggestions(result.data, buildSkillIndex(skills.data ?? [])),
        }
      : null;
  const [update] = await Promise.all([
    supabase
      .from("competition_extractions")
      .update({
        status: result.status,
        // Plain JSON from Zod output; `Json` only rejects the optional (undefined) fields.
        data: data as Json,
        page_count: result.pageCount,
        warnings: result.warnings,
        error,
      })
      .eq("id", extraction.id),
    supabase.from("agent_actions").insert({
      agent: "guidebook",
      actor_id: profile.id,
      target_id: competitionId,
      input: { competitionId, pageCount: result.pageCount },
      output: { extractionId: extraction.id, status: result.status },
      approval: "auto",
      model: gemini.model,
      duration_ms: durationMs,
      error,
    }),
  ]);
  if (update.error) {
    console.error("guidebook: update extraction", update.error);
    return fail(500, "UNKNOWN");
  }

  return NextResponse.json({
    extractionId: extraction.id,
    status: result.status,
    ...(data ? { data } : { error }),
    warnings: result.warnings,
    cached: false,
  });
}

/** role_templates stores skill ids; the prompt wants the names the LLM should copy. */
function toPromptTemplate(
  t: {
    name: string;
    required_skills: unknown;
    optional_skill_ids: number[];
    hours_per_week: number;
    slots: number;
  },
  nameById: Map<number, string>,
): PromptTemplate {
  const required = Array.isArray(t.required_skills)
    ? (t.required_skills as { skill_id: number; min_level: number }[])
    : [];
  return {
    name: t.name,
    required_skills: required.map((r) => ({
      skill: nameById.get(r.skill_id) ?? "",
      min_level: r.min_level,
    })),
    optional_skills: t.optional_skill_ids.map((id) => nameById.get(id) ?? "").filter(Boolean),
    hours_per_week: t.hours_per_week,
    slots: t.slots,
  };
}
