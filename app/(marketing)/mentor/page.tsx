import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MentorCard } from "@/components/mentor/mentor-card";
import { MentorFilters } from "@/components/mentor/mentor-filters";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { filterMentors, parseMentorFilters } from "@/lib/mentors/list";
import { loadMentorList } from "@/lib/mentors/queries";

export const metadata: Metadata = { title: "Mentor" };

/** The mentor grid (PRD F-MNT-01, §10.8). Public. */
export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseMentorFilters(await searchParams);
  const list = filterMentors(await loadMentorList(), filters);
  const filtered = Boolean(filters.role || filters.category || filters.price);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-1">
        <SectionLabel>Mentor</SectionLabel>
        <h1 className="text-2xl font-semibold text-ink-strong">
          Belajar langsung dari yang sudah pernah menang
        </h1>
        <p className="text-ink-2">
          Pilih mentor sesuai role yang timmu butuhkan, lalu pesan sesi untuk tim.
        </p>
      </header>

      {/* useSearchParams needs a Suspense boundary on a dynamic page. */}
      <Suspense>
        <MentorFilters />
      </Suspense>

      {list.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={filtered ? "Belum ada mentor yang cocok dengan filter ini" : "Belum ada mentor"}
          body={filtered ? "Coba ganti role, kategori, atau rentang harga." : undefined}
          action={
            filtered && (
              <Link href="/mentor" className={buttonClasses("secondary")}>
                Hapus semua filter
              </Link>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((m) => (
            <li key={m.id} className="flex">
              <MentorCard mentor={m} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
