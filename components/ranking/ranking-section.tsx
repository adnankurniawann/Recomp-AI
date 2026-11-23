"use client";

import { Link2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SegmentedTabs, segmentedPanelProps } from "@/components/ui/segmented-tabs";
import { SimulatedBadge } from "@/components/ui/simulated-badge";
import { ROLE_COLORS } from "@/lib/constants";
import { fetchRankingPage } from "@/lib/ranking/client";
import {
  RANKING_SORTS,
  RANKING_SORT_LABELS,
  sortCandidates,
  type RankingSort,
} from "@/lib/ranking/sort";
import type { RankingCandidate, RankingPage, RankingRole } from "@/lib/ranking/types";
import { cn } from "@/lib/utils";
import { CandidateCard } from "./candidate-card";
import type { InviteContext } from "./candidate-parts";
import { CANDIDATE_GRID, CandidateRow } from "./candidate-row";
import { ProfileSheet, type ProfileLoader } from "./profile-sheet";
import { ALGORITHM_NOTE } from "./score-badge";

export const EMPTY_RANKING_TEXT =
  "Belum ada mahasiswa yang tertarik dengan lomba ini dan cocok dengan role ini. Bagikan lomba ini ke temanmu.";

type Role = Pick<RankingRole, "id" | "name" | "colorKey">;

type RoleState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      total: number;
      candidates: RankingCandidate[];
      loadingMore: boolean;
    };

interface RankingSectionProps {
  /** The team's empty roles, one tab each (F-RNK-01). */
  roles: Role[];
  competition: { slug: string };
  invite: Omit<InviteContext, "onInvited">;
  /** Defaults to GET /api/ranking; screens on fixtures pass their own. */
  fetchPage?: (teamRoleId: string, offset: number) => Promise<RankingPage>;
  loadProfile?: ProfileLoader;
  /** The tab to open first, from "Lihat kandidat" on a role card. */
  initialRoleId?: string;
}

/**
 * Ranking per empty role at the bottom of the team dashboard (F-RNK-01..03, PRD §10.5): a tab per
 * role, 20 candidates at a time with "Muat lagi", a sort menu, and the ProfileSheet.
 */
export function RankingSection({
  roles,
  competition,
  invite,
  fetchPage = fetchRankingPage,
  loadProfile,
  initialRoleId,
}: RankingSectionProps) {
  const [activeId, setActiveId] = useState(
    roles.find((r) => r.id === initialRoleId)?.id ?? roles[0]?.id ?? "",
  );
  const [byRole, setByRole] = useState<Record<string, RoleState>>({});
  const [sort, setSort] = useState<RankingSort>("score");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(
    async (roleId: string) => {
      setByRole((s) => ({ ...s, [roleId]: { status: "loading" } }));
      try {
        const page = await fetchPage(roleId, 0);
        setByRole((s) => ({
          ...s,
          [roleId]: {
            status: "ready",
            total: page.total,
            candidates: page.candidates,
            loadingMore: false,
          },
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Ranking belum bisa dimuat.";
        setByRole((s) => ({ ...s, [roleId]: { status: "error", message } }));
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    if (activeId && !byRole[activeId]) void load(activeId);
  }, [activeId, byRole, load]);

  async function loadMore() {
    const current = byRole[activeId];
    if (current?.status !== "ready") return;
    const roleId = activeId;
    setByRole((s) => ({ ...s, [roleId]: { ...current, loadingMore: true } }));
    try {
      const page = await fetchPage(roleId, current.candidates.length);
      setByRole((s) => {
        const prev = s[roleId];
        if (prev?.status !== "ready") return s;
        const seen = new Set(prev.candidates.map((c) => c.profile.id));
        return {
          ...s,
          [roleId]: {
            status: "ready",
            total: page.total,
            candidates: [
              ...prev.candidates,
              ...page.candidates.filter((c) => !seen.has(c.profile.id)),
            ],
            loadingMore: false,
          },
        };
      });
    } catch {
      setByRole((s) => ({ ...s, [roleId]: { ...current, loadingMore: false } }));
      toast.error("Kandidat berikutnya belum bisa dimuat. Coba lagi.");
    }
  }

  function markInvited(profileId: string) {
    setByRole((s) => {
      const st = s[activeId];
      if (st?.status !== "ready") return s;
      return {
        ...s,
        [activeId]: {
          ...st,
          candidates: st.candidates.map((c) =>
            c.profile.id === profileId ? { ...c, inviteStatus: "pending" } : c,
          ),
        },
      };
    });
  }

  async function copyLink() {
    const url = `${window.location.origin}/lomba/${competition.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tautan lomba disalin");
    } catch {
      toast.error("Tautan belum bisa disalin. Salin manual: " + url);
    }
  }

  if (roles.length === 0) return null;

  const role = roles.find((r) => r.id === activeId) ?? roles[0]!;
  const state = byRole[role.id];
  const inviteCtx: InviteContext = { ...invite, onInvited: markInvited };
  const open =
    state?.status === "ready"
      ? (state.candidates.find((c) => c.profile.id === openId) ?? null)
      : null;

  return (
    <section aria-labelledby="ranking-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="ranking-title" className="text-lg font-semibold text-ink-strong">
          Kandidat untuk role kosong
        </h2>
        <p className="text-sm text-ink-2">
          Diurutkan dari skor kecocokan. Klik skor untuk melihat rinciannya.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          label="Role kosong"
          idBase="ranking"
          value={role.id}
          onChange={(id) => {
            setActiveId(id);
            setOpenId(null);
          }}
          tabs={roles.map((r) => {
            const st = byRole[r.id];
            return {
              value: r.id,
              label: (
                <>
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", ROLE_COLORS[r.colorKey].solid)}
                  />
                  {r.name}
                  {st?.status === "ready" && (
                    <span className="font-mono text-xs text-ink-2 tabular-nums">{st.total}</span>
                  )}
                </>
              ),
            };
          })}
        />
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Urut
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as RankingSort)}
            className="h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink shadow-xs hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-10"
          >
            {RANKING_SORTS.map((s) => (
              <option key={s} value={s}>
                {RANKING_SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div {...segmentedPanelProps("ranking", role.id)} className="flex flex-col gap-4">
        {!state || state.status === "loading" ? (
          <RankingSkeleton />
        ) : state.status === "error" ? (
          <ErrorState
            title="Ranking belum bisa dimuat"
            body={state.message}
            onRetry={() => load(role.id)}
          />
        ) : state.candidates.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada kandidat"
            body={EMPTY_RANKING_TEXT}
            action={
              <Button onClick={copyLink} icon={<Link2 aria-hidden size={16} strokeWidth={1.75} />}>
                Salin tautan lomba
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-visible md:rounded-xl md:border md:border-line md:bg-surface md:shadow-xs">
              <div
                aria-hidden
                className={`${CANDIDATE_GRID} hidden border-b border-line px-4 py-2.5 text-xs font-medium text-ink-3`}
              >
                <span>Kandidat</span>
                <span>Alasan</span>
                <span>Skill wajib</span>
                <span>Skor</span>
                <span className="sr-only">Aksi</span>
              </div>
              <ul className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-line">
                {sortCandidates(state.candidates, sort).map((c) => {
                  const props = {
                    candidate: c,
                    role,
                    invite: inviteCtx,
                    onOpenProfile: () => setOpenId(c.profile.id),
                  };
                  return (
                    <li key={`${c.profile.id}-${c.inviteStatus ?? "none"}`}>
                      <CandidateRow {...props} />
                      <CandidateCard {...props} />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="flex flex-wrap items-center justify-center gap-2 text-center text-xs text-ink-2">
                {state.candidates.some((c) => c.profile.isSimulated) && (
                  <>
                    <SimulatedBadge />
                    Profil bertanda Simulasi adalah data contoh.
                  </>
                )}{" "}
                {ALGORITHM_NOTE}
              </p>
              {state.candidates.length < state.total && (
                <Button onClick={loadMore} disabled={state.loadingMore}>
                  {state.loadingMore ? "Memuat..." : "Muat lagi"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <ProfileSheet
        candidate={open}
        role={role}
        invite={inviteCtx}
        onClose={() => setOpenId(null)}
        loadProfile={loadProfile}
      />
    </section>
  );
}

function RankingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Memuat kandidat">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs"
        >
          <div className="size-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded-sm bg-surface-2" />
            <div className="h-3 w-64 max-w-full animate-pulse rounded-sm bg-surface-2" />
            <div className="h-3 w-52 max-w-full animate-pulse rounded-sm bg-surface-2" />
          </div>
          <div className="h-[30px] w-14 animate-pulse rounded-sm bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
