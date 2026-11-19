"use server";

import type { ActionResult } from "@/lib/action-result";
import { saveProfileStep } from "@/lib/profile/save";
import type { OnboardingStep } from "@/lib/validation/profile";

/** Save one /profil tab. The tabs are the onboarding steps, so they share one validator and writer (F-PRF-07). */
export async function saveProfileSection(
  step: OnboardingStep,
  data: unknown,
): Promise<ActionResult<{ step: OnboardingStep }>> {
  return saveProfileStep(step, data);
}
