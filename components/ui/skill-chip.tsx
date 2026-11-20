import { Link2 } from "lucide-react";
import { LEVEL_LABELS, type Level } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type SkillChipState = "matched" | "missing" | "neutral";

interface SkillChipProps {
  name: string;
  level?: Level;
  hasEvidence?: boolean;
  /** `matched` on `success-50` for a required skill the candidate has; `missing` dashed grey. */
  state?: SkillChipState;
  /** Evidence link: makes the chip open it in a new tab. Only https links reach here (PRD §14). */
  href?: string | null;
  className?: string;
}

const states: Record<SkillChipState, string> = {
  matched: "border-transparent bg-success-50 text-success-ink",
  missing: "border-dashed border-line-strong bg-surface text-ink-3",
  neutral: "border-line bg-surface text-ink-2",
};

/** A skill pill: "Figma · Mahir" with a link icon when it has evidence (PRD §9.7, F-PRF-02). */
export function SkillChip({
  name,
  level,
  hasEvidence,
  state = "neutral",
  href,
  className,
}: SkillChipProps) {
  const classes = cn(
    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium whitespace-nowrap",
    states[state],
    href &&
      "transition-colors duration-150 ease-out hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none",
    className,
  );
  const content = (
    <>
      {name}
      {level && <span className="font-normal opacity-80">· {LEVEL_LABELS[level].label}</span>}
      {(hasEvidence || href) && <Link2 aria-label="ada bukti" size={13} strokeWidth={1.75} />}
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return <span className={classes}>{content}</span>;
}
