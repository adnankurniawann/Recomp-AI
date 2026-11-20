"use server";

import type { ActionResult } from "@/lib/action-result";
import { finishOnboarding, saveProfileStep, type SavedStep } from "@/lib/profile/save";
import type { OnboardingStep } from "@/lib/validation/profile";

/** Save one wizard step. Data is kept per step, so closing the tab loses nothing (F-PRF-01). */
export async function saveOnboardingStep(
  step: OnboardingStep,
  data: unknown,
): Promise<ActionResult<SavedStep>> {
  return saveProfileStep(step, data);
}

/** Mark onboarding done once every step is saved, then go to /lomba. */
export async function completeOnboarding(): Promise<ActionResult<{ redirect: string }>> {
  return finishOnboarding();
}
