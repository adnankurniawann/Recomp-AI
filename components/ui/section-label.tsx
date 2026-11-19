import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small grey mono caps above a section: "CARA KERJA", "PERSIAPAN" (PRD §9.3 `label`). */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] leading-[1.4] font-medium tracking-[0.18em] text-ink-3 uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
