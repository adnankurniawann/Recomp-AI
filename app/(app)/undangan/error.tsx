"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function InvitesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <ErrorState title="Undangan belum bisa dimuat" onRetry={reset} />
    </main>
  );
}
