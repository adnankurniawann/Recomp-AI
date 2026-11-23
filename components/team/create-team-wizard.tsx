"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTeam } from "@/app/(app)/tim/actions";
import { ChoiceGroup } from "@/components/profile/choice-group";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { ERROR_MESSAGES, issuesToFields } from "@/lib/action-result";
import type { RoleSuggestions } from "@/lib/ai/role-suggestions";
import type { RoleSuggestion } from "@/lib/ai/skill-map";
import {
  GOAL_LABELS,
  GOALS,
  WORK_TIME_LABELS,
  WORK_TIMES,
  type CompCategory,
  type Goal,
  type WorkTime,
} from "@/lib/constants";
import type { SkillOption } from "@/lib/profile/form";
import { createTeamSchema, totalSlots } from "@/lib/validation/team";
import { RoleEditor, type EditorRole } from "./role-editor";
import { StartingInvites, type StartingInvite } from "./starting-invites";

const STEPS = ["Tujuan tim", "Role yang dibutuhkan", "Role kamu"] as const;
const GOAL_OPTIONS = GOALS.map((value) => ({ value, label: GOAL_LABELS[value] }));
const WORK_TIME_OPTIONS = WORK_TIMES.map((value) => ({ value, label: WORK_TIME_LABELS[value] }));

interface CreateTeamWizardProps {
  competition: { id: string; category: CompCategory; teamMax: number };
  suggestions: RoleSuggestions | null;
  templates: RoleSuggestion[];
  skills: SkillOption[];
}

/** The three-step team wizard (PRD F-TEM-01); step 2 is the role editor (F-TEM-02). */
export function CreateTeamWizard({
  competition,
  suggestions,
  templates,
  skills,
}: CreateTeamWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("win");
  const [workTime, setWorkTime] = useState<WorkTime>("flexible");
  const [roles, setRoles] = useState<EditorRole[]>(suggestions?.roles ?? []);
  const [leaderRoleIndex, setLeaderRoleIndex] = useState(0);
  const [invites, setInvites] = useState<StartingInvite[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const slots = totalSlots(roles);
  const blocker =
    step === 2
      ? roles.length === 0
        ? "Tim butuh minimal 1 role"
        : slots > competition.teamMax
          ? `Total slot melebihi batas tim lomba (maks. ${competition.teamMax})`
          : null
      : null;

  const input = {
    competitionId: competition.id,
    name,
    goal,
    workTime,
    roles,
    leaderRoleIndex: Math.min(leaderRoleIndex, roles.length - 1),
    invites: invites.map(({ profileId, roleIndex }) => ({ profileId, roleIndex })),
  };

  function goTo(next: number) {
    setErrors({});
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function next() {
    const parsed = createTeamSchema.safeParse(input);
    const fields = parsed.success ? {} : issuesToFields(parsed.error.issues);
    if (step === 1 && fields.name) return setErrors({ name: fields.name });
    if (step === 2) {
      const roleErrors = Object.fromEntries(
        Object.entries(fields).filter(([key]) => key.startsWith("roles.")),
      );
      if (Object.keys(roleErrors).length > 0) {
        setErrors(roleErrors);
        toast.error(ERROR_MESSAGES.VALIDATION);
        return;
      }
    }
    if (step < 3) return goTo(step + 1);

    startTransition(async () => {
      const res = await createTeam({ ...input, extractionId: suggestions?.extractionId });
      if (!res.ok) {
        setErrors(res.error.fields ?? {});
        toast.error(res.error.message);
        return;
      }
      toast.success("Tim kamu sudah dibuat. Sekarang cari anggota untuk role yang kosong.");
      if (res.data.invitesFailed > 0)
        toast.error(
          `${res.data.invitesFailed} undangan belum terkirim. Coba undang lagi dari dashboard tim.`,
        );
      router.push(`/tim/${res.data.teamId}`);
    });
  }

  return (
    <Card padding="lg" className="flex flex-col gap-8 max-sm:px-4">
      <Stepper steps={STEPS} current={step} />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!blocker && !pending) next();
        }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-ink-strong">{STEPS[step - 1]}</h2>

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <Field id="name" label="Nama tim" error={errors.name}>
              <Input
                id="name"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={fieldDescribedBy("name", undefined, errors.name)}
              />
            </Field>
            <ChoiceGroup
              name="goal"
              legend="Tujuan tim"
              options={GOAL_OPTIONS}
              value={goal}
              onChange={setGoal}
            />
            <ChoiceGroup
              name="workTime"
              legend="Jam kerja tim"
              options={WORK_TIME_OPTIONS}
              value={workTime}
              onChange={setWorkTime}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {suggestions?.notice && (
              <p role="status" className="rounded-md bg-wash px-4 py-3 text-sm text-ink-2">
                {suggestions.notice}
              </p>
            )}
            {suggestions?.extractionStatus === "draft" && (
              <p className="text-sm text-ink-3">Ringkasan dibuat AI dan belum diperiksa admin.</p>
            )}
            <RoleEditor
              roles={roles}
              onChange={(next) => {
                if (next.length !== roles.length) setInvites([]); // role indexes shift
                setRoles(next);
              }}
              skills={skills}
              templates={templates}
              category={competition.category}
              teamMax={competition.teamMax}
              errors={errors}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2">
              Kamu otomatis masuk tim sebagai ketua. Pilih role yang akan kamu isi sendiri.
            </p>
            <ChoiceGroup
              name="leaderRole"
              legend="Role kamu"
              options={roles.map((r, i) => ({ value: String(i), label: r.name }))}
              value={String(input.leaderRoleIndex)}
              onChange={(v) => {
                const index = Number(v);
                setLeaderRoleIndex(index);
                // The leader now fills a one-slot role: invites to it would come back ROLE_FULL.
                if (roles[index]?.slots === 1)
                  setInvites(invites.filter((x) => x.roleIndex !== index));
              }}
              error={errors.leaderRoleIndex}
            />
            <StartingInvites
              roles={roles}
              leaderRoleIndex={input.leaderRoleIndex}
              value={invites}
              onChange={setInvites}
            />
          </div>
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
              onClick={() => goTo(step - 1)}
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
              {pending ? "Menyimpan…" : step < 3 ? "Lanjut" : "Buat tim"}
              {!pending &&
                (step < 3 ? (
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
