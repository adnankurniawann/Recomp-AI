import { CalendarDays, FileCheck, Heart, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { COMP_CATEGORY_LABELS } from "@/lib/constants";
import { daysLeft, type CompetitionSummary } from "@/lib/competitions/filter";
import { formatDate } from "@/lib/format/date";

export function teamSizeLabel(min: number, max: number) {
  return min === max ? `${min} orang` : `${min} sampai ${max} orang`;
}

function deadlineLabel(deadline: string | null, today: string) {
  if (!deadline) return "Deadline belum diumumkan";
  const days = daysLeft(deadline, today);
  if (days < 0) return `Sudah tutup ${formatDate(deadline)}`;
  if (days === 0) return "Tutup hari ini";
  return `${days} hari lagi · ${formatDate(deadline, { year: false })}`;
}

/** A competition in the `/lomba` grid (PRD §10.2). The whole card links to the detail page. */
export function CompetitionCard({ c, today }: { c: CompetitionSummary; today: string }) {
  const closed = c.registrationDeadline !== null && daysLeft(c.registrationDeadline, today) < 0;
  return (
    <Card
      interactive
      padding="md"
      className="relative flex w-full flex-col gap-3 focus-within:ring-3 focus-within:ring-primary-200"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
        {c.posterUrl ? (
          // Posters come from Supabase Storage at any size, so a plain img avoids remote config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.posterUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-ink-3">
            <Trophy aria-hidden size={28} strokeWidth={1.5} />
          </span>
        )}
        {c.isSimulated && <SimulatedBadge className="absolute top-2 left-2" />}
      </div>

      <div className="flex flex-col gap-1">
        <Chip className="self-start">{COMP_CATEGORY_LABELS[c.category]}</Chip>
        <h2 className="mt-1 font-semibold text-ink-strong">
          <Link
            href={`/lomba/${c.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {c.name}
          </Link>
        </h2>
        <p className="text-sm text-ink-3">{c.organizer}</p>
      </div>

      <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
        <li className={closed ? "flex items-center gap-2 text-ink-3" : "flex items-center gap-2"}>
          <CalendarDays aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          {deadlineLabel(c.registrationDeadline, today)}
        </li>
        <li className="flex items-center gap-2">
          <Users aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          {teamSizeLabel(c.teamMin, c.teamMax)}
        </li>
      </ul>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-ink-2">
          <Heart aria-hidden size={16} strokeWidth={1.75} className="text-ink-3" />
          <span>
            <span className="font-mono tabular-nums">{c.interestCount}</span> mahasiswa tertarik
          </span>
        </span>
        {c.hasGuidebook && (
          <span className="flex items-center gap-1 text-[13px] font-medium text-success-ink">
            <FileCheck aria-hidden size={14} strokeWidth={1.75} />
            Guidebook tersedia
          </span>
        )}
      </div>
    </Card>
  );
}
