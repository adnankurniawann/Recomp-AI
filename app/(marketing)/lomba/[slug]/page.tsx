import { ArrowLeft, ArrowUpRight, CalendarDays, Download, Flag, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { teamSizeLabel } from "@/components/competition/competition-card";
import { InterestButton } from "@/components/competition/interest-button";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { COMP_CATEGORY_LABELS } from "@/lib/constants";
import { deadlineStatus } from "@/lib/competitions/filter";
import { loadCompetition } from "@/lib/competitions/queries";
import { formatDate, todayIso } from "@/lib/format/date";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await loadCompetition((await params).slug);
  return { title: c?.name ?? "Lomba tidak ditemukan" };
}

export default async function CompetitionPage({ params }: Props) {
  const c = await loadCompetition((await params).slug);
  if (!c) notFound();
  const closed = deadlineStatus(c.registrationDeadline, todayIso()) === "closed";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/lomba"
        className="inline-flex items-center gap-1.5 self-start text-sm text-ink-2 hover:text-ink-strong"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Kembali ke daftar lomba
      </Link>

      <section className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="relative aspect-[4/5] w-full max-w-[280px] shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
          {c.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.posterUrl} alt={`Poster ${c.name}`} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-ink-3">
              <Trophy aria-hidden size={40} strokeWidth={1.5} />
            </span>
          )}
          {c.isSimulated && <SimulatedBadge className="absolute top-3 left-3" />}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Chip className="self-start">{COMP_CATEGORY_LABELS[c.category]}</Chip>
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-ink-strong">
              {c.name}
            </h1>
            <p className="text-ink-2">oleh {c.organizer}</p>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
            <li className="flex items-center gap-2">
              <CalendarDays aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
              {c.registrationDeadline
                ? `${closed ? "Pendaftaran tutup" : "Deadline"} ${formatDate(c.registrationDeadline)}`
                : "Deadline belum diumumkan"}
            </li>
            {c.eventDate && (
              <li className="flex items-center gap-2">
                <Flag aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
                Acara {formatDate(c.eventDate)}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Users aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
              {teamSizeLabel(c.teamMin, c.teamMax)}
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            {c.viewer?.teamId ? (
              <Link href={`/tim/${c.viewer.teamId}`} className={buttonClasses("primary")}>
                Buka tim saya
              </Link>
            ) : (
              !closed && (
                <Link
                  href={`/tim/baru?lomba=${encodeURIComponent(c.slug)}`}
                  className={buttonClasses("primary")}
                >
                  Buat tim
                </Link>
              )
            )}
            <InterestButton
              variant="button"
              competitionId={c.id}
              interested={c.viewer?.interested ?? false}
              count={c.interestCount}
              signedIn={!!c.viewer}
            />
            {c.guidebookUrl && (
              <a
                href={c.guidebookUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses("secondary")}
              >
                <Download aria-hidden size={16} strokeWidth={1.75} />
                Unduh guidebook
              </a>
            )}
          </div>

          {c.officialUrl && (
            <a
              href={c.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:text-primary-hover"
            >
              Situs resmi
              <ArrowUpRight aria-hidden size={14} strokeWidth={1.75} />
            </a>
          )}
        </div>
      </section>

      {c.description && (
        <Card padding="lg" className="flex flex-col gap-2">
          <h2 className="font-semibold text-ink-strong">Tentang lomba</h2>
          <p className="text-sm whitespace-pre-line text-ink-2">{c.description}</p>
        </Card>
      )}
    </main>
  );
}
