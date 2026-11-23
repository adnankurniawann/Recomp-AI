import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PayButton } from "@/components/mentor/pay-button";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRupiah } from "@/lib/format/currency";
import { formatSlot } from "@/lib/format/date";
import { BOOKING_STATUS } from "@/lib/mentors/booking";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout simulasi" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booking?: string }>;
};

/** The simulated checkout of a mentor booking (PRD F-MNT-03, §10.10). Team members only. */
export default async function CheckoutPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { booking: bookingId } = await searchParams;
  if (!bookingId || !/^[0-9a-f-]{36}$/i.test(bookingId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(`/mentor/${id}/checkout?booking=${bookingId}`)}`);
  }

  // RLS returns the booking to members of its team only.
  const { data: b } = await supabase
    .from("bookings")
    .select(
      `id, status, price, platform_fee, mentor_share, mentor_id,
       team:teams(id, name), mentor:mentors(display_name),
       service:mentor_services(name, duration_min), slot:mentor_slots(starts_at)`,
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!b || b.mentor_id !== id || !b.team) notFound();

  const status = BOOKING_STATUS[b.status];
  const rows = [
    { label: "Harga layanan", value: b.price },
    { label: "Biaya platform Recomp AI (20%)", value: b.platform_fee, note: "dari harga" },
    { label: "Diterima mentor", value: b.mentor_share },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/mentor/${id}`}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 hover:text-ink focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
        Kembali ke mentor
      </Link>

      <p
        role="note"
        className="flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-ink"
      >
        <TriangleAlert aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
        Ini pembayaran simulasi. Tidak ada uang yang ditarik.
      </p>

      <Card padding="lg" className="flex flex-col gap-5 max-sm:px-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>Ringkasan</SectionLabel>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <h1 className="text-xl font-semibold text-ink-strong">
            {b.service?.name ?? "Sesi mentor"}
          </h1>
          <p className="text-sm text-ink-2">
            {[b.mentor?.display_name, b.slot ? formatSlot(b.slot.starts_at) : null, b.team.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-2">{r.label}</dt>
              <dd className="text-right text-ink">
                <span className="font-mono tabular-nums">{formatRupiah(r.value)}</span>
                {r.note && <span className="ml-1 text-xs text-ink-3">({r.note})</span>}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3 font-medium">
            <dt className="text-ink-strong">Total dibayar tim</dt>
            <dd className="font-mono text-ink-strong tabular-nums">{formatRupiah(b.price)}</dd>
          </div>
        </dl>

        {b.status === "pending_payment" ? (
          <PayButton bookingId={b.id} teamId={b.team.id} />
        ) : (
          <Link href={`/tim/${b.team.id}`} className={buttonClasses("secondary", "lg", "w-full")}>
            Lihat sesi di dashboard tim
          </Link>
        )}
      </Card>
    </main>
  );
}
