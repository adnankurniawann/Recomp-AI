"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";
import { formatRupiah } from "@/lib/format/currency";
import { formatSlot } from "@/lib/format/date";
import type { MentorDetail } from "@/lib/mentors/queries";
import { cn } from "@/lib/utils";

export type BookAction = (input: {
  teamId: string;
  serviceId: string;
  slotId: string;
}) => Promise<ActionResult<{ bookingId: string }>>;

interface BookingPanelProps {
  mentor: Pick<MentorDetail, "id" | "services" | "slots" | "viewerTeams" | "signedIn">;
  /**
   * `createBooking` from F-MNT-03 (#45). Until it is passed, the button stays off and says so,
   * because a half-made booking must not look finished (STACK rule 6).
   */
  bookAction?: BookAction;
}

/** The sticky right column of /mentor/[id] (PRD §10.9): service, time slot, team, then connect. */
export function BookingPanel({ mentor, bookAction }: BookingPanelProps) {
  const router = useRouter();
  const slotId = useId();
  const teamId = useId();
  const [service, setService] = useState(mentor.services[0]?.id ?? "");
  const [slot, setSlot] = useState(mentor.slots[0]?.id ?? "");
  const [team, setTeam] = useState(mentor.viewerTeams[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const ready = Boolean(bookAction && service && slot && team);

  function connect() {
    if (!bookAction) return;
    startTransition(async () => {
      const result = await bookAction({ teamId: team, serviceId: service, slotId: slot });
      if (!result.ok) {
        toast.error(result.error.message);
        router.refresh();
        return;
      }
      router.push(`/mentor/${mentor.id}/checkout?booking=${result.data.bookingId}`);
    });
  }

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink-strong">Pilih layanan</h2>

      {mentor.services.length === 0 ? (
        <p className="text-sm text-ink-3">Mentor ini belum membuka layanan.</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Layanan</legend>
          {mentor.services.map((s) => (
            <label
              key={s.id}
              className={cn(
                "flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-line bg-surface p-3 transition-colors duration-150 ease-out hover:border-line-strong",
                "has-checked:border-primary has-checked:bg-wash has-focus-visible:ring-3 has-focus-visible:ring-primary-200",
              )}
            >
              <span className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  checked={service === s.id}
                  onChange={() => setService(s.id)}
                  className="mt-1 accent-primary"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">{s.name}</span>
                  <span className="text-xs text-ink-2">
                    <span className="font-mono tabular-nums">{s.durationMin}</span> menit
                    {s.description && <> · {s.description}</>}
                  </span>
                </span>
              </span>
              <span className="font-mono text-sm whitespace-nowrap text-ink-strong tabular-nums">
                {formatRupiah(s.price)}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <Field
        id={slotId}
        label="Jadwal"
        hint={
          mentor.slots.length === 0
            ? "Belum ada jadwal kosong. Coba cek lagi nanti."
            : "Waktu Indonesia Barat"
        }
      >
        <Select
          id={slotId}
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          disabled={mentor.slots.length === 0}
        >
          {mentor.slots.map((s) => (
            <option key={s.id} value={s.id}>
              {formatSlot(s.startsAt)}
            </option>
          ))}
        </Select>
      </Field>

      {mentor.signedIn ? (
        mentor.viewerTeams.length > 0 ? (
          <Field id={teamId} label="Untuk tim">
            <Select id={teamId} value={team} onChange={(e) => setTeam(e.target.value)}>
              {mentor.viewerTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-sm text-ink-2">
            Sesi mentor dipesan untuk tim. Buat atau gabung tim dulu dari halaman lomba.
          </p>
        )
      ) : (
        <Link
          href={`/masuk?next=/mentor/${mentor.id}`}
          className={buttonClasses("secondary", "lg", "w-full")}
        >
          Masuk untuk memesan
        </Link>
      )}

      {mentor.signedIn && (
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!ready || pending}
            aria-busy={pending}
            onClick={connect}
            icon={<CalendarClock aria-hidden size={16} strokeWidth={1.75} />}
          >
            {pending ? "Memproses…" : "Hubungkan dengan mentor"}
          </Button>
          {!bookAction && (
            <p className="text-xs text-ink-3">Pemesanan sesi mentor segera tersedia.</p>
          )}
        </div>
      )}
    </Card>
  );
}
