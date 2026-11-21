"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleInterest } from "@/app/(marketing)/lomba/actions";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InterestButtonProps {
  competitionId: string;
  interested: boolean;
  count: number;
  signedIn: boolean;
  /** `card`: "24 mahasiswa tertarik ♡" in a card footer. `button`: "♡ Tertarik · 24" on the detail page. */
  variant?: "card" | "button";
  className?: string;
}

/**
 * The "Tertarik" toggle (F-CMP-03). The count changes at once and the server confirms it; a visitor
 * without a session goes to /masuk and comes back here.
 */
export function InterestButton({
  competitionId,
  interested: initialInterested,
  count: initialCount,
  signedIn,
  variant = "card",
  className,
}: InterestButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState({ interested: initialInterested, count: initialCount });
  const [pending, startTransition] = useTransition();
  const signIn = () => router.push(`/masuk?next=${encodeURIComponent(pathname)}`);

  function toggle() {
    if (!signedIn) {
      signIn();
      return;
    }
    const before = state;
    setState({
      interested: !before.interested,
      count: Math.max(0, before.count + (before.interested ? -1 : 1)),
    });
    startTransition(async () => {
      const result = await toggleInterest(competitionId);
      if (!result.ok) {
        setState(before);
        if (result.error.code === "AUTH_REQUIRED") signIn();
        else toast.error(result.error.message);
        return;
      }
      setState(result.data);
    });
  }

  const { interested, count } = state;
  const heart = (
    <Heart
      aria-hidden
      size={16}
      strokeWidth={1.75}
      className={cn(
        "shrink-0 transition-colors duration-150 ease-out",
        interested ? "fill-danger text-danger" : "text-ink-3",
      )}
    />
  );

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={interested}
        className={buttonClasses("secondary", "md", className)}
      >
        {heart}
        {interested ? "Batal tertarik" : "Tertarik"}
        <span aria-hidden className="text-ink-3">
          ·
        </span>
        <span className="font-mono tabular-nums">{count}</span>
      </button>
    );
  }

  return (
    <span className={cn("relative z-10 flex items-center gap-1 text-ink-2", className)}>
      <span aria-live="polite">
        <span className="font-mono tabular-nums">{count}</span> mahasiswa tertarik
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={interested}
        aria-label={interested ? "Batal tertarik" : "Tandai tertarik"}
        title={interested ? "Batal tertarik" : "Tertarik"}
        className="-my-2 inline-flex size-11 items-center justify-center rounded-full transition-colors duration-150 ease-out hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:size-8"
      >
        {heart}
      </button>
    </span>
  );
}
