import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  // Navbar and footer.
  md: { box: "size-[30px] rounded-md text-[15px]", name: "text-lg" },
  // Sidebar and the app top bar.
  sm: { box: "size-7 rounded-sm text-sm", name: "text-base" },
};

/** Placeholder logo: a white "r" in a `primary` square, then "Recomp AI" (PRD §9.7; final logo is open, §24). */
export function Logo({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  const s = sizes[size];
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center bg-primary font-semibold text-white",
          s.box,
        )}
      >
        r
      </span>
      <span className={cn("font-semibold tracking-[-0.02em] text-ink-strong", s.name)}>
        Recomp AI
      </span>
    </Link>
  );
}
