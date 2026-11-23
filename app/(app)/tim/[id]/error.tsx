"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function TeamError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-6xl">
      <ErrorState title="Tim belum bisa dimuat" onRetry={reset} />
    </main>
  );
}
