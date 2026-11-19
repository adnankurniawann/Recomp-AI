"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { saveProfileSection } from "@/app/(app)/profil/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ERROR_MESSAGES, issuesToFields } from "@/lib/action-result";
import type { FieldErrors, ProfileFormValues, SkillOption } from "@/lib/profile/form";
import type { RoleTemplateSkills } from "@/lib/profile/suggest";
import { stepSchemas, type OnboardingStep } from "@/lib/validation/profile";
import { cn } from "@/lib/utils";
import { ContactPrefsFields } from "./contact-prefs-fields";
import { HistoryFields } from "./history-fields";
import { IdentityFields } from "./identity-fields";
import { PortfolioFields } from "./portfolio-fields";
import { RolesSkillsFields } from "./roles-skills-fields";

// The /profil tabs (PRD §10.11). Riwayat and Portofolio are one saved step, split into two tabs.
const TABS = [
  { key: "identity", label: "Data diri", step: 1 },
  { key: "skills", label: "Skill", step: 2 },
  { key: "history", label: "Riwayat", step: 3 },
  { key: "portfolio", label: "Portofolio", step: 3 },
  { key: "contact", label: "Kontak dan preferensi", step: 4 },
  { key: "account", label: "Akun", step: null },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const SECTION = {
  1: "identity",
  2: "rolesSkills",
  3: "historyPortfolio",
  4: "contactPrefs",
} as const;

/** Which tab shows the field an error belongs to, so a save error never hides on another tab. */
function tabForError(key: string, step: OnboardingStep): TabKey {
  if (step === 3) return key.startsWith("portfolio") ? "portfolio" : "history";
  return TABS.find((t) => t.step === step)!.key;
}

interface ProfileEditorProps {
  initialValues: ProfileFormValues;
  avatarUrl: string | null;
  loginEmail: string | null;
  skills: SkillOption[];
  templates: RoleTemplateSkills[];
}

/** Edit the profile any time, one tab per onboarding step (PRD F-PRF-07). */
export function ProfileEditor({
  initialValues,
  avatarUrl,
  loginEmail,
  skills,
  templates,
}: ProfileEditorProps) {
  const [tab, setTab] = useState<TabKey>("identity");
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const current = TABS.find((t) => t.key === tab)!;
  const ownSkills = values.rolesSkills.skills.flatMap((s) =>
    skills.filter((o) => o.id === s.skillId),
  );

  function save(step: OnboardingStep) {
    const data = values[SECTION[step]];
    const parsed = stepSchemas[step].safeParse(data);
    if (!parsed.success) {
      const fields = issuesToFields(parsed.error.issues);
      setErrors(fields);
      setTab(tabForError(Object.keys(fields)[0] ?? "", step));
      toast.error(ERROR_MESSAGES.VALIDATION);
      return;
    }
    startTransition(async () => {
      const result = await saveProfileSection(step, data);
      if (!result.ok) {
        const fields = result.error.fields ?? {};
        setErrors(fields);
        if (Object.keys(fields).length) setTab(tabForError(Object.keys(fields)[0]!, step));
        toast.error(result.error.message);
        return;
      }
      setErrors({});
      toast.success("Perubahan tersimpan");
    });
  }

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!;
    setTab(next.key);
    document.getElementById(`tab-${next.key}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label="Bagian profil"
          className="inline-flex gap-0.5 rounded-md bg-surface-2 p-[3px]"
        >
          {TABS.map((t, index) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t.key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                className={cn(
                  "h-11 rounded-sm px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-9",
                  active ? "bg-surface text-primary shadow-xs" : "text-ink-2 hover:text-ink",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <Card padding="lg" className="max-sm:px-4">
        <form
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (current.step && !pending) save(current.step);
          }}
          className="flex flex-col gap-6"
        >
          {tab === "identity" && (
            <IdentityFields
              value={values.identity}
              onChange={(identity) => setValues({ ...values, identity })}
              errors={errors}
              avatarUrl={avatarUrl}
            />
          )}
          {tab === "skills" && (
            <RolesSkillsFields
              value={values.rolesSkills}
              onChange={(rolesSkills) => setValues({ ...values, rolesSkills })}
              errors={errors}
              skills={skills}
              templates={templates}
            />
          )}
          {tab === "history" && (
            <HistoryFields
              value={values.historyPortfolio.history}
              onChange={(history) =>
                setValues({ ...values, historyPortfolio: { ...values.historyPortfolio, history } })
              }
              errors={errors}
            />
          )}
          {tab === "portfolio" && (
            <PortfolioFields
              value={values.historyPortfolio.portfolio}
              onChange={(portfolio) =>
                setValues({
                  ...values,
                  historyPortfolio: { ...values.historyPortfolio, portfolio },
                })
              }
              errors={errors}
              skillOptions={ownSkills}
            />
          )}
          {tab === "contact" && (
            <ContactPrefsFields
              value={values.contactPrefs}
              onChange={(contactPrefs) => setValues({ ...values, contactPrefs })}
              errors={errors}
            />
          )}
          {tab === "account" && (
            <dl className="flex flex-col gap-1">
              <dt className="text-sm font-medium text-ink-2">Email masuk</dt>
              <dd className="text-ink">{loginEmail ?? "-"}</dd>
            </dl>
          )}

          {current.step && (
            <div className="flex justify-end border-t border-line pt-5">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "Menyimpan…" : "Simpan perubahan"}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
