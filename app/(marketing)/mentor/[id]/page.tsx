import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/mentor/booking-panel";
import { createBooking } from "../actions";
import { Chip } from "@/components/ui/chip";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { COMP_CATEGORY_LABELS, ROLE_COLORS, ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format/initials";
import { loadMentor } from "@/lib/mentors/queries";
import { cn } from "@/lib/utils";

// SectionLabel's look on a real heading, so the sections show up in the heading outline.
const SECTION_LABEL =
  "font-mono text-[11px] leading-[1.4] font-medium tracking-[0.18em] text-ink-3 uppercase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mentor = await loadMentor((await params).id);
  return { title: mentor ? mentor.name : "Mentor tidak ditemukan" };
}

/** Mentor detail (PRD F-MNT-02, §10.9). Contacts open only after a paid booking. */
export default async function MentorPage({ params }: Props) {
  const mentor = await loadMentor((await params).id);
  if (!mentor) notFound();

  const color = ROLE_COLORS[mentor.roles[0] ?? "other"];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/mentor"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Semua mentor
      </Link>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line sm:size-[200px]",
            color.soft,
          )}
        >
          {mentor.photoUrl ? (
            // Mentor photos are used only with written permission (PRD F-MNT-01).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mentor.photoUrl} alt={mentor.name} className="size-full object-cover" />
          ) : (
            <span aria-hidden className={cn("text-5xl font-semibold", color.ink)}>
              {initials(mentor.name)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink-strong">
              {mentor.name}
            </h1>
            {mentor.isSimulated ? (
              <SimulatedBadge />
            ) : (
              mentor.verified && <StatusBadge tone="success">Terverifikasi</StatusBadge>
            )}
          </div>
          {mentor.roles.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Role">
              {mentor.roles.map((r) => (
                <li key={r}>
                  <Chip color={r}>{ROLE_LABELS[r]}</Chip>
                </li>
              ))}
            </ul>
          )}
          <p className="text-ink-2">{mentor.headline}</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-3" aria-labelledby="about-label">
            <h2 id="about-label" className={SECTION_LABEL}>
              Tentang
            </h2>
            <p className="leading-relaxed whitespace-pre-line text-ink">
              {mentor.bio ?? "Mentor ini belum menulis bio."}
            </p>
          </section>

          {mentor.achievements.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="achievements-label">
              <h2 id="achievements-label" className={SECTION_LABEL}>
                Prestasi
              </h2>
              <ol className="flex flex-col">
                {mentor.achievements.map((a, i) => (
                  <li key={`${a.year}-${a.title}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < mentor.achievements.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute top-3 bottom-0 left-[5px] w-px bg-line"
                      />
                    )}
                    <span
                      aria-hidden
                      className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-surface bg-primary ring-1 ring-line"
                    />
                    <span className="text-sm text-ink">
                      {a.year && (
                        <span className="mr-2 font-mono text-ink-3 tabular-nums">{a.year}</span>
                      )}
                      {a.title}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {mentor.categories.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="categories-label">
              <h2 id="categories-label" className={SECTION_LABEL}>
                Lomba yang dikuasai
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {mentor.categories.map((c) => (
                  <li
                    key={c}
                    className="inline-flex h-7 items-center rounded-full border border-line bg-surface px-2.5 text-[13px] font-medium text-ink-2"
                  >
                    {COMP_CATEGORY_LABELS[c]}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-6">
          <BookingPanel mentor={mentor} bookAction={createBooking} />
        </aside>
      </div>
    </main>
  );
}
