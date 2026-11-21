import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KpiPreview, RankingPreview } from "./preview";

export const metadata: Metadata = { title: "Pratinjau ranking" };

/**
 * Development only: the ranking section on fixtures (lib/fixtures), until the team dashboard
 * (#26) and GET /api/ranking (#28) exist. Gone in production builds.
 */
export default function RankingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <p className="text-xs text-ink-2">
        Pratinjau pengembang dengan data fixture. Undangan di sini memanggil server sungguhan.
      </p>
      <KpiPreview />
      <RankingPreview />
    </main>
  );
}
