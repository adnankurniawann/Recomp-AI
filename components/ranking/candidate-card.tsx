"use client";

import { Card } from "@/components/ui/card";
import { ReasonList } from "./reason-list";
import { ScoreBadge } from "./score-badge";
import {
  CandidateActions,
  CandidateFeedback,
  CandidateIdentity,
  CandidateSkills,
  type CandidateItemProps,
} from "./candidate-parts";

/**
 * A candidate on phones, below 768 px (F-RNK-01, PRD §10.5): stacked, with "Profil" and "Undang"
 * side by side at 44 px. Tapping the card opens the ProfileSheet.
 */
export function CandidateCard(props: CandidateItemProps) {
  const { candidate: c, onOpenProfile } = props;
  return (
    <Card onClick={onOpenProfile} className="flex cursor-pointer flex-col gap-3 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <CandidateIdentity candidate={c} onOpenProfile={onOpenProfile} />
        <ScoreBadge score={c.score} factors={c.factors} weights={c.weights} />
      </div>
      <ReasonList reasons={c.reasons} limit={3} />
      <CandidateSkills candidate={c} />
      <CandidateFeedback candidate={c} onFeedback={props.onFeedback} />
      <CandidateActions {...props} className="[&>*]:flex-1" />
    </Card>
  );
}
