"use client";

import { Lock } from "lucide-react";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GOAL_LABELS, GOALS, WORK_TIME_LABELS, WORK_TIMES } from "@/lib/constants";
import type { ContactPrefsValues, FieldErrors } from "@/lib/profile/form";
import { ChoiceGroup, SwitchField } from "./choice-group";

interface ContactPrefsFieldsProps {
  value: ContactPrefsValues;
  onChange: (value: ContactPrefsValues) => void;
  errors: FieldErrors;
}

const goalOptions = GOALS.map((g) => ({ value: g, label: GOAL_LABELS[g] }));
const workTimeOptions = WORK_TIMES.map((w) => ({ value: w, label: WORK_TIME_LABELS[w] }));

/** Step 4 "Kontak dan preferensi" (PRD F-PRF-01, F-PRF-05). */
export function ContactPrefsFields({ value, onChange, errors }: ContactPrefsFieldsProps) {
  const set = <K extends keyof ContactPrefsValues>(key: K, v: ContactPrefsValues[K]) =>
    onChange({ ...value, [key]: v });
  const hoursHint = "Berapa jam per minggu yang bisa kamu luangkan untuk lomba, 0 sampai 40.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
        <p className="inline-flex items-center gap-2 text-sm text-ink-2">
          <Lock aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          Kontak hanya terlihat oleh rekan setim setelah undangan diterima.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="whatsapp"
            label="WhatsApp"
            hint="Awali dengan 08 atau +62."
            error={errors.whatsapp}
          >
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812 3456 7890"
              className="font-mono tabular-nums"
              value={value.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              aria-invalid={!!errors.whatsapp}
              aria-describedby={fieldDescribedBy("whatsapp", true, errors.whatsapp)}
            />
          </Field>
          <Field id="contactEmail" label="Email kontak" optional error={errors.contactEmail}>
            <Input
              id="contactEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={value.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              aria-invalid={!!errors.contactEmail}
              aria-describedby={fieldDescribedBy("contactEmail", undefined, errors.contactEmail)}
            />
          </Field>
        </div>
      </div>

      <Field
        id="hoursPerWeek"
        label="Jam tersedia per minggu"
        hint={hoursHint}
        error={errors.hoursPerWeek}
      >
        <Input
          id="hoursPerWeek"
          type="number"
          inputMode="numeric"
          min={0}
          max={40}
          className="font-mono tabular-nums sm:max-w-40"
          value={Number.isNaN(value.hoursPerWeek) ? "" : value.hoursPerWeek}
          onChange={(e) =>
            set("hoursPerWeek", e.target.value === "" ? Number.NaN : Number(e.target.value))
          }
          aria-invalid={!!errors.hoursPerWeek}
          aria-describedby={fieldDescribedBy("hoursPerWeek", hoursHint, errors.hoursPerWeek)}
        />
      </Field>

      <ChoiceGroup
        name="goal"
        legend="Tujuan ikut lomba"
        options={goalOptions}
        value={value.goal}
        onChange={(v) => set("goal", v)}
        error={errors.goal}
      />

      <ChoiceGroup
        name="workTime"
        legend="Jam kerja"
        options={workTimeOptions}
        value={value.workTime}
        onChange={(v) => set("workTime", v)}
        error={errors.workTime}
      />

      <SwitchField
        id="openToInvite"
        label="Terbuka untuk diajak"
        description="Kalau dimatikan, kamu tidak muncul di daftar kandidat tim mana pun."
        checked={value.openToInvite}
        onChange={(v) => set("openToInvite", v)}
      />
    </div>
  );
}
