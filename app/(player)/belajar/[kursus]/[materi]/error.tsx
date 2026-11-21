"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LessonError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-4 px-4">
      <ErrorState title="Materi belum bisa dimuat" onRetry={reset} />
      <Link href="/belajar" className={buttonClasses("ghost", "md", "self-center")}>
        Kembali ke daftar kursus
      </Link>
    </main>
  );
}
