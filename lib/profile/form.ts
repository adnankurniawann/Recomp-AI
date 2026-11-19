import {
  COMP_CATEGORIES,
  isRoleKey,
  type CompCategory,
  type CompResult,
  type Goal,
  type PreferredRoleKey,
  type SkillCategory,
  type WorkTime,
} from "@/lib/constants";
import type { Tables } from "@/lib/supabase/types";
import type { SavedProfileState } from "./progress";

// What the onboarding wizard and the /profil tabs edit. Fields hold what the inputs hold (empty
// strings, NaN for an empty number); the Zod schemas in lib/validation/profile.ts turn them into
// clean data on save.

export interface IdentityValues {
  fullName: string;
  username: string;
  campus: string;
  major: string;
  entryYear: number;
  bio: string;
}

export interface SkillValue {
  skillId: number;
  level: number;
  evidenceUrl: string;
}

export interface RolesSkillsValues {
  preferredRoles: PreferredRoleKey[];
  skills: SkillValue[];
}

export interface HistoryValue {
  /** Stable React key; never saved. */
  key: string;
  id?: string;
  competitionName: string;
  year: number;
  category: CompCategory | "";
  role: string;
  result: CompResult;
  evidenceUrl: string;
  note: string;
}

export interface PortfolioValue {
  key: string;
  id?: string;
  title: string;
  description: string;
  url: string;
  skillIds: number[];
}

export interface HistoryPortfolioValues {
  history: HistoryValue[];
  portfolio: PortfolioValue[];
}

export interface ContactPrefsValues {
  whatsapp: string;
  contactEmail: string;
  hoursPerWeek: number;
  goal: Goal;
  workTime: WorkTime;
  openToInvite: boolean;
}

export interface ProfileFormValues {
  identity: IdentityValues;
  rolesSkills: RolesSkillsValues;
  historyPortfolio: HistoryPortfolioValues;
  contactPrefs: ContactPrefsValues;
}

export interface SkillOption {
  id: number;
  name: string;
  category: SkillCategory;
}

export type FieldErrors = Record<string, string>;

let keySeq = 0;
/** A client-only key for a new list item. */
export function newItemKey(): string {
  keySeq += 1;
  return `new-${keySeq}`;
}

export function emptyHistory(): HistoryValue {
  return {
    key: newItemKey(),
    competitionName: "",
    year: new Date().getFullYear(),
    category: "",
    role: "",
    result: "participant",
    evidenceUrl: "",
    note: "",
  };
}

export function emptyPortfolio(): PortfolioValue {
  return { key: newItemKey(), title: "", description: "", url: "", skillIds: [] };
}

export interface OwnProfileRows {
  profile: Tables<"profiles">;
  skills: Pick<Tables<"profile_skills">, "skill_id" | "level" | "evidence_url">[];
  history: Tables<"competition_history">[];
  portfolio: Tables<"portfolio_items">[];
  contact: Pick<Tables<"profile_contacts">, "whatsapp" | "contact_email"> | null;
  /** The sign-in email, used as the contact email until the student sets one. */
  loginEmail: string | null;
}

/** Saved rows → form values. Keeps the order the profile shows: newest history first. */
export function toFormValues(rows: OwnProfileRows): ProfileFormValues {
  const { profile } = rows;
  return {
    identity: {
      fullName: profile.full_name,
      username: profile.username ?? "",
      campus: profile.campus ?? "",
      major: profile.major ?? "",
      entryYear: profile.entry_year ?? Number.NaN,
      bio: profile.bio ?? "",
    },
    rolesSkills: {
      preferredRoles: profile.preferred_roles.filter(
        (r): r is PreferredRoleKey => isRoleKey(r) && r !== "other",
      ),
      skills: rows.skills.map((s) => ({
        skillId: s.skill_id,
        level: s.level,
        evidenceUrl: s.evidence_url ?? "",
      })),
    },
    historyPortfolio: {
      history: [...rows.history]
        .sort((a, b) => b.year - a.year)
        .map((h) => ({
          key: h.id,
          id: h.id,
          competitionName: h.competition_name,
          year: h.year,
          category: (COMP_CATEGORIES as readonly string[]).includes(h.category) ? h.category : "",
          role: h.role ?? "",
          result: h.result,
          evidenceUrl: h.evidence_url ?? "",
          note: h.note ?? "",
        })),
      portfolio: [...rows.portfolio]
        .sort((a, b) => a.sort - b.sort)
        .map((p) => ({
          key: p.id,
          id: p.id,
          title: p.title,
          description: p.description ?? "",
          url: p.url,
          skillIds: p.skill_ids,
        })),
    },
    contactPrefs: {
      whatsapp: rows.contact?.whatsapp ?? "",
      contactEmail: rows.contact?.contact_email ?? rows.loginEmail ?? "",
      hoursPerWeek: profile.hours_per_week,
      goal: profile.goal,
      workTime: profile.work_time,
      openToInvite: profile.open_to_invite,
    },
  };
}

export function toSavedState(rows: OwnProfileRows): SavedProfileState {
  return {
    username: rows.profile.username,
    campus: rows.profile.campus,
    major: rows.profile.major,
    entryYear: rows.profile.entry_year,
    preferredRoleCount: rows.profile.preferred_roles.length,
    skillCount: rows.skills.length,
    hasWhatsapp: Boolean(rows.contact?.whatsapp),
  };
}
