"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-5xl">
      <ErrorState title="Halaman admin belum bisa dimuat" onRetry={reset} />
    </main>
  );
}
