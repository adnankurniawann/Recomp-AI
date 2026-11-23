"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCompetition } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { issuesToFields } from "@/lib/action-result";
import { COMP_CATEGORIES, COMP_CATEGORY_LABELS } from "@/lib/constants";
import { competitionSchema, type CompetitionInput } from "@/lib/validation/admin";

type Values = Omit<CompetitionInput, "teamMin" | "teamMax"> & { teamMin: number; teamMax: number };

const EMPTY_COMPETITION: Values = {
  slug: "",
  name: "",
  organizer: "",
  category: "hackathon",
  description: "",
  registrationDeadline: "",
  eventDate: "",
  teamMin: 1,
  teamMax: 4,
  officialUrl: "",
  isPublished: false,
  isFeatured: false,
  isSimulated: false,
};

/** Add or edit a competition (PRD F-CMP-04, simple admin UI). */
export function CompetitionForm({ initial = EMPTY_COMPETITION }: { initial?: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setV((s) => ({ ...s, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = competitionSchema.safeParse(v);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await saveCompetition(v);
      if (!res.ok) {
        setErrors(res.error.fields ?? {});
        toast.error(res.error.message);
        return;
      }
      toast.success(v.id ? "Lomba sudah disimpan." : "Lomba sudah ditambahkan.");
      if (v.id) router.refresh();
      else router.push(`/admin/lomba/${res.data.id}`);
    });
  }

  const text = (
    key: "slug" | "name" | "organizer" | "officialUrl",
    label: string,
    hint?: string,
  ) => (
    <Field id={key} label={label} hint={hint} error={errors[key]} optional={key === "officialUrl"}>
      <Input
        id={key}
        value={(v[key] as string | null | undefined) ?? ""}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={fieldDescribedBy(key, hint, errors[key])}
      />
    </Field>
  );
  const date = (key: "registrationDeadline" | "eventDate", label: string) => (
    <Field id={key} label={label} error={errors[key]} optional>
      <Input
        id={key}
        type="date"
        value={v[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
      />
    </Field>
  );
  const size = (key: "teamMin" | "teamMax", label: string) => (
    <Field id={key} label={label} error={errors[key]}>
      <Input
        id={key}
        type="number"
        min={1}
        max={10}
        className="font-mono"
        value={Number.isNaN(v[key]) ? "" : v[key]}
        onChange={(e) => set(key, e.target.valueAsNumber)}
        aria-invalid={!!errors[key]}
      />
    </Field>
  );
  const flag = (key: "isPublished" | "isFeatured" | "isSimulated", label: string) => (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={v[key]}
        onChange={(e) => set(key, e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );

  return (
    <Card padding="lg" className="max-sm:px-4">
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("name", "Nama lomba")}
          {text("slug", "Slug", "Dipakai di alamat /lomba/slug")}
          {text("organizer", "Penyelenggara")}
          <Field id="category" label="Kategori" error={errors.category}>
            <Select
              id="category"
              value={v.category}
              onChange={(e) => set("category", e.target.value as Values["category"])}
            >
              {COMP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {COMP_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          {date("registrationDeadline", "Batas pendaftaran")}
          {date("eventDate", "Tanggal acara")}
          {size("teamMin", "Minimal anggota tim")}
          {size("teamMax", "Maksimal anggota tim")}
        </div>
        {text("officialUrl", "Tautan resmi", "Diawali https://")}
        <Field id="description" label="Deskripsi" error={errors.description} optional>
          <Textarea
            id="description"
            rows={4}
            value={v.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
          <legend className="sr-only">Status lomba</legend>
          {flag("isPublished", "Tampilkan di /lomba")}
          {flag("isFeatured", "Unggulan")}
          {flag("isSimulated", "Data simulasi")}
        </fieldset>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="self-end"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? "Menyimpan…" : v.id ? "Simpan lomba" : "Tambah lomba"}
        </Button>
      </form>
    </Card>
  );
}
