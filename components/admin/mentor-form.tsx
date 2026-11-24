"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveMentor } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Textarea } from "@/components/ui/input";
import { issuesToFields } from "@/lib/action-result";
import {
  COMP_CATEGORIES,
  COMP_CATEGORY_LABELS,
  PREFERRED_ROLE_KEYS,
  ROLE_LABELS,
} from "@/lib/constants";
import { mentorSchema, type MentorInput } from "@/lib/validation/admin";

type Service = Omit<MentorInput["services"][number], "durationMin" | "price"> & {
  durationMin: number;
  price: number;
};
type Values = Omit<MentorInput, "services"> & { services: Service[] };

const NEW_SERVICE: Service = { name: "", description: "", durationMin: 60, price: 75_000 };

const EMPTY_MENTOR: Values = {
  displayName: "",
  roles: [],
  headline: "",
  bio: "",
  categories: [],
  verified: false,
  isSimulated: false,
  isActive: true,
  services: [NEW_SERVICE],
};

/** Add or edit a mentor and their services (F-ADM-01, simple admin UI like the competition form). */
export function MentorForm({ initial = EMPTY_MENTOR }: { initial?: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setV((s) => ({ ...s, [key]: value }));
  const setService = (i: number, patch: Partial<Service>) =>
    set(
      "services",
      v.services.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    );
  const toggle = <T extends string>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = mentorSchema.safeParse(v);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await saveMentor(v);
      if (!res.ok) {
        setErrors(res.error.fields ?? {});
        toast.error(res.error.message);
        return;
      }
      toast.success(v.id ? "Mentor sudah disimpan." : "Mentor sudah ditambahkan.");
      if (v.id) router.refresh();
      else router.push(`/admin/mentor/${res.data.id}`);
    });
  }

  const flag = (key: "verified" | "isSimulated" | "isActive", label: string) => (
    <label className="flex min-h-11 items-center gap-2 text-sm text-ink md:min-h-0">
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
          <Field id="displayName" label="Nama" error={errors.displayName}>
            <Input
              id="displayName"
              value={v.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              aria-invalid={!!errors.displayName}
              aria-describedby={fieldDescribedBy("displayName", undefined, errors.displayName)}
            />
          </Field>
          <Field
            id="headline"
            label="Kredensial"
            hint="Satu baris, contoh: Juara 1 GEMASTIK 2024, kategori UX"
            error={errors.headline}
          >
            <Input
              id="headline"
              value={v.headline}
              onChange={(e) => set("headline", e.target.value)}
              aria-invalid={!!errors.headline}
              aria-describedby={fieldDescribedBy(
                "headline",
                "Satu baris, contoh: Juara 1 GEMASTIK 2024, kategori UX",
                errors.headline,
              )}
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">Role</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {PREFERRED_ROLE_KEYS.map((r) => (
              <label
                key={r}
                className="flex min-h-11 items-center gap-2 text-sm text-ink md:min-h-0"
              >
                <input
                  type="checkbox"
                  checked={v.roles.includes(r)}
                  onChange={() => set("roles", toggle(v.roles, r))}
                  className="size-4 accent-primary"
                />
                {ROLE_LABELS[r]}
              </label>
            ))}
          </div>
          {errors.roles && <p className="text-sm text-danger">{errors.roles}</p>}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">Kategori lomba yang dikuasai</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {COMP_CATEGORIES.map((c) => (
              <label
                key={c}
                className="flex min-h-11 items-center gap-2 text-sm text-ink md:min-h-0"
              >
                <input
                  type="checkbox"
                  checked={v.categories.includes(c)}
                  onChange={() => set("categories", toggle(v.categories, c))}
                  className="size-4 accent-primary"
                />
                {COMP_CATEGORY_LABELS[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="bio" label="Bio" error={errors.bio} optional>
          <Textarea
            id="bio"
            rows={4}
            value={v.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-ink">Layanan</legend>
          {v.services.map((s, i) => (
            <div
              key={s.id ?? `new-${i}`}
              className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_120px_140px_auto] sm:items-end"
            >
              <Field
                id={`services.${i}.name`}
                label="Nama layanan"
                error={errors[`services.${i}.name`]}
              >
                <Input
                  id={`services.${i}.name`}
                  value={s.name}
                  placeholder="Review pitch deck"
                  onChange={(e) => setService(i, { name: e.target.value })}
                  aria-invalid={!!errors[`services.${i}.name`]}
                />
              </Field>
              <Field
                id={`services.${i}.durationMin`}
                label="Durasi (menit)"
                error={errors[`services.${i}.durationMin`]}
              >
                <Input
                  id={`services.${i}.durationMin`}
                  type="number"
                  min={15}
                  max={240}
                  className="font-mono"
                  value={Number.isNaN(s.durationMin) ? "" : s.durationMin}
                  onChange={(e) => setService(i, { durationMin: e.target.valueAsNumber })}
                />
              </Field>
              <Field
                id={`services.${i}.price`}
                label="Harga (Rp)"
                error={errors[`services.${i}.price`]}
              >
                <Input
                  id={`services.${i}.price`}
                  type="number"
                  min={0}
                  step={1000}
                  className="font-mono"
                  value={Number.isNaN(s.price) ? "" : s.price}
                  onChange={(e) => setService(i, { price: e.target.valueAsNumber })}
                />
              </Field>
              <IconButton
                label={`Hapus layanan ${i + 1}`}
                icon={<Trash2 aria-hidden size={18} strokeWidth={1.75} />}
                onClick={() =>
                  set(
                    "services",
                    v.services.filter((_, j) => j !== i),
                  )
                }
                disabled={v.services.length === 1}
              />
            </div>
          ))}
          {errors.services && <p className="text-sm text-danger">{errors.services}</p>}
          {v.services.length < 5 && (
            <Button
              type="button"
              variant="secondary"
              className="self-start"
              onClick={() => set("services", [...v.services, NEW_SERVICE])}
            >
              <Plus aria-hidden size={16} strokeWidth={1.75} />
              Tambah layanan
            </Button>
          )}
        </fieldset>

        <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
          <legend className="sr-only">Status mentor</legend>
          {flag("isActive", "Tampilkan di /mentor")}
          {flag("verified", "Terverifikasi")}
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
          {pending ? "Menyimpan…" : v.id ? "Simpan mentor" : "Tambah mentor"}
        </Button>
      </form>
    </Card>
  );
}
