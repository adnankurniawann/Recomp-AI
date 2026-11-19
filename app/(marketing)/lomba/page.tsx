import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompetitionCard } from "@/components/competition/competition-card";
import { CompetitionFilters } from "@/components/competition/competition-filters";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { filterCompetitions, parseFilters } from "@/lib/competitions/filter";
import { loadCompetitions } from "@/lib/competitions/queries";
import { todayIso } from "@/lib/format/date";

export const metadata: Metadata = { title: "Lomba" };

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const today = todayIso();
  const all = await loadCompetitions();
  const list = filterCompetitions(all, filters, today);
  const filtered = Object.values(filters).some(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-1">
        <SectionLabel>Lomba</SectionLabel>
        <h1 className="text-2xl font-semibold text-ink-strong">
          Temukan lomba dan tandai yang ingin kamu ikuti
        </h1>
      </header>

      {/* useSearchParams needs a Suspense boundary on a dynamic page. */}
      <Suspense>
        <CompetitionFilters />
      </Suspense>

      {list.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={
            filtered
              ? "Belum ada lomba yang cocok dengan filter ini"
              : "Belum ada lomba yang dibuka"
          }
          body={filtered ? "Coba ganti kategori atau hapus kata kunci." : undefined}
          action={
            filtered && (
              <Link href="/lomba" className={buttonClasses("secondary")}>
                Hapus semua filter
              </Link>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.id} className="flex">
              <CompetitionCard c={c} today={today} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
