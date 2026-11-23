import { Plus, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EXTRACTION_STATUS } from "@/lib/ai/extraction-status";
import { COMP_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format/date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin lomba" };

/** Every competition, published or not, with its guidebook and newest extraction (F-CMP-04). */
export default async function AdminCompetitionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select(
      "id, slug, name, category, registration_deadline, is_published, is_simulated, guidebook_path, competition_extractions(status, created_at)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(`admin competitions: ${error.message}`);
  const list = data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <SectionLabel>Admin</SectionLabel>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Lomba</h1>
        </div>
        <Link href="/admin/lomba/baru" className={buttonClasses("primary")}>
          <Plus aria-hidden size={16} strokeWidth={1.75} />
          Tambah lomba
        </Link>
      </header>

      {list.length === 0 ? (
        <EmptyState icon={Trophy} title="Belum ada lomba" body="Tambahkan lomba pertama." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[13px] text-ink-3">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">Lomba</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Batas daftar</th>
                <th className="px-4 py-3 font-medium">Guidebook</th>
                <th className="px-4 py-3 font-medium">Ekstraksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const latest = [...c.competition_extractions].sort((a, b) =>
                  b.created_at.localeCompare(a.created_at),
                )[0];
                return (
                  <tr key={c.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/lomba/${c.id}`}
                          className="font-medium text-ink-strong hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.is_simulated && <SimulatedBadge />}
                        {!c.is_published && <StatusBadge>Draf</StatusBadge>}
                      </div>
                      <span className="font-mono text-xs text-ink-3">{c.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{COMP_CATEGORY_LABELS[c.category]}</td>
                    <td className="px-4 py-3 text-ink-2">
                      {c.registration_deadline ? formatDate(c.registration_deadline) : "–"}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{c.guidebook_path ? "Ada" : "Belum"}</td>
                    <td className="px-4 py-3">
                      {latest ? (
                        <StatusBadge tone={EXTRACTION_STATUS[latest.status].tone}>
                          {EXTRACTION_STATUS[latest.status].label}
                        </StatusBadge>
                      ) : (
                        <span className="text-ink-3">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
