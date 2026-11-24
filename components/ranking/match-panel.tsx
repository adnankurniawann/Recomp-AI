import { scoreTone } from "@/lib/format/score";
import type { RankingCandidate } from "@/lib/ranking/types";
import { cn } from "@/lib/utils";
import { FactorBars } from "./factor-bars";
import { ReasonList } from "./reason-list";
import { ALGORITHM_NOTE } from "./score-badge";

const SCORE_DOTS = { success: "bg-success", primary: "bg-primary", warning: "bg-warning" };

/** "Kecocokan untuk role X": score, the five factors and the reasons (F-RNK-03, F-PRF-06). */
export function MatchPanel({
  candidate: c,
  roleName,
  headingAs: Heading = "h3",
  children,
}: {
  candidate: RankingCandidate;
  roleName: string;
  headingAs?: "h2" | "h3";
  /** Extra actions under the note, like "Undang" on the public profile. */
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-label={`Kecocokan untuk ${roleName}`}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2/40 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <Heading className="font-semibold text-ink-strong">Kecocokan untuk {roleName}</Heading>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2 rounded-full", SCORE_DOTS[scoreTone(c.score)])} />
          <span className="font-mono text-xl text-ink-strong tabular-nums">{c.score}</span>
        </span>
      </div>
      <FactorBars factors={c.factors} weights={c.weights} />
      <ReasonList reasons={c.reasons} className="border-t border-line pt-3" />
      <p className="text-xs text-ink-2">{ALGORITHM_NOTE}</p>
      {children}
    </section>
  );
}
