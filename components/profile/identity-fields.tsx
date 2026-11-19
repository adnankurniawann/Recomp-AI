"use client";

import { Avatar } from "@/components/ui/avatar";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import type { FieldErrors, IdentityValues } from "@/lib/profile/form";

interface IdentityFieldsProps {
  value: IdentityValues;
  onChange: (value: IdentityValues) => void;
  errors: FieldErrors;
  avatarUrl: string | null;
}

/** Step 1 "Data diri" (PRD F-PRF-01). */
export function IdentityFields({ value, onChange, errors, avatarUrl }: IdentityFieldsProps) {
  const set = <K extends keyof IdentityValues>(key: K, v: IdentityValues[K]) =>
    onChange({ ...value, [key]: v });

  const usernameHint =
    "3 sampai 20 karakter: huruf kecil, angka, atau _. Dipakai di alamat profilmu.";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={value.fullName || "Kamu"} src={avatarUrl} size={64} />
        <p className="text-sm text-ink-3">Foto diambil dari akun yang kamu pakai untuk masuk.</p>
      </div>

      <Field id="fullName" label="Nama lengkap" error={errors.fullName}>
        <Input
          id="fullName"
          autoComplete="name"
          value={value.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          aria-invalid={!!errors.fullName}
          aria-describedby={fieldDescribedBy("fullName", undefined, errors.fullName)}
        />
      </Field>

      <Field id="username" label="Username" hint={usernameHint} error={errors.username}>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={value.username}
          onChange={(e) => set("username", e.target.value.toLowerCase())}
          aria-invalid={!!errors.username}
          aria-describedby={fieldDescribedBy("username", usernameHint, errors.username)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="campus" label="Kampus" error={errors.campus}>
          <Input
            id="campus"
            autoComplete="organization"
            value={value.campus}
            onChange={(e) => set("campus", e.target.value)}
            aria-invalid={!!errors.campus}
            aria-describedby={fieldDescribedBy("campus", undefined, errors.campus)}
          />
        </Field>
        <Field id="major" label="Jurusan" error={errors.major}>
          <Input
            id="major"
            value={value.major}
            onChange={(e) => set("major", e.target.value)}
            aria-invalid={!!errors.major}
            aria-describedby={fieldDescribedBy("major", undefined, errors.major)}
          />
        </Field>
      </div>

      <Field id="entryYear" label="Angkatan" error={errors.entryYear} className="sm:max-w-40">
        <Input
          id="entryYear"
          type="number"
          inputMode="numeric"
          min={2015}
          max={2035}
          placeholder="2024"
          className="font-mono tabular-nums"
          value={Number.isNaN(value.entryYear) ? "" : value.entryYear}
          onChange={(e) =>
            set("entryYear", e.target.value === "" ? Number.NaN : Number(e.target.value))
          }
          aria-invalid={!!errors.entryYear}
          aria-describedby={fieldDescribedBy("entryYear", undefined, errors.entryYear)}
        />
      </Field>

      <Field
        id="bio"
        label="Bio"
        optional
        hint={<span className="font-mono tabular-nums">{value.bio.length}/280</span>}
        error={errors.bio}
      >
        <Textarea
          id="bio"
          maxLength={280}
          placeholder="Ceritakan singkat minatmu dan lomba yang ingin kamu ikuti."
          value={value.bio}
          onChange={(e) => set("bio", e.target.value)}
          aria-invalid={!!errors.bio}
          aria-describedby={fieldDescribedBy("bio", true, errors.bio)}
        />
      </Field>
    </div>
  );
}
