import Link from "next/link";
import { cn } from "@/lib/utils";
import { FULL_LOGO } from "./logo-paths";

interface FullLogoProps {
  className?: string;
  /** Classes for the parts the intro animates. */
  stemClassName?: string;
  shoulderClassName?: string;
  wordmarkClassName?: string;
}

/**
 * The full logo, r(logo) + "ecomp ai" (docs/brand/README.md). "ecomp ai" comes first in the markup so
 * the r sits on top of it when the intro slides the name out from behind the r.
 */
export function FullLogo({
  className,
  stemClassName,
  shoulderClassName,
  wordmarkClassName,
}: FullLogoProps) {
  return (
    <svg
      viewBox={FULL_LOGO.viewBox}
      role="img"
      aria-label="Recomp AI"
      className={cn("w-auto", className)}
    >
      <g className={wordmarkClassName}>
        {FULL_LOGO.ink.map((d) => (
          <path key={d} d={d} fillRule="evenodd" className="fill-ink-strong" />
        ))}
        {FULL_LOGO.accent.map((d) => (
          <path key={d} d={d} fillRule="evenodd" className="fill-primary" />
        ))}
      </g>
      <path d={FULL_LOGO.stem} className={cn("fill-primary", stemClassName)} />
      <path d={FULL_LOGO.shoulder} className={cn("fill-primary", shoulderClassName)} />
    </svg>
  );
}

const heights = {
  // Navbar and footer.
  md: "h-7",
  // Sidebar and the app top bar.
  sm: "h-6",
};

/** The full logo as a link home. */
export function Logo({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center rounded-md focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none",
        className,
      )}
    >
      <FullLogo className={heights[size]} />
    </Link>
  );
}
