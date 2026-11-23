"use client";

import { RankingSection } from "@/components/ranking/ranking-section";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { ok, fail } from "@/lib/action-result";
import { fixtureProfiles, fixtureRanking, fixtureTeam } from "@/lib/fixtures";
import type { PublicProfile } from "@/lib/profile/public";
import { RANKING_PAGE_SIZE, type RankingPage } from "@/lib/ranking/types";

const leader = fixtureProfiles.find((p) => p.id === fixtureTeam.leaderId)!;
const emptyRoles = fixtureTeam.roles.filter((r) => r.memberIds.length < r.slots);
const wait = () => new Promise((r) => setTimeout(r, 400));

// An empty tab too, to see the empty state next to the filled ones.
const EMPTY_ROLE = { id: "preview-empty", name: "Data Analyst", colorKey: "data" as const };

async function fetchPage(teamRoleId: string, offset: number): Promise<RankingPage> {
  await wait();
  if (teamRoleId === EMPTY_ROLE.id) {
    return {
      role: { ...EMPTY_ROLE, requiredSkills: [], hoursPerWeek: 6 },
      total: 0,
      candidates: [],
    };
  }
  const all = fixtureRanking(teamRoleId);
  // Small pages so "Muat lagi" shows up with only a handful of fixture profiles.
  const size = Math.min(RANKING_PAGE_SIZE, 2);
  return { ...all, candidates: all.candidates.slice(offset, offset + size) };
}

async function loadProfile(username: string) {
  await wait();
  const p = fixtureProfiles.find((f) => f.username === username);
  if (!p) return fail<PublicProfile>("NOT_FOUND", "Profil ini tidak ditemukan.");
  return ok<PublicProfile>({
    ...p,
    preferredRoles: p.preferredRoles.filter((r) => r !== "other"),
    isOwn: false,
    skills: p.skills.map(({ skillId, name, level, evidenceUrl }) => ({
      skillId,
      name,
      level,
      evidenceUrl,
    })),
    history: p.history.map((h, i) => ({ ...h, id: `${p.id}-h${i}`, note: null })),
    portfolio: p.portfolio.map((item, i) => ({
      ...item,
      id: `${p.id}-p${i}`,
      coverUrl: null,
      skillNames: [],
    })),
    interests: [],
  });
}

export function RankingPreview() {
  return (
    <RankingSection
      roles={[...emptyRoles, EMPTY_ROLE]}
      competition={{ slug: fixtureTeam.competition.slug }}
      invite={{
        teamName: fixtureTeam.name,
        leaderName: leader.fullName,
        competitionName: fixtureTeam.competition.name,
      }}
      fetchPage={fetchPage}
      loadProfile={loadProfile}
      submitFeedback={async () => {
        await wait();
        return ok({});
      }}
    />
  );
}

/** The KPI strip of the team dashboard (PRD §10.4), with the fixture team. */
export function KpiPreview() {
  const filled = fixtureTeam.roles.filter((r) => r.memberIds.length >= r.slots).length;
  return (
    <KpiStrip
      items={[
        {
          label: "Role terisi",
          value: `${filled}/${fixtureTeam.roles.length}`,
          bar: { value: filled, max: fixtureTeam.roles.length, segments: true },
        },
        {
          label: "Kandidat cocok",
          value: "27",
          sub: "dari 41 yang tertarik",
          bar: { value: 27, max: 41 },
        },
        {
          label: "Undangan",
          value: "2",
          sub: "1 menunggu respon",
          bar: { value: 1, max: 2, segments: true },
        },
        { label: "Skill gap", value: "2", sub: "Figma, Public Speaking" },
      ]}
    />
  );
}
