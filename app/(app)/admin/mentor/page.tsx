import { GraduationCap, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROLE_LABELS, type RoleKey } from "@/lib/constants";
import { formatRupiah } from "@/lib/format/currency";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin mentor" };

/** Every mentor, shown or hidden, with their services (F-ADM-01, PRD §10.11 "tabel mentor"). */
export default async function AdminMentorsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentors")
    .select("id, display_name, roles, verified, is_simulated, is_active, mentor_services(price)")
    .order("display_name");
  if (error) throw new Error(`admin mentors: ${error.message}`);
  const list = data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <SectionLabel>Admin</SectionLabel>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Mentor</h1>
        </div>
        <Link href="/admin/mentor/baru" className={buttonClasses("primary")}>
          <Plus aria-hidden size={16} strokeWidth={1.75} />
          Tambah mentor
        </Link>
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Belum ada mentor"
          body="Tambahkan mentor pertama."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[13px] text-ink-3">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">Mentor</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Layanan</th>
                <th className="px-4 py-3 font-medium">Mulai dari</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const prices = m.mentor_services.map((s) => s.price);
                return (
                  <tr key={m.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/mentor/${m.id}`}
                          className="tap-target font-medium text-ink-strong hover:underline"
                        >
                          {m.display_name}
                        </Link>
                        {m.is_simulated && <SimulatedBadge />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {m.roles.map((r) => ROLE_LABELS[r as RoleKey] ?? r).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{prices.length}</td>
                    <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">
                      {prices.length ? formatRupiah(Math.min(...prices)) : "–"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge tone={m.is_active ? "success" : "neutral"}>
                          {m.is_active ? "Tampil" : "Disembunyikan"}
                        </StatusBadge>
                        {m.verified && <StatusBadge tone="primary">Terverifikasi</StatusBadge>}
                      </div>
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
