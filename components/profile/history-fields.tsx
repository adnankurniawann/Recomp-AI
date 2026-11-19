"use client";

import { Plus, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import {
  COMP_CATEGORIES,
  COMP_CATEGORY_LABELS,
  COMP_RESULTS,
  COMP_RESULT_LABELS,
  type CompCategory,
  type CompResult,
} from "@/lib/constants";
import { emptyHistory, type FieldErrors, type HistoryValue } from "@/lib/profile/form";

interface HistoryFieldsProps {
  value: HistoryValue[];
  onChange: (value: HistoryValue[]) => void;
  errors: FieldErrors;
}

/** Competition history, optional (PRD F-PRF-03). */
export function HistoryFields({ value, onChange, errors }: HistoryFieldsProps) {
  const update = (index: number, patch: Partial<HistoryValue>) =>
    onChange(value.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  const add = () => onChange([...value, emptyHistory()]);
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  if (value.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Belum ada riwayat lomba"
        body="Boleh dikosongkan. Riwayat membantu ketua tim melihat pengalamanmu."
        action={
          <Button onClick={add} icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}>
            Tambah riwayat lomba
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {value.map((h, index) => {
          const id = (field: string) => `history-${h.key}-${field}`;
          const err = (field: string) => errors[`history.${index}.${field}`];
          const title = h.competitionName.trim() || `Riwayat ${index + 1}`;
          return (
            <li
              key={h.key}
              className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-ink-strong">{title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  aria-label={`Hapus ${title}`}
                  className="h-11 md:h-8"
                  icon={<Trash2 aria-hidden size={16} strokeWidth={1.75} />}
                >
                  Hapus
                </Button>
              </div>

              <Field id={id("name")} label="Nama lomba" error={err("competitionName")}>
                <Input
                  id={id("name")}
                  value={h.competitionName}
                  onChange={(e) => update(index, { competitionName: e.target.value })}
                  aria-invalid={!!err("competitionName")}
                  aria-describedby={fieldDescribedBy(id("name"), undefined, err("competitionName"))}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field id={id("year")} label="Tahun" error={err("year")}>
                  <Input
                    id={id("year")}
                    type="number"
                    inputMode="numeric"
                    min={2015}
                    max={2035}
                    className="font-mono tabular-nums"
                    value={Number.isNaN(h.year) ? "" : h.year}
                    onChange={(e) =>
                      update(index, {
                        year: e.target.value === "" ? Number.NaN : Number(e.target.value),
                      })
                    }
                    aria-invalid={!!err("year")}
                    aria-describedby={fieldDescribedBy(id("year"), undefined, err("year"))}
                  />
                </Field>
                <Field id={id("category")} label="Kategori" error={err("category")}>
                  <Select
                    id={id("category")}
                    value={h.category}
                    onChange={(e) =>
                      update(index, { category: e.target.value as CompCategory | "" })
                    }
                    aria-invalid={!!err("category")}
                    aria-describedby={fieldDescribedBy(id("category"), undefined, err("category"))}
                  >
                    <option value="">Pilih…</option>
                    {COMP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {COMP_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id={id("result")} label="Hasil" error={err("result")}>
                  <Select
                    id={id("result")}
                    value={h.result}
                    onChange={(e) => update(index, { result: e.target.value as CompResult })}
                  >
                    {COMP_RESULTS.map((r) => (
                      <option key={r} value={r}>
                        {COMP_RESULT_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={id("role")} label="Role di tim" optional error={err("role")}>
                  <Input
                    id={id("role")}
                    placeholder="UI/UX Designer"
                    value={h.role}
                    onChange={(e) => update(index, { role: e.target.value })}
                    aria-invalid={!!err("role")}
                    aria-describedby={fieldDescribedBy(id("role"), undefined, err("role"))}
                  />
                </Field>
                <Field id={id("evidence")} label="Tautan bukti" optional error={err("evidenceUrl")}>
                  <Input
                    id={id("evidence")}
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={h.evidenceUrl}
                    onChange={(e) => update(index, { evidenceUrl: e.target.value })}
                    aria-invalid={!!err("evidenceUrl")}
                    aria-describedby={fieldDescribedBy(
                      id("evidence"),
                      undefined,
                      err("evidenceUrl"),
                    )}
                  />
                </Field>
              </div>

              <Field
                id={id("note")}
                label="Catatan singkat"
                optional
                hint={<span className="font-mono tabular-nums">{h.note.length}/200</span>}
                error={err("note")}
              >
                <Input
                  id={id("note")}
                  maxLength={200}
                  value={h.note}
                  onChange={(e) => update(index, { note: e.target.value })}
                  aria-invalid={!!err("note")}
                  aria-describedby={fieldDescribedBy(id("note"), true, err("note"))}
                />
              </Field>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={add}
        className="self-start"
        icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}
      >
        Tambah riwayat lomba
      </Button>
    </div>
  );
}
