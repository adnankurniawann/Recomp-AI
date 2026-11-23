import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RankingSection } from "@/components/ranking/ranking-section";
import {
  CompleteCard,
  MemberList,
  MentorSessions,
  RoleRow,
  SentInvites,
} from "@/components/team/team-dashboard";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KpiStrip, type KpiItem } from "@/components/ui/kpi-strip";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format/date";
import { createClient } from "@/lib/supabase/server";
import { loadTeamDashboard } from "@/lib/team/queries";
import { TEAM_STATUS } from "@/lib/team/status";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ role?: string }> };

export const metadata: Metadata = { title: "Tim" };

/** The team dashboard (PRD F-TEM-03..04, §10.4). */
export default async function TeamPage({ params, searchParams }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(`/tim/${id}`)}`);

  const team = await loadTeamDashboard(id);
  if (!team) notFound();
  const { role: activeRole } = await searchParams;

  const { competition: c, viewer } = team;
  const filled = team.roles.filter((r) => r.filled).length;
  const emptyRoles = team.roles.filter((r) => !r.filled);
  const pending = team.invites.filter((i) => i.status === "pending").length;
  const status = TEAM_STATUS[team.status];

  const kpis: KpiItem[] = [
    {
      label: "Role terisi",
      value: `${filled}/${team.roles.length}`,
      bar: { value: filled, max: team.roles.length, segments: true },
    },
    { label: "Peminat lomba", value: team.interestCount, sub: "mahasiswa menandai Tertarik" },
    ...(viewer.isLeader
      ? [
          {
            label: "Undangan",
            value: team.invites.length,
            sub: `${pending} menunggu respon`,
          },
        ]
      : []),
    {
      label: "Skill gap",
      value: team.gap.length,
      sub: team.gap.length > 0 ? "skill wajib belum tertutup" : "Semua skill wajib tertutup",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
              {team.name}
            </h1>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <p className="text-sm text-ink-2">
            <Link href={`/lomba/${c.slug}`} className="text-primary hover:underline">
              {c.name}
            </Link>
            {c.deadline && <> · deadline {formatDate(c.deadline, { year: false })}</>} · maks.{" "}
            <span className="font-mono tabular-nums">{c.teamMax}</span> orang
          </p>
        </div>
        {viewer.isLeader && team.status !== "archived" && (
          <Link href={`/tim/${team.id}/role`} className={buttonClasses("secondary")}>
            <Pencil aria-hidden size={16} strokeWidth={1.75} />
            Edit role
          </Link>
        )}
      </header>

      <KpiStrip items={kpis} />

      {team.gap.length > 0 && (
        <p role="status" className="text-sm text-ink-2">
          Skill wajib yang belum tertutup:{" "}
          <span className="font-medium text-ink">{team.gap.join(", ")}</span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
          <SectionLabel>Role</SectionLabel>
          <ul className="flex flex-col">
            {team.roles.map((r) => (
              <RoleRow
                key={r.id}
                role={r}
                team={team}
                canInvite={viewer.isLeader && team.status === "forming"}
              />
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-6">
          <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
            <SectionLabel>Anggota</SectionLabel>
            <MemberList team={team} canAssign={viewer.isLeader && team.status !== "archived"} />
          </Card>
          {viewer.isLeader && (
            <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
              <SectionLabel>Undangan terkirim</SectionLabel>
              <SentInvites invites={team.invites} />
            </Card>
          )}
          {viewer.isMember && (
            <Card padding="lg" className="flex flex-col gap-4 max-sm:px-4">
              <SectionLabel>Sesi mentor</SectionLabel>
              <MentorSessions bookings={team.bookings} />
            </Card>
          )}
        </div>
      </div>

      {team.suggestions && <CompleteCard suggestions={team.suggestions} />}

      {viewer.isLeader && team.status === "forming" && emptyRoles.length > 0 && (
        <section id="kandidat" aria-label="Kandidat per role" className="scroll-mt-20">
          <RankingSection
            key={activeRole}
            roles={emptyRoles}
            initialRoleId={activeRole}
            canRecruit
            competition={{ slug: c.slug }}
            invite={{
              teamName: team.name,
              leaderName: viewer.leaderName,
              competitionName: c.name,
            }}
          />
        </section>
      )}
    </main>
  );
}
