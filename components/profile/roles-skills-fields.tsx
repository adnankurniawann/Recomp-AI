"use client";

import { Link2, Plus, Sparkles, Tags, X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import {
  LEVEL_LABELS,
  LEVELS,
  PREFERRED_ROLE_KEYS,
  ROLE_COLORS,
  ROLE_LABELS,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  type Level,
  type PreferredRoleKey,
} from "@/lib/constants";
import type { FieldErrors, RolesSkillsValues, SkillOption } from "@/lib/profile/form";
import { suggestSkillIds, type RoleTemplateSkills } from "@/lib/profile/suggest";
import { MAX_PREFERRED_ROLES } from "@/lib/validation/profile";
import { cn } from "@/lib/utils";

interface RolesSkillsFieldsProps {
  value: RolesSkillsValues;
  onChange: (value: RolesSkillsValues) => void;
  errors: FieldErrors;
  skills: SkillOption[];
  templates: RoleTemplateSkills[];
}

const MAX_SUGGESTIONS = 10;

/** Step 2 "Role dan skill" (PRD F-PRF-01, F-PRF-02). */
export function RolesSkillsFields({
  value,
  onChange,
  errors,
  skills,
  templates,
}: RolesSkillsFieldsProps) {
  const byId = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const chosen = new Set(value.skills.map((s) => s.skillId));
  const suggestions = suggestSkillIds(templates, value.preferredRoles)
    .filter((id) => byId.has(id) && !chosen.has(id))
    .slice(0, MAX_SUGGESTIONS);
  const roleLimitReached = value.preferredRoles.length >= MAX_PREFERRED_ROLES;

  function toggleRole(role: PreferredRoleKey) {
    const selected = value.preferredRoles.includes(role);
    if (!selected && roleLimitReached) return;
    onChange({
      ...value,
      preferredRoles: selected
        ? value.preferredRoles.filter((r) => r !== role)
        : [...value.preferredRoles, role],
    });
  }

  function addSkill(skillId: number) {
    if (!byId.has(skillId) || chosen.has(skillId)) return;
    onChange({ ...value, skills: [...value.skills, { skillId, level: 1, evidenceUrl: "" }] });
  }

  function updateSkill(index: number, patch: Partial<RolesSkillsValues["skills"][number]>) {
    onChange({
      ...value,
      skills: value.skills.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  function removeSkill(index: number) {
    onChange({ ...value, skills: value.skills.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-2" aria-describedby="preferredRoles-msg">
        <legend className="text-sm font-medium text-ink-2">Role yang kamu minati</legend>
        <p
          id="preferredRoles-msg"
          className={cn("text-xs", errors.preferredRoles ? "text-danger-ink" : "text-ink-3")}
        >
          {errors.preferredRoles ?? "Pilih 1 sampai 3. Ketua tim melihat ini saat mencari anggota."}
        </p>
        <div className="flex flex-wrap gap-2">
          {PREFERRED_ROLE_KEYS.map((role) => {
            const selected = value.preferredRoles.includes(role);
            const disabled = !selected && roleLimitReached;
            const color = ROLE_COLORS[role];
            return (
              <button
                key={role}
                type="button"
                aria-pressed={selected}
                aria-disabled={disabled}
                onClick={() => toggleRole(role)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-[border-color,background-color] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-8",
                  selected
                    ? cn("border-transparent", color.soft, color.ink)
                    : "border-line bg-surface text-ink-2 hover:border-line-strong",
                  disabled && "cursor-not-allowed opacity-50 hover:border-line",
                )}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", color.solid)} />
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="flex flex-col gap-4" aria-labelledby="skills-heading">
        <div className="flex flex-col gap-1">
          <h3 id="skills-heading" className="text-sm font-medium text-ink-2">
            Skill
          </h3>
          <p className={cn("text-xs", errors.skills ? "text-danger-ink" : "text-ink-3")}>
            {errors.skills ??
              "Pilih minimal 3 dari daftar. Tambahkan tautan bukti kalau ada, supaya skormu lebih kuat."}
          </p>
        </div>

        {skills.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Daftar skill belum tersedia"
            body="Daftar skill dimuat dari database. Coba muat ulang halaman sebentar lagi."
          />
        ) : (
          <>
            {suggestions.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg bg-wash p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-hover">
                  <Sparkles aria-hidden size={14} strokeWidth={1.75} />
                  Saran untuk role pilihanmu
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => addSkill(id)}
                      className="inline-flex h-11 items-center gap-1 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-xs hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-7"
                    >
                      <Plus aria-hidden size={14} strokeWidth={1.75} />
                      {byId.get(id)?.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field id="addSkill" label="Tambah skill lain">
              <Select id="addSkill" value="" onChange={(e) => addSkill(Number(e.target.value))}>
                <option value="">Pilih skill…</option>
                {SKILL_CATEGORIES.map((category) => {
                  const options = skills.filter(
                    (s) => s.category === category && !chosen.has(s.id),
                  );
                  if (options.length === 0) return null;
                  return (
                    <optgroup key={category} label={SKILL_CATEGORY_LABELS[category]}>
                      {options.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </Select>
            </Field>

            {value.skills.length > 0 && (
              <ul className="flex flex-col gap-3">
                {value.skills.map((s, index) => {
                  const name = byId.get(s.skillId)?.name ?? `Skill ${s.skillId}`;
                  const levelId = `skill-${s.skillId}-level`;
                  const evidenceId = `skill-${s.skillId}-evidence`;
                  const evidenceError = errors[`skills.${index}.evidenceUrl`];
                  const level = LEVEL_LABELS[s.level as Level];
                  return (
                    <li
                      key={s.skillId}
                      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                          {name}
                          {s.evidenceUrl && (
                            <Link2 aria-label="Ada bukti" size={14} className="text-ink-3" />
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Hapus skill ${name}`}
                          onClick={() => removeSkill(index)}
                          className="size-11 px-0 md:size-8"
                          icon={<X aria-hidden size={16} strokeWidth={1.75} />}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                        <Field id={levelId} label="Level" hint={level?.hint}>
                          <Select
                            id={levelId}
                            value={s.level}
                            onChange={(e) => updateSkill(index, { level: Number(e.target.value) })}
                            aria-describedby={fieldDescribedBy(levelId, level?.hint)}
                          >
                            {LEVELS.map((l) => (
                              <option key={l} value={l}>
                                {l} · {LEVEL_LABELS[l].label}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field id={evidenceId} label="Tautan bukti" optional error={evidenceError}>
                          <Input
                            id={evidenceId}
                            type="url"
                            inputMode="url"
                            placeholder="https://"
                            value={s.evidenceUrl}
                            onChange={(e) => updateSkill(index, { evidenceUrl: e.target.value })}
                            aria-invalid={!!evidenceError}
                            aria-describedby={fieldDescribedBy(
                              evidenceId,
                              undefined,
                              evidenceError,
                            )}
                          />
                        </Field>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
