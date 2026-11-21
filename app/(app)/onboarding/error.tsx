"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function OnboardingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <ErrorState title="Profilmu belum bisa dimuat" onRetry={reset} />
    </main>
  );
}
