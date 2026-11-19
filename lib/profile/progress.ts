import type { OnboardingStep } from "@/lib/validation/profile";

export interface SavedProfileState {
  username: string | null;
  campus: string | null;
  major: string | null;
  entryYear: number | null;
  preferredRoleCount: number;
  skillCount: number;
  hasWhatsapp: boolean;
}

/**
 * The wizard step to reopen at, so closing the tab doesn't lose the place (PRD F-PRF-01).
 * Step 3 is optional, so a student who saved step 2 but not step 4 lands on step 3 again.
 */
export function resumeStep(s: SavedProfileState): OnboardingStep {
  if (!s.username || !s.campus || !s.major || s.entryYear === null) return 1;
  if (s.preferredRoleCount < 1 || s.skillCount < 3) return 2;
  if (!s.hasWhatsapp) return 3;
  return 4;
}
