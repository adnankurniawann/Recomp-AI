"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function NewTeamError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <ErrorState title="Halaman buat tim belum bisa dimuat" onRetry={reset} />
    </main>
  );
}
