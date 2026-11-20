"use client";

import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import {
  emptyPortfolio,
  type FieldErrors,
  type PortfolioValue,
  type SkillOption,
} from "@/lib/profile/form";
import { cn } from "@/lib/utils";
import { PortfolioCover } from "./portfolio-cover";

interface PortfolioFieldsProps {
  value: PortfolioValue[];
  onChange: (value: PortfolioValue[]) => void;
  errors: FieldErrors;
  /** The student's own skills, offered as "skill terkait". */
  skillOptions: SkillOption[];
  /** Show the cover uploader (on /profil). An item gets it once it has been saved and has an id. */
  covers?: boolean;
}

const MAX_RELATED_SKILLS = 6;

/** Portfolio items, optional (PRD F-PRF-04). Covers are uploaded on /profil, after the item is saved. */
export function PortfolioFields({
  value,
  onChange,
  errors,
  skillOptions,
  covers = false,
}: PortfolioFieldsProps) {
  const update = (index: number, patch: Partial<PortfolioValue>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const add = () => onChange([...value, emptyPortfolio()]);
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  if (value.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Belum ada portofolio"
        body="Boleh dikosongkan. Tautan karya membuat ketua tim lebih yakin."
        action={
          <Button onClick={add} icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}>
            Tambah portofolio
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {value.map((p, index) => {
          const id = (field: string) => `portfolio-${p.key}-${field}`;
          const err = (field: string) => errors[`portfolio.${index}.${field}`];
          const title = p.title.trim() || `Portofolio ${index + 1}`;
          const toggleSkill = (skillId: number) => {
            const has = p.skillIds.includes(skillId);
            if (!has && p.skillIds.length >= MAX_RELATED_SKILLS) return;
            update(index, {
              skillIds: has ? p.skillIds.filter((s) => s !== skillId) : [...p.skillIds, skillId],
            });
          };
          return (
            <li
              key={p.key}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={id("title")} label="Judul" error={err("title")}>
                  <Input
                    id={id("title")}
                    maxLength={80}
                    value={p.title}
                    onChange={(e) => update(index, { title: e.target.value })}
                    aria-invalid={!!err("title")}
                    aria-describedby={fieldDescribedBy(id("title"), undefined, err("title"))}
                  />
                </Field>
                <Field id={id("url")} label="Tautan utama" error={err("url")}>
                  <Input
                    id={id("url")}
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={p.url}
                    onChange={(e) => update(index, { url: e.target.value })}
                    aria-invalid={!!err("url")}
                    aria-describedby={fieldDescribedBy(id("url"), undefined, err("url"))}
                  />
                </Field>
              </div>

              <Field
                id={id("description")}
                label="Deskripsi"
                optional
                hint={<span className="font-mono tabular-nums">{p.description.length}/300</span>}
                error={err("description")}
              >
                <Textarea
                  id={id("description")}
                  maxLength={300}
                  value={p.description}
                  onChange={(e) => update(index, { description: e.target.value })}
                  aria-invalid={!!err("description")}
                  aria-describedby={fieldDescribedBy(id("description"), true, err("description"))}
                />
              </Field>

              {covers &&
                (p.id ? (
                  <PortfolioCover
                    portfolioId={p.id}
                    coverUrl={p.coverUrl}
                    onChange={(coverUrl) => update(index, { coverUrl })}
                  />
                ) : (
                  <p className="text-xs text-ink-3">
                    Simpan perubahan dulu, lalu kamu bisa menambah gambar sampul.
                  </p>
                ))}

              {skillOptions.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-medium text-ink-2">
                    Skill terkait{" "}
                    <span className="font-normal text-ink-3">(opsional, maks. 6)</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((s) => {
                      const selected = p.skillIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleSkill(s.id)}
                          className={cn(
                            "inline-flex h-11 items-center rounded-full border px-3 text-[13px] font-medium transition-[border-color,background-color] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-7",
                            selected
                              ? "border-transparent bg-wash text-primary-hover"
                              : "border-line bg-surface text-ink-2 hover:border-line-strong",
                          )}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </li>
          );
        })}
      </ul>
      <Button
        onClick={add}
        className="self-start"
        icon={<Plus aria-hidden size={16} strokeWidth={1.75} />}
      >
        Tambah portofolio
      </Button>
    </div>
  );
}
