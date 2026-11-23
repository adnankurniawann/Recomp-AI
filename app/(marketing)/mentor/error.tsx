"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function MentorsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <ErrorState title="Daftar mentor belum bisa dimuat" onRetry={reset} />
    </main>
  );
}
