import "server-only";
import { revalidatePath } from "next/cache";
import { fail, failFromDb, failValidation, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { onboardingStepInput, type OnboardingStep } from "@/lib/validation/profile";

export interface SavedStep {
  step: OnboardingStep;
  /**
   * Step 3 only: the row ids of the saved history and portfolio, in the order sent. New items get
   * their id here, so the next save updates them instead of deleting and re-creating them (which
   * would also drop an uploaded portfolio cover).
   */
  ids?: { history: string[]; portfolio: string[] };
}

/**
 * Save one wizard step or /profil tab (PRD §13.1 `saveOnboardingStep`). Validates on the server,
 * then writes under the student's session: step 1 is a plain update guarded by RLS, steps 2 to 4
 * touch several tables and go through the security definer functions in 0002_profile_rls.sql.
 */
export async function saveProfileStep(
  step: OnboardingStep,
  data: unknown,
): Promise<ActionResult<SavedStep>> {
  const parsed = onboardingStepInput.safeParse({ step, data });
  if (!parsed.success) {
    // Paths come back as "data.username"; the form keys fields without the "data." prefix.
    return failValidation(
      parsed.error.issues.map((i) => ({
        ...i,
        path: i.path[0] === "data" ? i.path.slice(1) : i.path,
      })),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");

  const input = parsed.data;
  let ids: SavedStep["ids"];
  switch (input.step) {
    case 1: {
      const d = input.data;
      const { data: rows, error } = await supabase
        .from("profiles")
        .update({
          full_name: d.fullName,
          username: d.username,
          campus: d.campus,
          major: d.major,
          entry_year: d.entryYear,
          bio: d.bio,
        })
        .eq("user_id", user.id)
        .select("id");
      if (error?.code === "23505") {
        return fail("USERNAME_TAKEN", undefined, { username: "Username ini sudah dipakai" });
      }
      if (error) return logged(error);
      if (!rows?.length) return fail("NOT_FOUND");
      break;
    }
    case 2: {
      const d = input.data;
      const { error } = await supabase.rpc("save_profile_skills", {
        p_preferred_roles: d.preferredRoles,
        p_skills: d.skills.map((s) => ({
          skill_id: s.skillId,
          level: s.level,
          evidence_url: s.evidenceUrl,
        })),
      });
      if (error) return logged(error);
      break;
    }
    case 3: {
      const d = input.data;
      // An id for every new item, made here; ids from the client that the student doesn't own are
      // ignored by the SQL function.
      const history = d.history.map((h) => ({ ...h, id: h.id ?? crypto.randomUUID() }));
      const portfolio = d.portfolio.map((p) => ({ ...p, id: p.id ?? crypto.randomUUID() }));
      const { error } = await supabase.rpc("save_profile_history_portfolio", {
        p_history: history.map((h) => ({
          id: h.id,
          competition_name: h.competitionName,
          year: h.year,
          category: h.category,
          role: h.role,
          result: h.result,
          evidence_url: h.evidenceUrl,
          note: h.note,
        })),
        p_portfolio: portfolio.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          url: p.url,
          skill_ids: p.skillIds,
        })),
      });
      if (error) return logged(error);
      ids = { history: history.map((h) => h.id), portfolio: portfolio.map((p) => p.id) };
      break;
    }
    case 4: {
      const d = input.data;
      const { error } = await supabase.rpc("save_profile_contact", {
        p_whatsapp: d.whatsapp,
        p_contact_email: d.contactEmail ?? "",
        p_hours_per_week: d.hoursPerWeek,
        p_goal: d.goal,
        p_work_time: d.workTime,
        p_open_to_invite: d.openToInvite,
      });
      if (error) return logged(error);
      break;
    }
  }

  revalidatePath("/profil");
  return ok(ids ? { step, ids } : { step });
}

/** Finish onboarding (PRD §13.1 `completeOnboarding`). The SQL function checks every step is saved. */
export async function finishOnboarding(): Promise<ActionResult<{ redirect: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("AUTH_REQUIRED");

  const { error } = await supabase.rpc("complete_onboarding");
  if (error) return logged(error);

  revalidatePath("/", "layout");
  return ok({ redirect: "/lomba" });
}

function logged<T>(error: { code?: string; message: string }): ActionResult<T> {
  if (error.code !== "P0001") console.error("[profile]", error.code, error.message);
  return failFromDb(error);
}
