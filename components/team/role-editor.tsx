"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { RoleSuggestion, UnmatchedSkill } from "@/lib/ai/skill-map";
import { guessColorKey } from "@/lib/ai/skill-map";
import {
  LEVEL_LABELS,
  LEVELS,
  ROLE_KEYS,
  ROLE_LABELS,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  type CompCategory,
  type Level,
} from "@/lib/constants";
import { roleSourceLabel } from "@/lib/format/role-source";
import type { SkillOption } from "@/lib/profile/form";
import { MAX_ROLES, totalSlots, type RoleInput } from "@/lib/validation/team";

/** A role in the editor: the input the server takes, plus what the card shows next to it. */
export type EditorRole = RoleInput & {
  unmatchedSkills?: UnmatchedSkill[];
  /** Members already in this role (existing teams); it can't drop below this many slots. */
  memberCount?: number;
};

interface RoleEditorProps {
  roles: EditorRole[];
  onChange: (roles: EditorRole[]) => void;
  skills: SkillOption[];
  /** The category templates, for "Tambah role" › "Dari template". */
  templates: RoleSuggestion[];
  category: CompCategory;
  teamMax: number;
  /** Field errors from Zod keyed "roles.0.name". */
  errors?: Record<string, string>;
}

const EMPTY_ROLE: EditorRole = {
  name: "",
  colorKey: "other",
  source: "manual",
  sourcePage: null,
  sourceCriterion: null,
  edited: false,
  requiredSkills: [],
  optionalSkillIds: [],
  hoursPerWeek: 8,
  slots: 1,
};

/** One card per role (PRD F-TEM-02), used by the team wizard and "Edit role". */
export function RoleEditor({
  roles,
  onChange,
  skills,
  templates,
  category,
  teamMax,
  errors = {},
}: RoleEditorProps) {
  const [adding, setAdding] = useState(false);
  const byId = new Map(skills.map((s) => [s.id, s.name]));
  const slots = totalSlots(roles);

  function patch(index: number, p: Partial<EditorRole>) {
    onChange(
      roles.map((r, i) =>
        i === index ? { ...r, ...p, edited: r.source !== "manual" || r.edited } : r,
      ),
    );
  }

  function add(role: EditorRole) {
    onChange([...roles, role]);
    setAdding(false);
  }

  function skillOptions(exclude: ReadonlySet<number>) {
    return SKILL_CATEGORIES.map((category) => {
      const options = skills.filter((s) => s.category === category && !exclude.has(s.id));
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
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {roles.map((r, i) => {
          const id = (field: string) => `role-${i}-${field}`;
          const err = (field: string) => errors[`roles.${i}.${field}`];
          const used = new Set([...r.requiredSkills.map((s) => s.skillId), ...r.optionalSkillIds]);
          const members = r.memberCount ?? 0;
          return (
            <li key={r.id ?? `new-${i}`}>
              <Card padding="md" className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-ink-3">
                      {roleSourceLabel(r, { category })}
                      {r.edited && " · diubah ketua"}
                    </p>
                    {members > 0 && (
                      <p className="text-xs text-ink-2">
                        <span className="font-mono tabular-nums">{members}</span> anggota di role
                        ini
                      </p>
                    )}
                  </div>
                  <IconButton
                    label={`Hapus role ${r.name || i + 1}`}
                    icon={<Trash2 aria-hidden size={16} strokeWidth={1.75} />}
                    disabled={members > 0}
                    onClick={() => onChange(roles.filter((_, j) => j !== i))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                  <Field id={id("name")} label="Nama role" error={err("name")}>
                    <Input
                      id={id("name")}
                      value={r.name}
                      maxLength={40}
                      onChange={(e) =>
                        patch(i, {
                          name: e.target.value,
                          ...(r.source === "manual" &&
                            r.colorKey === "other" && { colorKey: guessColorKey(e.target.value) }),
                        })
                      }
                      aria-invalid={!!err("name")}
                      aria-describedby={fieldDescribedBy(id("name"), undefined, err("name"))}
                    />
                  </Field>
                  <Field id={id("color")} label="Bidang">
                    <Select
                      id={id("color")}
                      value={r.colorKey}
                      onChange={(e) =>
                        patch(i, { colorKey: e.target.value as EditorRole["colorKey"] })
                      }
                    >
                      {ROLE_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {ROLE_LABELS[k]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field id={id("description")} label="Deskripsi" optional error={err("description")}>
                  <Textarea
                    id={id("description")}
                    value={r.description ?? ""}
                    maxLength={200}
                    onChange={(e) => patch(i, { description: e.target.value })}
                    aria-invalid={!!err("description")}
                    aria-describedby={fieldDescribedBy(
                      id("description"),
                      undefined,
                      err("description"),
                    )}
                    className="min-h-16"
                  />
                </Field>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-sm font-medium text-ink-2">Skill wajib</legend>
                  {r.requiredSkills.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {r.requiredSkills.map((s, k) => {
                        const name = byId.get(s.skillId) ?? `Skill ${s.skillId}`;
                        return (
                          <li key={s.skillId} className="flex items-center gap-2">
                            <span className="flex-1 text-sm text-ink">{name}</span>
                            <label htmlFor={id(`level-${s.skillId}`)} className="sr-only">
                              Level minimal {name}
                            </label>
                            <Select
                              id={id(`level-${s.skillId}`)}
                              value={s.minLevel}
                              onChange={(e) =>
                                patch(i, {
                                  requiredSkills: r.requiredSkills.map((x, j) =>
                                    j === k ? { ...x, minLevel: Number(e.target.value) } : x,
                                  ),
                                })
                              }
                              className="w-48 sm:w-56"
                            >
                              {LEVELS.map((l) => (
                                <option key={l} value={l}>
                                  Min. {l} · {LEVEL_LABELS[l as Level].label}
                                </option>
                              ))}
                            </Select>
                            <IconButton
                              label={`Hapus skill wajib ${name}`}
                              icon={<X aria-hidden size={16} strokeWidth={1.75} />}
                              onClick={() =>
                                patch(i, {
                                  requiredSkills: r.requiredSkills.filter((_, j) => j !== k),
                                })
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <label htmlFor={id("add-required")} className="sr-only">
                    Tambah skill wajib
                  </label>
                  <Select
                    id={id("add-required")}
                    value=""
                    onChange={(e) =>
                      patch(i, {
                        requiredSkills: [
                          ...r.requiredSkills,
                          { skillId: Number(e.target.value), minLevel: 2 },
                        ],
                      })
                    }
                    aria-invalid={!!err("requiredSkills")}
                    aria-describedby={fieldDescribedBy(
                      id("add-required"),
                      undefined,
                      err("requiredSkills"),
                    )}
                  >
                    <option value="">Tambah skill wajib…</option>
                    {skillOptions(used)}
                  </Select>
                  {err("requiredSkills") && (
                    <p id={`${id("add-required")}-error`} className="text-xs text-danger-ink">
                      {err("requiredSkills")}
                    </p>
                  )}
                  {(r.unmatchedSkills?.length ?? 0) > 0 && (
                    <p className="text-xs text-ink-3">
                      Dari guidebook, belum ada di daftar skill:{" "}
                      {r.unmatchedSkills!.map((u) => u.name).join(", ")}. Pilih skill yang paling
                      dekat.
                    </p>
                  )}
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-sm font-medium text-ink-2">
                    Skill tambahan <span className="font-normal text-ink-3">(opsional)</span>
                  </legend>
                  {r.optionalSkillIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.optionalSkillIds.map((sid) => (
                        <Chip
                          key={sid}
                          color={r.colorKey}
                          onRemove={() =>
                            patch(i, {
                              optionalSkillIds: r.optionalSkillIds.filter((x) => x !== sid),
                            })
                          }
                        >
                          {byId.get(sid) ?? `Skill ${sid}`}
                        </Chip>
                      ))}
                    </div>
                  )}
                  <label htmlFor={id("add-optional")} className="sr-only">
                    Tambah skill tambahan
                  </label>
                  <Select
                    id={id("add-optional")}
                    value=""
                    onChange={(e) =>
                      patch(i, {
                        optionalSkillIds: [...r.optionalSkillIds, Number(e.target.value)],
                      })
                    }
                  >
                    <option value="">Tambah skill tambahan…</option>
                    {skillOptions(used)}
                  </Select>
                </fieldset>

                <div className="grid grid-cols-2 gap-4 sm:w-80">
                  <Field id={id("hours")} label="Jam per minggu" error={err("hoursPerWeek")}>
                    <Input
                      id={id("hours")}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={40}
                      value={r.hoursPerWeek}
                      onChange={(e) => patch(i, { hoursPerWeek: Number(e.target.value) })}
                      aria-invalid={!!err("hoursPerWeek")}
                      aria-describedby={fieldDescribedBy(
                        id("hours"),
                        undefined,
                        err("hoursPerWeek"),
                      )}
                      className="font-mono"
                    />
                  </Field>
                  <Field id={id("slots")} label="Jumlah slot" error={err("slots")}>
                    <Input
                      id={id("slots")}
                      type="number"
                      inputMode="numeric"
                      min={Math.max(1, members)}
                      max={3}
                      value={r.slots}
                      onChange={(e) =>
                        patch(i, {
                          slots: Math.min(3, Math.max(1, members, Number(e.target.value) || 1)),
                        })
                      }
                      aria-invalid={!!err("slots")}
                      aria-describedby={fieldDescribedBy(id("slots"), undefined, err("slots"))}
                      className="font-mono"
                    />
                  </Field>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          Total slot <span className="font-mono tabular-nums">{slots}</span> dari maks.{" "}
          <span className="font-mono tabular-nums">{teamMax}</span>
        </p>
        {roles.length < MAX_ROLES &&
          (adding ? (
            <div className="flex flex-wrap items-center gap-2">
              {templates.length > 0 && (
                <>
                  <label htmlFor="add-template" className="sr-only">
                    Dari template
                  </label>
                  <Select
                    id="add-template"
                    value=""
                    onChange={(e) => {
                      const t = templates[Number(e.target.value)]!;
                      add({ ...t, source: "manual", edited: false, unmatchedSkills: [] });
                    }}
                    className="w-56"
                  >
                    <option value="">Dari template…</option>
                    {templates.map((t, k) => (
                      <option key={t.name} value={k}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </>
              )}
              <Button variant="secondary" onClick={() => add({ ...EMPTY_ROLE })}>
                Kosong
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Batal
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setAdding(true)}
              icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}
            >
              Tambah role
            </Button>
          ))}
      </div>
    </div>
  );
}
