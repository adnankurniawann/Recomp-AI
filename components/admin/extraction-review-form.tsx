"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewExtraction } from "@/app/(app)/admin/actions";
import { RoleEditor, type EditorRole } from "@/components/team/role-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { ERROR_MESSAGES, issuesToFields } from "@/lib/action-result";
import type { RoleSuggestion } from "@/lib/ai/skill-map";
import type { CompCategory } from "@/lib/constants";
import type { SkillOption } from "@/lib/profile/form";
import { reviewExtractionSchema } from "@/lib/validation/admin";

type Deadline = { name: string; date: string | null; page: number | null };
type Criterion = {
  name: string;
  weightPercent: number | null;
  description?: string;
  page: number | null;
};
type ReviewRole = EditorRole & { reason?: string | null };

export interface ReviewValues {
  summary: string;
  teamSize: { min: number; max: number };
  deadlines: Deadline[];
  criteria: Criterion[];
  roles: ReviewRole[];
}

interface ExtractionReviewFormProps {
  extractionId: string;
  competitionId: string;
  initial: ReviewValues;
  skills: SkillOption[];
  templates: RoleSuggestion[];
  category: CompCategory;
}

/** Edit the guidebook agent's result as a form, then approve it as `reviewed` (F-CMP-04). */
export function ExtractionReviewForm({
  extractionId,
  competitionId,
  initial,
  skills,
  templates,
  category,
}: ExtractionReviewFormProps) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const patchList = <K extends "deadlines" | "criteria">(
    key: K,
    i: number,
    patch: Partial<ReviewValues[K][number]>,
  ) =>
    setV((s) => ({
      ...s,
      [key]: s[key].map((item, j) => (j === i ? { ...item, ...patch } : item)),
    }));
  const removeAt = (key: "deadlines" | "criteria", i: number) =>
    setV((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) }));

  function approve() {
    const input = { extractionId, ...v };
    const parsed = reviewExtractionSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      toast.error(ERROR_MESSAGES.VALIDATION);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await reviewExtraction(input);
      if (!res.ok) {
        setErrors(res.error.fields ?? {});
        toast.error(res.error.message);
        return;
      }
      toast.success("Hasil ekstraksi disetujui. Ketua tim sekarang memakai versi ini.");
      router.push(`/admin/lomba/${competitionId}`);
    });
  }

  // RoleEditor reports errors as `roles.0.name`; ours come back with the same paths.
  const roleErrors = Object.fromEntries(
    Object.entries(errors).filter(([k]) => k.startsWith("roles.")),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
        <SectionLabel>Ringkasan</SectionLabel>
        <Field id="summary" label="Ringkasan lomba" error={errors.summary}>
          <Textarea
            id="summary"
            rows={4}
            value={v.summary}
            onChange={(e) => setV((s) => ({ ...s, summary: e.target.value }))}
            aria-invalid={!!errors.summary}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
          {(["min", "max"] as const).map((k) => (
            <Field
              key={k}
              id={`team-${k}`}
              label={k === "min" ? "Minimal anggota" : "Maksimal anggota"}
              error={errors[`teamSize.${k}`]}
            >
              <Input
                id={`team-${k}`}
                type="number"
                min={1}
                max={10}
                className="font-mono"
                value={Number.isNaN(v.teamSize[k]) ? "" : v.teamSize[k]}
                onChange={(e) =>
                  setV((s) => ({ ...s, teamSize: { ...s.teamSize, [k]: e.target.valueAsNumber } }))
                }
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
        <SectionLabel>Kriteria penilaian</SectionLabel>
        <ul className="flex flex-col gap-3">
          {v.criteria.map((c, i) => (
            <li key={i} className="flex items-end gap-2">
              <Field
                id={`criteria-${i}-name`}
                label="Kriteria"
                error={errors[`criteria.${i}.name`]}
                className="flex-1"
              >
                <Input
                  id={`criteria-${i}-name`}
                  value={c.name}
                  onChange={(e) => patchList("criteria", i, { name: e.target.value })}
                />
              </Field>
              <Field
                id={`criteria-${i}-weight`}
                label="Bobot %"
                error={errors[`criteria.${i}.weightPercent`]}
                className="w-24"
              >
                <Input
                  id={`criteria-${i}-weight`}
                  type="number"
                  min={0}
                  max={100}
                  className="font-mono"
                  value={c.weightPercent ?? ""}
                  onChange={(e) =>
                    patchList("criteria", i, {
                      weightPercent: e.target.value === "" ? null : e.target.valueAsNumber,
                    })
                  }
                />
              </Field>
              <IconButton
                label={`Hapus kriteria ${c.name || i + 1}`}
                icon={<Trash2 aria-hidden size={16} strokeWidth={1.75} />}
                onClick={() => removeAt("criteria", i)}
              />
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          className="self-start"
          icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}
          onClick={() =>
            setV((s) => ({
              ...s,
              criteria: [...s.criteria, { name: "", weightPercent: null, page: null }],
            }))
          }
        >
          Tambah kriteria
        </Button>
      </Card>

      <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
        <SectionLabel>Tanggal penting</SectionLabel>
        <ul className="flex flex-col gap-3">
          {v.deadlines.map((d, i) => (
            <li key={i} className="flex items-end gap-2">
              <Field
                id={`deadline-${i}-name`}
                label="Tahap"
                error={errors[`deadlines.${i}.name`]}
                className="flex-1"
              >
                <Input
                  id={`deadline-${i}-name`}
                  value={d.name}
                  onChange={(e) => patchList("deadlines", i, { name: e.target.value })}
                />
              </Field>
              <Field id={`deadline-${i}-date`} label="Tanggal" className="w-40">
                <Input
                  id={`deadline-${i}-date`}
                  type="date"
                  value={d.date ?? ""}
                  onChange={(e) => patchList("deadlines", i, { date: e.target.value || null })}
                />
              </Field>
              <IconButton
                label={`Hapus tanggal ${d.name || i + 1}`}
                icon={<Trash2 aria-hidden size={16} strokeWidth={1.75} />}
                onClick={() => removeAt("deadlines", i)}
              />
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          className="self-start"
          icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}
          onClick={() =>
            setV((s) => ({
              ...s,
              deadlines: [...s.deadlines, { name: "", date: null, page: null }],
            }))
          }
        >
          Tambah tanggal
        </Button>
      </Card>

      <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
        <SectionLabel>Role yang disarankan</SectionLabel>
        {errors.roles && <p className="text-sm text-danger-ink">{errors.roles}</p>}
        <RoleEditor
          roles={v.roles}
          onChange={(roles) => setV((s) => ({ ...s, roles: roles as ReviewRole[] }))}
          skills={skills}
          templates={templates}
          category={category}
          teamMax={Number.isNaN(v.teamSize.max) ? 10 : v.teamSize.max}
          errors={roleErrors}
        />
      </Card>

      <Button
        variant="primary"
        size="lg"
        className="self-end"
        onClick={approve}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Menyimpan…" : "Simpan dan setujui"}
      </Button>
    </div>
  );
}
