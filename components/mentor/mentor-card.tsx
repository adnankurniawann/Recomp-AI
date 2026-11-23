import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { COMP_CATEGORY_LABELS, ROLE_COLORS, ROLE_LABELS } from "@/lib/constants";
import { formatRupiah } from "@/lib/format/currency";
import { initials } from "@/lib/format/initials";
import type { MentorCardData } from "@/lib/mentors/list";
import { cn } from "@/lib/utils";

/** A face card in the /mentor grid (PRD F-MNT-01, §10.8). The whole card opens /mentor/[id]. */
export function MentorCard({ mentor: m }: { mentor: MentorCardData }) {
  const color = ROLE_COLORS[m.roles[0] ?? "other"];
  return (
    <Card
      interactive
      className="group relative flex w-full flex-col gap-3 focus-within:ring-3 focus-within:ring-primary-200"
    >
      <div
        className={cn(
          "flex aspect-square items-center justify-center overflow-hidden rounded-xl",
          color.soft,
        )}
      >
        {m.photoUrl ? (
          // Mentor photos are used only with written permission (PRD F-MNT-01).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.photoUrl}
            alt=""
            className="size-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "text-5xl font-semibold transition-transform duration-200 ease-out group-hover:scale-[1.03]",
              color.ink,
            )}
          >
            {initials(m.name)}
          </span>
        )}
      </div>

      {m.roles.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Role">
          {m.roles.map((r) => (
            <li key={r}>
              <Chip color={r}>{ROLE_LABELS[r]}</Chip>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-ink-strong">
          <Link
            href={`/mentor/${m.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {m.name}
          </Link>
        </h2>
        <p className="text-sm text-ink-2">{m.headline}</p>
        {m.categories.length > 0 && (
          <p className="text-[13px] text-ink-3">
            {m.categories.map((c) => COMP_CATEGORY_LABELS[c]).join(", ")}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          {m.minPrice !== null ? (
            <>
              Mulai dari{" "}
              <span className="font-mono text-ink-strong tabular-nums">
                {formatRupiah(m.minPrice)}
              </span>
            </>
          ) : (
            "Belum ada layanan"
          )}
        </p>
        {m.isSimulated ? (
          <SimulatedBadge />
        ) : (
          m.verified && <StatusBadge tone="success">Terverifikasi</StatusBadge>
        )}
      </div>
    </Card>
  );
}
