"use client";

import { ReasonList } from "./reason-list";
import { ScoreBadge } from "./score-badge";
import {
  CandidateActions,
  CandidateIdentity,
  CandidateSkills,
  type CandidateItemProps,
} from "./candidate-parts";

/** Column template shared by the table head and every row. */
export const CANDIDATE_GRID =
  "md:grid md:grid-cols-[minmax(11rem,1.1fr)_minmax(13rem,1.6fr)_minmax(9rem,1fr)_4rem_11.5rem] md:items-start md:gap-4";

/**
 * A candidate in the ranking table, from 768 px up (F-RNK-01, PRD §10.5). Clicking the row opens
 * the ProfileSheet; the name and "Profil" button do the same for keyboard users.
 */
export function CandidateRow(props: CandidateItemProps) {
  const { candidate: c, onOpenProfile } = props;
  return (
    <div
      onClick={onOpenProfile}
      className={`${CANDIDATE_GRID} hidden cursor-pointer px-4 py-4 transition-colors duration-150 ease-out hover:bg-surface-2/50`}
    >
      <CandidateIdentity candidate={c} onOpenProfile={onOpenProfile} />
      <ReasonList reasons={c.reasons} limit={3} />
      <CandidateSkills candidate={c} />
      <ScoreBadge score={c.score} factors={c.factors} weights={c.weights} />
      <CandidateActions {...props} className="justify-end" />
    </div>
  );
}
