import { Info } from "lucide-react";
import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui/section-label";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { metricRows, TrialMetrics, type MetricCell } from "@/lib/admin/metrics";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Metrik uji coba" };

/**
 * The trial metrics of PRD §17 (F-ADM-01): real and simulated data side by side, so the proposal
 * reports only real participants. Counts come from `trial_metrics()`; no names or contacts.
 */
export default async function MetricsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("trial_metrics");
  if (error) throw new Error(`trial_metrics: ${error.message}`);
  const metrics = TrialMetrics.parse(data);
  const rows = metricRows(metrics);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <SectionLabel>Admin</SectionLabel>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
          Metrik uji coba
        </h1>
        <p className="text-sm text-ink-2">
          Angka dari data asli dan data simulasi dipisah. Laporkan hanya kolom data asli.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Peserta asli" value={metrics.real.participants} />
        <Stat label="Tim asli" value={metrics.real.teams} />
        <Stat label="Profil simulasi" value={metrics.simulated.participants} simulated />
        <Stat label="Tim simulasi" value={metrics.simulated.teams} simulated />
      </dl>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-xs">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-xs font-medium text-ink-3">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Metrik
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Data asli
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                <span className="inline-flex items-center gap-2">
                  Data simulasi <SimulatedBadge />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.key} className="align-top">
                <th scope="row" className="px-4 py-3 font-normal">
                  <p className="font-medium text-ink-strong">{r.label}</p>
                  <p className="text-xs text-ink-3">{r.formula}</p>
                </th>
                <td className="px-4 py-3">
                  <Cell cell={r.real} />
                </td>
                <td className="px-4 py-3">
                  <Cell cell={r.simulated} />
                </td>
              </tr>
            ))}
            <tr className="align-top">
              <th scope="row" className="px-4 py-3 font-normal">
                <p className="font-medium text-ink-strong">Akurasi ekstraksi</p>
                <p className="text-xs text-ink-3">Kriteria benar / kriteria di jawaban manual</p>
              </th>
              <td colSpan={2} className="px-4 py-3 text-sm text-ink-2">
                Dihitung lewat <code className="font-mono text-[13px]">pnpm eval:guidebook</code>{" "}
                dengan guidebook yang dijawab manual.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2 text-xs text-ink-3">
        <Info aria-hidden size={14} strokeWidth={1.75} className="mt-px shrink-0" />
        Data simulasi: tim dengan ketua simulasi, serta umpan balik dan undangan untuk kandidat
        simulasi. Undangan yang masih menunggu tidak ikut dihitung.
      </p>
    </main>
  );
}

function Stat({ label, value, simulated }: { label: string; value: number; simulated?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <dt className="flex items-center gap-2 text-xs text-ink-3">
        {label}
        {simulated && <SimulatedBadge />}
      </dt>
      <dd className="font-mono text-2xl text-ink-strong tabular-nums">{value}</dd>
    </div>
  );
}

function Cell({ cell }: { cell: MetricCell }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-base text-ink-strong tabular-nums">{cell.value}</span>
      <span className="text-xs text-ink-3">{cell.detail}</span>
    </div>
  );
}
