"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { loadProfileForSheet } from "@/app/(marketing)/u/[username]/actions";
import { HistoryTimeline } from "@/components/profile/history-timeline";
import { PortfolioGrid } from "@/components/profile/portfolio-grid";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { buttonClasses } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { IconButton } from "@/components/ui/icon-button";
import { SectionLabel } from "@/components/ui/section-label";
import { SkillChip } from "@/components/ui/skill-chip";
import type { ActionResult } from "@/lib/action-result";
import { scoreTone } from "@/lib/format/score";
import type { PublicProfile } from "@/lib/profile/public";
import type { RankingCandidate, RankingRole } from "@/lib/ranking/types";
import { cn } from "@/lib/utils";
import { CandidateInvite, type InviteContext } from "./candidate-parts";
import { FactorBars } from "./factor-bars";
import { ReasonList } from "./reason-list";
import { ALGORITHM_NOTE } from "./score-badge";

export type ProfileLoader = (username: string) => Promise<ActionResult<PublicProfile>>;

const SCORE_DOTS = { success: "bg-success", primary: "bg-primary", warning: "bg-warning" };

interface ProfileSheetProps {
  /** The candidate to show; null keeps the sheet closed. */
  candidate: RankingCandidate | null;
  role: Pick<RankingRole, "id" | "name" | "colorKey">;
  invite: InviteContext;
  onClose: () => void;
  /** Defaults to the server action; screens on fixtures pass their own. */
  loadProfile?: ProfileLoader;
}

type State =
  | { status: "loading" }
  | { status: "ready"; profile: PublicProfile }
  | { status: "error"; message: string };

/**
 * The quick profile sheet from the right (F-RNK-03, PRD §10.6): 560 px on desktop, full screen on
 * phones. The match panel comes from the ranking right away; the rest of the profile loads after.
 */
export function ProfileSheet({
  candidate,
  role,
  invite,
  onClose,
  loadProfile = loadProfileForSheet,
}: ProfileSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, setState] = useState<State>({ status: "loading" });
  const username = candidate?.profile.username;

  const load = useCallback(async () => {
    if (!username) return;
    setState({ status: "loading" });
    const result = await loadProfile(username);
    setState(
      result.ok
        ? { status: "ready", profile: result.data }
        : { status: "error", message: result.error.message },
    );
  }, [username, loadProfile]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (candidate && !dialog.open) dialog.showModal();
    else if (!candidate && dialog.open) dialog.close();
  }, [candidate]);

  useEffect(() => {
    void load();
  }, [load]);

  const c = candidate;
  const matched = new Set(c?.matchedRequired.map((s) => s.skillId));

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // Click on the backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="mt-0 mr-0 mb-0 ml-auto h-dvh max-h-none w-full max-w-none border-l border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink-strong/40 md:max-w-[560px]"
    >
      {c && (
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 id={titleId} className="truncate text-sm font-medium text-ink-2">
              Profil {c.profile.fullName}
            </h2>
            <IconButton
              label="Tutup"
              icon={<X aria-hidden size={18} strokeWidth={1.75} />}
              onClick={onClose}
            />
          </header>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-6">
            {state.status === "ready" ? (
              <ProfileSummary profile={state.profile} avatarSize={72} layout="row" headingAs="h2" />
            ) : state.status === "loading" ? (
              <SummarySkeleton />
            ) : null}

            <section
              aria-label={`Kecocokan untuk ${role.name}`}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-ink-strong">Kecocokan untuk {role.name}</h3>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", SCORE_DOTS[scoreTone(c.score)])}
                  />
                  <span className="font-mono text-xl text-ink-strong tabular-nums">{c.score}</span>
                </span>
              </div>
              <FactorBars factors={c.factors} weights={c.weights} />
              <ReasonList reasons={c.reasons} className="border-t border-line pt-3" />
              <p className="text-xs text-ink-2">{ALGORITHM_NOTE}</p>
            </section>

            {state.status === "error" && (
              <ErrorState title="Profil belum bisa dimuat" body={state.message} onRetry={load} />
            )}
            {state.status === "loading" && <BodySkeleton />}
            {state.status === "ready" && (
              <>
                <section className="flex flex-col gap-3">
                  <SectionLabel>Skill</SectionLabel>
                  {state.profile.skills.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {state.profile.skills.map((s) => (
                        <li key={s.skillId}>
                          <SkillChip
                            name={s.name}
                            level={s.level}
                            href={s.evidenceUrl}
                            state={matched.has(s.skillId) ? "matched" : "neutral"}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-2">Belum ada skill.</p>
                  )}
                </section>

                <section className="flex flex-col gap-3">
                  <SectionLabel>Riwayat lomba</SectionLabel>
                  {state.profile.history.length ? (
                    <HistoryTimeline
                      items={state.profile.history}
                      limit={5}
                      moreHref={`/u/${state.profile.username}`}
                    />
                  ) : (
                    <p className="text-sm text-ink-2">Belum ada riwayat lomba.</p>
                  )}
                </section>

                <section className="flex flex-col gap-3">
                  <SectionLabel>Portofolio</SectionLabel>
                  {state.profile.portfolio.length ? (
                    <PortfolioGrid items={state.profile.portfolio} columns={2} limit={4} />
                  ) : (
                    <p className="text-sm text-ink-2">Belum ada portofolio.</p>
                  )}
                </section>
              </>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-6">
            <Link
              href={`/u/${c.profile.username}`}
              className={buttonClasses("secondary", "md", "h-11 md:h-10")}
            >
              Buka profil lengkap
            </Link>
            <CandidateInvite
              key={c.inviteStatus ?? "none"}
              candidate={c}
              role={role}
              invite={invite}
            />
          </footer>
        </div>
      )}
    </dialog>
  );
}

function SummarySkeleton() {
  return (
    <div className="flex gap-4" aria-hidden>
      <div className="size-[72px] shrink-0 animate-pulse rounded-full bg-surface-2" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className="h-6 w-1/2 animate-pulse rounded-sm bg-surface-2" />
        <div className="h-4 w-2/3 animate-pulse rounded-sm bg-surface-2" />
        <div className="h-7 w-40 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}

function BodySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded-sm bg-surface-2" />
          <div className="h-16 animate-pulse rounded-md bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
