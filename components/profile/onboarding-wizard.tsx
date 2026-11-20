"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { completeOnboarding, saveOnboardingStep } from "@/app/(app)/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { ERROR_MESSAGES, issuesToFields } from "@/lib/action-result";
import {
  withSavedIds,
  type FieldErrors,
  type ProfileFormValues,
  type SkillOption,
} from "@/lib/profile/form";
import type { RoleTemplateSkills } from "@/lib/profile/suggest";
import {
  MIN_SKILLS,
  ONBOARDING_STEPS,
  stepSchemas,
  type OnboardingStep,
} from "@/lib/validation/profile";
import { ContactPrefsFields } from "./contact-prefs-fields";
import { HistoryFields } from "./history-fields";
import { IdentityFields } from "./identity-fields";
import { PortfolioFields } from "./portfolio-fields";
import { RolesSkillsFields } from "./roles-skills-fields";

const SECTION = {
  1: "identity",
  2: "rolesSkills",
  3: "historyPortfolio",
  4: "contactPrefs",
} as const;
const TITLES = ONBOARDING_STEPS.map((s) => s.title);

interface OnboardingWizardProps {
  initialStep: OnboardingStep;
  initialValues: ProfileFormValues;
  avatarUrl: string | null;
  skills: SkillOption[];
  templates: RoleTemplateSkills[];
}

/** The four-step onboarding wizard (PRD F-PRF-01). Each "Lanjut" saves its step. */
export function OnboardingWizard({
  initialStep,
  initialValues,
  avatarUrl,
  skills,
  templates,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const section = SECTION[step];
  const blocker =
    step === 2
      ? values.rolesSkills.preferredRoles.length < 1
        ? ERROR_MESSAGES.MIN_ROLES
        : values.rolesSkills.skills.length < MIN_SKILLS
          ? ERROR_MESSAGES.MIN_SKILLS
          : null
      : null;

  const ownSkills = values.rolesSkills.skills.flatMap((s) =>
    skills.filter((o) => o.id === s.skillId),
  );

  function goTo(next: OnboardingStep) {
    setErrors({});
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function submit() {
    const data = values[section];
    const parsed = stepSchemas[step].safeParse(data);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      toast.error(ERROR_MESSAGES.VALIDATION);
      return;
    }

    startTransition(async () => {
      const saved = await saveOnboardingStep(step, data);
      if (!saved.ok) {
        setErrors(saved.error.fields ?? {});
        toast.error(saved.error.message);
        return;
      }
      const ids = saved.data.ids;
      if (ids)
        setValues((v) => ({ ...v, historyPortfolio: withSavedIds(v.historyPortfolio, ids) }));
      if (step < 4) {
        goTo((step + 1) as OnboardingStep);
        return;
      }
      const done = await completeOnboarding();
      if (!done.ok) {
        toast.error(done.error.message);
        return;
      }
      toast.success("Profil kamu sudah lengkap. Selamat mencari tim!");
      router.push(done.data.redirect);
    });
  }

  return (
    <Card
      padding="lg"
      className="flex flex-col gap-8 max-sm:rounded-none max-sm:border-x-0 max-sm:px-4"
    >
      <Stepper steps={TITLES} current={step} />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!blocker && !pending) submit();
        }}
        className="flex flex-col gap-6"
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-ink-strong outline-none"
        >
          {TITLES[step - 1]}
        </h2>

        {step === 1 && (
          <IdentityFields
            value={values.identity}
            onChange={(identity) => setValues({ ...values, identity })}
            errors={errors}
            avatarUrl={avatarUrl}
          />
        )}
        {step === 2 && (
          <RolesSkillsFields
            value={values.rolesSkills}
            onChange={(rolesSkills) => setValues({ ...values, rolesSkills })}
            errors={errors}
            skills={skills}
            templates={templates}
          />
        )}
        {step === 3 && (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3" aria-labelledby="history-heading">
              <h3 id="history-heading" className="text-sm font-medium text-ink-2">
                Riwayat lomba <span className="font-normal text-ink-3">(opsional)</span>
              </h3>
              <HistoryFields
                value={values.historyPortfolio.history}
                onChange={(history) =>
                  setValues({
                    ...values,
                    historyPortfolio: { ...values.historyPortfolio, history },
                  })
                }
                errors={errors}
              />
            </section>
            <section className="flex flex-col gap-3" aria-labelledby="portfolio-heading">
              <h3 id="portfolio-heading" className="text-sm font-medium text-ink-2">
                Portofolio <span className="font-normal text-ink-3">(opsional)</span>
              </h3>
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
            </section>
          </div>
        )}
        {step === 4 && (
          <ContactPrefsFields
            value={values.contactPrefs}
            onChange={(contactPrefs) => setValues({ ...values, contactPrefs })}
            errors={errors}
          />
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-5">
          {blocker && (
            <p role="status" className="text-sm text-warning-ink">
              {blocker}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="lg"
              disabled={step === 1 || pending}
              onClick={() => goTo((step - 1) as OnboardingStep)}
              icon={<ArrowLeft aria-hidden size={16} strokeWidth={1.75} />}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!!blocker || pending}
              aria-busy={pending}
            >
              {pending ? "Menyimpan…" : step < 4 ? "Lanjut" : "Selesai"}
              {!pending &&
                (step < 4 ? (
                  <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
                ) : (
                  <Check aria-hidden size={16} strokeWidth={1.75} />
                ))}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
