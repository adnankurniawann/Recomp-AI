"use client";

import { LogIn, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/app/(auth)/masuk/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD } from "@/lib/validation/auth";

type Mode = "sign-in" | "sign-up";

interface SignInCardProps {
  next: string | null;
  /** `?error=callback` after a failed Google sign-in or confirmation link. */
  callbackFailed: boolean;
}

/** `/masuk` (PRD §10.11): Google first, email and password below it (F-FND-02). */
export function SignInCard({ next, callbackFailed }: SignInCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [checkInbox, setCheckInbox] = useState<string | null>(null);
  const [googlePending, startGoogle] = useTransition();
  const [emailPending, startEmail] = useTransition();

  function google() {
    startGoogle(async () => {
      const result = await signInWithGoogle(next);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setFields({});
    startEmail(async () => {
      const result =
        mode === "sign-in"
          ? await signInWithEmail({ email: form.email, password: form.password, next })
          : await signUpWithEmail({
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              next,
            });
      if (!result.ok) {
        setFields(result.error.fields ?? {});
        toast.error(result.error.message);
        return;
      }
      if (!result.data.redirect) {
        setCheckInbox(form.email ?? "");
        return;
      }
      router.replace(result.data.redirect);
      router.refresh();
    });
  }

  if (checkInbox) {
    return (
      <Card padding="lg" className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-wash text-primary">
          <MailCheck aria-hidden size={22} strokeWidth={1.75} />
        </span>
        <h1 className="text-xl font-semibold text-ink-strong">Cek emailmu</h1>
        <p className="text-sm text-ink-2">
          Kami mengirim tautan konfirmasi ke <span className="font-medium">{checkInbox}</span>. Buka
          tautan itu untuk melanjutkan.
        </p>
      </Card>
    );
  }

  const signUp = mode === "sign-up";
  const pending = googlePending || emailPending;

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
          {signUp ? "Daftar ke Recomp AI" : "Masuk ke Recomp AI"}
        </h1>
        <p className="text-sm text-ink-2">
          Bentuk tim lomba sesuai role yang dibutuhkan, lalu siapkan bersama.
        </p>
      </header>

      {callbackFailed && (
        <p
          role="alert"
          className="rounded-md border border-line bg-danger-50 px-3 py-2 text-sm text-danger-ink"
        >
          Gagal masuk. Coba lagi ya.
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={google}
        disabled={pending}
        icon={<LogIn aria-hidden size={18} strokeWidth={1.75} />}
      >
        {googlePending ? "Mengalihkan..." : "Lanjutkan dengan Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-ink-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        atau pakai email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {signUp && (
          <Field id="fullName" label="Nama lengkap" error={fields.fullName}>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              aria-invalid={!!fields.fullName}
              aria-describedby={fieldDescribedBy("fullName", undefined, fields.fullName)}
            />
          </Field>
        )}
        <Field id="email" label="Email" error={fields.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!fields.email}
            aria-describedby={fieldDescribedBy("email", undefined, fields.email)}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          hint={signUp ? `Minimal ${MIN_PASSWORD} karakter` : undefined}
          error={fields.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={signUp ? "new-password" : "current-password"}
            required
            minLength={MIN_PASSWORD}
            aria-invalid={!!fields.password}
            aria-describedby={fieldDescribedBy(
              "password",
              signUp ? "hint" : undefined,
              fields.password,
            )}
          />
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          {emailPending ? "Memproses..." : signUp ? "Daftar" : "Masuk dengan email"}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm text-ink-2">
        <p>
          {signUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(signUp ? "sign-in" : "sign-up");
              setFields({});
            }}
            className="rounded-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
          >
            {signUp ? "Masuk" : "Daftar dengan email"}
          </button>
        </p>
        <p className="text-xs text-ink-3">
          Dengan masuk, kamu menyetujui{" "}
          <Link
            href="/privasi"
            className="rounded-sm underline hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
          >
            kebijakan privasi
          </Link>
          .
        </p>
      </div>
    </Card>
  );
}
