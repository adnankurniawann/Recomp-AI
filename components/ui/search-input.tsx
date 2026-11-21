"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Accessible name, since the field has no visible label. */
  label: string;
  /** Show the ⌘K hint and focus the field on ⌘K / Ctrl+K. */
  shortcut?: boolean;
}

/** Magnifier, the field, and an optional ⌘K hint on the right (PRD §9.7). */
export function SearchInput({ label, shortcut, className, ...props }: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  return (
    <label
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-ink-3 shadow-xs transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-200 hover:border-line-strong md:h-10",
        className,
      )}
    >
      <Search aria-hidden size={16} strokeWidth={1.75} className="shrink-0" />
      <input
        ref={ref}
        type="search"
        aria-label={label}
        className="min-w-0 flex-1 self-stretch bg-transparent text-sm text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {shortcut && (
        <kbd className="hidden rounded-sm border border-line px-1.5 font-mono text-[11px] text-ink-3 sm:inline">
          ⌘K
        </kbd>
      )}
    </label>
  );
}
